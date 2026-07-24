"use client";

import { useCallback, useRef, useState } from "react";
import { removeBackgroundWithFallback, type BgRemovalModel, type RemoveBackgroundResult } from "./background-removal";
import { cropToContent } from "./crop-to-content";
import { downscaleImage } from "./downscale-image";

export type BackgroundRemovalStatus = "idle" | "processing" | "done";

interface BackgroundRemovalState {
  status: BackgroundRemovalStatus;
  progress: number;
  resultBlob: Blob | null;
  usedFallback: boolean;
}

const INITIAL_STATE: BackgroundRemovalState = {
  status: "idle",
  progress: 0,
  resultBlob: null,
  usedFallback: false,
};

// Now that the actual inference runs in a Worker (see background-removal.ts),
// the main thread is free for the whole duration, so a plain setInterval
// reliably ticks the whole time — no CSS workarounds needed. Flat +5%/sec,
// capped short of 100; the caller moves on immediately once the real work
// finishes, whatever this happens to be showing at that moment.
const PROGRESS_STEP = 5;
const PROGRESS_INTERVAL_MS = 1000;
const PROGRESS_CAP = 95;

interface RunOptions {
  model?: BgRemovalModel;
}

export function useBackgroundRemoval() {
  const [state, setState] = useState<BackgroundRemovalState>(INITIAL_STATE);

  // Tracks which photo the in-flight/most-recent run is for, so callers can
  // fire this eagerly the moment a photo is picked (to spend the time the
  // user spends typing a caption/location on the real removal, not just a
  // model warm-up) and then call it again at submit time to just join that
  // same run instead of queuing a redundant duplicate behind it on the
  // shared worker (which only ever processes one removal at a time).
  const runningFor = useRef<Blob | null>(null);
  const runningPromise = useRef<Promise<RemoveBackgroundResult> | null>(null);

  const run = useCallback((source: Blob, options: RunOptions = {}): Promise<RemoveBackgroundResult> => {
    if (runningFor.current === source && runningPromise.current) {
      return runningPromise.current;
    }

    runningFor.current = source;
    setState({ ...INITIAL_STATE, status: "processing" });

    const timer = setInterval(() => {
      setState((prev) => {
        if (prev.status !== "processing" || runningFor.current !== source) return prev;
        return { ...prev, progress: Math.min(PROGRESS_CAP, prev.progress + PROGRESS_STEP) };
      });
    }, PROGRESS_INTERVAL_MS);

    const promise = (async (): Promise<RemoveBackgroundResult> => {
      try {
        // Shrink before doing any heavy work: avoids decoding full phone-camera
        // resolution on lower-end devices. Deliberately using the same default
        // as the poster's "original" photo (~1600px) rather than a smaller,
        // bg-removal-specific target — a tighter downscale here measurably
        // added visible edge noise to the cutout without meaningfully speeding
        // things up (the model resizes to a fixed 1024x1024 internally either
        // way, so inference cost was never the part this could shrink).
        const { blob: downscaled } = await downscaleImage(source);
        const result = await removeBackgroundWithFallback(downscaled, { model: options.model });

        // Only crop when the background was actually removed — a fallback blob
        // is still the original opaque photo, so there's no transparent margin to trim.
        const finalBlob = result.usedFallback ? result.blob : (await cropToContent(result.blob)).blob;
        const finalResult = { blob: finalBlob, usedFallback: result.usedFallback };

        // A photo that's since been swapped out can't be cancelled (the
        // worker has no abort — see background-removal.ts) so it keeps
        // running to completion in the background; when it finally
        // resolves, it should just quietly finish instead of stomping
        // whatever the newer photo's run has already reported.
        if (runningFor.current === source) {
          setState({ status: "done", progress: 100, resultBlob: finalResult.blob, usedFallback: finalResult.usedFallback });
        }
        return finalResult;
      } finally {
        clearInterval(timer);
      }
    })();

    runningPromise.current = promise;
    return promise;
  }, []);

  const reset = useCallback(() => {
    runningFor.current = null;
    runningPromise.current = null;
    setState(INITIAL_STATE);
  }, []);

  return { ...state, run, reset };
}
