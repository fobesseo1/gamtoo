import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cross-origin isolation unlocks SharedArrayBuffer, which is what lets
  // onnxruntime-web (background removal) use multiple WASM threads instead
  // of one — the library's own code already tries to size its thread pool
  // off this, it's just been sitting unused since nothing here ever turned
  // it on. "credentialless" (rather than the stricter "require-corp") means
  // cross-origin requests we make (Supabase, the ONNX model CDN) don't need
  // to opt in with their own headers — it just strips credentials from
  // them instead, so nothing else on the site needs to change for this.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
        ],
      },
    ];
  },
};

export default nextConfig;
