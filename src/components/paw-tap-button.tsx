"use client";

import { useState } from "react";

interface PawTapButtonProps {
  onTap: () => void;
  disabled?: boolean;
  size?: number;
}

/** The "감탄 기록하기" submit trigger — a paw print that floats, pulses, and
 * plays a satisfying stamp animation on tap before the parent starts the
 * celebration/processing sequence. */
export function PawTapButton({ onTap, disabled, size = 120 }: PawTapButtonProps) {
  const [stamping, setStamping] = useState(false);
  const scale = size / 200;

  const handleClick = () => {
    if (disabled || stamping) return;
    setStamping(true);
    onTap();
    setTimeout(() => setStamping(false), 600);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label="감탄 기록하기"
      className={`relative mx-auto flex items-center justify-center bg-transparent ${
        disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"
      }`}
      style={{ width: size * 1.4, height: size * 1.4 }}
    >
      <div
        className="gamtoo-paw-pulse-ring pointer-events-none absolute left-1/2 top-1/2"
        style={{
          width: size * 1.15,
          height: size * 1.15,
          borderRadius: "50%",
          background: "radial-gradient(circle, oklch(88% 0.07 65 / .5), transparent 70%)",
          animation: "gamtoo-paw-pulse 2.4s ease-out infinite",
        }}
      />
      <div
        className="gamtoo-paw relative"
        style={{
          width: size,
          height: size,
          filter: "drop-shadow(0 14px 22px rgba(70,45,20,.45))",
          animation: stamping
            ? "gamtoo-paw-stamp .55s cubic-bezier(.34,1.56,.64,1) 1"
            : "gamtoo-paw-float 2s ease-in-out infinite",
        }}
      >
        <div style={{ position: "absolute", width: 142 * scale, height: 128 * scale, borderRadius: "50% 50% 46% 46% / 55% 55% 45% 45%", background: "linear-gradient(160deg, oklch(94% 0.05 80 / .92), oklch(85% 0.07 70 / .92))", bottom: 6 * scale, left: 29 * scale, boxShadow: "inset -8px -10px 16px oklch(62% 0.09 70 / .4)" }} />
        <div style={{ position: "absolute", width: 51 * scale, height: 57 * scale, borderRadius: "50%", background: "linear-gradient(160deg, oklch(94% 0.05 80 / .92), oklch(85% 0.07 70 / .92))", top: 4 * scale, left: 13 * scale }} />
        <div style={{ position: "absolute", width: 51 * scale, height: 57 * scale, borderRadius: "50%", background: "linear-gradient(160deg, oklch(94% 0.05 80 / .92), oklch(85% 0.07 70 / .92))", top: -6 * scale, left: 75 * scale }} />
        <div style={{ position: "absolute", width: 51 * scale, height: 57 * scale, borderRadius: "50%", background: "linear-gradient(160deg, oklch(94% 0.05 80 / .92), oklch(85% 0.07 70 / .92))", top: 4 * scale, left: 137 * scale }} />
      </div>
    </button>
  );
}
