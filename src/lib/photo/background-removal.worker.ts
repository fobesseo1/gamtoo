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
import { FilesetResolver, ImageSegmenter } from "@mediapipe/tasks-vision";

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

// Mobile-only path: MediaPipe's selfie segmenter is a much smaller/faster
// model than imgly's isnet family, and its "GPU" delegate is WebGL-based
// (not WebGPU), which is what actually works reliably on mobile GPUs --
// unlike imgly's WebGPU path, which came back fully transparent on a real
// mobile device (see background-removal.ts). Created lazily and cached: the
// model download + WebGL setup only needs to happen once per worker
// lifetime, same reasoning as imgly's own internal memoization.
let segmenterPromise: Promise<ImageSegmenter> | null = null;

function getSegmenter(): Promise<ImageSegmenter> {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(`${self.location.origin}/mediapipe/wasm`);
      return ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `${self.location.origin}/mediapipe/selfie_segmenter.tflite`,
          delegate: "GPU",
        },
        outputCategoryMask: false,
        outputConfidenceMasks: true,
      });
    })();
  }
  return segmenterPromise;
}

// Runs selfie segmentation and applies the resulting per-pixel confidence
// mask as the output image's alpha channel, so the result is a transparent
// PNG/WebP in the same shape as imgly's removeBackground() output -- callers
// downstream (cropToContent, poster compositing) don't need to know which
// engine produced it.
async function removeBackgroundMediaPipe(source: Blob): Promise<Blob> {
  const segmenter = await getSegmenter();
  const bitmap = await createImageBitmap(source);

  const result = segmenter.segment(bitmap);
  const mask = result.confidenceMasks?.[0];
  if (!mask) {
    result.close();
    bitmap.close();
    throw new Error("mediapipe-no-confidence-mask");
  }

  const maskData = mask.getAsFloat32Array();
  const width = mask.width;
  const height = mask.height;

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  for (let i = 0; i < width * height; i++) {
    pixels[i * 4 + 3] = Math.max(0, Math.min(255, Math.round(pixels[i * 4 + 3] * maskData[i])));
  }
  ctx.putImageData(imageData, 0, 0);
  result.close();

  return canvas.convertToBlob({ type: "image/webp", quality: 0.92 });
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
      debug: false,
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
    let blob: Blob;
    if (request.device === "gpu") {
      // Desktop path: imgly + WebGPU + isnet. Untouched by the mobile work below.
      blob = await removeBackground(shrunk, config);
    } else {
      // Mobile path: try MediaPipe first, fall back to the existing imgly
      // cpu path (same `config` the old mobile-only path already used) on
      // any failure -- unsupported delegate, missing WebGL2, etc.
      try {
        blob = await removeBackgroundMediaPipe(shrunk);
      } catch (mediapipeError) {
        console.warn("[background-removal] MediaPipe failed, falling back to imgly cpu:", mediapipeError);
        blob = await removeBackground(shrunk, config);
      }
    }
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
