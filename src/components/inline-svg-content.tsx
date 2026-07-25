"use client";

import { useEffect, useState } from "react";

interface InlineSvgContentProps {
  src: string;
  /** Flattens whatever colors/gradients the file uses down to a plain gray
   * silhouette -- shape stays legible, color doesn't. Used for
   * not-yet-acquired items in the collection (docs/gamtoo-item-system.md
   * 7.2): a CSS filter works on any file's fill/gradient colors without
   * having to parse or rewrite them. */
  silhouette?: boolean;
}

export const SILHOUETTE_STYLE: React.CSSProperties = { filter: "brightness(0)", opacity: 0.25 };

/** Fetches an SVG file and renders just its inner content (defs + shapes,
 * not the outer <svg> tag) so it can be nested inside a shared parent
 * <svg viewBox="0 -100 270 370">. Every character/hat file uses that same
 * viewBox (see docs/gamtoo-item-system.md 3.1), so layering them is just
 * stacking two of these under one <svg> -- no coordinate math needed.
 * Renders nothing until the fetch resolves. */
export function InlineSvgContent({ src, silhouette }: InlineSvgContentProps) {
  const [inner, setInner] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setInner(null);
    fetch(src)
      .then((res) => res.text())
      .then((text) => {
        if (cancelled) return;
        const match = text.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
        setInner(match ? match[1] : text);
      })
      .catch((error) => {
        console.error(`[inline-svg-content] failed to load ${src}:`, error);
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  if (!inner) return null;
  return (
    // eslint-disable-next-line react/no-danger
    <g style={silhouette ? SILHOUETTE_STYLE : undefined} dangerouslySetInnerHTML={{ __html: inner }} />
  );
}
