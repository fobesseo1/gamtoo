import { InlineSvgContent } from "./inline-svg-content";

interface HatIconProps {
  svgPath: string;
  /** Not-yet-acquired items render as a shape-only silhouette (see
   * InlineSvgContent) -- the collection grid's whole point is showing
   * "what exists" without giving away the real color/design. */
  silhouette?: boolean;
  className?: string;
}

/** A hat rendered on its own (no character underneath) -- the collection
 * grid (docs/gamtoo-item-system.md 7) shows items, not characters, since
 * it's "which hats have I collected," not "how does my character look." */
export function HatIcon({ svgPath, silhouette, className }: HatIconProps) {
  return (
    <svg viewBox="0 -100 270 370" overflow="visible" className={className}>
      <InlineSvgContent src={svgPath} silhouette={silhouette} />
    </svg>
  );
}
