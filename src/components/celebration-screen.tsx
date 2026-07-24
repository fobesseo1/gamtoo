"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { IconCorners } from "./celebration-icon-corners";

const CONFETTI_COLORS = ["#F2C14E", "#F27E7E", "#7EC8A0", "#A99BE0", "#FCE3B4", "#E68A3D"];

const CORNERS: React.CSSProperties[] = [
  { top: 64, left: -14, transform: "scale(.82) rotate(-6deg)" },
  { top: 92, right: -14, transform: "scale(.82) rotate(6deg)" },
  { bottom: 150, left: -16, transform: "scale(.8) rotate(7deg)" },
  { bottom: 120, right: -16, transform: "scale(.8) rotate(-7deg)" },
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vr: number;
  color: string;
  round: boolean;
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

interface CelebrationScreenProps {
  message?: ReactNode;
}

/** The "나에게 감탄!" celebration screen shown while a poster is generated —
 * rotating rays, four corners cycling through the celebration icons, and a
 * real physics-based confetti burst + rain on canvas. */
export function CelebrationScreen({ message }: CelebrationScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const W = canvas.width;
    const H = canvas.height;
    const reduced = prefersReducedMotion();

    const parts: Particle[] = [];
    const spawnRain = () => {
      parts.push({
        x: Math.random() * W,
        y: -20,
        vx: (Math.random() - 0.5) * 1.2,
        vy: 1.4 + Math.random() * 2,
        size: 6 + Math.random() * 7,
        rot: Math.random() * 6.28,
        vr: (Math.random() - 0.5) * 0.25,
        color: CONFETTI_COLORS[(Math.random() * CONFETTI_COLORS.length) | 0],
        round: Math.random() < 0.4,
      });
    };

    // initial burst from the center, like popping a party popper
    if (!reduced) {
      const cx = W / 2;
      const cy = H * 0.46;
      for (let i = 0; i < 90; i++) {
        const a = Math.random() * 6.28;
        const sp = 4 + Math.random() * 9;
        parts.push({
          x: cx,
          y: cy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 3,
          size: 7 + Math.random() * 9,
          rot: Math.random() * 6.28,
          vr: (Math.random() - 0.5) * 0.4,
          color: CONFETTI_COLORS[(Math.random() * CONFETTI_COLORS.length) | 0],
          round: Math.random() < 0.4,
        });
      }
    }

    let running = true;
    let raf = 0;
    const loop = () => {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      if (!reduced && Math.random() < 0.5) spawnRain();
      for (let i = parts.length - 1; i >= 0; i--) {
        const q = parts[i];
        q.vy += 0.11;
        q.x += q.vx;
        q.y += q.vy;
        q.rot += q.vr;
        q.vx *= 0.995;
        if (q.y > H + 40 || q.x < -40 || q.x > W + 40) {
          parts.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.translate(q.x, q.y);
        ctx.rotate(q.rot);
        ctx.fillStyle = q.color;
        ctx.globalAlpha = 0.95;
        if (q.round) {
          ctx.beginPath();
          ctx.arc(0, 0, q.size / 2, 0, 6.283);
          ctx.fill();
        } else {
          ctx.fillRect(-q.size / 2, -q.size / 2, q.size, q.size * 0.7);
        }
        ctx.restore();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      className="relative flex-1 overflow-hidden"
      style={{ background: "radial-gradient(circle at 50% 46%, #FFF7EC 0%, #FCEBD2 62%, #F6DDBE 100%)" }}
    >
      <div
        className="gamtoo-rays pointer-events-none absolute"
        style={{
          top: "46%",
          left: "50%",
          width: 1100,
          height: 1100,
          transform: "translate(-50%,-50%)",
          background: "repeating-conic-gradient(from 0deg, rgba(255,255,255,.6) 0deg 5deg, rgba(255,255,255,0) 5deg 12deg)",
          opacity: 0.75,
          animation: "gamtoo-ray-rotate 48s linear infinite",
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          top: "46%",
          left: "50%",
          width: 520,
          height: 520,
          transform: "translate(-50%,-50%)",
          background: "radial-gradient(circle, rgba(255,255,255,.85), rgba(255,255,255,0) 70%)",
        }}
      />

      <IconCorners positions={CORNERS} size={150} intervalMs={1300} />

      <div
        className="absolute flex flex-col items-center gap-0.5"
        style={{ top: "44%", left: "50%", transform: "translate(-50%,-54%)" }}
      >
        <div className="gamtoo-celebrate-title" style={{ animation: "gamtoo-title-pop .85s ease-in-out infinite" }}>
          <div
            style={{
              fontSize: 44,
              fontWeight: 900,
              lineHeight: 1.02,
              letterSpacing: -1,
              color: "#fff",
              WebkitTextStroke: "8px oklch(66% 0.16 52)",
              paintOrder: "stroke fill",
              textShadow: "0 7px 0 oklch(52% 0.14 48), 0 14px 20px rgba(120,60,10,.35)",
              textAlign: "center",
            }}
          >
            나에게
          </div>
          <div
            style={{
              fontSize: 68,
              fontWeight: 900,
              lineHeight: 0.98,
              letterSpacing: -2,
              color: "#fff",
              WebkitTextStroke: "10px oklch(66% 0.16 52)",
              paintOrder: "stroke fill",
              textShadow: "0 9px 0 oklch(52% 0.14 48), 0 18px 24px rgba(120,60,10,.35)",
              textAlign: "center",
            }}
          >
            감탄!
          </div>
        </div>
      </div>

      {message && (
        <div
          className="gamtoo-celebrate-sub absolute left-0 right-0 text-center"
          style={{ bottom: "16%", animation: "gamtoo-sub-float 2.4s ease-in-out infinite" }}
        >
          {message}
        </div>
      )}

      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
    </div>
  );
}
