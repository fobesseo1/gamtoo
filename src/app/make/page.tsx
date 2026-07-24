"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useBackgroundRemoval } from "@/lib/photo/use-background-removal";
import { downscaleImage } from "@/lib/photo/downscale-image";
import { detectLocationLabel } from "@/lib/geolocation";
import { textWeight, truncateToWeight } from "@/lib/text-length";
import { pickRandomTemplate, getCurrentTimeOfDay } from "@/lib/templates";
import type { PosterTemplate } from "@/lib/templates";
import { renderPoster } from "@/lib/render";
import { getPosterStorage } from "@/lib/storage";
import { BgRemovalLoadingMessage, useLoadingMessageIndex } from "@/components/bg-removal-loading-message";
import { CelebrationScreen } from "@/components/celebration-screen";
import { ProcessingScreen } from "@/components/processing-screen";
import { ProgressBar } from "@/components/progress-bar";
import { PawTapButton } from "@/components/paw-tap-button";

type Step = "form" | "processing" | "celebrating" | "result";

interface RenderedPoster {
  blob: Blob;
  url: string;
}

// Fixed length of the post-completion fanfare (confetti + title) — the
// fanfare only plays once work is actually done, so this doesn't need to
// track real progress; it's just long enough to register as a payoff.
const CELEBRATION_BURST_MS = 1400;

// One poster-caption line, not a paragraph — roughly 20 Korean characters or
// 40 English ones (see lib/text-length for the weighting behind this).
const MAX_TEXT_WEIGHT = 40;

// Shown when the user leaves the field blank, so no poster ever renders
// with an empty caption/location — a photo-only or blank submission still
// gets a real one-liner and place name instead of a gap in the layout.
const DEFAULT_CAPTION = "I amaze myself.";
const DEFAULT_LOCATION = "Seoul, Myeong-dong";

/** Randomly picks a template from a category or categories, and picks it
 * only from the "photo" pools. Called as soon as the page loads (before we
 * even know whether the user will attach a photo) so that, the instant a
 * photo does get attached, we already know whether the winning template
 * expects a cutout ("photo") or the original with its background
 * ("photo-noremovebg") — and can decide right then whether to start
 * background removal at all, instead of finding out only at submit time. */
function pickPhotoTemplate(): PosterTemplate {
  return pickRandomTemplate(["photo", "photo-noremovebg"], { timeOfDay: getCurrentTimeOfDay() });
}

