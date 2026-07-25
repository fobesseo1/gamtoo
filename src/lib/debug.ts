/** True only when the page URL has a `?debug=1`-style query param (any
 * value, just presence). Workers don't share the page's URL (a Worker's own
 * `location` is its script's URL, not the page's), so this only works on
 * the main thread — worker code needs the value passed in explicitly. */
export const DEBUG =
  typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug");
