export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Scales a source image into a destination rect, either fully covering it
 * (cropping overflow) or fitting entirely within it (letterboxed).
 */
export function computeFitRect(
  srcWidth: number,
  srcHeight: number,
  dest: Rect,
  fit: "cover" | "contain",
): Rect {
  const srcRatio = srcWidth / srcHeight;
  const destRatio = dest.width / dest.height;
  const fitsWidthFirst = fit === "cover" ? srcRatio > destRatio : srcRatio < destRatio;

  let width: number;
  let height: number;
  if (fitsWidthFirst) {
    height = dest.height;
    width = height * srcRatio;
  } else {
    width = dest.width;
    height = width / srcRatio;
  }

  return {
    x: dest.x + (dest.width - width) / 2,
    y: dest.y + (dest.height - height) / 2,
    width,
    height,
  };
}

export function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}
