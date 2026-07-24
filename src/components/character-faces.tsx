import { ScaledIcon } from "./celebration-icons";
import type { CharacterName } from "@/lib/characters/constants";

/** Clay-style character faces (seal/panda/bichon/bear/mochi), ported from
 * the "Clay Animal Faces" design — same 5 characters already used as
 * decoration in poster templates (src/lib/characters), just illustrated
 * instead of the current colored-circle-with-text-label placeholders. */

interface FaceProps {
  size?: number;
}

export function SealFace({ size }: FaceProps) {
  return (
    <ScaledIcon size={size} nativeWidth={270} nativeHeight={270} animation="gamtoo-float-bounce 2.4s ease-in-out infinite">
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle at 35% 28%, #ffffff 0%, #eef2f3 45%, #dde4e6 78%, #cfd8db 100%)", boxShadow: "0 22px 34px rgba(90,110,115,0.16), inset -8px -14px 24px rgba(140,160,165,0.18), inset 10px 14px 22px rgba(255,255,255,0.9)" }} />
      <div style={{ position: "absolute", top: 26, left: 52, width: 74, height: 44, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(255,255,255,0.95), rgba(255,255,255,0))", transform: "rotate(-18deg)" }} />
      <div style={{ position: "absolute", top: 102, left: 60, width: 37, height: 40, borderRadius: "50%", background: "radial-gradient(circle at 34% 28%, #4c4c4c, #101010 68%)", boxShadow: "0 2px 4px rgba(0,0,0,0.25)" }}>
        <div style={{ position: "absolute", top: 6, left: 7, width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.9)" }} />
      </div>
      <div style={{ position: "absolute", top: 102, left: 173, width: 37, height: 40, borderRadius: "50%", background: "radial-gradient(circle at 34% 28%, #4c4c4c, #101010 68%)", boxShadow: "0 2px 4px rgba(0,0,0,0.25)" }}>
        <div style={{ position: "absolute", top: 6, left: 7, width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.9)" }} />
      </div>
      <div style={{ position: "absolute", top: 144, left: 124, width: 22, height: 16, borderRadius: "50% 50% 60% 60%", background: "radial-gradient(circle at 35% 30%, #4a5054, #23272a 70%)", boxShadow: "0 2px 3px rgba(0,0,0,0.25)" }}>
        <div style={{ position: "absolute", top: 3, left: 4, width: 6, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.5)" }} />
      </div>
      <div style={{ position: "absolute", top: 166, left: 124, width: 22, height: 10, borderBottom: "3.5px solid #8a9498", borderRadius: "50%" }} />
      <div style={{ position: "absolute", top: 150, left: 62, width: 34, height: 3, borderRadius: 3, background: "#aeb9bc", transform: "rotate(9deg)" }} />
      <div style={{ position: "absolute", top: 162, left: 58, width: 36, height: 3, borderRadius: 3, background: "#aeb9bc" }} />
      <div style={{ position: "absolute", top: 174, left: 62, width: 34, height: 3, borderRadius: 3, background: "#aeb9bc", transform: "rotate(-9deg)" }} />
      <div style={{ position: "absolute", top: 150, left: 174, width: 34, height: 3, borderRadius: 3, background: "#aeb9bc", transform: "rotate(-9deg)" }} />
      <div style={{ position: "absolute", top: 162, left: 176, width: 36, height: 3, borderRadius: 3, background: "#aeb9bc" }} />
      <div style={{ position: "absolute", top: 174, left: 174, width: 34, height: 3, borderRadius: 3, background: "#aeb9bc", transform: "rotate(9deg)" }} />
      <div style={{ position: "absolute", top: 158, left: 44, width: 34, height: 20, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(244,169,170,0.55), rgba(244,169,170,0))" }} />
      <div style={{ position: "absolute", top: 158, left: 192, width: 34, height: 20, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(244,169,170,0.55), rgba(244,169,170,0))" }} />
    </ScaledIcon>
  );
}

export function PandaFace({ size }: FaceProps) {
  return (
    <ScaledIcon size={size} nativeWidth={270} nativeHeight={270} animation="gamtoo-float-bounce 2.2s ease-in-out infinite">
      <div style={{ position: "absolute", top: -8, left: 16, width: 66, height: 64, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #6f7477, #45494c 75%)", boxShadow: "0 10px 16px rgba(60,70,75,0.25)" }} />
      <div style={{ position: "absolute", top: -8, left: 188, width: 66, height: 64, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #6f7477, #45494c 75%)", boxShadow: "0 10px 16px rgba(60,70,75,0.25)" }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle at 35% 28%, #ffffff 0%, #f6f7f7 48%, #e6eaeb 80%, #d8dee0 100%)", boxShadow: "0 22px 34px rgba(90,110,115,0.16), inset -8px -14px 24px rgba(150,165,170,0.16), inset 10px 14px 22px rgba(255,255,255,0.9)" }} />
      <div style={{ position: "absolute", top: 26, left: 52, width: 74, height: 44, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(255,255,255,0.95), rgba(255,255,255,0))", transform: "rotate(-18deg)" }} />
      <div style={{ position: "absolute", top: 88, left: 44, width: 76, height: 66, borderRadius: "50%", background: "radial-gradient(circle at 38% 32%, #a7adb0, #83898c 80%)", transform: "rotate(-16deg)" }} />
      <div style={{ position: "absolute", top: 88, left: 150, width: 76, height: 66, borderRadius: "50%", background: "radial-gradient(circle at 38% 32%, #a7adb0, #83898c 80%)", transform: "rotate(16deg)" }} />
      <div style={{ position: "absolute", top: 98, left: 64, width: 40, height: 43, borderRadius: "50%", background: "radial-gradient(circle at 34% 28%, #4c4c4c, #0d0d0d 68%)", boxShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
        <div style={{ position: "absolute", top: 6, left: 7, width: 12, height: 12, borderRadius: "50%", background: "rgba(255,255,255,0.92)" }} />
      </div>
      <div style={{ position: "absolute", top: 98, left: 166, width: 40, height: 43, borderRadius: "50%", background: "radial-gradient(circle at 34% 28%, #4c4c4c, #0d0d0d 68%)", boxShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
        <div style={{ position: "absolute", top: 6, left: 7, width: 12, height: 12, borderRadius: "50%", background: "rgba(255,255,255,0.92)" }} />
      </div>
      <div style={{ position: "absolute", top: 160, left: 121, width: 28, height: 18, borderRadius: "50% 50% 58% 58%", background: "radial-gradient(circle at 35% 30%, #444, #111 70%)", boxShadow: "0 2px 3px rgba(0,0,0,0.25)" }}>
        <div style={{ position: "absolute", top: 3, left: 5, width: 7, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.55)" }} />
      </div>
      <div style={{ position: "absolute", top: 178, left: 133, width: 4, height: 12, borderRadius: 3, background: "#1a1a1a" }} />
      <div style={{ position: "absolute", top: 186, left: 122, width: 26, height: 12, borderBottom: "4px solid #1a1a1a", borderRadius: "50%" }} />
    </ScaledIcon>
  );
}

export function BichonFace({ size }: FaceProps) {
  return (
    <ScaledIcon size={size} nativeWidth={270} nativeHeight={270} animation="gamtoo-float-bounce 2.5s ease-in-out infinite">
      <div style={{ position: "absolute", top: -16, left: 90, width: 90, height: 88, borderRadius: "50%", background: "radial-gradient(circle at 35% 28%, #ffffff, #ece8e1 80%)", boxShadow: "0 8px 14px rgba(160,150,135,0.18)" }} />
      <div style={{ position: "absolute", top: -8, left: 26, width: 80, height: 78, borderRadius: "50%", background: "radial-gradient(circle at 35% 28%, #ffffff, #eae6de 80%)", boxShadow: "0 8px 14px rgba(160,150,135,0.18)" }} />
      <div style={{ position: "absolute", top: -8, left: 164, width: 80, height: 78, borderRadius: "50%", background: "radial-gradient(circle at 35% 28%, #ffffff, #eae6de 80%)", boxShadow: "0 8px 14px rgba(160,150,135,0.18)" }} />
      <div style={{ position: "absolute", top: 44, left: -16, width: 76, height: 74, borderRadius: "50%", background: "radial-gradient(circle at 35% 28%, #ffffff, #e8e4dc 80%)", boxShadow: "0 8px 14px rgba(160,150,135,0.18)" }} />
      <div style={{ position: "absolute", top: 44, left: 210, width: 76, height: 74, borderRadius: "50%", background: "radial-gradient(circle at 35% 28%, #ffffff, #e8e4dc 80%)", boxShadow: "0 8px 14px rgba(160,150,135,0.18)" }} />
      <div style={{ position: "absolute", top: 110, left: -26, width: 72, height: 70, borderRadius: "50%", background: "radial-gradient(circle at 35% 28%, #fdfcfa, #e6e2da 80%)", boxShadow: "0 8px 14px rgba(160,150,135,0.18)" }} />
      <div style={{ position: "absolute", top: 110, left: 224, width: 72, height: 70, borderRadius: "50%", background: "radial-gradient(circle at 35% 28%, #fdfcfa, #e6e2da 80%)", boxShadow: "0 8px 14px rgba(160,150,135,0.18)" }} />
      <div style={{ position: "absolute", top: 172, left: 0, width: 74, height: 72, borderRadius: "50%", background: "radial-gradient(circle at 35% 28%, #fdfcfa, #e6e2da 80%)", boxShadow: "0 10px 16px rgba(160,150,135,0.18)" }} />
      <div style={{ position: "absolute", top: 172, left: 196, width: 74, height: 72, borderRadius: "50%", background: "radial-gradient(circle at 35% 28%, #fdfcfa, #e6e2da 80%)", boxShadow: "0 10px 16px rgba(160,150,135,0.18)" }} />
      <div style={{ position: "absolute", top: 204, left: 62, width: 78, height: 74, borderRadius: "50%", background: "radial-gradient(circle at 35% 28%, #fdfcfa, #e6e2da 80%)", boxShadow: "0 12px 18px rgba(160,150,135,0.2)" }} />
      <div style={{ position: "absolute", top: 204, left: 132, width: 78, height: 74, borderRadius: "50%", background: "radial-gradient(circle at 35% 28%, #fdfcfa, #e6e2da 80%)", boxShadow: "0 12px 18px rgba(160,150,135,0.2)" }} />
      <div style={{ position: "absolute", inset: 14, borderRadius: "50%", background: "radial-gradient(circle at 35% 28%, #ffffff 0%, #f8f6f1 50%, #ebe7de 82%, #ddd8cc 100%)", boxShadow: "0 22px 34px rgba(150,140,120,0.16), inset -8px -14px 24px rgba(180,170,150,0.16), inset 10px 14px 22px rgba(255,255,255,0.95)" }} />
      <div style={{ position: "absolute", top: 36, left: 60, width: 70, height: 42, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(255,255,255,0.95), rgba(255,255,255,0))", transform: "rotate(-18deg)" }} />
      <div style={{ position: "absolute", top: 34, left: 74, width: 42, height: 40, borderRadius: "50%", background: "radial-gradient(circle at 35% 28%, #ffffff, #efebe3 85%)" }} />
      <div style={{ position: "absolute", top: 26, left: 112, width: 46, height: 44, borderRadius: "50%", background: "radial-gradient(circle at 35% 28%, #ffffff, #efebe3 85%)" }} />
      <div style={{ position: "absolute", top: 34, left: 154, width: 42, height: 40, borderRadius: "50%", background: "radial-gradient(circle at 35% 28%, #ffffff, #efebe3 85%)" }} />
      <div style={{ position: "absolute", top: 106, left: 68, width: 37, height: 40, borderRadius: "50%", background: "radial-gradient(circle at 34% 28%, #4c4c4c, #101010 68%)", boxShadow: "0 2px 4px rgba(0,0,0,0.25)" }}>
        <div style={{ position: "absolute", top: 6, left: 7, width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.9)" }} />
      </div>
      <div style={{ position: "absolute", top: 106, left: 165, width: 37, height: 40, borderRadius: "50%", background: "radial-gradient(circle at 34% 28%, #4c4c4c, #101010 68%)", boxShadow: "0 2px 4px rgba(0,0,0,0.25)" }}>
        <div style={{ position: "absolute", top: 6, left: 7, width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.9)" }} />
      </div>
      <div style={{ position: "absolute", top: 152, left: 121, width: 28, height: 20, borderRadius: "48% 48% 58% 58%", background: "radial-gradient(circle at 35% 30%, #3d3d3d, #0d0d0d 72%)", boxShadow: "0 2px 3px rgba(0,0,0,0.3)" }}>
        <div style={{ position: "absolute", top: 3, left: 5, width: 8, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.55)" }} />
      </div>
      <div style={{ position: "absolute", top: 176, left: 112, width: 22, height: 11, borderBottom: "3.5px solid #6b6458", borderRadius: "50%" }} />
      <div style={{ position: "absolute", top: 176, left: 136, width: 22, height: 11, borderBottom: "3.5px solid #6b6458", borderRadius: "50%" }} />
      <div style={{ position: "absolute", top: 164, left: 56, width: 34, height: 20, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(240,160,150,0.5), rgba(240,160,150,0))" }} />
      <div style={{ position: "absolute", top: 164, left: 180, width: 34, height: 20, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(240,160,150,0.5), rgba(240,160,150,0))" }} />
    </ScaledIcon>
  );
}

export function BearFace({ size }: FaceProps) {
  return (
    <ScaledIcon size={size} nativeWidth={270} nativeHeight={270} animation="gamtoo-float-bounce 2.3s ease-in-out infinite">
      <div style={{ position: "absolute", top: -26, left: -2, width: 92, height: 90, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #e0bb96, #c69a72 78%)", boxShadow: "0 12px 18px rgba(150,110,75,0.22)" }}>
        <div style={{ position: "absolute", top: 20, left: 20, width: 50, height: 48, borderRadius: "50%", background: "radial-gradient(circle at 40% 32%, #f4e0c8, #e8cba9 80%)" }} />
      </div>
      <div style={{ position: "absolute", top: -26, left: 180, width: 92, height: 90, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #e0bb96, #c69a72 78%)", boxShadow: "0 12px 18px rgba(150,110,75,0.22)" }}>
        <div style={{ position: "absolute", top: 20, left: 22, width: 50, height: 48, borderRadius: "50%", background: "radial-gradient(circle at 40% 32%, #f4e0c8, #e8cba9 80%)" }} />
      </div>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle at 35% 28%, #f3ddc2 0%, #e9cba6 50%, #ddb88d 82%, #cfa678 100%)", boxShadow: "0 22px 34px rgba(150,110,75,0.2), inset -8px -14px 24px rgba(170,125,85,0.2), inset 10px 14px 22px rgba(255,248,238,0.85)" }} />
      <div style={{ position: "absolute", top: 26, left: 52, width: 74, height: 44, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(255,255,255,0.85), rgba(255,255,255,0))", transform: "rotate(-18deg)" }} />
      <div style={{ position: "absolute", top: 98, left: 60, width: 37, height: 40, borderRadius: "50%", background: "radial-gradient(circle at 34% 28%, #4c4c4c, #101010 68%)", boxShadow: "0 2px 4px rgba(0,0,0,0.25)" }}>
        <div style={{ position: "absolute", top: 6, left: 7, width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.9)" }} />
      </div>
      <div style={{ position: "absolute", top: 98, left: 173, width: 37, height: 40, borderRadius: "50%", background: "radial-gradient(circle at 34% 28%, #4c4c4c, #101010 68%)", boxShadow: "0 2px 4px rgba(0,0,0,0.25)" }}>
        <div style={{ position: "absolute", top: 6, left: 7, width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.9)" }} />
      </div>
      <div style={{ position: "absolute", top: 158, left: 36, width: 38, height: 22, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(238,150,130,0.5), rgba(238,150,130,0))" }} />
      <div style={{ position: "absolute", top: 158, left: 196, width: 38, height: 22, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(238,150,130,0.5), rgba(238,150,130,0))" }} />
      <div style={{ position: "absolute", top: 136, left: 86, width: 98, height: 76, borderRadius: "50%", background: "radial-gradient(circle at 40% 30%, #fbeed9, #efd6b3 82%)", boxShadow: "inset -4px -8px 12px rgba(200,160,115,0.25)" }} />
      <div style={{ position: "absolute", top: 150, left: 121, width: 28, height: 19, borderRadius: "48% 48% 58% 58%", background: "radial-gradient(circle at 35% 30%, #8a6248, #5c3e2a 72%)", boxShadow: "0 2px 3px rgba(80,55,35,0.3)" }}>
        <div style={{ position: "absolute", top: 3, left: 5, width: 7, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.5)" }} />
      </div>
      <div style={{ position: "absolute", top: 172, left: 113, width: 22, height: 11, borderBottom: "3.5px solid #7a5a40", borderRadius: "50%" }} />
      <div style={{ position: "absolute", top: 172, left: 135, width: 22, height: 11, borderBottom: "3.5px solid #7a5a40", borderRadius: "50%" }} />
    </ScaledIcon>
  );
}

export function MochiFace({ size }: FaceProps) {
  return (
    <ScaledIcon size={size} nativeWidth={270} nativeHeight={270} animation="gamtoo-float-bounce 2.1s ease-in-out infinite">
      <div style={{ position: "absolute", top: -14, left: 86, width: 14, height: 52, borderRadius: 8, background: "linear-gradient(180deg, #cfc5ea, #bcb1dc)", transform: "rotate(-14deg)", boxShadow: "inset 3px 3px 5px rgba(255,255,255,0.7), 0 4px 8px rgba(140,125,180,0.2)" }} />
      <div style={{ position: "absolute", top: -40, left: 64, width: 42, height: 40, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #f4d9e6, #e2b3cb 78%)", boxShadow: "0 8px 14px rgba(180,125,160,0.25), inset 6px 8px 10px rgba(255,255,255,0.7)" }} />
      <div style={{ position: "absolute", top: -14, left: 170, width: 14, height: 52, borderRadius: 8, background: "linear-gradient(180deg, #cfc5ea, #bcb1dc)", transform: "rotate(14deg)", boxShadow: "inset 3px 3px 5px rgba(255,255,255,0.7), 0 4px 8px rgba(140,125,180,0.2)" }} />
      <div style={{ position: "absolute", top: -40, left: 164, width: 42, height: 40, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #f4d9e6, #e2b3cb 78%)", boxShadow: "0 8px 14px rgba(180,125,160,0.25), inset 6px 8px 10px rgba(255,255,255,0.7)" }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle at 35% 28%, #f0ecfa 0%, #e0daf2 50%, #cdc4e7 82%, #bcb1dc 100%)", boxShadow: "0 22px 34px rgba(130,115,170,0.2), inset -8px -14px 24px rgba(140,125,180,0.2), inset 10px 14px 22px rgba(255,255,255,0.9)" }} />
      <div style={{ position: "absolute", top: 26, left: 52, width: 74, height: 44, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(255,255,255,0.95), rgba(255,255,255,0))", transform: "rotate(-18deg)" }} />
      <div style={{ position: "absolute", top: 106, left: 56, width: 35, height: 37, borderRadius: "50%", background: "radial-gradient(circle at 34% 28%, #4c4c4c, #101010 68%)", boxShadow: "0 2px 4px rgba(0,0,0,0.25)" }}>
        <div style={{ position: "absolute", top: 6, left: 7, width: 9, height: 9, borderRadius: "50%", background: "rgba(255,255,255,0.9)" }} />
      </div>
      <div style={{ position: "absolute", top: 106, left: 179, width: 35, height: 37, borderRadius: "50%", background: "radial-gradient(circle at 34% 28%, #4c4c4c, #101010 68%)", boxShadow: "0 2px 4px rgba(0,0,0,0.25)" }}>
        <div style={{ position: "absolute", top: 6, left: 7, width: 9, height: 9, borderRadius: "50%", background: "rgba(255,255,255,0.9)" }} />
      </div>
      <div style={{ position: "absolute", top: 150, left: 122, width: 26, height: 22, borderRadius: "50%", background: "radial-gradient(circle at 42% 30%, #b0788c, #8e5670 75%)", boxShadow: "inset 0 4px 6px rgba(90,45,65,0.45)" }}>
        <div style={{ position: "absolute", bottom: 2, left: 6, width: 14, height: 9, borderRadius: "50%", background: "radial-gradient(circle at 45% 35%, #f0b0b4, #d98a90 80%)" }} />
      </div>
      <div style={{ position: "absolute", top: 150, left: 42, width: 36, height: 22, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(240,170,185,0.6), rgba(240,170,185,0))" }} />
      <div style={{ position: "absolute", top: 150, left: 192, width: 36, height: 22, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(240,170,185,0.6), rgba(240,170,185,0))" }} />
    </ScaledIcon>
  );
}

export const CHARACTER_FACES: Record<CharacterName, (props: FaceProps) => React.JSX.Element> = {
  seal: SealFace,
  panda: PandaFace,
  bichon: BichonFace,
  bear: BearFace,
  mochi: MochiFace,
};
