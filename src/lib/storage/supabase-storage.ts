import { supabase } from "@/lib/supabase/client";
import type { PosterStorage } from "./poster-storage";
import type { NewPosterRecord, PosterRecord } from "./types";

const BUCKET = "posters";
// Signed URLs are re-generated on every call (getAll/getById/save), so this
// just needs to comfortably outlive a single page view -- not a long-term
// cache lifetime.
const SIGNED_URL_TTL_SECONDS = 60 * 60;

interface PostRow {
  id: string;
  created_at: string;
  template_id: string;
  category: string;
  user_text: string | null;
  location: string | null;
  image_path: string;
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("not-authenticated");
  return data.user.id;
}

async function toRecord(row: PostRow): Promise<PosterRecord> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(row.image_path, SIGNED_URL_TTL_SECONDS);
  if (error || !data) throw error ?? new Error("signed-url-failed");

  return {
    id: row.id,
    createdAt: row.created_at,
    templateId: row.template_id,
    category: row.category,
    imageUrl: data.signedUrl,
    userText: row.user_text ?? undefined,
    location: row.location ?? undefined,
  };
}

export class SupabasePosterStorage implements PosterStorage {
  async save(record: NewPosterRecord): Promise<PosterRecord> {
    const userId = await requireUserId();
    const id = crypto.randomUUID();
    const imagePath = `${userId}/${id}.png`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(imagePath, record.imageBlob, { contentType: "image/png" });
    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from("posts")
      .insert({
        id,
        user_id: userId,
        has_photo: record.hasPhoto,
        template_id: record.templateId,
        category: record.category,
        user_text: record.userText ?? null,
        location: record.location ?? null,
        image_path: imagePath,
      })
      .select()
      .single();
    if (error || !data) {
      // The row never landed -- don't leave an orphaned object in the bucket.
      await supabase.storage.from(BUCKET).remove([imagePath]);
      throw error ?? new Error("insert-failed");
    }

    return toRecord(data as PostRow);
  }

  async getAll(): Promise<PosterRecord[]> {
    const { data, error } = await supabase
      .from("posts")
      .select()
      .order("created_at", { ascending: false });
    if (error) throw error;
    return Promise.all((data as PostRow[]).map(toRecord));
  }

  async getById(id: string): Promise<PosterRecord | undefined> {
    const { data, error } = await supabase.from("posts").select().eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return undefined;
    return toRecord(data as PostRow);
  }

  async remove(id: string): Promise<void> {
    const { data, error: fetchError } = await supabase
      .from("posts")
      .select("image_path")
      .eq("id", id)
      .maybeSingle();
    if (fetchError) throw fetchError;

    const { error: deleteError } = await supabase.from("posts").delete().eq("id", id);
    if (deleteError) throw deleteError;

    if (data) {
      await supabase.storage.from(BUCKET).remove([(data as { image_path: string }).image_path]);
    }
  }
}
