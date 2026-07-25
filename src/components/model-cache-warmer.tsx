"use client";

import { useEffect } from "react";
import { detectIsMobile } from "@/lib/photo/background-removal";

// Only the files actually requested at runtime (see
// background-removal.worker.ts's getSegmenter()) -- the "_module" wasm
// variant is never fetched by the library (useModule defaults to false), so
// it's excluded here even though it's sitting in public/mediapipe/wasm/.
const MEDIAPIPE_PREFETCH_URLS = [
  "/mediapipe/wasm/vision_wasm_internal.js",
  "/mediapipe/wasm/vision_wasm_internal.wasm",
  "/mediapipe/wasm/vision_wasm_nosimd_internal.js",
  "/mediapipe/wasm/vision_wasm_nosimd_internal.wasm",
  "/mediapipe/selfie_multiclass_256x256.tflite",
];

interface BgrResourceEntry {
  chunks: { name: string }[];
}

// bgr's chunk filenames are content hashes, not something to hardcode here
// -- reads the same resources.json the library itself reads, so this can't
// drift out of sync with it.
async function bgrPrefetchUrls(): Promise<string[]> {
  const response = await fetch("/bgr/resources.json");
  const manifest: Record<string, BgrResourceEntry> = await response.json();
  const urls = new Set<string>(["/bgr/resources.json"]);
  for (const entry of Object.values(manifest)) {
    for (const chunk of entry.chunks) urls.add(`/bgr/${chunk.name}`);
  }
  return [...urls];
}

function onIdle(callback: () => void) {
  const win = window as unknown as { requestIdleCallback?: (cb: () => void) => number };
  if (win.requestIdleCallback) win.requestIdleCallback(callback);
  else setTimeout(callback, 2000);
}

/**
 * Registers the Service Worker (sw.js — Cache First for /bgr/ and
 * /mediapipe/, everything else passes through untouched) and, once the app
 * is idle, prefetches only the model files this device will actually use:
 * MediaPipe on mobile, imgly's bgr files on desktop, never both — the two
 * sets together are ~450MB, and a device only ever needs one of them (see
 * background-removal.worker.ts's device === "gpu" branch). A plain fetch()
 * is enough to populate the cache: the Service Worker's fetch handler
 * intercepts it the same as any other request to those paths.
 */
export function ModelCacheWarmer() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("[model-cache-warmer] service worker registration failed:", error);
    });

    onIdle(() => {
      void (async () => {
        try {
          const urls = detectIsMobile() ? MEDIAPIPE_PREFETCH_URLS : await bgrPrefetchUrls();
          await Promise.all(urls.map((url) => fetch(url).catch(() => null)));
        } catch (error) {
          console.warn("[model-cache-warmer] prefetch failed:", error);
        }
      })();
    });
  }, []);

  return null;
}
