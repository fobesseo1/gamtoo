import { useEffect, useState, type CSSProperties } from "react";
import type { CharacterName } from "@/lib/characters/constants";
import { CHARACTER_FACES } from "./character-faces";
import { MESSAGE_CHARACTERS } from "./bg-removal-loading-message";

const GROUP_ORDER: CharacterName[] = ["mochi", "panda", "seal", "bichon", "bear"];

// Scattered around the photo card, with room for the wander animation to
// drift into without instantly overlapping a neighbor.
const GROUP_POSITIONS: CSSProperties[] = [
  { top: -50, left: -56 },
  { top: -44, right: -58 },
  { top: "42%", left: -76 },
  { bottom: -44, left: -50 },
  { bottom: -50, right: -46 },
];

// Candidate spots around the photo boundary for the solo character — one is
// picked at random each time a new character shows up, instead of always
// the same top-center spot. No `transform` here (avoids fighting with the
// wander animation, which also animates `transform` on the same element).
const SOLO_POSITIONS: CSSProperties[] = [
  { top: -74, left: 40 },
  { top: -62, left: -48 },
  { top: -62, right: -48 },
  { bottom: -74, left: 40 },
  { bottom: -62, left: -48 },
  { bottom: -62, right: -48 },
  { top: 78, left: -78 },
  { top: 78, right: -78 },
];

const WANDER_KEYFRAMES = ["gamtoo-wander-a", "gamtoo-wander-b", "gamtoo-wander-c", "gamtoo-wander-d"];
const WANDER_DURATIONS_MS = [6200, 7400, 8100, 6800, 7000];

function randomWander() {
  const keyframe = WANDER_KEYFRAMES[Math.floor(Math.random() * WANDER_KEYFRAMES.length)];
  const durationMs = 5500 + Math.round(Math.random() * 3000);
  // Negative delay starts the animation already partway through its cycle,
  // so it's not always beginning from the same pose.
  const delayMs = -Math.round(Math.random() * durationMs);
  return { animation: `${keyframe} ${durationMs}ms ease-in-out infinite`, animationDelay: `${delayMs}ms` };
}

interface SoloCharacterProps {
  character: CharacterName;
  size: number;
}

// Deterministic so server and client render the same thing on the first
// pass (this component can be part of the initial SSR paint on pages like
// /dev/characters) — the real pick happens client-side right after, in an
// effect, which a bare Math.random() in a useState initializer can't do
// without the server and client disagreeing and triggering a hydration
// mismatch.
const DEFAULT_CHOICE = { position: SOLO_POSITIONS[0], wander: { animation: "none" } };

function pickRandomChoice() {
  return {
    position: SOLO_POSITIONS[Math.floor(Math.random() * SOLO_POSITIONS.length)],
    wander: randomWander(),
  };
}

/** One character, at a randomly-picked spot around the photo boundary with
 * a randomly-picked wander pattern — both re-rolled only when `character`
 * changes (via the parent's `key`), so it stays put while it's on screen. */
function SoloCharacter({ character, size }: SoloCharacterProps) {
  const [{ position, wander }, setChoice] = useState(DEFAULT_CHOICE);
  useEffect(() => {
    setChoice(pickRandomChoice());
  }, []);
  const Face = CHARACTER_FACES[character];

  return (
    <div
      className="gamtoo-wander pointer-events-none absolute"
      style={{ width: size, height: size, ...position, ...wander }}
    >
      <div style={{ animation: "gamtoo-icon-pop-in 0.4s ease-out" }}>
        <Face size={size} />
      </div>
    </div>
  );
}

interface CharacterLoadingAnimationProps {
  messageIndex: number;
  soloSize?: number;
  groupSize?: number;
}

/** Shows whichever character the current loading message calls out by name
 * — bouncing solo, wandering around a randomly-picked spot on the photo
 * boundary — or, for the generic messages that don't name anyone, the whole
 * group scattered and wandering around the photo instead. */
export function CharacterLoadingAnimation({
  messageIndex,
  soloSize = 120,
  groupSize = 54,
}: CharacterLoadingAnimationProps) {
  const solo = MESSAGE_CHARACTERS[messageIndex];

  if (solo) {
    return <SoloCharacter key={solo} character={solo} size={soloSize} />;
  }

  return (
    <>
      {GROUP_ORDER.map((name, i) => {
        const Face = CHARACTER_FACES[name];
        return (
          <div
            key={name}
            className="gamtoo-wander pointer-events-none absolute"
            style={{
              width: groupSize,
              height: groupSize,
              ...GROUP_POSITIONS[i],
              animation: `${WANDER_KEYFRAMES[i % WANDER_KEYFRAMES.length]} ${
                WANDER_DURATIONS_MS[i % WANDER_DURATIONS_MS.length]
              }ms ease-in-out infinite`,
              animationDelay: `${-i * 900}ms`,
            }}
          >
            <div style={{ animation: "gamtoo-icon-pop-in 0.4s ease-out" }}>
              <Face size={groupSize} />
            </div>
          </div>
        );
      })}
    </>
  );
}
