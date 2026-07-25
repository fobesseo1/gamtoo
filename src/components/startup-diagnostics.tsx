"use client";

import { useEffect } from "react";

export function StartupDiagnostics() {
  useEffect(() => {
    alert(
      'COI: ' + self.crossOriginIsolated + '\n' +
      'GPU: ' + !!(navigator as unknown as { gpu?: unknown }).gpu + '\n' +
      'CORES: ' + navigator.hardwareConcurrency
    );
  }, []);

  return null;
}
