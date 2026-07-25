"use client";

import { useEffect, useState } from "react";

interface InlineSvgContentProps {
  src: string;
}

/** Fetches an SVG file and renders just its inner content (defs + shapes,
 * not the outer <svg> tag) so it can be nested inside a shared parent
 * <svg viewBox="0 -100 270 370">. Every character/hat file uses that same
 * viewBox (see docs/gamtoo-item-system.md 3.1), so layering them is just
 * stacking two of these under one <svg> -- no coordinate math needed.
 * Renders nothing until the fetch resolves. */
export function InlineSvgContent({ src }: InlineSvgContentProps) {
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
  // eslint-disable-next-line react/no-danger
  return <g dangerouslySetInnerHTML={{ __html: inner }} />;
}
