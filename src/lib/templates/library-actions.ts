"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { TimeOfDay } from "./constants";
import type { PosterTemplate } from "./types";

type Source = "built-in" | "added";

interface EntryPatch {
  enabled?: boolean;
  weight?: number | null;
  time_of_day?: TimeOfDay[] | null;
  template_json?: PosterTemplate | null;
}

// Reachable only from pages already gated behind /admin/* (see proxy.ts) —
// this is the one place allowed to touch template_entries writes, using the
// service-role key that bypasses RLS.
async function upsertEntry(id: string, source: Source, patch: EntryPatch): Promise<void> {
  const { data: existing } = await supabaseAdmin
    .from("template_entries")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabaseAdmin.from("template_entries").upsert({
    id,
    source,
    enabled: patch.enabled ?? existing?.enabled ?? true,
    weight: "weight" in patch ? patch.weight : (existing?.weight ?? null),
    time_of_day: "time_of_day" in patch ? patch.time_of_day : (existing?.time_of_day ?? null),
    template_json: "template_json" in patch ? patch.template_json : (existing?.template_json ?? null),
    added_at: existing?.added_at ?? new Date().toISOString(),
  });
  if (error) throw error;
}

export async function addTemplateToLibrary(template: PosterTemplate): Promise<void> {
  await upsertEntry(template.id, "added", { enabled: true, template_json: template });
  revalidatePath("/admin/templates/library");
}

/** Removes a template from the pool. Built-ins are hidden permanently via a
 * disabled row (the code file isn't touched) — from the admin's point of
 * view it's gone from the list either way. */
export async function deleteLibraryTemplate(id: string, source: Source): Promise<void> {
  if (source === "added") {
    const { error } = await supabaseAdmin.from("template_entries").delete().eq("id", id);
    if (error) throw error;
  } else {
    await upsertEntry(id, "built-in", { enabled: false });
  }
  revalidatePath("/admin/templates/library");
}

export async function setLibraryTemplateEnabled(id: string, source: Source, enabled: boolean): Promise<void> {
  await upsertEntry(id, source, { enabled });
  revalidatePath("/admin/templates/library");
}

export async function updateLibraryTemplateWeight(
  id: string,
  source: Source,
  weight: number,
  timeOfDay: TimeOfDay[],
): Promise<void> {
  await upsertEntry(id, source, { weight, time_of_day: timeOfDay.length > 0 ? timeOfDay : null });
  revalidatePath("/admin/templates/library");
}
