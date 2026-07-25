/**
 * Runs @imgly/background-removal's WASM inference off the main thread.
 * That inference is single-threaded and runs synchronously for most of its
 * duration once it starts — on the main thread, that blocks EVERYTHING else
 * (React state updates, CSS animations, all of it; verified directly: a
 * plain busy-loop froze every kind of progress indicator we tried). Moving
 * it here keeps the main thread free the whole time.
 *
 * Deliberately avoids `self`/`DedicatedWorkerGlobalScope` typing — mixing
 * the "webworker" and "dom" TS libs in one project causes global type
 * conflicts. `addEventListener`/`postMessage`/`MessageEvent` are declared
 * in the default "dom" lib too (window-to-window messaging), so this
 * type-checks fine without it.
 */

export type BgRemovalModel = "isnet" | "isnet_fp16" | "isnet_quint8";
export type BgRemovalDevice = "cpu" | "gpu";

export type WorkerRequest =
  | { id: number; type: "remove"; blob: Blob; model?: BgRemovalModel; device?: BgRemovalDevice }
  | { id: number; type: "preload"; model?: BgRemovalModel; device?: BgRemovalDevice };

export type WorkerResponse =
  | { id: number; type: "remove"; status: "done"; blob: Blob; elapsedMs: number }
  | { id: number; type: "preload"; status: "done" }
  | { id: number; status: "error"; message: string };

addEventListener("message", async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  try {
    const { removeBackground, preload } = await import("@imgly/background-removal");
    // "gpu" only actually engages WebGPU if the library's own feature
    // detection (navigator.gpu.requestAdapter()) succeeds — otherwise it
    // silently uses the wasm path, same as "cpu" ever did. No fallback
    // logic needed on our end.
    const config = { model: request.model, device: request.device };
    if (request.type === "preload") {
      await preload(config);
      const response: WorkerResponse = { id: request.id, type: "preload", status: "done" };
      postMessage(response);
      return;
    }

    let device: "cpu" | "gpu" = "cpu";
    try {
      const gpu = (navigator as unknown as { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu;
      if (gpu && (await gpu.requestAdapter())) device = "gpu";
    } catch {}

    const removeConfig = {
      model: "isnet" as const,
      device,
    };

    const start = performance.now();
    const blob = await removeBackground(request.blob, removeConfig);
    const elapsedMs = performance.now() - start;
    const response: WorkerResponse = { id: request.id, type: "remove", status: "done", blob, elapsedMs };
    postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      id: request.id,
      status: "error",
      message: error instanceof Error ? error.message : String(error),
    };
    postMessage(response);
  }
});
