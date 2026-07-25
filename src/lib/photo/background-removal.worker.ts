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

// --- Mask post-processing toggles ---------------------------------------
// Bilinear (vs. nearest-neighbor) interpolation when upscaling the model's
// small native-resolution mask up to the full photo size.
const MASK_UPSCALE_BILINEAR = true;
// Pushes the smooth confidence gradient at the mask's edge toward a harder
// cutoff instead of a soft blend, so edges read as sharp instead of hazy.
const APPLY_ALPHA_SHARPENING = true;
const ALPHA_SHARPEN_LOW = 0.45;
const ALPHA_SHARPEN_HIGH = 0.6;
// Drops every foreground blob except the largest connected one, so isolated
// misclassified background pixels don't show up as stray specks.
const KEEP_LARGEST_COMPONENT_ONLY = true;
const LARGEST_COMPONENT_ALPHA_THRESHOLD = 10;
// If MediaPipe's mask keeps less than this fraction of the photo, the
// subject probably isn't a person at all (a corn dog, a toy, ...) --
// selfie_multiclass has no "this isn't a person" signal of its own, it just
// quietly erases almost everything. Below this, the result is untrustworthy
// enough to retry with imgly instead of shipping it.
const MIN_ALIVE_ALPHA_RATIO = 0.08;
// --------------------------------------------------------------------------

// selfie_multiclass_256x256's category order (official MediaPipe docs):
// 0 background, 1 hair, 2 body-skin, 3 face-skin, 4 clothes, 5 others. Using
// 1 - P(background) as alpha keeps every non-background category (hair,
// skin, face, clothes, accessories) without having to enumerate them.
const BACKGROUND_CATEGORY_INDEX = 0;

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
          modelAssetPath: `${self.location.origin}/mediapipe/selfie_multiclass_256x256.tflite`,
          delegate: "GPU",
        },
        outputCategoryMask: false,
        outputConfidenceMasks: true,
      });
    })();
  }
  return segmenterPromise;
}

// Upscales a single-channel mask (native model resolution, e.g. 256px) to
// the target size via a plain canvas draw -- imageSmoothingEnabled controls
// whether that scale is bilinear/bicubic or nearest-neighbor, so this is
// also where the MASK_UPSCALE_BILINEAR toggle takes effect.
function upscaleMask(
  maskValues: Float32Array,
  maskWidth: number,
  maskHeight: number,
  targetWidth: number,
  targetHeight: number,
): Uint8ClampedArray {
  const small = new OffscreenCanvas(maskWidth, maskHeight);
  const smallCtx = small.getContext("2d")!;
  const smallImageData = smallCtx.createImageData(maskWidth, maskHeight);
  for (let i = 0; i < maskWidth * maskHeight; i++) {
    const v = Math.max(0, Math.min(255, Math.round(maskValues[i] * 255)));
    smallImageData.data[i * 4] = v;
    smallImageData.data[i * 4 + 1] = v;
    smallImageData.data[i * 4 + 2] = v;
    smallImageData.data[i * 4 + 3] = 255;
  }
  smallCtx.putImageData(smallImageData, 0, 0);

  const large = new OffscreenCanvas(targetWidth, targetHeight);
  const largeCtx = large.getContext("2d")!;
  largeCtx.imageSmoothingEnabled = MASK_UPSCALE_BILINEAR;
  largeCtx.imageSmoothingQuality = "high";
  largeCtx.drawImage(small, 0, 0, targetWidth, targetHeight);

  const upscaled = largeCtx.getImageData(0, 0, targetWidth, targetHeight).data;
  const result = new Uint8ClampedArray(targetWidth * targetHeight);
  for (let i = 0; i < result.length; i++) result[i] = upscaled[i * 4];
  return result;
}

function applyAlphaSharpening(alpha: Uint8ClampedArray): void {
  const low = ALPHA_SHARPEN_LOW * 255;
  const range = (ALPHA_SHARPEN_HIGH - ALPHA_SHARPEN_LOW) * 255;
  for (let i = 0; i < alpha.length; i++) {
    alpha[i] = Math.max(0, Math.min(255, Math.round(((alpha[i] - low) / range) * 255)));
  }
}

