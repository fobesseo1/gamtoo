import type { BgRemovalModel, WorkerRequest, WorkerResponse } from "./background-removal.worker";

export type { BgRemovalModel };

// Plain `Omit` on a union type doesn't distribute — it collapses the union
// into a single merged object type first, which drops the "remove" branch's
// `blob` field. This distributes Omit over each union member individually
// instead, so the discriminated union (and its per-branch fields) survives.
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export interface RemoveBackgroundResult {
  blob: Blob;
  usedFallback: boolean;
}

interface RemoveBackgroundOptions {
  timeoutMs?: number;
  model?: BgRemovalModel;
}

const DEFAULT_TIMEOUT_MS = 30000;

// isnet_quint8 (8-bit) measured ~30% faster than isnet_fp16, but the
// quantization visibly roughened cutout edges on a real photo — not worth
// the tradeoff, so back to fp16. Kept as an explicit constant (rather than
// just omitting `model` and letting the library fall back to its own
// default) so preload (fired on photo pick) and the real removal call
// (fired on submit) always warm and use the *same* config — the library
// memoizes its model init by config, so a mismatch here would silently
// throw away the preload's benefit.
export const DEFAULT_BG_REMOVAL_MODEL: BgRemovalModel = "isnet_fp16";

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
  const { timeoutMs = DEFAULT_TIMEOUT_MS, model = DEFAULT_BG_REMOVAL_MODEL } = options;

  try {
    const response = await send({ type: "remove", blob: source, model }, timeoutMs);
    if (response.status === "error") throw new Error(response.message);
    if (response.type !== "remove") throw new Error("unexpected-worker-response");
    return { blob: response.blob, usedFallback: false };
  } catch (error) {
    console.warn("[background-removal] falling back to original photo:", error);
    return { blob: source, usedFallback: true };
  }
}

/**
 * Kicks off the model download + ONNX session init in the background,
 * without running inference — call this as soon as a photo is picked (before
 * the user taps submit) so the model is already warm by the time
 * removeBackgroundWithFallback actually needs it. Fire-and-forget: on
 * failure the real run just pays the init cost itself later, same as today.
 */
export function preloadBackgroundRemovalModel(model: BgRemovalModel = DEFAULT_BG_REMOVAL_MODEL): void {
  send({ type: "preload", model }).catch((error) => {
    console.warn("[background-removal] preload failed:", error);
  });
}
