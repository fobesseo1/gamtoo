import type { CharacterExpression, CharacterName } from "@/lib/characters/constants";
import { getCharacterAssetPath, pickRandomCharacter } from "@/lib/characters/registry";
import type {
  BackgroundLayer,
  DecorationLayer,
  ImageLayer,
  PosterTemplate,
  TemplateLayer,
  TextLayer,
} from "@/lib/templates/types";
import type { ImageFit } from "@/lib/templates/constants";
import { drawText } from "./draw-text";
import { formatDate } from "./format";
import { computeFitRect, roundedRectPath, type Rect } from "./geometry";
import { loadDrawable } from "./load-image";

/** Matches the app's own body font (see globals.css) so unstyled text layers
 * look consistent with the rest of the product rather than a generic fallback. */
const DEFAULT_FONT_FAMILY = '"Pretendard Variable", sans-serif';

/** -5% tracking by default, as a fraction of font size. */
const DEFAULT_LETTER_SPACING = -0.05;

export interface RenderPosterData {
  /** The processed user photo: background-removed cutout, or the (downscaled)
   * original — either way, "photo" category templates. Omitted for graphic-only. */
  userPhoto?: Blob;
  userText?: string;
  date?: Date;
  location?: string;
  nickname?: string;
  /** Fixes the character used by decoration layers with useRandomCharacter.
   * If omitted, one is picked randomly and reused for every such layer in this render. */
  character?: { name: CharacterName; expression: CharacterExpression };
  /**
   * Overrides every image layer's fit for this render. A background-removed
   * cutout has no fill around the subject, so "cover" (built for full
   * rectangular photos) crops into the person — pass "contain" when
   * userPhoto is a cutout. Leave unset to use each template's own fit.
   */
  imageFit?: ImageFit;
}

function resolveTextValue(layer: TextLayer, data: RenderPosterData): string {
  switch (layer.textField) {
    case "date":
      return data.date ? formatDate(data.date, layer.dateFormat) : "";
    case "userText":
      return data.userText ?? "";
    case "location":
      return data.location ?? "";
    case "nickname":
      return data.nickname ?? "";
    case "custom":
      return layer.customText ?? "";
    default:
      return "";
  }
}

function layerRect(layer: TemplateLayer, canvasWidth: number, canvasHeight: number): Rect {
  const { x, y, width, height } = layer.position;
  return {
    x,
    y,
    width: width ?? canvasWidth - x,
    height: height ?? canvasHeight - y,
  };
}

async function drawBackgroundLayer(
  ctx: CanvasRenderingContext2D,
  layer: BackgroundLayer,
  template: PosterTemplate,
): Promise<void> {
  const rect = layerRect(layer, template.canvasSize.width, template.canvasSize.height);
  const color = layer.color ?? template.backgroundColor;
  if (color) {
    ctx.fillStyle = color;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  }
  if (layer.assetPath) {
    const bitmap = await loadDrawable(layer.assetPath);
    const fitted = computeFitRect(bitmap.width, bitmap.height, rect, "cover");
    ctx.drawImage(bitmap, fitted.x, fitted.y, fitted.width, fitted.height);
    bitmap.close();
  }
}

async function drawImageLayer(
  ctx: CanvasRenderingContext2D,
  layer: ImageLayer,
  bitmap: ImageBitmap,
  canvasWidth: number,
  canvasHeight: number,
  fitOverride: ImageFit | undefined,
): Promise<void> {
  const rect = layerRect(layer, canvasWidth, canvasHeight);
  const fit = fitOverride ?? layer.fit ?? "cover";

  ctx.save();
  if (layer.borderRadius) {
    roundedRectPath(ctx, rect.x, rect.y, rect.width, rect.height, layer.borderRadius);
  } else {
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
  }
  ctx.clip();

  const fitted = computeFitRect(bitmap.width, bitmap.height, rect, fit);
  ctx.drawImage(bitmap, fitted.x, fitted.y, fitted.width, fitted.height);
  ctx.restore();
}

