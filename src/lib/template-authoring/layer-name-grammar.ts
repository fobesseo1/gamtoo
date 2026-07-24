import { resolveColorToken } from "./tailwind-colors";

export interface ParsedLayerName {
  /** Stacking order: an explicit number, or "last" for "always on top". */
  tier: number | "last";
  /** Semantic slot type, e.g. "originphoto", "maintext", "dateText". Case-insensitive. */
  role: string;
  fontSizePx?: number;
  /** Resolved "#rrggbb". */
  color?: string;
  scaleAxis?: "row" | "column";
  scaleFactor?: number;
  fontFamily?: string;
  /** "left" (default) grows the text rightward from the layer's position;
   * "center"/"right" anchor it at the placeholder's center/right edge
   * instead, so real content of any length stays centered/right-hung there
   * rather than always drifting rightward from a fixed left edge. */
  align?: "left" | "center" | "right";
  /** Explicit wrap width in px. Text has no forced wrap width by default —
   * without this, it just starts at its position and runs on one line. */
  wrapWidthPx?: number;
  /** Tracking override as a percent (e.g. -8 for -8%). Defaults to -5% when unset. */
  letterSpacingPercent?: number;
  /** Line-height multiplier override (e.g. 1.5). */
  lineHeightMultiplier?: number;
  /** Anything after the role that isn't a recognized modifier token (e.g. "yyyy/mm/dd" for dateText). */
  extraTokens: string[];
}

const FONT_SIZE_PATTERN = /^(\d+(?:\.\d+)?)px$/i;
const SCALE_PATTERN = /^(row|column)(\d+(?:\.\d+)?)$/i;
const WRAP_WIDTH_PATTERN = /^w(\d+(?:\.\d+)?)px$/i;
const TRACKING_PATTERN = /^track(-?\d+(?:\.\d+)?)$/i;
const LINE_HEIGHT_PATTERN = /^lh(\d+(?:\.\d+)?)$/i;
/** Must be checked before the font-family catch-all, same reasoning as the
 * date-format token below — these are plain letter tokens that'd otherwise
 * look like a font name. */
const ALIGN_PATTERN = /^(left|center|right)$/i;
/** A date-format token like "mmdd", "yymm", "yyyy/mm/dd" — made only of
 * y/m/d and separators. Must be checked before the font-family catch-all,
 * since a pure-letter token like "mmdd" would otherwise look like a font name. */
const DATE_FORMAT_TOKEN_PATTERN = /^(?=[ymd/.\-]*[ymd])[ymd/.\-]+$/i;

/** Korean keywords admins can type in a layer name instead of a real CSS font-family. */
const FONT_ALIASES: Record<string, string> = {
  필기체: '"Nanum Pen Script", cursive',
};

/**
 * Parses a design-tool layer name like "3_nickText_32px_red-200_column1.5_필기체"
 * into structured slot data. Returns null if the name doesn't start with a
 * tier token ("last" or a number) — such layers aren't part of the template convention.
 */
export function parseLayerName(name: string): ParsedLayerName | null {
  const tokens = name.trim().split("_").filter(Boolean);
  if (tokens.length < 2) return null;

  const [tierToken, roleToken, ...rest] = tokens;

  let tier: number | "last";
  if (tierToken.toLowerCase() === "last") {
    tier = "last";
  } else if (/^\d+$/.test(tierToken)) {
    tier = Number(tierToken);
  } else {
    return null;
  }

  const result: ParsedLayerName = { tier, role: roleToken, extraTokens: [] };

  for (const token of rest) {
    const sizeMatch = token.match(FONT_SIZE_PATTERN);
    if (sizeMatch) {
      result.fontSizePx = parseFloat(sizeMatch[1]);
      continue;
    }

    const scaleMatch = token.match(SCALE_PATTERN);
    if (scaleMatch) {
      result.scaleAxis = scaleMatch[1].toLowerCase() as "row" | "column";
      result.scaleFactor = parseFloat(scaleMatch[2]);
      continue;
    }

    const wrapMatch = token.match(WRAP_WIDTH_PATTERN);
    if (wrapMatch) {
      result.wrapWidthPx = parseFloat(wrapMatch[1]);
      continue;
    }

    const trackingMatch = token.match(TRACKING_PATTERN);
    if (trackingMatch) {
      result.letterSpacingPercent = parseFloat(trackingMatch[1]);
      continue;
    }

    const lineHeightMatch = token.match(LINE_HEIGHT_PATTERN);
    if (lineHeightMatch) {
      result.lineHeightMultiplier = parseFloat(lineHeightMatch[1]);
      continue;
    }

    const color = resolveColorToken(token);
    if (color) {
      result.color = color;
      continue;
    }

    const alignMatch = token.match(ALIGN_PATTERN);
    if (alignMatch) {
      result.align = alignMatch[1].toLowerCase() as "left" | "center" | "right";
      continue;
    }

    if (DATE_FORMAT_TOKEN_PATTERN.test(token)) {
      result.extraTokens.push(token);
      continue;
    }

    if (!result.fontFamily && /^[a-zA-Z가-힣][a-zA-Z가-힣0-9\s]*$/.test(token)) {
      result.fontFamily = FONT_ALIASES[token] ?? token;
      continue;
    }

    result.extraTokens.push(token);
  }

  return result;
}
