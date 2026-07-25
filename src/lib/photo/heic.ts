import { DEBUG } from "@/lib/debug";

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

export interface HeicDecodeResult {
  /** Poster-quality copy, capped the same as a JPEG/PNG upload (see
   * downscale-image.ts) — not a smaller, HEIC-specific size. */
  poster: Blob;
  /** Pre-shrunk to the same cap background removal uses on its own input,
   * so that step doesn't have to shrink a full-size photo down itself. */
  bgRemoval: Blob;
}

type HeicWorkerResponse =
  | { id: number; status: "done"; poster: Blob; bgRemoval: Blob }
  | { id: number; status: "error"; message: string };

let heicWorker: Worker | null = null;
let nextHeicRequestId = 0;
const pendingHeicRequests = new Map<number, { resolve: (result: HeicDecodeResult) => void; reject: (error: Error) => void }>();

function getHeicWorker(): Worker {
  if (heicWorker) return heicWorker;

  const worker = new Worker(new URL("./heic-decode.worker.ts", import.meta.url));
  worker.onmessage = (event: MessageEvent<HeicWorkerResponse>) => {
    const entry = pendingHeicRequests.get(event.data.id);
    if (!entry) return;
    pendingHeicRequests.delete(event.data.id);
    if (event.data.status === "error") entry.reject(new Error(event.data.message));
    else entry.resolve({ poster: event.data.poster, bgRemoval: event.data.bgRemoval });
  };
  worker.onerror = (event) => {
    for (const entry of pendingHeicRequests.values()) {
      entry.reject(new Error(event.message || "heic-decode-worker-error"));
    }
    pendingHeicRequests.clear();
    heicWorker = null;
  };
  heicWorker = worker;
  return worker;
}

// Decodes straight to pixels via libheif-js (see heic-decode.worker.ts)
// instead of heic2any's decode-then-re-encode-to-JPEG round trip. The pixels
// are decoded once there and resized twice from that same decode.
function decodeHeicFast(blob: Blob): Promise<HeicDecodeResult> {
  const worker = getHeicWorker();
  const id = nextHeicRequestId++;
  return new Promise((resolve, reject) => {
    pendingHeicRequests.set(id, { resolve, reject });
    worker.postMessage({ id, blob });
  });
}

/** Converts a HEIC/HEIF blob to two regular image blobs entirely
 * client-side (no server round trip) — every non-Safari browser lacks a
 * built-in HEIC decoder, so this is the only way an iPhone photo (HEIC by
 * default since iOS 11) works anywhere else. Tries the fast libheif-js path
 * first; on any failure (unsupported HEIC variant, worker crash, etc.)
 * falls back to the slower heic2any path, which only ever produces one
 * full-size blob (used for both `poster` and `bgRemoval` — background
 * removal's own resize step shrinks it same as any other photo). If that
 * also fails, returns the original blob for both, so the caller's existing
 * decode/error path handles it. */
export async function convertHeicToJpeg(blob: Blob): Promise<HeicDecodeResult> {
  try {
    return await decodeHeicFast(blob);
  } catch (error) {
    console.warn("[heic] fast libheif decode failed, falling back to heic2any:", error);
  }

  try {
    const { default: heic2any } = await import("heic2any");
    const start = performance.now();
    const result = await heic2any({ blob, toType: "image/jpeg", quality: 0.9 });
    const elapsedMs = performance.now() - start;
    if (DEBUG) console.log(`HEIC 변환 소요 시간: ${elapsedMs.toFixed(0)}ms`);
    const converted = Array.isArray(result) ? result[0] : result;
    return { poster: converted, bgRemoval: converted };
  } catch (error) {
    console.warn("[heic] conversion failed, using the original file as-is:", error);
    return { poster: blob, bgRemoval: blob };
  }
}
