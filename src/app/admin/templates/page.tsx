"use client";

import { useState } from "react";
import Link from "next/link";
import { parseSvgTemplate, type ParseSvgTemplateResult } from "@/lib/template-authoring";
import { renderPoster, createSamplePhotoBlob } from "@/lib/render";
import {
  TEMPLATE_CATEGORIES,
  TIME_OF_DAY,
  getTemplatesByCategory,
  addTemplateToLibrary,
  type TemplateCategory,
  type TimeOfDay,
} from "@/lib/templates";
import type { PosterTemplate } from "@/lib/templates";

const WEIGHT_PRESETS = [
  { label: "적게 나옴", value: 0.5 },
  { label: "보통", value: 1 },
  { label: "자주 나옴", value: 2 },
  { label: "아주 자주", value: 3 },
];

function slugify(input: string): string {
  return (
    input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, "-")
      .replace(/^-+|-+$/g, "") || "untitled"
  );
}

export default function AdminTemplatesPage() {
  const [parsed, setParsed] = useState<ParseSvgTemplateResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [addedToLibrary, setAddedToLibrary] = useState(false);

  const [templateName, setTemplateName] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("photo");
  const [weight, setWeight] = useState(1);
  const [selectedTimes, setSelectedTimes] = useState<TimeOfDay[]>([]);

  const existingWeightSum = getTemplatesByCategory(category).reduce(
    (sum, t) => sum + (t.weightConditions?.weight ?? 1),
    0,
  );
  const estimatedPercent = Math.round((weight / (existingWeightSum + weight)) * 100);

  const buildTemplate = (): PosterTemplate | null => {
    if (!parsed) return null;
    return {
      schemaVersion: 1,
      id: slugify(templateName),
      name: templateName || "이름 없는 템플릿",
      category,
      canvasSize: parsed.canvasSize,
      layers: parsed.layers,
      weightConditions:
        selectedTimes.length > 0 || weight !== 1
          ? { weight, timeOfDay: selectedTimes.length > 0 ? selectedTimes : undefined }
          : undefined,
    };
  };

  const renderPreview = async (template: PosterTemplate) => {
    const hasPhoto = template.layers.some((l) => l.type === "image");
    const userPhoto = hasPhoto ? await createSamplePhotoBlob() : undefined;
    const blob = await renderPoster(template, {
      userPhoto,
      userText: "오늘 한강 러닝 완주! 스스로가 자랑스럽다",
      location: "서울 마포",
      nickname: "감투유저",
      date: new Date(),
      imageFit: "contain",
    });
    setPreviewUrl(URL.createObjectURL(blob));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError(null);
    setPreviewUrl(null);
    setAddedToLibrary(false);
    if (!templateName) setTemplateName(file.name.replace(/\.svg$/i, ""));

    try {
      const text = await file.text();
      const result = await parseSvgTemplate(text);
      setParsed(result);
      const template = {
        schemaVersion: 1,
        id: slugify(templateName || file.name),
        name: templateName || file.name,
        category,
        canvasSize: result.canvasSize,
        layers: result.layers,
      };
      await renderPreview(template);
    } catch (err) {
      console.error(err);
      setParseError(err instanceof Error ? err.message : "SVG를 파싱하지 못했습니다.");
      setParsed(null);
    }
  };

  const handleRefreshPreview = async () => {
    const template = buildTemplate();
    if (template) await renderPreview(template);
  };

  const handleDownload = () => {
    const template = buildTemplate();
    if (!template) return;
    const json = JSON.stringify(template, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${template.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleTime = (time: TimeOfDay) => {
    setSelectedTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time],
    );
  };

  const handleAddToLibrary = () => {
    const template = buildTemplate();
    if (!template) return;
    addTemplateToLibrary(template);
    setAddedToLibrary(true);
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">템플릿 업로드 (관리자)</h1>
          <p className="mt-1 text-sm text-muted">
            Figma 등에서 이름 규칙({"{층위|last}_{역할}[_크기px][_색상][_row|column배율][_left|center|right][_폰트]"})으로
            레이어를 이름 붙여 내보낸 SVG를 업로드하세요.
          </p>
        </div>
        <Link
          href="/admin/templates/library"
          className="shrink-0 rounded border border-ink px-3 py-2 text-xs font-medium"
        >
          템플릿 목록 관리 →
        </Link>
      </div>

      <label className="flex h-24 w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-border-strong text-sm text-muted">
        SVG 파일 선택
        <input type="file" accept=".svg,image/svg+xml" className="hidden" onChange={handleFileChange} />
      </label>

      {parseError && <p className="text-sm text-error">{parseError}</p>}

      {parsed && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col text-sm">
              템플릿 이름
              <input
                className="mt-1 rounded border border-hairline px-3 py-2"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </label>
            <label className="flex flex-col text-sm">
              카테고리
              <select
                className="mt-1 rounded border border-hairline px-3 py-2"
                value={category}
                onChange={(e) => setCategory(e.target.value as TemplateCategory)}
              >
                {TEMPLATE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-col text-sm">
              노출 확률
              <div className="mt-1 flex flex-wrap gap-2">
                {WEIGHT_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setWeight(preset.value)}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      weight === preset.value
                        ? "border-ink bg-ink text-on-primary"
                        : "border-hairline text-muted"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-muted">
                현재 &quot;{category}&quot; 카테고리 기준 약 {estimatedPercent}% 확률로 뽑혀요
              </p>
            </div>
            <div className="flex flex-col text-sm">
              선호 시간대 (선택 없으면 전체)
              <div className="mt-1 flex flex-wrap gap-2">
                {TIME_OF_DAY.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTime(t)}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      selectedTimes.includes(t)
                        ? "border-ink bg-ink text-on-primary"
                        : "border-hairline text-muted"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleRefreshPreview}
            className="w-fit rounded border border-ink px-4 py-2 text-sm font-medium"
          >
            미리보기 새로고침
          </button>

          <div>
            <h2 className="mb-2 text-sm font-semibold">파싱된 레이어 ({parsed.layers.length}개)</h2>
            <div className="overflow-x-auto rounded border border-hairline">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-soft">
                  <tr>
                    <th className="p-2">id</th>
                    <th className="p-2">type</th>
                    <th className="p-2">zIndex</th>
                    <th className="p-2">position</th>
                    <th className="p-2">기타</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.layers.map((layer) => (
                    <tr key={layer.id} className="border-t border-hairline">
                      <td className="p-2">{layer.id}</td>
                      <td className="p-2">{layer.type}</td>
                      <td className="p-2">{layer.zIndex}</td>
                      <td className="p-2">
                        {layer.position.x},{layer.position.y} {layer.position.width}x
                        {layer.position.height}
                      </td>
                      <td className="p-2">
                        {layer.type === "text" &&
                          `${layer.textField} ${layer.fontSize ?? ""}px ${layer.color ?? ""}`}
                        {layer.type === "decoration" && "rasterized image"}
                        {layer.type === "image" && layer.imageSlot}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsed.warnings.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-xs text-error">
                {parsed.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
          </div>

          {previewUrl && (
            <div>
              <h2 className="mb-2 text-sm font-semibold">미리보기</h2>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="템플릿 미리보기" className="w-full max-w-sm rounded border border-hairline" />
            </div>
          )}

          {addedToLibrary && (
            <p className="text-sm text-body">
              ✓ 라이브러리에 추가했어요 — 이제 다른 템플릿들과 같이 랜덤으로 뽑혀요.{" "}
              <Link href="/make" className="underline">
                기록하기에서 확인
              </Link>{" "}
              ·{" "}
              <Link href="/admin/templates/library" className="underline">
                목록 관리
              </Link>
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleAddToLibrary}
              className="w-fit rounded bg-ink px-4 py-2 text-sm font-medium text-on-primary"
            >
              라이브러리에 추가
            </button>
            <button
              onClick={handleDownload}
              className="w-fit rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary"
            >
              템플릿 JSON 다운로드
            </button>
          </div>
        </>
      )}
    </main>
  );
}
