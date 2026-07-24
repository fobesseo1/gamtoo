// HEIC/HEIF files are an ISO-BMFF container (the same family as MP4/MOV) —
// bytes 4-7 spell "ftyp", followed by a 4-character brand. Checking the
// actual bytes (rather than trusting the OS/browser-reported file.type,
// which for HEIC is inconsistently populated depending on device/browser)
// is what makes this reliable regardless of where the photo came from.
const HEIF_BRANDS = new Set([
  "heic",
  "heix",
  "hevc",
  "hevx",
  "heim",
  "heis",
  "hevm",
  "hevs",
  "mif1",
  "msf1",
]);

export async function isHeicImage(blob: Blob): Promise<boolean> {
  const head = await blob.slice(0, 12).arrayBuffer();
  if (head.byteLength < 12) return false;
  const bytes = new Uint8Array(head);
  const readAscii4 = (offset: number) => String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
  if (readAscii4(4) !== "ftyp") return false;
  return HEIF_BRANDS.has(readAscii4(8));
}

/** Converts a HEIC/HEIF blob to JPEG entirely client-side (no server round
 * trip) — every non-Safari browser lacks a built-in HEIC decoder, so this is
 * the only way an iPhone photo (HEIC by default since iOS 11) works
 * anywhere else. Never throws: on conversion failure, returns the original
 * blob so the caller's existing decode/error path handles it, same as
 * before this existed. */
export async function convertHeicToJpeg(blob: Blob): Promise<Blob> {
  try {
    const { default: heic2any } = await import("heic2any");
    const result = await heic2any({ blob, toType: "image/jpeg", quality: 0.9 });
    return Array.isArray(result) ? result[0] : result;
  } catch (error) {
    console.warn("[heic] conversion failed, using the original file as-is:", error);
    return blob;
  }
}
