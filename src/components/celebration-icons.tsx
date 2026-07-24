/** Small 3D-style celebration icons (crown/firework/ribbon/bouquet/trophy),
 * ported from a hand-drawn CSS icon set. Each is authored at a fixed native
 * pixel size and scaled to fit `size` via a wrapping transform, so the
 * gradients/shadows/clip-paths stay crisp instead of being redrawn per size. */

interface IconProps {
  size?: number;
}

// Scale lives on its own element, separate from `animation` below: an
// animation that also touches `transform` (e.g. a float/sway bounce) would
// otherwise fully override this scale() for as long as it runs. flexShrink: 0
// keeps flexbox from shrinking this to fit `size` on its own before the scale
// transform even applies (flex-basis comes from the declared width/height,
// not the post-transform rendered size).
export function ScaledIcon({
  size = 96,
  nativeWidth,
  nativeHeight,
  animation,
  children,
}: IconProps & { nativeWidth: number; nativeHeight: number; animation?: string; children: React.ReactNode }) {
  const scale = size / Math.max(nativeWidth, nativeHeight);
  return (
    <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ flexShrink: 0, width: nativeWidth, height: nativeHeight, transform: `scale(${scale})` }}>
        <div style={{ position: "relative", width: nativeWidth, height: nativeHeight, animation }}>{children}</div>
      </div>
    </div>
  );
}

export function CrownIcon({ size }: IconProps) {
  return (
    <ScaledIcon
      size={size}
      nativeWidth={130}
      nativeHeight={110}
      animation="gamtoo-float-bounce 2.2s ease-in-out infinite"
    >
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 5,
          width: 110,
          height: 64,
          clipPath: "polygon(0% 100%, 8% 22%, 30% 54%, 50% 2%, 70% 54%, 92% 22%, 100% 100%)",
          background: "linear-gradient(155deg, oklch(90% 0.13 90), oklch(76% 0.15 85))",
          boxShadow: "inset -5px -6px 10px oklch(58% 0.13 85 / 0.35), inset 3px 3px 6px oklch(98% 0.06 90 / 0.6)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 0.8,
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: "linear-gradient(150deg, oklch(93% 0.12 90), oklch(78% 0.14 86))",
          boxShadow: "inset -4px -5px 8px oklch(60% 0.12 86 / 0.4), inset 3px 3px 6px oklch(98% 0.06 90 / 0.7)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 45,
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: "linear-gradient(150deg, oklch(94% 0.12 90), oklch(79% 0.14 86))",
          boxShadow: "inset -4px -5px 8px oklch(60% 0.12 86 / 0.4), inset 3px 3px 6px oklch(98% 0.06 90 / 0.7)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 14,
          right: 10.8,
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: "linear-gradient(150deg, oklch(93% 0.12 90), oklch(78% 0.14 86))",
          boxShadow: "inset -4px -5px 8px oklch(60% 0.12 86 / 0.4), inset 3px 3px 6px oklch(98% 0.06 90 / 0.7)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 8,
          width: 114,
          height: 20,
          borderRadius: 9,
          background: "linear-gradient(160deg, oklch(72% 0.14 45), oklch(58% 0.14 40))",
          boxShadow: "inset -4px -5px 8px oklch(42% 0.12 40 / 0.5), inset 3px 3px 6px oklch(85% 0.1 45 / 0.5)",
        }}
      />
    </ScaledIcon>
  );
}

const SPARK_COLORS = [
  "radial-gradient(circle at 35% 30%, oklch(95% 0.1 30), oklch(75% 0.15 28))",
  "radial-gradient(circle at 35% 30%, oklch(96% 0.08 90), oklch(80% 0.13 88))",
  "radial-gradient(circle at 35% 30%, oklch(94% 0.07 165), oklch(76% 0.11 162))",
  "radial-gradient(circle at 35% 30%, oklch(93% 0.06 280), oklch(74% 0.11 278))",
];
const SPARK_POSITIONS = [
  { top: 57, left: 105, size: 22 },
  { top: 91, left: 91, size: 18 },
  { top: 105, left: 57, size: 22 },
  { top: 91, left: 23, size: 18 },
  { top: 57, left: 9, size: 22 },
  { top: 23, left: 23, size: 18 },
  { top: 9, left: 57, size: 22 },
  { top: 23, left: 91, size: 18 },
];