export default function MakePage() {
  const [step, setStep] = useState<Step>("form");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [userText, setUserText] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dipActive, setDipActive] = useState(false);

  // Tentatively picked the moment this page loads, assuming a photo is
  // likely — re-picking a template is essentially free (no network, no
  // heavy work), so guessing wrong just means picking again from
  // "graphic-only" at submit time instead (see handleSubmit).
  const [preselectedTemplate, setPreselectedTemplate] = useState<PosterTemplate | null>(null);

  const [template, setTemplate] = useState<PosterTemplate | null>(null);
  const [originalPoster, setOriginalPoster] = useState<RenderedPoster | null>(null);
  const [cutoutPoster, setCutoutPoster] = useState<RenderedPoster | null>(null);
  const [bgRemoved, setBgRemoved] = useState(false);
  const [bgProcessing, setBgProcessing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    setPreselectedTemplate(pickPhotoTemplate());
  }, []);

  // Best-effort default for the location field — silently does nothing
  // (leaving the field blank) if permission is denied or detection fails
  // for any reason. Only fills the field if the user hasn't already typed
  // something into it by the time the (permission prompt + network) round
  // trip resolves.
  useEffect(() => {
    detectLocationLabel().then((label) => {
      if (!label) return;
      setLocation((prev) => (prev === "" ? label : prev));
    });
  }, []);

  const { run: removeBackground, progress } = useBackgroundRemoval();
  const loadingMessageIndex = useLoadingMessageIndex();

  const canSubmit = Boolean(photoFile) || userText.trim().length > 0;
  const displayedPoster = bgRemoved && cutoutPoster ? cutoutPoster : originalPoster;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    setPhotoPreviewUrl(file ? URL.createObjectURL(file) : null);
    // Only worth starting the real removal early if the template we'll
    // actually use it on ("photo") expects a cutout at all — a
    // "photo-noremovebg" pick never touches background removal, so there's
    // nothing to warm up for it. If they swap photos before submitting,
    // handleSubmit's call below reuses this by identity when it's the same
    // File, or starts a fresh run that queues behind this one otherwise (the
    // shared worker can't cancel an in-flight run — see
    // background-removal.ts — so a swap just costs a wait, not a redo).
    if (file && preselectedTemplate?.category === "photo") void removeBackground(file);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setStep("processing");

    try {
      let userPhoto: Blob | undefined;

      // A photo submission uses the template already picked on page load
      // (so the bg-removal decision above and this one always agree on the
      // same template) — text-only submissions never had a valid pick for
      // them (the preselect only ever draws from the photo pools), so those
      // pick fresh from "graphic-only" right here instead.
      const picked = photoFile ? preselectedTemplate ?? pickPhotoTemplate() : pickRandomTemplate("graphic-only", { timeOfDay: getCurrentTimeOfDay() });

      if (photoFile) {
        userPhoto = (await downscaleImage(photoFile)).blob;
      }

      const originalBlob = await renderPoster(picked, {
        userPhoto,
        userText: userText.trim() || DEFAULT_CAPTION,
        location: location.trim() || DEFAULT_LOCATION,
        date: new Date(),
        // Never crop the user's photo, in any template — always fit the
        // whole thing in, original or cutout alike.
        imageFit: "contain",
      });

      setTemplate(picked);
      setOriginalPoster({ blob: originalBlob, url: URL.createObjectURL(originalBlob) });

      // Only "photo" templates expect a cutout — "photo-noremovebg" always
      // shows the original as-is, so there's no removal (and no toggle) at all.
      let finalBgRemoved = false;
      let cutoutResult: RenderedPoster | null = null;
      if (photoFile && picked.category === "photo") {
        try {
          const removed = await removeBackground(photoFile);
          const cutoutBlob = await renderPoster(picked, {
            userPhoto: removed.blob,
            userText: userText.trim() || DEFAULT_CAPTION,
            location: location.trim() || DEFAULT_LOCATION,
            date: new Date(),
            imageFit: "contain",
          });
          cutoutResult = { blob: cutoutBlob, url: URL.createObjectURL(cutoutBlob) };
          finalBgRemoved = true;
        } catch (err) {
          console.error(err);
        }
      }

      setCutoutPoster(cutoutResult);
      setBgRemoved(finalBgRemoved);
      setSaveStatus("idle");

      // Work is genuinely done now — the fanfare plays here, not earlier.
      setStep("celebrating");
      await new Promise((resolve) => setTimeout(resolve, CELEBRATION_BURST_MS));
      setStep("result");
    } catch (err) {
      console.error(err);
      setError("포스터를 만드는 중 문제가 생겼어요. 다시 시도해주세요.");
      setStep("form");
    }
  };

  const handlePawTap = () => {
    if (!canSubmit) return;
    setDipActive(true);
    setTimeout(() => setDipActive(false), 340);
    setTimeout(() => {
      void handleSubmit();
    }, 380);
  };

  const handleToggleBackgroundRemoval = async () => {
    if (!photoFile || !template || template.category !== "photo") return;

    if (bgRemoved) {
      setBgRemoved(false);
      return;
    }

    if (cutoutPoster) {
      setBgRemoved(true);
      return;
    }

    setBgProcessing(true);
    try {
      const result = await removeBackground(photoFile);
      const blob = await renderPoster(template, {
        userPhoto: result.blob,
        userText: userText.trim() || DEFAULT_CAPTION,
        location: location.trim() || DEFAULT_LOCATION,
        date: new Date(),
        // Never crop the user's photo, in any template.
        imageFit: "contain",
      });
      setCutoutPoster({ blob, url: URL.createObjectURL(blob) });
      setBgRemoved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setBgProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!displayedPoster || !template) return;
    setSaveStatus("saving");
    try {
      await getPosterStorage().save({
        templateId: template.id,
        category: template.category,
        imageBlob: displayedPoster.blob,
        userText: userText.trim() || DEFAULT_CAPTION,
        location: location.trim() || DEFAULT_LOCATION,
      });
      setSaveStatus("saved");
    } catch (err) {
      console.error(err);
      setError("저장하는 중 문제가 생겼어요. 다시 시도해주세요.");
      setSaveStatus("idle");
    }
  };

  const handleReset = () => {
    setStep("form");
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
    setUserText("");
    setLocation("");
    setTemplate(null);
    setOriginalPoster(null);
    setCutoutPoster(null);
    setBgRemoved(false);
    setSaveStatus("idle");
    setPreselectedTemplate(pickPhotoTemplate());
  };

  const handleDownload = () => {
    if (!displayedPoster) return;
    const a = document.createElement("a");
    a.href = displayedPoster.url;
    a.download = `gamtoo-${Date.now()}.png`;
    a.click();
  };

  let content: React.ReactNode;

  if (step === "processing") {
    content = (
      <ProcessingScreen
        photoPreviewUrl={photoPreviewUrl}
        progress={progress}
        messageIndex={loadingMessageIndex}
      />
    );
  } else if (step === "celebrating") {
    content = (
      <main className="flex flex-1 flex-col">
        <CelebrationScreen
          message={
            <span className="text-[18px] font-extrabold" style={{ color: "oklch(46% 0.09 55)" }}>
              내가 나에게 감탄했어요!
            </span>
          }
        />
      </main>
    );
  } else if (step === "result" && displayedPoster) {
    content = (
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center gap-6 px-6 py-12">
        <h1 className="text-[20px] font-semibold">포스터가 완성됐어요</h1>

        <div className="relative w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayedPoster.url}
            alt="생성된 포스터"
            className={`w-full rounded-lg shadow-[var(--shadow-card)] ${
              bgProcessing ? "animate-gamtoo-pulse" : ""
            }`}
          />
          {bgProcessing && (
            <div className="absolute inset-0 overflow-hidden rounded-lg">
              <div className="animate-gamtoo-shimmer h-full w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            </div>
          )}
        </div>

        {bgProcessing && (
          <div className="flex w-full flex-col items-center gap-2 text-center">
            <BgRemovalLoadingMessage index={loadingMessageIndex} />
            <ProgressBar progress={progress} />
          </div>
        )}

        {error && <p className="text-[14px] text-error">{error}</p>}

        {saveStatus === "saved" ? (
          <>
            <p className="text-[14px] text-body">
              {bgRemoved ? "배경을 지운 버전" : "원본 사진 버전"}으로 보관함에 저장했어요.
            </p>
            <div className="flex w-full gap-3">
              <button
                onClick={handleReset}
                className="h-12 flex-1 rounded-sm border border-ink text-[16px] font-medium text-ink"
              >
                새로 기록하기
              </button>
              <Link
                href="/archive"
                className="flex h-12 flex-1 items-center justify-center rounded-sm bg-primary text-[16px] font-medium text-on-primary"
              >
                보관함 보기
              </Link>
            </div>
          </>
        ) : (
          <>
            {photoFile && !bgProcessing && template?.category === "photo" && (
              <div className="flex w-full gap-1 rounded-md border border-hairline p-1">
                <button
                  type="button"
                  onClick={() => bgRemoved && handleToggleBackgroundRemoval()}
                  className={`h-10 flex-1 rounded-sm text-[14px] font-medium transition-colors ${
                    !bgRemoved ? "bg-ink text-on-primary" : "text-muted"
                  }`}
                >
                  원본 그대로
                </button>
                <button
                  type="button"
                  onClick={() => !bgRemoved && handleToggleBackgroundRemoval()}
                  className={`h-10 flex-1 rounded-sm text-[14px] font-medium transition-colors ${
                    bgRemoved ? "bg-ink text-on-primary" : "text-muted"
                  }`}
                >
                  배경 제거
                </button>
              </div>
            )}

            <div className="flex w-full gap-3">
              <button
                onClick={handleDownload}
                disabled={bgProcessing}
                className="h-12 flex-1 rounded-sm border border-ink text-[16px] font-medium text-ink disabled:opacity-50"
              >
                다운로드
              </button>
              <button
                onClick={handleSave}
                disabled={bgProcessing || saveStatus === "saving"}
                className="h-12 flex-1 rounded-sm bg-primary text-[16px] font-medium text-on-primary disabled:bg-primary-disabled"
              >
                {saveStatus === "saving" ? "저장하는 중..." : "저장하기"}
              </button>
            </div>
            <button onClick={handleReset} className="text-[14px] text-muted underline">
              새로 기록하기
            </button>
          </>
        )}
      </main>
    );
  } else {
    content = (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-10">
        <div>
          <h1 className="text-[22px] font-medium">오늘의 감탄을 기록해보세요</h1>
          <p className="mt-1 text-[14px] text-muted">사진이나 문구, 하나만 있어도 괜찮아요.</p>
        </div>

        {error && <p className="text-[14px] text-error">{error}</p>}

        <div>
          <label className="mb-2 block text-[14px] font-medium text-ink">사진 (선택)</label>
          {photoPreviewUrl ? (
            <div className="relative w-40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoPreviewUrl} alt="선택한 사진" className="w-40 rounded-md object-cover" />
              <button
                onClick={handleRemovePhoto}
                aria-label="사진 제거"
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[12px] text-on-primary"
              >
                ×
              </button>
            </div>
          ) : (
            <label className="flex h-32 w-32 cursor-pointer items-center justify-center rounded-md border border-dashed border-border-strong text-center text-[14px] text-muted">
              + 사진 추가
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <label className="text-[14px] font-medium text-ink">문구 (선택)</label>
            <span className="text-[12px] text-muted">
              {textWeight(userText)}/{MAX_TEXT_WEIGHT}
            </span>
          </div>
          <textarea
            value={userText}
            onChange={(e) => setUserText(truncateToWeight(e.target.value, MAX_TEXT_WEIGHT))}
            placeholder="오늘 어떤 게 감탄스러웠나요?"
            rows={2}
            className="w-full rounded-sm border border-hairline px-3 py-3 text-[16px] outline-none focus:border-2 focus:border-ink"
          />
          <p className="mt-1.5 text-[12px] text-muted">비워두면 &ldquo;{DEFAULT_CAPTION}&rdquo;가 들어가요</p>
        </div>

        <div>
          <label className="mb-2 block text-[14px] font-medium text-ink">위치 (선택)</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="예: 서울 마포"
            className="w-full rounded-sm border border-hairline px-3 py-3 text-[16px] outline-none focus:border-2 focus:border-ink"
          />
          <p className="mt-1.5 text-[12px] text-muted">비워두면 &ldquo;{DEFAULT_LOCATION}&rdquo;이 들어가요</p>
        </div>

        <div className="flex flex-col items-center gap-2 py-2">
          <PawTapButton onTap={handlePawTap} disabled={!canSubmit} />
          <p className="text-[14px] font-medium text-muted">발바닥 꾹, 감탄 기록하기</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 z-50 bg-[#1a1206] transition-opacity duration-300"
        style={{ opacity: dipActive ? 0.5 : 0 }}
      />
      {content}
    </>
  );
}
