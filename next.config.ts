import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Reverted: enabling cross-origin isolation (for multi-threaded WASM
  // background removal) worked fine on desktop but crashed the background-
  // removal Worker outright on real mobile browsers ("background-removal-
  // worker-error", no cutout produced at all) -- worse than the original
  // single-threaded-but-working state, so this is off again until a safe
  // way to enable it (verified on real mobile devices first) is found.
};

export default nextConfig;
