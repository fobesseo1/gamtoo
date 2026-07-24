export const TEMPLATE_CATEGORIES = ["photo", "photo-noremovebg", "graphic-only"] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export const LAYER_TYPES = ["background", "image", "text", "decoration"] as const;
export type LayerType = (typeof LAYER_TYPES)[number];

export const TEXT_FIELDS = ["date", "userText", "location", "nickname", "custom"] as const;
export type TextField = (typeof TEXT_FIELDS)[number];

export const IMAGE_SLOTS = ["userPhoto"] as const;
export type ImageSlot = (typeof IMAGE_SLOTS)[number];

export const TIME_OF_DAY = ["morning", "afternoon", "evening", "night"] as const;
export type TimeOfDay = (typeof TIME_OF_DAY)[number];

export const TEXT_ALIGNS = ["left", "center", "right"] as const;
export type TextAlign = (typeof TEXT_ALIGNS)[number];

export const IMAGE_FITS = ["cover", "contain"] as const;
export type ImageFit = (typeof IMAGE_FITS)[number];
