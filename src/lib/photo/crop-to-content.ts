export interface CropToContentResult {
  blob: Blob;
  width: number;
  height: number;
}

interface CropToContentOptions {
  /** Alpha values at or below this are treated as background. 0-255. */
  alphaThreshold?: number;
  /** Extra pixels kept around the detected content on every side. */
  padding?: number;
}

/**
 * Crops a transparent PNG down to the bounding box of its non-transparent
 * pixels, so a background-removed cutout no longer carries the empty
 * margins of the original photo canvas.
 */
export async function cropToContent(
  source: Blob,
  options: CropToContentOptions = {},
): Promise<CropToContentResult> {
  const { alphaThreshold = 10, padding = 0 } = options;

  const bitmap = await createImageBitmap(source);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  let minX = canvas.width;
  let minY = canvas.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const alpha = data[(y * canvas.width + x) * 4 + 3];
      if (alpha > alphaThreshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Nothing above the threshold (fully transparent image) — return untouched.
  if (maxX < minX || maxY < minY) {
    return { blob: source, width: canvas.width, height: canvas.height };
  }

  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(canvas.width - 1, maxX + padding);
  maxY = Math.min(canvas.height - 1, maxY + padding);

  const cropWidth = maxX - minX + 1;
  const cropHeight = maxY - minY + 1;

  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = cropWidth;
  cropCanvas.height = cropHeight;
  const cropCtx = cropCanvas.getContext("2d")!;
  cropCtx.drawImage(canvas, minX, minY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

  const blob = await new Promise<Blob>((resolve) =>
    cropCanvas.toBlob((result) => resolve(result!), "image/png"),
  );

  return { blob, width: cropWidth, height: cropHeight };
}
