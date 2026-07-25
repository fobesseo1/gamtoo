/**
 * Decodes HEIC/HEIF straight to pixels via libheif-js, instead of heic2any's
 * decode-then-re-encode-to-JPEG round trip (our own code then had to decode
 * that JPEG all over again afterward). Runs in a Worker: libheif-js's WASM
 * binary is large enough (~1MB) that Chrome blocks synchronous
 * WebAssembly compilation on the main thread, but Workers have no such
 * limit.
 *
 * Deliberately avoids `self`/`DedicatedWorkerGlobalScope` typing, same as
 * background-removal.worker.ts — see that file for why.
 */

// @ts-expect-error -- libheif-js ships no TypeScript types for this subpath;
// runtime shape (HeifDecoder/.decode()/.display()) is documented in its
// README, not in a .d.ts.
import libheifModule from "libheif-js/wasm-bundle";

interface HeifDisplayResult {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

interface HeifImage {
  get_width(): number;
  get_height(): number;
  display(
    target: { data: Uint8ClampedArray; width: number; height: number },
    callback: (result: HeifDisplayResult | null) => void,
  ): void;
}

interface HeifDecoderInstance {
  decode(buffer: Uint8Array): HeifImage[];
}

const libheif = libheifModule as { HeifDecoder: new () => HeifDecoderInstance };

// Matches downscale-image.ts's DEFAULT_MAX_DIMENSION -- the poster's visible
// "original photo" copy for a HEIC upload should be capped exactly the same
// as a JPEG/PNG upload's, not silently downgraded because it came from HEIC.
const POSTER_MAX_DIMENSION = 1600;
// Matches background-removal.worker.ts's MAX_BG_REMOVAL_DIMENSION.
const BG_REMOVAL_MAX_DIMENSION = 1024;

async function resizeBitmap(bitmap: ImageBitmap, maxDimension: number): Promise<Blob> {
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas.convertToBlob({ type: "image/webp", quality: 0.92 });
}

export type HeicDecodeRequest = { id: number; blob: Blob };
export type HeicDecodeResponse =
  | { id: number; status: "done"; poster: Blob; bgRemoval: Blob }
  | { id: number; status: "error"; message: string };

addEventListener("message", async (event: MessageEvent<HeicDecodeRequest>) => {
  const request = event.data;
  try {
    const bytes = new Uint8Array(await request.blob.arrayBuffer());
    const decoder = new libheif.HeifDecoder();
    const image = decoder.decode(bytes)[0];
    if (!image) throw new Error("heic-no-image");

    const width = image.get_width();
    const height = image.get_height();
    const pixels = await new Promise<HeifDisplayResult>((resolve, reject) => {
      image.display({ data: new Uint8ClampedArray(width * height * 4), width, height }, (result) => {
        if (!result) reject(new Error("heic-display-failed"));
        else resolve(result);
      });
    });

    // Decoded once here, then drawn (read-only, doesn't consume the bitmap)
    // into two differently-sized canvases below -- no second HEIC decode.
    const bitmap = await createImageBitmap(new ImageData(pixels.data as Uint8ClampedArray<ArrayBuffer>, width, height));

    const [poster, bgRemoval] = await Promise.all([
      resizeBitmap(bitmap, POSTER_MAX_DIMENSION),
      resizeBitmap(bitmap, BG_REMOVAL_MAX_DIMENSION),
    ]);
    bitmap.close();

    const response: HeicDecodeResponse = { id: request.id, status: "done", poster, bgRemoval };
    postMessage(response);
  } catch (error) {
    const response: HeicDecodeResponse = {
      id: request.id,
      status: "error",
      message: error instanceof Error ? error.message : String(error),
    };
    postMessage(response);
  }
});
