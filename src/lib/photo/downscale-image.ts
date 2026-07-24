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

/** Decodes via an <img> element rather than createImageBitmap() — real phone
 * photos from high-megapixel sensors (108MP Samsung flagships, etc.) hit
 * "the source image could not be decoded" from createImageBitmap on stock
 * Chrome/Brave mobile (Samsung Internet tolerates the same file fine), while
 * the <img> decode path handles the same oversized originals without issue. */
function loadImageElement(source: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(source);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image-decode-failed"));
    img.src = url;
  });
}

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

  const img = await loadImageElement(source);
  try {
    const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.round(img.naturalWidth * scale);
    const height = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((result) => resolve(result!), mimeType, quality),
    );

    return { blob, width, height };
  } finally {
    URL.revokeObjectURL(img.src);
  }
}
