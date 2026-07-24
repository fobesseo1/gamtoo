export interface PosterRecord {
  id: string;
  createdAt: string;
  templateId: string;
  category: string;
  imageBlob: Blob;
  userText?: string;
  location?: string;
  /** Reserved for future account sync — unset while the app is local-only. */
  userId?: string;
}

export type NewPosterRecord = Omit<PosterRecord, "id" | "createdAt">;
