import { sniffImageDimensions } from "./sniff-image-dimensions";

export interface DownscaleImageOptions {
  /** Longest side is capped to this many pixels. Never upscales. */
  maxDimension?: number;
  quality?: number;
  mimeType?: string;
}

export interface DownscaleImageResult {
  blob: Blob;
  width: number;
  height: number;
}

const DEFAULT_MAX_DIMENSION = 1600;
const DEFAULT_QUALITY = 0.85;
const DEFAULT_MIME_TYPE = "image/jpeg";

/**
 * Shrinks an uploaded photo to a poster-appropriate resolution before it's
 * fed to background removal or stored. Modern phone photos (4000px+, several
 * MB) add decode/processing time and storage cost far beyond what a poster
 * canvas (~1080px) ever needs, without any visible quality gain.
 *
 * Real high-megapixel phone photos (50-100+ MP) can fail to decode at all on
 * mobile — "the source image could not be decoded" — because decoding at
 * full resolution needs a huge pixel buffer (100MP × 4 bytes ≈ 400MB) that a
 * phone won't allocate; this isn't a specific-browser quirk, every mobile
 * browser tested hit the same wall past some size. So this decodes straight
 * to the target size via createImageBitmap's resize options (which can use
 * the codec's own scaled decode instead of decoding full-res first) whenever
 * the file's real dimensions can be read cheaply from its header — the
 * multi-hundred-MB buffer is never allocated in the first place.
 */
export async function downscaleImage(
  source: Blob,
  options: DownscaleImageOptions = {},
): Promise<DownscaleImageResult> {
  const {
    maxDimension = DEFAULT_MAX_DIMENSION,
    quality = DEFAULT_QUALITY,
    mimeType = DEFAULT_MIME_TYPE,
  } = options;

  const dims = await sniffImageDimensions(source);

  let bitmap: ImageBitmap;
  if (dims) {
    const scale = Math.min(1, maxDimension / Math.max(dims.width, dims.height));
    bitmap = await createImageBitmap(source, {
      resizeWidth: Math.max(1, Math.round(dims.width * scale)),
      resizeHeight: Math.max(1, Math.round(dims.height * scale)),
      resizeQuality: "medium",
    });
  } else {
    // Unknown format (not JPEG/PNG) — fall back to a plain full decode.
    bitmap = await createImageBitmap(source);
  }

  const width = bitmap.width;
  const height = bitmap.height;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((result) => resolve(result!), mimeType, quality),
  );

  return { blob, width, height };
}
