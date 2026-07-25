import type { BgRemovalDevice, BgRemovalModel, WorkerRequest, WorkerResponse } from "./background-removal.worker";

export type { BgRemovalModel, BgRemovalDevice };

// Plain `Omit` on a union type doesn't distribute — it collapses the union
// into a single merged object type first, which drops the "remove" branch's
// `blob` field. This distributes Omit over each union member individually
// instead, so the discriminated union (and its per-branch fields) survives.
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export interface RemoveBackgroundResult {
  blob: Blob;
  usedFallback: boolean;
  /** Why it fell back, when it did — real device failures are otherwise
   * unreachable to debug (no console access on a phone). */
  fallbackReason?: string;
}

interface RemoveBackgroundOptions {
  timeoutMs?: number;
  model?: BgRemovalModel;
  device?: BgRemovalDevice;
}

// A cold start (model never downloaded/initialized in this tab yet) can
// genuinely take longer than 30s on a slow connection — timing out then
// silently falls back to the original photo with no visible error, but the
// worker keeps loading the model in the background regardless, so the very
// next attempt in the same tab finds it already warm and succeeds. That
// read as "the first photo never works, has to be redone" — the real fix is
// giving the cold-start case enough runway to finish within one attempt.
const DEFAULT_TIMEOUT_MS = 90000;

// isnet_quint8 (8-bit) measured ~30% faster than isnet_fp16, but the
// quantization visibly roughened cutout edges on a real photo — not worth
// the tradeoff, so back to fp16. Kept as an explicit constant (rather than
// just omitting `model` and letting the library fall back to its own
// default) so preload (fired on photo pick) and the real removal call
// (fired on submit) always warm and use the *same* config — the library
// memoizes its model init by config, so a mismatch here would silently
// throw away the preload's benefit.
export const DEFAULT_BG_REMOVAL_MODEL: BgRemovalModel = "isnet_fp16";

// NOT "gpu" — tested it directly: real-world timing dropped to ~400ms (from
// ~7-9s on threaded CPU), which sounded great until the actual output image
// turned out to be fully transparent — the subject removed along with the
// background instead of just the background. A fast, silently-wrong result
// is worse than a slow, correct one, so this stays on the verified-correct
// CPU path unless/until the library's WebGPU path is confirmed reliable.
export const DEFAULT_BG_REMOVAL_DEVICE: BgRemovalDevice = "cpu";

type PendingEntry = { resolve: (value: WorkerResponse) => void; reject: (error: Error) => void };

// One Worker, reused across preload + every removal call for the tab's
// lifetime: recreating it per-call would throw away the whole point of
// preloading — both the downloaded model bytes and the compiled ONNX
// session live in this worker's memory, not the main thread's, so a fresh
// worker per call would re-pay that cost every time. Requests carry an id so
// responses route back to the right caller even if a preload and a removal
// end up in flight at once (the library's own init() is memoized by config,
// so a removal that starts mid-preload just joins the same in-flight init
// instead of duplicating it).
let sharedWorker: Worker | null = null;
let nextRequestId = 0;
const pending = new Map<number, PendingEntry>();

function getWorker(): Worker {
  if (sharedWorker) return sharedWorker;

  const worker = new Worker(new URL("./background-removal.worker.ts", import.meta.url));
  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const entry = pending.get(event.data.id);
    if (!entry) return;
    pending.delete(event.data.id);
    entry.resolve(event.data);
  };
  worker.onerror = (event) => {
    // A worker-level error isn't tied to one request — fail everything
    // currently waiting so callers don't hang forever, then let the next
    // call spin up a fresh worker.
    for (const entry of pending.values()) {
      entry.reject(new Error(event.message || "background-removal-worker-error"));
    }
    pending.clear();
    sharedWorker = null;
  };
  sharedWorker = worker;
  return worker;
}

function send(request: DistributiveOmit<WorkerRequest, "id">, timeoutMs?: number): Promise<WorkerResponse> {
  const worker = getWorker();
  const id = nextRequestId++;

  return new Promise((resolve, reject) => {
    const timer = timeoutMs
      ? setTimeout(() => {
          pending.delete(id);
          reject(new Error("background-removal-timeout"));
        }, timeoutMs)
      : null;

    pending.set(id, {
      resolve: (response) => {
        if (timer) clearTimeout(timer);
        resolve(response);
      },
      reject: (error) => {
        if (timer) clearTimeout(timer);
        reject(error);
      },
    });

    worker.postMessage({ id, ...request } as WorkerRequest);
  });
}

/**
 * Runs @imgly/background-removal entirely client-side and never throws:
 * on timeout, model failure, or an unsupported browser, it resolves with
 * the original photo instead so the poster generation flow can continue.
 */
export async function removeBackgroundWithFallback(
  source: Blob,
  options: RemoveBackgroundOptions = {},
): Promise<RemoveBackgroundResult> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    model = DEFAULT_BG_REMOVAL_MODEL,
    device = DEFAULT_BG_REMOVAL_DEVICE,
  } = options;

  try {
    const response = await send({ type: "remove", blob: source, model, device }, timeoutMs);
    if (response.status === "error") throw new Error(response.message);
    if (response.type !== "remove") throw new Error("unexpected-worker-response");
    alert(`배경 제거 소요 시간: ${response.elapsedMs.toFixed(0)}ms`);
    return { blob: response.blob, usedFallback: false };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn("[background-removal] falling back to original photo:", error);
    return { blob: source, usedFallback: true, fallbackReason: reason };
  }
}

/**
 * Kicks off the model download + ONNX session init in the background,
 * without running inference — call this as soon as a photo is picked (before
 * the user taps submit) so the model is already warm by the time
 * removeBackgroundWithFallback actually needs it. Fire-and-forget: on
 * failure the real run just pays the init cost itself later, same as today.
 */
export function preloadBackgroundRemovalModel(
  model: BgRemovalModel = DEFAULT_BG_REMOVAL_MODEL,
  device: BgRemovalDevice = DEFAULT_BG_REMOVAL_DEVICE,
): void {
  send({ type: "preload", model, device }).catch((error) => {
    console.warn("[background-removal] preload failed:", error);
  });
}
