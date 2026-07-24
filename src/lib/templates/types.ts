import type {
  ImageFit,
  ImageSlot,
  LayerType,
  TemplateCategory,
  TextAlign,
  TextField,
  TimeOfDay,
} from "./constants";

export interface LayerPosition {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

interface BaseLayer {
  id: string;
  type: LayerType;
  zIndex: number;
  position: LayerPosition;
  opacity?: number;
  rotation?: number;
  extraProps?: Record<string, unknown>;
}

export interface BackgroundLayer extends BaseLayer {
  type: "background";
  color?: string;
  assetPath?: string;
}

export interface ImageLayer extends BaseLayer {
  type: "image";
  imageSlot: ImageSlot;
  fit?: ImageFit;
  borderRadius?: number;
}

export interface TextLayer extends BaseLayer {
  type: "text";
  textField: TextField;
  /** Required when textField is "custom"; ignored otherwise. */
  customText?: string;
  /**
   * Only meaningful when textField is "date". A literal format string using
   * yyyy/yy/mm/dd tokens with separators preserved as-is, e.g. "yyyy/mm/dd",
   * "yy.mm.dd", or just "mm/dd" (year omitted entirely). Defaults to "yyyy/mm/dd".
   */
  dateFormat?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number | string;
  color?: string;
  align?: TextAlign;
  lineHeight?: number;
  /** Independent horizontal/vertical stretch, e.g. scaleY: 1.5 stretches text
   * taller without widening it (a "row"/"column" typography effect). Defaults to 1. */
  scaleX?: number;
  scaleY?: number;
  /** Tracking as a fraction of font size (e.g. -0.05 = -5%, tighter). Defaults to -0.05. */
  letterSpacing?: number;
}

export interface DecorationLayer extends BaseLayer {
  type: "decoration";
  assetPath?: string;
  /** If true, the renderer fills assetPath with a randomly picked character illustration. */
  useRandomCharacter?: boolean;
}

export type TemplateLayer = BackgroundLayer | ImageLayer | TextLayer | DecorationLayer;

export interface WeightConditions {
  timeOfDay?: TimeOfDay[];
  weight?: number;
}

export interface PosterTemplate {
  /** Bump when the shape of PosterTemplate/TemplateLayer changes incompatibly. */
  schemaVersion: number;
  id: string;
  name: string;
  category: TemplateCategory;
  canvasSize: { width: number; height: number };
  backgroundColor?: string;
  layers: TemplateLayer[];
  weightConditions?: WeightConditions;
  extraProps?: Record<string, unknown>;
}
