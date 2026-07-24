import { BgRemovalLoadingMessage, MESSAGE_CHARACTERS } from "./bg-removal-loading-message";
import { CharacterLoadingAnimation } from "./character-loading-animation";
import { CHARACTER_FACES } from "./character-faces";
import { ProgressBar } from "./progress-bar";

interface ProcessingScreenProps {
  photoPreviewUrl?: string | null;
  progress?: number;
  messageIndex: number;
}

/** The honest "still working" screen — shown while the poster is actually
 * being generated (and, if there's a photo, while the background is being
 * removed, which realistically takes several seconds). Shows the real photo
 * pulsing/shimmering with the character the current message calls out by
 * name (or the whole group, for the generic messages), plus a real progress
 * bar, so the fanfare in CelebrationScreen stays reserved for genuine
 * completion instead of having to carry the whole wait on its own. */
export function ProcessingScreen({ photoPreviewUrl, progress = 0, messageIndex }: ProcessingScreenProps) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      {photoPreviewUrl ? (
        <div className="relative w-56">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoPreviewUrl}
            alt="처리 중인 사진"
            className="animate-gamtoo-pulse w-full rounded-lg shadow-[var(--shadow-card)]"
          />
          <div className="absolute inset-0 overflow-hidden rounded-lg">
            <div className="animate-gamtoo-shimmer h-full w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </div>
          <CharacterLoadingAnimation messageIndex={messageIndex} />
        </div>
      ) : (
        <SoloCharacter messageIndex={messageIndex} />
      )}

      <div className="flex w-full flex-col items-center gap-3">
        <BgRemovalLoadingMessage index={messageIndex} />
        {photoPreviewUrl && <ProgressBar progress={progress} />}
      </div>
    </main>
  );
}

/** No photo card to scatter the group around on the text-only path, so just
 * show whoever the message names (or mochi by default) bouncing in place. */
function SoloCharacter({ messageIndex }: { messageIndex: number }) {
  const name = MESSAGE_CHARACTERS[messageIndex] ?? "mochi";
  const Face = CHARACTER_FACES[name];
  return (
    <div key={name} style={{ animation: "gamtoo-icon-pop-in 0.4s ease-out" }}>
      <Face size={88} />
    </div>
  );
}
