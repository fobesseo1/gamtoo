"use client";

import { useState } from "react";
import { useBackgroundRemoval } from "@/lib/photo/use-background-removal";
import { preloadBackgroundRemovalModel, type BgRemovalModel } from "@/lib/photo/background-removal";
import { downscaleImage } from "@/lib/photo/downscale-image";

// isnet_fp16 removed from this list -- its model chunks aren't self-hosted
// under public/bgr/ (unused by the live app; see background-removal.ts's
// getBgRemovalConfig), so picking it here would just 404.
const MODELS: { value: BgRemovalModel | "default"; label: string }[] = [
  { value: "default", label: "기본값 (기기별 자동 선택)" },
  { value: "isnet_quint8", label: "isnet_quint8 (8비트)" },
  { value: "isnet", label: "isnet (fp32, 최고화질)" },
];

/** Draws a simple synthetic "subject on a background" image so we can
 * exercise the pipeline without needing a real photo upload. */
function createTestPhotoBlob(): Promise<Blob> {
  // Sized like a real phone photo (~3000x2000) so the downscale step has
  // something meaningful to do in this test.
  const canvas = document.createElement("canvas");
  canvas.width = 3000;
  canvas.height = 2000;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#87CEEB";
  ctx.fillRect(0, 0, 3000, 2000);
  ctx.fillStyle = "#4B3621";
  ctx.beginPath();
  ctx.arc(1500, 1000, 700, 0, Math.PI * 2);
  ctx.fill();
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), "image/png"));
}

function formatKB(bytes: number): string {
  return `${Math.round(bytes / 1024)}KB`;
}

interface ImagePanelInfo {
  url: string;
  label: string;
}

export default function BackgroundRemovalDevPage() {
  const { status, progress, resultBlob, usedFallback, run } = useBackgroundRemoval();
  const [sourcePanel, setSourcePanel] = useState<ImagePanelInfo | null>(null);
  const [downscaledPanel, setDownscaledPanel] = useState<ImagePanelInfo | null>(null);
  const [resultPanel, setResultPanel] = useState<ImagePanelInfo | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [model, setModel] = useState<BgRemovalModel | "default">("default");
  const [preloadedAt, setPreloadedAt] = useState<number | null>(null);

  const runOn = async (blob: Blob) => {
    setDownscaledPanel(null);
    setResultPanel(null);
    setElapsedMs(null);
    setSourcePanel({ url: URL.createObjectURL(blob), label: `원본 ${formatKB(blob.size)}` });

    // Downscale again here purely to show the intermediate result — the
    // hook already does this internally, at the same default, before
    // background removal.
    const downscaled = await downscaleImage(blob);
    setDownscaledPanel({
      url: URL.createObjectURL(downscaled.blob),
      label: `다운스케일 후 (${downscaled.width}x${downscaled.height}) ${formatKB(downscaled.blob.size)}`,
    });

    const start = performance.now();
    const result = await run(blob, model === "default" ? {} : { model });
    setElapsedMs(Math.round(performance.now() - start));
    setResultPanel({
      url: URL.createObjectURL(result.blob),
      label: `결과 ${formatKB(result.blob.size)}`,
    });
  };

  const handlePreload = () => {
    preloadBackgroundRemovalModel(model === "default" ? undefined : model);
    setPreloadedAt(performance.now());
  };

  const handleTestImage = () => createTestPhotoBlob().then(runOn);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) runOn(file);
  };

  return (
    <main className="flex flex-1 flex-col gap-4 px-6 py-10">
      <h1 className="text-2xl font-semibold">배경 제거 연동 테스트</h1>
      <p className="text-sm text-zinc-500">
        실제 사진을 올리거나, 합성 테스트 이미지로 파이프라인 동작을 확인할 수 있습니다. 처음
        실행 시 모델(수십MB) 다운로드 때문에 시간이 걸릴 수 있습니다.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-zinc-500">
          모델:{" "}
          <select
            value={model}
            onChange={(e) => setModel(e.target.value as BgRemovalModel | "default")}
            className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700"
          >
            {MODELS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={handlePreload}
          className="w-fit rounded border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
        >
          이 모델 미리 로딩
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="w-fit cursor-pointer rounded border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700">
          사진 업로드
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={status === "processing"}
          />
        </label>
        <button
          onClick={handleTestImage}
          disabled={status === "processing"}
          className="w-fit rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {status === "processing" ? `처리 중... ${progress}%` : "합성 테스트 이미지로 실행"}
        </button>
      </div>

      <dl className="text-sm">
        <div>상태: {status}</div>
        <div>진행률: {progress}%</div>
        {preloadedAt !== null && <div>미리 로딩 요청 시각: +{Math.round(preloadedAt)}ms (탭 로드 기준)</div>}
        {elapsedMs !== null && (
          <div>
            소요 시간: <strong>{elapsedMs}ms</strong> (모델: {model})
          </div>
        )}
        {resultBlob && (
          <div>폴백 사용 여부: {usedFallback ? "예 (원본 유지)" : "아니오 (배경 제거 성공)"}</div>
        )}
      </dl>

      <div className="flex flex-wrap gap-6">
        {[sourcePanel, downscaledPanel, resultPanel].map(
          (panel, i) =>
            panel && (
              <div key={i}>
                <p className="mb-1 text-xs text-zinc-500">{panel.label}</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={panel.url}
                  alt={panel.label}
                  className="w-64 rounded border border-zinc-300 bg-[repeating-conic-gradient(#ccc_0_25%,white_0_50%)] bg-[length:20px_20px]"
                />
              </div>
            ),
        )}
      </div>
    </main>
  );
}
