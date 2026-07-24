import type { PosterTemplate } from "./types";

import cafeMug from "./data/portrait/cafe-mug";
import cozyScarf from "./data/portrait/cozy-scarf";
import windowLight from "./data/portrait/window-light";

import magazineStrip from "./data/photo-frame/magazine-strip";
import polaroidFrame from "./data/photo-frame/polaroid-frame";
import colorBlockFrame from "./data/photo-frame/color-block-frame";

import characterTypo from "./data/graphic-only/character-typo";
import minimalQuote from "./data/graphic-only/minimal-quote";
import stickerGrid from "./data/graphic-only/sticker-grid";

/**
 * Every template must be imported and listed here. This is the single place
 * a new template needs to be registered — creating the data file alone does
 * not add it to the app.
 */
export const TEMPLATES: PosterTemplate[] = [
  cafeMug,
  cozyScarf,
  windowLight,
  magazineStrip,
  polaroidFrame,
  colorBlockFrame,
  characterTypo,
  minimalQuote,
  stickerGrid,
];
