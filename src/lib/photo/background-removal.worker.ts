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

import { sniffImageDimensions } from "./sniff-image-dimensions";

export type BgRemovalModel = "isnet" | "isnet_fp16" | "isnet_quint8";
export type BgRemovalDevice = "cpu" | "gpu";

const MAX_BG_REMOVAL_DIMENSION = 1024;

// Worker context has no `document`/HTMLCanvasElement, so this can't reuse
// downscale-image.ts as-is -- OffscreenCanvas + convertToBlob() is the
// Worker-safe equivalent. Returns a fresh Blob; never mutates `source`.
async function shrinkForBgRemoval(source: Blob): Promise<Blob> {
  const dims = await sniffImageDimensions(source);

  let bitmap: ImageBitmap;
  if (dims) {
    const scale = Math.min(1, MAX_BG_REMOVAL_DIMENSION / Math.max(dims.width, dims.height));
    bitmap = await createImageBitmap(source, {
      resizeWidth: Math.max(1, Math.round(dims.width * scale)),
      resizeHeight: Math.max(1, Math.round(dims.height * scale)),
      resizeQuality: "medium",
    });
  } else {
    bitmap = await createImageBitmap(source);
  }

  const scale = Math.min(1, MAX_BG_REMOVAL_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return canvas.convertToBlob({ type: "image/png" });
}

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
    const config = {
      model: request.model,
      device: request.device,
      publicPath: `${self.location.origin}/bgr/`,
      debug: true,
      proxyToWorker: true,
      output: { format: "image/webp" as const, quality: 0.92 },
    };
    if (request.type === "preload") {
      await preload(config);
      const response: WorkerResponse = { id: request.id, type: "preload", status: "done" };
      postMessage(response);
      return;
    }

    const shrunk = await shrinkForBgRemoval(request.blob);

    const start = performance.now();
    const blob = await removeBackground(shrunk, config);
    const elapsedMs = performance.now() - start;

    // @ts-expect-error -- onnxruntime-web's package.json "exports" hides its
    // types.d.ts from TS's module resolution; runtime import is unaffected.
    const ort = (await import("onnxruntime-web")) as {
      env: { wasm: { numThreads?: number; simd?: boolean } };
    };
    console.log("ORT threads:", ort.env.wasm.numThreads);
    console.log("ORT simd:", ort.env.wasm.simd);
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
