import type { TemplateLayer } from "@/lib/templates/types";
import type { TextField } from "@/lib/templates/constants";
import { DEFAULT_DATE_FORMAT } from "@/lib/render/format";
import { parseLayerName, type ParsedLayerName } from "./layer-name-grammar";

export interface ParseSvgTemplateResult {
  canvasSize: { width: number; height: number };
  layers: TemplateLayer[];
  warnings: string[];
}

const DYNAMIC_TEXT_ROLES: Record<string, TextField> = {
  maintext: "userText",
  datetext: "date",
  locationtext: "location",
  nicktext: "nickname",
};

function getLayerName(el: Element): string | null {
  return el.getAttribute("id") || el.getAttribute("data-name") || null;
}

function parseNumberAttr(value: string | null): number | null {
  if (!value) return null;
  const match = value.trim().match(/^(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

function readCanvasSize(svgEl: SVGSVGElement): { width: number; height: number } {
  const viewBox = svgEl.getAttribute("viewBox");
  if (viewBox) {
    const parts = viewBox.trim().split(/\s+/).map(Number);
    if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
      return { width: parts[2], height: parts[3] };
    }
  }
  const width = parseNumberAttr(svgEl.getAttribute("width"));
  const height = parseNumberAttr(svgEl.getAttribute("height"));
  if (width && height) return { width, height };

  const bbox = svgEl.getBBox();
  return { width: bbox.width, height: bbox.height };
}

async function rasterizeSvgString(
  svgString: string,
  width: number,
  height: number,
): Promise<{ blob: Blob; hasVisiblePixels: boolean }> {
  const blob = new Blob([svgString], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Failed to rasterize SVG element"));
      image.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, width, height);

    const { data } = ctx.getImageData(0, 0, width, height);
    let hasVisiblePixels = false;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) {
        hasVisiblePixels = true;
        break;
      }
    }

    const pngBlob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"));
    return { blob: pngBlob, hasVisiblePixels };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Clones the SVG and hides every element whose id is in hiddenIds. Leaves
 * everything else (including unnamed decorative content) untouched. */
function cloneHiding(svgEl: SVGSVGElement, hiddenIds: Iterable<string>): SVGSVGElement {
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  for (const id of hiddenIds) {
    const target = clone.querySelector(`#${CSS.escape(id)}`) ?? findByDataName(clone, id);
    if (target) (target as SVGElement).style.display = "none";
  }
  return clone;
}

/**
 * Clones the SVG and hides every element EXCEPT the given target and its own
 * descendants — including unnamed siblings, which `cloneHiding` can't reach
 * since it can only look up elements by id. Used to isolate a single
 * decorative layer for rasterization without any of the rest of the design
 * (named or not) bleeding into the same PNG.
 */
function cloneShowingOnly(svgEl: SVGSVGElement, targetId: string): SVGSVGElement {
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  const target = clone.querySelector(`#${CSS.escape(targetId)}`) ?? findByDataName(clone, targetId);
  if (!target) return clone;

  const hideSiblingsAlongPathTo = (el: Element) => {
    for (const child of Array.from(el.children)) {
      if (child === target) continue;
      if (child.contains(target)) {
        hideSiblingsAlongPathTo(child);
        continue;
      }
      (child as SVGElement).style.display = "none";
    }
  };
  hideSiblingsAlongPathTo(clone);
  return clone;
}

/**
 * `getBBox()` returns an element's geometry in its own local coordinate
 * system, ignoring that element's own `transform` attribute (a well-known
 * SVG gotcha) — so a rotated/scaled layer reports its pre-transform box, not
 * where it actually ends up on the canvas. `getCTM()` gives the full matrix
 * (this element's transform plus every ancestor's) from that local space to
 * the root canvas, so we transform the bbox's corners through it and take
 * the axis-aligned box of the result to get the real on-canvas position.
 */
function getElementCanvasRect(el: SVGGraphicsElement): { x: number; y: number; width: number; height: number } {
  const bbox = el.getBBox();
  const ctm = el.getCTM();
  if (!ctm) {
    return { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
  }

  const corners = [
    new DOMPoint(bbox.x, bbox.y),
    new DOMPoint(bbox.x + bbox.width, bbox.y),
    new DOMPoint(bbox.x, bbox.y + bbox.height),
    new DOMPoint(bbox.x + bbox.width, bbox.y + bbox.height),
  ].map((point) => point.matrixTransform(ctm));

  const xs = corners.map((p) => p.x);
  const ys = corners.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { x: minX, y: minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function buildDynamicLayer(
  elementId: string,
  parsed: ParsedLayerName,
  rect: { x: number; y: number; width: number; height: number },
  zIndex: number,
): TemplateLayer | null {
  const role = parsed.role.toLowerCase();
  const position = rect;

  if (role === "originphoto") {
    return {
      id: elementId,
      type: "image",
      zIndex,
      position,
      imageSlot: "userPhoto",
      fit: "contain",
    };
  }

  const textField = DYNAMIC_TEXT_ROLES[role];
  if (!textField) return null;

  // Text only carries its natural anchor point by default — not the design's
  // (often outline-converted, ink-tight) box size. Real user/date/nickname
  // content rarely matches the original placeholder text's exact width, so
  // forcing a wrap there causes surprise line breaks. Wrapping (and
  // box-relative alignment within that wrap width) only happens when the
  // admin explicitly asks for it via a "w200px" token.
  //
  // Where the anchor sits depends on alignment, though: left-aligned text
  // grows rightward from the placeholder's left edge (the only behavior
  // before "center"/"right" existed), but center/right text needs to anchor
  // at the placeholder's center/right edge instead, or real content would
  // visibly drift off to one side as its length differs from the
  // placeholder's. (The renderer treats an unset position.width as "no box"
  // and uses this x as the literal anchor, via native canvas text
  // alignment — see drawTextLayer in render-poster.ts.)
  let anchorX = position.x;
  if (!parsed.wrapWidthPx && parsed.align === "center") {
    anchorX = position.x + position.width / 2;
  } else if (!parsed.wrapWidthPx && parsed.align === "right") {
    anchorX = position.x + position.width;
  }

  return {
    id: elementId,
    type: "text",
    zIndex,
    position: { x: anchorX, y: position.y, width: parsed.wrapWidthPx },
    textField,
    dateFormat: textField === "date" ? parsed.extraTokens[0] ?? DEFAULT_DATE_FORMAT : undefined,
    fontFamily: parsed.fontFamily,
    fontSize: parsed.fontSizePx,
    color: parsed.color,
    align: parsed.align,
    scaleX: parsed.scaleAxis === "row" ? parsed.scaleFactor : undefined,
    scaleY: parsed.scaleAxis === "column" ? parsed.scaleFactor : undefined,
    letterSpacing: parsed.letterSpacingPercent !== undefined ? parsed.letterSpacingPercent / 100 : undefined,
    lineHeight: parsed.lineHeightMultiplier,
  };
}

/**
 * Parses an SVG design (exported from Figma or similar) into a PosterTemplate's
 * layers, using a layer-naming convention ("{tier|last}_{role}[_size][_color][_scale][_font]")
 * instead of hand-written coordinates:
 *
 * - A layer named with a recognized dynamic role (originphoto, maintext,
 *   dateText, locationText, nickText) becomes a live image/text slot,
 *   positioned from that layer's actual bounding box in the design.
 * - A layer named with the tier convention but an unrecognized role (e.g.
 *   "9_ribbon") is treated as an opt-in decoration — rasterized on its own
 *   at its given tier, so it can sit in front of the photo/text if needed.
 * - Everything else — any layer the admin didn't bother naming at all — is
 *   automatically flattened into one background image behind everything
 *   (z-index 0). This is the common case: only name the handful of slots
 *   that actually need to change; the rest of the design just works as-is.
 */
export async function parseSvgTemplate(svgText: string): Promise<ParseSvgTemplateResult> {
  const warnings: string[] = [];
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-99999px";
  container.style.top = "0";
  container.style.pointerEvents = "none";
  container.innerHTML = svgText;
  document.body.appendChild(container);

  try {
    const svgEl = container.querySelector("svg") as SVGSVGElement | null;
    if (!svgEl) throw new Error("올바른 SVG 파일이 아닙니다.");

    const canvasSize = readCanvasSize(svgEl);

    const named = Array.from(svgEl.querySelectorAll<SVGGraphicsElement>("[id], [data-name]"));
    const slots: Array<{
      el: SVGGraphicsElement;
      id: string;
      parsed: ParsedLayerName;
      rect: { x: number; y: number; width: number; height: number };
    }> = [];

    for (const el of named) {
      const name = getLayerName(el);
      if (!name) continue;
      const parsed = parseLayerName(name);
      // Names that don't match the tier convention are just regular design
      // content — they fall through into the auto-generated background below.
      if (!parsed) continue;
      let rect: { x: number; y: number; width: number; height: number };
      try {
        rect = getElementCanvasRect(el);
      } catch {
        warnings.push(`"${name}" 레이어의 위치를 읽을 수 없어 건너뜁니다.`);
        continue;
      }
      slots.push({ el, id: name, parsed, rect });
    }

    const maxNumericTier = slots.reduce(
      (max, s) => (typeof s.parsed.tier === "number" ? Math.max(max, s.parsed.tier) : max),
      0,
    );
    let lastCounter = 0;

    const layers: TemplateLayer[] = [];

    for (const slot of slots) {
      const zIndex =
        slot.parsed.tier === "last" ? maxNumericTier + 1 + lastCounter++ : slot.parsed.tier;

      const rect = {
        x: Math.round(slot.rect.x),
        y: Math.round(slot.rect.y),
        width: Math.round(slot.rect.width),
        height: Math.round(slot.rect.height),
      };

      const dynamicLayer = buildDynamicLayer(slot.id, slot.parsed, rect, zIndex);
      if (dynamicLayer) {
        layers.push(dynamicLayer);
        continue;
      }

      // Explicitly-named decorative layer (e.g. something that must sit in
      // front of the photo): rasterize just this element in isolation, so
      // nothing else — named or not — bleeds into its PNG.
      const clone = cloneShowingOnly(svgEl, slot.id);
      const serialized = new XMLSerializer().serializeToString(clone);
      const { blob } = await rasterizeSvgString(serialized, canvasSize.width, canvasSize.height);
      const dataUrl = await blobToDataUrl(blob);

      layers.push({
        id: slot.id,
        type: "decoration",
        zIndex,
        position: { x: 0, y: 0, width: canvasSize.width, height: canvasSize.height },
        assetPath: dataUrl,
      });
    }

    // Everything that wasn't explicitly named as a slot — background art,
    // illustrations, brand marks the admin didn't bother tiering — gets
    // flattened into one auto-background behind all of the above (z-index 0).
    const recognizedIds = slots.map((s) => s.id);
    const backgroundClone = cloneHiding(svgEl, recognizedIds);
    const backgroundSvg = new XMLSerializer().serializeToString(backgroundClone);
    const { blob: backgroundBlob, hasVisiblePixels } = await rasterizeSvgString(
      backgroundSvg,
      canvasSize.width,
      canvasSize.height,
    );
    if (hasVisiblePixels) {
      const backgroundDataUrl = await blobToDataUrl(backgroundBlob);
      layers.push({
        id: "auto-background",
        type: "decoration",
        zIndex: 0,
        position: { x: 0, y: 0, width: canvasSize.width, height: canvasSize.height },
        assetPath: backgroundDataUrl,
      });
    }

    const foundRoles = new Set(slots.map((s) => s.parsed.role.toLowerCase()));
    if (!foundRoles.has("originphoto")) {
      warnings.push("사진이 들어갈 자리(originphoto)를 찾지 못했습니다 — 사진 없는 템플릿이라면 무시해도 됩니다.");
    }

    return { canvasSize, layers, warnings };
  } finally {
    document.body.removeChild(container);
  }
}

function findByDataName(root: Element, name: string): Element | null {
  return root.querySelector(`[data-name="${CSS.escape(name)}"]`);
}
