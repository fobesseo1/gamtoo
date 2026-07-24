import { TEMPLATES } from "./registry";
import type { TemplateCategory, TimeOfDay } from "./constants";
import type { PosterTemplate } from "./types";

/**
 * Local (this-browser-only) template management layer, sitting on top of the
 * code-defined registry. Lets an admin try out newly-uploaded templates
 * alongside the built-in ones, and tweak/hide any of them, without touching
 * code. None of this is visible to real end users on other devices — it's a
 * curation workspace before a template gets committed into the codebase.
 */

export interface LibraryEntry {
  template: PosterTemplate;
  enabled: boolean;
  addedAt: string;
}

export interface BuiltinOverride {
  enabled: boolean;
  weight?: number;
  timeOfDay?: TimeOfDay[];
}

const ADDED_KEY = "gamtoo:added-templates";
const BUILTIN_OVERRIDES_KEY = "gamtoo:builtin-overrides";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// --- Admin-added templates ---

export function getAddedTemplateEntries(): LibraryEntry[] {
  return readJson<LibraryEntry[]>(ADDED_KEY, []);
}

/** Adds a new template, or replaces an existing one with the same id. */
export function addTemplateToLibrary(template: PosterTemplate): void {
  const entries = getAddedTemplateEntries().filter((e) => e.template.id !== template.id);
  entries.push({ template, enabled: true, addedAt: new Date().toISOString() });
  writeJson(ADDED_KEY, entries);
}

export function removeAddedTemplate(id: string): void {
  writeJson(
    ADDED_KEY,
    getAddedTemplateEntries().filter((e) => e.template.id !== id),
  );
}

export function setAddedTemplateEnabled(id: string, enabled: boolean): void {
  writeJson(
    ADDED_KEY,
    getAddedTemplateEntries().map((e) => (e.template.id === id ? { ...e, enabled } : e)),
  );
}

export function updateAddedTemplateWeight(id: string, weight: number, timeOfDay: TimeOfDay[]): void {
  writeJson(
    ADDED_KEY,
    getAddedTemplateEntries().map((e) =>
      e.template.id === id
        ? {
            ...e,
            template: {
              ...e.template,
              weightConditions: { weight, timeOfDay: timeOfDay.length > 0 ? timeOfDay : undefined },
            },
          }
        : e,
    ),
  );
}

// --- Built-in template overrides (enabled/weight/timeOfDay only — the
// design itself lives in code and isn't editable here) ---

export function getBuiltinOverrides(): Record<string, BuiltinOverride> {
  return readJson(BUILTIN_OVERRIDES_KEY, {});
}

function patchBuiltinOverride(id: string, patch: Partial<BuiltinOverride>): void {
  const all = getBuiltinOverrides();
  const existing = all[id];
  all[id] = {
    // `in` (not `??`) so an explicitly-passed `undefined` (e.g. clearing
    // timeOfDay) overwrites rather than falling back to the old value.
    enabled: "enabled" in patch ? (patch.enabled as boolean) : (existing?.enabled ?? true),
    weight: "weight" in patch ? patch.weight : existing?.weight,
    timeOfDay: "timeOfDay" in patch ? patch.timeOfDay : existing?.timeOfDay,
  };
  writeJson(BUILTIN_OVERRIDES_KEY, all);
}

export function setBuiltinEnabled(id: string, enabled: boolean): void {
  patchBuiltinOverride(id, { enabled });
}

export function updateBuiltinWeight(id: string, weight: number, timeOfDay: TimeOfDay[]): void {
  patchBuiltinOverride(id, { weight, timeOfDay: timeOfDay.length > 0 ? timeOfDay : undefined });
}

// --- Merged, effective registry ---

function applyBuiltinOverride(template: PosterTemplate, override?: BuiltinOverride): PosterTemplate {
  if (!override || (override.weight === undefined && override.timeOfDay === undefined)) return template;
  return {
    ...template,
    weightConditions: {
      weight: override.weight ?? template.weightConditions?.weight ?? 1,
      timeOfDay: override.timeOfDay ?? template.weightConditions?.timeOfDay,
    },
  };
}

/** Every enabled template — built-in (with local overrides applied) plus
 * admin-added — merged into one pool. This is what the real app draws from. */
export function getEffectiveTemplates(): PosterTemplate[] {
  const overrides = getBuiltinOverrides();
  const builtins = TEMPLATES.filter((t) => overrides[t.id]?.enabled ?? true).map((t) =>
    applyBuiltinOverride(t, overrides[t.id]),
  );
  const added = getAddedTemplateEntries()
    .filter((e) => e.enabled)
    .map((e) => e.template);
  return [...builtins, ...added];
}

export interface LibraryRow {
  template: PosterTemplate;
  source: "built-in" | "added";
  enabled: boolean;
}

/** Every template (enabled or not) for the management screen — unlike
 * getEffectiveTemplates, this includes disabled ones so they can be re-enabled. */
export function getAllLibraryRows(): LibraryRow[] {
  const overrides = getBuiltinOverrides();
  const builtinRows: LibraryRow[] = TEMPLATES.map((t) => ({
    template: applyBuiltinOverride(t, overrides[t.id]),
    source: "built-in",
    enabled: overrides[t.id]?.enabled ?? true,
  }));
  const addedRows: LibraryRow[] = getAddedTemplateEntries().map((e) => ({
    template: e.template,
    source: "added",
    enabled: e.enabled,
  }));
  return [...builtinRows, ...addedRows];
}

/** Removes a template from the pool. Built-ins are hidden permanently via a
 * local override (the code file isn't touched) — from the admin's point of
 * view it's gone from the list either way. */
export function deleteLibraryTemplate(id: string, source: "built-in" | "added"): void {
  if (source === "built-in") {
    setBuiltinEnabled(id, false);
  } else {
    removeAddedTemplate(id);
  }
}

export function setLibraryTemplateEnabled(
  id: string,
  source: "built-in" | "added",
  enabled: boolean,
): void {
  if (source === "built-in") {
    setBuiltinEnabled(id, enabled);
  } else {
    setAddedTemplateEnabled(id, enabled);
  }
}

export function updateLibraryTemplateWeight(
  id: string,
  source: "built-in" | "added",
  weight: number,
  timeOfDay: TimeOfDay[],
): void {
  if (source === "built-in") {
    updateBuiltinWeight(id, weight, timeOfDay);
  } else {
    updateAddedTemplateWeight(id, weight, timeOfDay);
  }
}

export function getLibraryCountByCategory(category: TemplateCategory): number {
  return getEffectiveTemplates().filter((t) => t.category === category).length;
}
