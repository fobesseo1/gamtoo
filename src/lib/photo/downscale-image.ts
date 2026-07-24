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

  const bitmap = await createImageBitmap(source);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

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
