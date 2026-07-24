export const CHARACTER_NAMES = ["seal", "bichon", "panda", "bear", "mochi"] as const;
export type CharacterName = (typeof CHARACTER_NAMES)[number];

export const CHARACTER_EXPRESSIONS = ["calm", "amazed", "joy", "sleepy"] as const;
export type CharacterExpression = (typeof CHARACTER_EXPRESSIONS)[number];

export const CHARACTER_DISPLAY_NAMES: Record<CharacterName, string> = {
  seal: "물범",
  bichon: "비숑",
  panda: "판다",
  bear: "아기곰",
  mochi: "모찌",
};

export const CHARACTER_EXPRESSION_DISPLAY_NAMES: Record<CharacterExpression, string> = {
  calm: "평온",
  amazed: "감탄",
  joy: "기쁨",
  sleepy: "졸림",
};
