"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { CELEBRATION_ICONS } from "./celebration-icons";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

const WANDER_KEYFRAMES = ["gamtoo-wander-a", "gamtoo-wander-b", "gamtoo-wander-c", "gamtoo-wander-d"];
const WANDER_DURATIONS_MS = [6200, 7400, 8100, 6800];

interface IconCornersProps {
  /** One absolutely-positioned CSS spec per icon slot — as many as you like. */
  positions: CSSProperties[];
  size?: number;
  intervalMs?: number;
  /** Adds a slow, independent drifting motion per slot on top of the fixed
   * anchor position — for long waits where icons that only swap content in
   * place read as stuck. Off by default (the brief celebration burst doesn't
   * need it). */
  wander?: boolean;
}

/** Several celebration icons scattered around fixed positions, each swapping
 * to the next icon in the set one at a time on a round-robin timer — used
 * both for the full celebration screen's four corners and, smaller, around
 * the photo on the processing screen. */
export function IconCorners({ positions, size = 100, intervalMs = 1300, wander = false }: IconCornersProps) {
  const [iconIndex, setIconIndex] = useState(() => positions.map((_, i) => i % CELEBRATION_ICONS.length));
  const nextIconRef = useRef(positions.length);
  const nextSlotRef = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const timer = setInterval(() => {
      setIconIndex((prev) => {
        const next = [...prev];
        const slot = nextSlotRef.current % positions.length;
        next[slot] = nextIconRef.current % CELEBRATION_ICONS.length;
        nextIconRef.current += 1;
        nextSlotRef.current += 1;
        return next;
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [positions.length, intervalMs]);

  return (
    <>
      {positions.map((pos, i) => {
        const Icon = CELEBRATION_ICONS[iconIndex[i]];
        const wanderStyle: CSSProperties = wander
          ? {
              animation: `${WANDER_KEYFRAMES[i % WANDER_KEYFRAMES.length]} ${
                WANDER_DURATIONS_MS[i % WANDER_DURATIONS_MS.length]
              }ms ease-in-out infinite`,
              animationDelay: `${-i * 900}ms`,
            }
          : {};
        return (
          <div
            key={i}
            className={`pointer-events-none absolute ${wander ? "gamtoo-wander" : ""}`}
            style={{ width: size, height: size, ...pos, ...wanderStyle }}
          >
            <div key={iconIndex[i]} style={{ animation: "gamtoo-icon-pop-in .4s ease-out" }}>
              <Icon size={size} />
            </div>
          </div>
        );
      })}
    </>
  );
}
