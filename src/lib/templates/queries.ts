import { getEffectiveTemplates } from "./local-library";
import type { TemplateCategory, TimeOfDay } from "./constants";
import type { PosterTemplate } from "./types";

/** Templates whose time-of-day preference doesn't match are not excluded, only de-prioritized. */
const OFF_TIME_WEIGHT_MULTIPLIER = 0.3;

export function getAllTemplates(): PosterTemplate[] {
  return getEffectiveTemplates();
}

export function getTemplatesByCategory(category: TemplateCategory): PosterTemplate[] {
  return getEffectiveTemplates().filter((template) => template.category === category);
}

export function getTemplateById(id: string): PosterTemplate | undefined {
  return getEffectiveTemplates().find((template) => template.id === id);
}

export function getCurrentTimeOfDay(date: Date = new Date()): TimeOfDay {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

export function pickRandomTemplate(
  category: TemplateCategory | TemplateCategory[],
  options?: { timeOfDay?: TimeOfDay },
): PosterTemplate {
  const categories = Array.isArray(category) ? category : [category];
  const candidates = getEffectiveTemplates().filter((template) => categories.includes(template.category));
  if (candidates.length === 0) {
    throw new Error(`No templates registered for category: ${categories.join(", ")}`);
  }

  const timeOfDay = options?.timeOfDay;
  const weights = candidates.map((template) => {
    const base = template.weightConditions?.weight ?? 1;
    const preferredTimes = template.weightConditions?.timeOfDay;
    if (timeOfDay && preferredTimes && !preferredTimes.includes(timeOfDay)) {
      return base * OFF_TIME_WEIGHT_MULTIPLIER;
    }
    return base;
  });

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = Math.random() * totalWeight;
  for (let i = 0; i < candidates.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}
