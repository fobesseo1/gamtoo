/** Loads any image source (public asset path, blob URL, or Blob) as a drawable ImageBitmap. */
export async function loadDrawable(source: string | Blob): Promise<ImageBitmap> {
  const blob = typeof source === "string" ? await fetch(source).then((res) => res.blob()) : source;
  return createImageBitmap(blob);
}
