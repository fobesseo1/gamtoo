"use client";

import { useEffect } from "react";
import { DEBUG } from "@/lib/debug";

export function StartupDiagnostics() {
  useEffect(() => {
    if (!DEBUG) return;
    console.log(
      'COI: ' + self.crossOriginIsolated + '\n' +
      'GPU: ' + !!(navigator as unknown as { gpu?: unknown }).gpu + '\n' +
      'CORES: ' + navigator.hardwareConcurrency
    );
  }, []);

  return null;
}
