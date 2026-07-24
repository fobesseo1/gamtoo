"use client";

import { useState } from "react";
import { downscaleImage } from "@/lib/photo/downscale-image";
import { getAllTemplates } from "@/lib/templates";
import { renderPoster } from "@/lib/render";

interface RenderedPoster {
  id: string;
  name: string;
  category: string;
  url: string;
}

export default function RenderDevPage() {
  const [userText, setUserText] = useState("오늘 한강 러닝 완주! 스스로가 자랑스럽다");
  const [location, setLocation] = useState("서울 마포");
  const [status, setStatus] = useState<"idle" | "working">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [posters, setPosters] = useState<RenderedPoster[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("working");
    setPosters([]);

    setStatusMessage("사진 다운스케일 중...");
    const { blob: original } = await downscaleImage(file);

    const data = {
      userText,
      location,
      date: new Date(),
    };

    setStatusMessage("템플릿 렌더링 중...");
    const templates = getAllTemplates();
    const results: RenderedPoster[] = [];
    for (const template of templates) {
      const userPhoto = template.category === "photo" ? original : undefined;
      const blob = await renderPoster(template, { ...data, userPhoto });
      results.push({
        id: template.id,
        name: template.name,
        category: template.category,
        url: URL.createObjectURL(blob),
      });
    }

    setPosters(results);
    setStatus("idle");
    setStatusMessage("");
  };

  const handleGraphicOnly = async () => {
    setStatus("working");
    setPosters([]);
    setStatusMessage("그래픽 전용 템플릿 렌더링 중...");

    const data = { userText, location, date: new Date() };
    const templates = getAllTemplates().filter((t) => t.category === "graphic-only");
    const results: RenderedPoster[] = [];
    for (const template of templates) {
      const blob = await renderPoster(template, data);
      results.push({
        id: template.id,
        name: template.name,
        category: template.category,
        url: URL.createObjectURL(blob),
      });
    }
    setPosters(results);
    setStatus("idle");
    setStatusMessage("");
  };

  return (
    <main className="flex flex-1 flex-col gap-4 px-6 py-10">
      <h1 className="text-2xl font-semibold">Canvas 렌더러 테스트</h1>
      <p className="text-sm text-zinc-500">
        사진을 올리면 9개 템플릿 전체(사진형은 실제 사진, 그래픽전용은 랜덤 캐릭터)를 렌더링합니다.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-sm">
          문구
          <input
            className="w-72 rounded border border-zinc-300 px-2 py-1"
            value={userText}
            onChange={(e) => setUserText(e.target.value)}
          />
        </label>
        <label className="flex flex-col text-sm">
          위치
          <input
            className="w-40 rounded border border-zinc-300 px-2 py-1"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="w-fit cursor-pointer rounded border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700">
          사진 업로드 후 전체 템플릿 렌더링
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={status === "working"}
          />
        </label>
        <button
          onClick={handleGraphicOnly}
          disabled={status === "working"}
          className="w-fit rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          그래픽 전용 3개만 렌더링 (사진 불필요)
        </button>
      </div>

      {status === "working" && <p className="text-sm">{statusMessage}</p>}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posters.map((poster) => (
          <div key={poster.id}>
            <p className="mb-1 text-xs text-zinc-500">
              [{poster.category}] {poster.name}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={poster.url} alt={poster.name} className="w-full rounded border border-zinc-300" />
          </div>
        ))}
      </div>
    </main>
  );
}
