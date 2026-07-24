import type { TextAlign } from "@/lib/templates/constants";

export interface DrawTextOptions {
  text: string;
  x: number;
  y: number;
  maxWidth: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: number | string;
  color: string;
  align: TextAlign;
  /** True when x is the literal draw anchor (already resolved to the left/
   * center/right point it should sit at) rather than a box's left edge —
   * skips the box-relative offset (x + maxWidth/2, etc.) that "center"/
   * "right" would otherwise add, which only makes sense when maxWidth is a
   * real box width and not just a wrap safety net. */
  anchored?: boolean;
  lineHeight: number;
  /** Independent horizontal/vertical stretch around each line's anchor point. Defaults to 1. */
  scaleX?: number;
  scaleY?: number;
  /** Tracking in px (already resolved from the fontSize fraction). */
  letterSpacing?: number;
}

function splitLongWord(ctx: CanvasRenderingContext2D, word: string, maxWidth: number, lines: string[]): string {
  let chunk = "";
  for (const char of word) {
    const candidate = chunk + char;
    if (chunk && ctx.measureText(candidate).width > maxWidth) {
      lines.push(chunk);
      chunk = char;
    } else {
      chunk = candidate;
    }
  }
  return chunk;
}

/** Word-wraps text to fit maxWidth, falling back to character splitting for
 * single "words" that overflow on their own (long unspaced Korean text). */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(" ");
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        current = candidate;
        continue;
      }
      if (current) {
        lines.push(current);
        current = "";
      }
      current =
        ctx.measureText(word).width <= maxWidth ? word : splitLongWord(ctx, word, maxWidth, lines);
    }
    lines.push(current);
  }
  return lines;
}

export function drawText(ctx: CanvasRenderingContext2D, options: DrawTextOptions): void {
  const {
    text,
    x,
    y,
    maxWidth,
    fontFamily,
    fontSize,
    fontWeight,
    color,
    align,
    anchored = false,
    lineHeight,
    scaleX = 1,
    scaleY = 1,
    letterSpacing = 0,
  } = options;
  if (!text) return;

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textBaseline = "top";
  ctx.textAlign = align;
  // Canvas letterSpacing takes a CSS length string, not a bare number.
  // Unsupported in older browsers — silently ignored there (normal tracking).
  ctx.letterSpacing = `${letterSpacing}px`;

  // Wrapping is measured in normal (unscaled) font metrics, matching maxWidth
  // as designed — only the rendered glyphs get stretched, not the line breaks.
  const lines = wrapLines(ctx, text, maxWidth);
  const lineHeightPx = fontSize * lineHeight;
  const drawX = anchored
    ? x
    : align === "left"
      ? x
      : align === "right"
        ? x + maxWidth
        : x + maxWidth / 2;

  lines.forEach((line, i) => {
    const lineY = y + i * lineHeightPx;
    if (scaleX === 1 && scaleY === 1) {
      ctx.fillText(line, drawX, lineY);
      return;
    }
    // Stretch glyphs around this line's anchor point without moving it.
    ctx.save();
    ctx.translate(drawX, lineY);
    ctx.scale(scaleX, scaleY);
    ctx.fillText(line, 0, 0);
    ctx.restore();
  });
}
