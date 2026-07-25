import type { CharacterName } from "@/lib/characters/constants";
import { InlineSvgContent } from "./inline-svg-content";

interface CharacterWithHatProps {
  character: CharacterName;
  /** e.g. "/hats/hat_crown.svg" -- omit to render the character alone. */
  hatSvgPath?: string;
  className?: string;
}

/** Layers a character and (optionally) a hat inside one shared
 * <svg viewBox="0 -100 270 370">, per docs/gamtoo-item-system.md 3.1-3.2:
 * every character/item SVG uses that exact viewBox, so no per-character
 * anchor/offset math is needed -- the hat is just drawn on top. The hat
 * partially covering ears/antennae is intentional (3.2), not a bug to
 * correct here. */
export function CharacterWithHat({ character, hatSvgPath, className }: CharacterWithHatProps) {
  return (
    <svg viewBox="0 -100 270 370" className={className}>
      <InlineSvgContent src={`/characters/char_${character}.svg`} />
      {hatSvgPath && <InlineSvgContent src={hatSvgPath} />}
    </svg>
  );
}
