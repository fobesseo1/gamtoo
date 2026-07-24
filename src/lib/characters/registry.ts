import { CHARACTER_EXPRESSIONS, CHARACTER_NAMES, type CharacterExpression, type CharacterName } from "./constants";

/** Full-body illustration, used instead of a face expression (e.g. graphic-only hero shots). */
export const CHARACTER_FULL_BODY_POSE = "full" as const;
export type CharacterPose = CharacterExpression | typeof CHARACTER_FULL_BODY_POSE;

export function getCharacterAssetPath(name: CharacterName, pose: CharacterPose): string {
  return `/characters/${name}/${pose}.png`;
}

export function pickRandomCharacter(): { name: CharacterName; expression: CharacterExpression } {
  const name = CHARACTER_NAMES[Math.floor(Math.random() * CHARACTER_NAMES.length)];
  const expression = CHARACTER_EXPRESSIONS[Math.floor(Math.random() * CHARACTER_EXPRESSIONS.length)];
  return { name, expression };
}
