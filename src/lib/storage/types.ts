export interface PosterRecord {
  id: string;
  createdAt: string;
  templateId: string;
  category: string;
  /** Short-lived signed URL into the "posters" Storage bucket -- re-fetch
   * the record (or call getAll again) rather than caching this past a
   * single page view. */
  imageUrl: string;
  userText?: string;
  location?: string;
}

export interface NewPosterRecord {
  templateId: string;
  category: string;
  imageBlob: Blob;
  userText?: string;
  location?: string;
  /** Whether the source poster included a user photo (regardless of which
   * template ended up used) -- the item-system drop condition is "photo
   * included + once per day" (see docs/gamtoo-item-system.md 5.2), so this
   * needs to be recorded accurately at save time, not inferred later. */
  hasPhoto: boolean;
}
