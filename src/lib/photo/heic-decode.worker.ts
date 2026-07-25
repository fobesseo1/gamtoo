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

const MAX_HEIC_DECODE_DIMENSION = 1024;

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

export type HeicDecodeRequest = { id: number; blob: Blob };
export type HeicDecodeResponse =
  | { id: number; status: "done"; blob: Blob }
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

    const bitmap = await createImageBitmap(new ImageData(pixels.data as Uint8ClampedArray<ArrayBuffer>, width, height));

    // Resize on the spot, straight from the decoded pixels, to the same cap
    // background removal uses -- so a HEIC photo only ever gets resized
    // once instead of once here and again inside background-removal.worker.ts.
    const scale = Math.min(1, MAX_HEIC_DECODE_DIMENSION / Math.max(width, height));
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));

    const canvas = new OffscreenCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    bitmap.close();

    const blob = await canvas.convertToBlob({ type: "image/webp", quality: 0.92 });
    const response: HeicDecodeResponse = { id: request.id, status: "done", blob };
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