// Iterative (stack-based, not recursive -- a 4-connectivity flood fill over
// a megapixel-scale image would blow the call stack otherwise) 4-connected
// component labeling. Zeroes every foreground blob except the largest.
function keepLargestComponent(alpha: Uint8ClampedArray, width: number, height: number): void {
  const size = width * height;
  const labels = new Int32Array(size).fill(-1);
  const stack: number[] = [];
  let bestLabel = -1;
  let bestSize = 0;
  let nextLabel = 0;

  for (let start = 0; start < size; start++) {
    if (labels[start] !== -1 || alpha[start] <= LARGEST_COMPONENT_ALPHA_THRESHOLD) continue;
    const label = nextLabel++;
    let count = 0;
    labels[start] = label;
    stack.push(start);
    while (stack.length > 0) {
      const idx = stack.pop()!;
      count++;
      const x = idx % width;
      const y = (idx / width) | 0;
      if (x > 0) {
        const n = idx - 1;
        if (labels[n] === -1 && alpha[n] > LARGEST_COMPONENT_ALPHA_THRESHOLD) { labels[n] = label; stack.push(n); }
      }
      if (x < width - 1) {
        const n = idx + 1;
        if (labels[n] === -1 && alpha[n] > LARGEST_COMPONENT_ALPHA_THRESHOLD) { labels[n] = label; stack.push(n); }
      }
      if (y > 0) {
        const n = idx - width;
        if (labels[n] === -1 && alpha[n] > LARGEST_COMPONENT_ALPHA_THRESHOLD) { labels[n] = label; stack.push(n); }
      }
      if (y < height - 1) {
        const n = idx + width;
        if (labels[n] === -1 && alpha[n] > LARGEST_COMPONENT_ALPHA_THRESHOLD) { labels[n] = label; stack.push(n); }
      }
    }
    if (count > bestSize) {
      bestSize = count;
      bestLabel = label;
    }
  }

  if (bestLabel === -1) return;
  for (let i = 0; i < size; i++) {
    if (labels[i] !== bestLabel) alpha[i] = 0;
  }
}

// Runs selfie segmentation and applies the resulting per-pixel mask as the
// output image's alpha channel, so the result is a transparent PNG/WebP in
// the same shape as imgly's removeBackground() output -- callers downstream
// (cropToContent, poster compositing) don't need to know which engine
// produced it.
async function removeBackgroundMediaPipe(source: Blob): Promise<Blob> {
  const segmenter = await getSegmenter();
  const bitmap = await createImageBitmap(source);

  const result = segmenter.segment(bitmap);
  const backgroundMask = result.confidenceMasks?.[BACKGROUND_CATEGORY_INDEX];
  if (!backgroundMask) {
    result.close();
    bitmap.close();
    throw new Error("mediapipe-no-confidence-mask");
  }

  const backgroundData = backgroundMask.getAsFloat32Array();
  const foreground = new Float32Array(backgroundData.length);
  for (let i = 0; i < backgroundData.length; i++) foreground[i] = 1 - backgroundData[i];

  const { width, height } = bitmap;
  const alpha = upscaleMask(foreground, backgroundMask.width, backgroundMask.height, width, height);
  result.close();

  if (APPLY_ALPHA_SHARPENING) applyAlphaSharpening(alpha);
  if (KEEP_LARGEST_COMPONENT_ONLY) keepLargestComponent(alpha, width, height);

  let aliveCount = 0;
  for (let i = 0; i < alpha.length; i++) {
    if (alpha[i] > LARGEST_COMPONENT_ALPHA_THRESHOLD) aliveCount++;
  }
  const aliveRatio = aliveCount / alpha.length;
  if (aliveRatio < MIN_ALIVE_ALPHA_RATIO) {
    bitmap.close();
    throw new Error(`mediapipe-low-alpha-coverage:${(aliveRatio * 100).toFixed(1)}%`);
  }

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  for (let i = 0; i < width * height; i++) pixels[i * 4 + 3] = alpha[i];
  ctx.putImageData(imageData, 0, 0);

  return canvas.convertToBlob({ type: "image/webp", quality: 0.92 });
}

export type WorkerRequest =
  | { id: number; type: "remove"; blob: Blob; model?: BgRemovalModel; device?: BgRemovalDevice; debug?: boolean }
  | { id: number; type: "preload"; model?: BgRemovalModel; device?: BgRemovalDevice }
  | { id: number; type: "preloadMediaPipe" };

export type WorkerResponse =
  | { id: number; type: "remove"; status: "retrying" }
  | { id: number; type: "remove"; status: "done"; blob: Blob; elapsedMs: number }
  | { id: number; type: "preload"; status: "done" }
  | { id: number; type: "preloadMediaPipe"; status: "done" }
  | { id: number; status: "error"; message: string };

addEventListener("message", async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  try {
    if (request.type === "preloadMediaPipe") {
      // Warms up the mobile MediaPipe path only -- desktop never touches
      // getSegmenter(), so this can't affect the imgly + WebGPU path.
      await getSegmenter();
      const response: WorkerResponse = { id: request.id, type: "preloadMediaPipe", status: "done" };
      postMessage(response);
      return;
    }

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
      if (request.debug) console.log("[background-removal] engine: gpu (imgly + WebGPU)");
      blob = await removeBackground(shrunk, config);
    } else {
      // Mobile path: try MediaPipe first, fall back to the existing imgly
      // cpu path (same `config` the old mobile-only path already used) on
      // any failure -- unsupported delegate, missing WebGL2, etc.
      try {
        blob = await removeBackgroundMediaPipe(shrunk);
        if (request.debug) console.log("[background-removal] engine: mediapipe");
      } catch (mediapipeError) {
        console.warn("[background-removal] MediaPipe failed, falling back to imgly cpu:", mediapipeError);
        if (request.debug) console.log("[background-removal] engine: cpu (imgly fallback)");
        const retrying: WorkerResponse = { id: request.id, type: "remove", status: "retrying" };
        postMessage(retrying);
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
