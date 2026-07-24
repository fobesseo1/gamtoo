import { supabase } from "@/lib/supabase/client";
import { TEMPLATES } from "./registry";
import type { TimeOfDay } from "./constants";
import type { PosterTemplate } from "./types";

/**
 * Shared template library, backed by a Supabase table so every visitor (not
 * just the browser that added something) sees the same set. Built-in
 * templates still live in code (./registry) — this only carries per-template
 * overrides (enabled/weight/timeOfDay) for them, plus the full definition for
 * anything an admin added through the upload page. Reads use the public
 * anon key (safe — RLS only allows select for it); writes need the
 * service-role key and live in library-actions.ts instead.
 */

export interface TemplateEntryRow {
  id: string;
  source: "built-in" | "added";
  enabled: boolean;
  weight: number | null;
  time_of_day: TimeOfDay[] | null;
  template_json: PosterTemplate | null;
  added_at: string;
}

function applyOverride(template: PosterTemplate, row?: TemplateEntryRow): PosterTemplate {
  if (!row || (row.weight === null && row.time_of_day === null)) return template;
  return {
    ...template,
    weightConditions: {
      weight: row.weight ?? template.weightConditions?.weight ?? 1,
      timeOfDay: row.time_of_day ?? template.weightConditions?.timeOfDay,
    },
  };
}

async function fetchEntries(): Promise<TemplateEntryRow[]> {
  const { data, error } = await supabase.from("template_entries").select("*");
  if (error) {
    // Falls back to the built-ins exactly as coded, un-overridden — better
    // than a broken app if the table is briefly unreachable.
    console.warn("[templates] failed to load remote overrides, using built-ins as-is:", error);
    return [];
  }
  return (data ?? []) as TemplateEntryRow[];
}

export interface LibraryRow {
  template: PosterTemplate;
  source: "built-in" | "added";
  enabled: boolean;
}

/** Every enabled template — built-in (with remote overrides applied) plus
 * admin-added — merged into one pool. This is what the real app draws from. */
export async function getEffectiveTemplates(): Promise<PosterTemplate[]> {
  const entries = await fetchEntries();
  const byId = new Map(entries.map((e) => [e.id, e]));

  const builtins = TEMPLATES.filter((t) => byId.get(t.id)?.enabled ?? true).map((t) =>
    applyOverride(t, byId.get(t.id)),
  );
  const added = entries
    .filter((e) => e.source === "added" && e.enabled && e.template_json)
    .map((e) => applyOverride(e.template_json as PosterTemplate, e));

  return [...builtins, ...added];
}

/** Every template (enabled or not) for the management screen — unlike
 * getEffectiveTemplates, this includes disabled ones so they can be re-enabled. */
export async function getAllLibraryRows(): Promise<LibraryRow[]> {
  const entries = await fetchEntries();
  const byId = new Map(entries.map((e) => [e.id, e]));

  const builtinRows: LibraryRow[] = TEMPLATES.map((t) => ({
    template: applyOverride(t, byId.get(t.id)),
    source: "built-in",
    enabled: byId.get(t.id)?.enabled ?? true,
  }));
  const addedRows: LibraryRow[] = entries
    .filter((e) => e.source === "added" && e.template_json)
    .map((e) => ({
      template: applyOverride(e.template_json as PosterTemplate, e),
      source: "added",
      enabled: e.enabled,
    }));

  return [...builtinRows, ...addedRows];
}
