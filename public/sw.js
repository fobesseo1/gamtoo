// Cache First for the model/wasm assets under /bgr/ and /mediapipe/ only --
// everything else falls through to the browser's normal handling
// untouched. Cache Storage survives much longer than the regular HTTP
// cache (which Vercel's Cache-Control: immutable header already covers;
// this is the second, longer-lived layer for when that gets evicted).
const CACHE_NAME = "gamtoo-models-v1";
const CACHEABLE_PREFIXES = ["/bgr/", "/mediapipe/"];

function isCacheable(url) {
  const path = new URL(url).pathname;
  return CACHEABLE_PREFIXES.some((prefix) => path.startsWith(prefix));
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || !isCacheable(request.url)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;

      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone());
      return response;
    }),
  );
});