export function FireworkIcon({ size }: IconProps) {
  return (
    <ScaledIcon size={size} nativeWidth={140} nativeHeight={140}>
      {SPARK_POSITIONS.map((pos, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: pos.top,
            left: pos.left,
            width: pos.size,
            height: pos.size,
            borderRadius: "50%",
            background: SPARK_COLORS[i % SPARK_COLORS.length],
            animation: `gamtoo-spark-pop 1.6s ease-in-out infinite ${i * 0.2}s`,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 14,
          height: 14,
          marginLeft: -7,
          marginTop: -7,
          borderRadius: "50%",
          background: "radial-gradient(circle, oklch(98% 0.04 90), oklch(88% 0.1 60 / 0))",
          animation: "gamtoo-firework-core 1.6s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 2,
          left: 2,
          width: 9,
          height: 9,
          borderRadius: 2,
          background: "oklch(90% 0.11 90)",
          transform: "rotate(45deg)",
          animation: "gamtoo-twinkle-pulse 1.5s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 4,
          right: 0,
          width: 8,
          height: 8,
          borderRadius: 2,
          background: "oklch(85% 0.13 30)",
          transform: "rotate(45deg)",
          animation: "gamtoo-twinkle-pulse 1.7s ease-in-out infinite .3s",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 16,
          right: -4,
          width: 7,
          height: 7,
          borderRadius: 2,
          background: "oklch(88% 0.09 165)",
          transform: "rotate(45deg)",
          animation: "gamtoo-twinkle-pulse 1.6s ease-in-out infinite .6s",
        }}
      />
    </ScaledIcon>
  );
}

export function RibbonIcon({ size }: IconProps) {
  return (
    <ScaledIcon
      size={size}
      nativeWidth={150}
      nativeHeight={130}
      animation="gamtoo-sway 2.4s ease-in-out infinite"
    >
      <div
        style={{
          position: "absolute",
          top: 46,
          left: 60,
          width: 16,
          height: 66,
          background: "linear-gradient(180deg, oklch(86% 0.09 20), oklch(70% 0.12 18))",
          clipPath: "polygon(0 0, 100% 0, 100% 88%, 50% 100%, 0 88%)",
          transform: "rotate(-12deg)",
          transformOrigin: "top center",
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 46,
          left: 76,
          width: 16,
          height: 66,
          background: "linear-gradient(180deg, oklch(86% 0.09 20), oklch(70% 0.12 18))",
          clipPath: "polygon(0 0, 100% 0, 100% 88%, 50% 100%, 0 88%)",
          transform: "rotate(12deg)",
          transformOrigin: "top center",
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 2,
          width: 56,
          height: 48,
          borderRadius: "50%",
          background: "linear-gradient(145deg, oklch(92% 0.08 20), oklch(76% 0.11 18))",
          boxShadow: "inset -6px -7px 12px oklch(58% 0.1 18 / 0.4)",
          transform: "rotate(-12deg)",
          zIndex: 2,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 19,
          left: 14,
          width: 22,
          height: 13,
          borderRadius: "50%",
          background: "oklch(97% 0.03 20 / 0.55)",
          transform: "rotate(-12deg)",
          zIndex: 2,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 2,
          width: 56,
          height: 48,
          borderRadius: "50%",
          background: "linear-gradient(145deg, oklch(92% 0.08 20), oklch(76% 0.11 18))",
          boxShadow: "inset -6px -7px 12px oklch(58% 0.1 18 / 0.4)",
          transform: "rotate(12deg)",
          zIndex: 2,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 19,
          right: 32,
          width: 22,
          height: 13,
          borderRadius: "50%",
          background: "oklch(97% 0.03 20 / 0.55)",
          transform: "rotate(12deg)",
          zIndex: 2,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 26,
          left: 58,
          width: 34,
          height: 30,
          borderRadius: 13,
          background: "linear-gradient(150deg, oklch(93% 0.08 20), oklch(78% 0.12 18))",
          boxShadow: "0 0 0 4px oklch(97% 0.02 90), inset -4px -5px 8px oklch(56% 0.1 18 / 0.4)",
          zIndex: 3,
        }}
      />
    </ScaledIcon>
  );
}

function FlowerCluster({
  bottom,
  left,
  right,
  size,
  petalSize,
  petalColor,
  centerDelay,
}: {
  bottom: number;
  left?: number;
  right?: number;
  size: number;
  petalSize: number;
  petalColor: string;
  centerDelay?: string;
}) {
  const half = size / 2;
  const centerSize = petalSize - 2;
  return (
    <div style={{ position: "absolute", bottom, left, right, width: size, height: size }}>
      <div style={{ position: "absolute", width: petalSize, height: petalSize, borderRadius: "50%", background: petalColor, top: 0, left: half - petalSize / 2 }} />
      <div style={{ position: "absolute", width: petalSize, height: petalSize, borderRadius: "50%", background: petalColor, bottom: 0, left: half - petalSize / 2 }} />
      <div style={{ position: "absolute", width: petalSize, height: petalSize, borderRadius: "50%", background: petalColor, top: half - petalSize / 2, left: 0 }} />
      <div style={{ position: "absolute", width: petalSize, height: petalSize, borderRadius: "50%", background: petalColor, top: half - petalSize / 2, right: 0 }} />
      <div
        style={{
          position: "absolute",
          width: centerSize,
          height: centerSize,
          borderRadius: "50%",
          background: "oklch(90% 0.12 90)",
          top: half - centerSize / 2,
          left: half - centerSize / 2,
          animation: centerDelay ? `gamtoo-twinkle-pulse 2.2s ease-in-out infinite ${centerDelay}` : undefined,
        }}
      />
    </div>
  );
}

export function BouquetIcon({ size }: IconProps) {
  return (
    <ScaledIcon
      size={size}
      nativeWidth={130}
      nativeHeight={130}
      animation="gamtoo-sway 2.6s ease-in-out infinite"
    >
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 34,
          width: 62,
          height: 64,
          clipPath: "polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)",
          background: "linear-gradient(160deg, oklch(88% 0.09 165), oklch(74% 0.1 160))",
          boxShadow: "inset -5px -6px 10px oklch(60% 0.1 160 / 0.35)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 52,
          left: 44,
          width: 26,
          height: 20,
          borderRadius: "50%",
          background: "linear-gradient(145deg, oklch(85% 0.1 20), oklch(72% 0.12 18))",
          transform: "rotate(-16deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 52,
          right: 44,
          width: 26,
          height: 20,
          borderRadius: "50%",
          background: "linear-gradient(145deg, oklch(85% 0.1 20), oklch(72% 0.12 18))",
          transform: "rotate(16deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 54,
          left: 58,
          width: 14,
          height: 14,
          borderRadius: 6,
          background: "linear-gradient(145deg, oklch(88% 0.1 20), oklch(74% 0.12 18))",
        }}
      />
      <FlowerCluster bottom={56} left={14} size={32} petalSize={14} petalColor="oklch(85% 0.08 160)" />
      <FlowerCluster bottom={74} left={34} size={36} petalSize={16} petalColor="oklch(85% 0.1 20)" centerDelay="0s" />
      <FlowerCluster bottom={70} left={64} size={32} petalSize={14} petalColor="oklch(85% 0.07 290)" />
      <FlowerCluster bottom={52} left={78} size={30} petalSize={13} petalColor="oklch(88% 0.09 165)" centerDelay=".2s" />
    </ScaledIcon>
  );
}