function drawTextLayer(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  data: RenderPosterData,
  canvasWidth: number,
  canvasHeight: number,
): void {
  const value = resolveTextValue(layer, data);
  if (!value) return;
  const rect = layerRect(layer, canvasWidth, canvasHeight);
  const fontSize = layer.fontSize ?? 16;
  drawText(ctx, {
    text: value,
    x: rect.x,
    y: rect.y,
    maxWidth: rect.width,
    // No explicit wrap width means layer.position.x is already the literal
    // anchor point (see buildDynamicLayer in svg-template-parser.ts) — with
    // an explicit box, x is the box's left edge instead, and align should
    // position text within it the usual box-relative way.
    anchored: layer.position.width === undefined,
    fontFamily: layer.fontFamily ?? DEFAULT_FONT_FAMILY,
    fontSize,
    fontWeight: layer.fontWeight ?? 400,
    color: layer.color ?? "#000000",
    align: layer.align ?? "left",
    lineHeight: layer.lineHeight ?? 1.2,
    scaleX: layer.scaleX ?? 1,
    scaleY: layer.scaleY ?? 1,
    // -5% tracking by default — tighter, more "designed" typography, and it's
    // what lets 16px default text keep fitting boxes sized for smaller originals.
    letterSpacing: fontSize * (layer.letterSpacing ?? DEFAULT_LETTER_SPACING),
  });
}

async function drawDecorationLayer(
  ctx: CanvasRenderingContext2D,
  layer: DecorationLayer,
  character: { name: CharacterName; expression: CharacterExpression },
  canvasWidth: number,
  canvasHeight: number,
): Promise<void> {
  const rect = layerRect(layer, canvasWidth, canvasHeight);

  const assetPath = layer.useRandomCharacter
    ? getCharacterAssetPath(character.name, character.expression)
    : layer.assetPath;

  if (assetPath) {
    const bitmap = await loadDrawable(assetPath);
    const fitted = computeFitRect(bitmap.width, bitmap.height, rect, "contain");
    ctx.drawImage(bitmap, fitted.x, fitted.y, fitted.width, fitted.height);
    bitmap.close();
    return;
  }

  const shape = layer.extraProps?.shape;
  const color = (layer.extraProps?.color as string | undefined) ?? "#CCCCCC";
  if (shape === "pill") {
    roundedRectPath(ctx, rect.x, rect.y, rect.width, rect.height, rect.height / 2);
    ctx.fillStyle = color;
    ctx.fill();
  } else if (shape === "rect") {
    ctx.fillStyle = color;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  }
}

/**
 * Custom @font-face fonts (like the "필기체" option) are only fetched by the
 * browser once something actually requests them — merely declaring the
 * @font-face doesn't load it. Without this, the very first poster to use a
 * given font would silently render with the browser's fallback instead,
 * since canvas text painting doesn't wait for fonts the way DOM text does.
 */
async function ensureFontsLoaded(layers: TemplateLayer[]): Promise<void> {
  const specs = new Set(
    layers
      .filter((l): l is TextLayer => l.type === "text")
      .map((l) => `${l.fontWeight ?? 400} ${l.fontSize ?? 16}px ${l.fontFamily ?? DEFAULT_FONT_FAMILY}`),
  );
  await Promise.all(Array.from(specs).map((spec) => document.fonts.load(spec)));
}

/**
 * Composites a PosterTemplate + user data into a final PNG blob. Reads the
 * template data generically (layer type + zIndex order) — never branches on
 * a specific template id/name. Adding a new template never touches this file.
 */
export async function renderPoster(template: PosterTemplate, data: RenderPosterData): Promise<Blob> {
  const { width, height } = template.canvasSize;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  if (template.backgroundColor) {
    ctx.fillStyle = template.backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }

  const character = data.character ?? pickRandomCharacter();
  const [userPhotoBitmap] = await Promise.all([
    data.userPhoto ? loadDrawable(data.userPhoto) : Promise.resolve(null),
    ensureFontsLoaded(template.layers),
  ]);

  const sortedLayers = [...template.layers].sort((a, b) => a.zIndex - b.zIndex);

  for (const layer of sortedLayers) {
    ctx.save();
    if (layer.opacity !== undefined) ctx.globalAlpha = layer.opacity;

    switch (layer.type) {
      case "background":
        await drawBackgroundLayer(ctx, layer, template);
        break;
      case "image":
        if (userPhotoBitmap) {
          await drawImageLayer(ctx, layer, userPhotoBitmap, width, height, data.imageFit);
        }
        break;
      case "text":
        drawTextLayer(ctx, layer, data, width, height);
        break;
      case "decoration":
        await drawDecorationLayer(ctx, layer, character, width, height);
        break;
    }

    ctx.restore();
  }

  userPhotoBitmap?.close();

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), "image/png"));
}