export function TrophyIcon({ size }: IconProps) {
  return (
    <ScaledIcon
      size={size}
      nativeWidth={130}
      nativeHeight={140}
      animation="gamtoo-float-bounce 2.3s ease-in-out infinite"
    >
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 35,
          width: 60,
          height: 52,
          borderRadius: "20% 20% 45% 45% / 30% 30% 55% 55%",
          background: "linear-gradient(160deg, oklch(92% 0.1 90), oklch(76% 0.12 88))",
          boxShadow: "inset -6px -8px 12px oklch(58% 0.1 88 / 0.4), inset 4px 4px 8px oklch(98% 0.05 90 / 0.6)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 4,
            left: 8,
            width: 12,
            height: 30,
            background: "oklch(98% 0.05 90 / 0.5)",
            borderRadius: "50%",
            animation: "gamtoo-shine 2.4s ease-in-out infinite",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          top: 4,
          left: 30,
          width: 70,
          height: 16,
          borderRadius: "50%",
          background: "linear-gradient(160deg, oklch(94% 0.1 90), oklch(80% 0.12 88))",
          boxShadow: "inset 0 -3px 6px oklch(60% 0.1 88 / 0.35)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 16,
          left: -6,
          width: 32,
          height: 38,
          border: "8px solid oklch(80% 0.11 88)",
          borderRight: "none",
          borderRadius: "50% 0 0 50%",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 16,
          right: -6,
          width: 32,
          height: 38,
          border: "8px solid oklch(80% 0.11 88)",
          borderLeft: "none",
          borderRadius: "0 50% 50% 0",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 58,
          left: 56,
          width: 18,
          height: 8,
          borderRadius: 4,
          background: "oklch(76% 0.12 88)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 64,
          left: 60,
          width: 10,
          height: 20,
          background: "linear-gradient(160deg, oklch(90% 0.1 90), oklch(78% 0.12 88))",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 84,
          left: 44,
          width: 42,
          height: 14,
          borderRadius: 5,
          background: "linear-gradient(160deg, oklch(88% 0.11 87), oklch(72% 0.12 86))",
          boxShadow: "inset -3px -4px 6px oklch(56% 0.1 86 / 0.4)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 98,
          left: 32,
          width: 66,
          height: 20,
          borderRadius: 6,
          background: "linear-gradient(160deg, oklch(80% 0.1 60), oklch(64% 0.1 55))",
          boxShadow: "inset -4px -5px 8px oklch(46% 0.1 55 / 0.4)",
        }}
      />
    </ScaledIcon>
  );
}

export const CELEBRATION_ICONS = [CrownIcon, FireworkIcon, RibbonIcon, BouquetIcon, TrophyIcon];
