"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { logout } from "@/app/admin/login/actions";
import {
  TIME_OF_DAY,
  getAllLibraryRows,
  type LibraryRow,
  type TimeOfDay,
  type PosterTemplate,
} from "@/lib/templates";
import {
  deleteLibraryTemplate,
  setLibraryTemplateEnabled,
  updateLibraryTemplateWeight,
} from "@/lib/templates/library-actions";
import { renderPoster, createSamplePhotoBlob } from "@/lib/render";

const WEIGHT_PRESETS = [
  { label: "적게 나옴", value: 0.5 },
  { label: "보통", value: 1 },
  { label: "자주 나옴", value: 2 },
  { label: "아주 자주", value: 3 },
];

const SOURCE_LABEL: Record<LibraryRow["source"], string> = {
  "built-in": "기존",
  added: "추가",
};

const PAGE_SIZE = 10;

async function renderThumbnail(template: PosterTemplate): Promise<string> {
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
  return URL.createObjectURL(blob);
}

export default function TemplateLibraryPage() {
  // Fetched from Supabase client-side (rather than during server rendering)
  // so a stale/cached server render never shows outdated enabled state.
  const [rows, setRows] = useState<LibraryRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftWeight, setDraftWeight] = useState(1);
  const [draftTimes, setDraftTimes] = useState<TimeOfDay[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);

  const refresh = async () => setRows(await getAllLibraryRows());

  useEffect(() => {
    refresh();
  }, []);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Render (and cache) a small preview for whichever rows are on the current
  // page, so we're not rasterizing every template in the library up front.
  useEffect(() => {
    const missing = pageRows.filter((row) => !thumbnails[row.template.id]);
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      for (const row of missing) {
        const url = await renderThumbnail(row.template);
        if (!cancelled) setThumbnails((prev) => ({ ...prev, [row.template.id]: url }));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, currentPage]);

  const handleToggleEnabled = async (row: LibraryRow) => {
    await setLibraryTemplateEnabled(row.template.id, row.source, !row.enabled);
    await refresh();
  };

  const handleDelete = async (row: LibraryRow) => {
    await deleteLibraryTemplate(row.template.id, row.source);
    await refresh();
  };

  const startEditing = (row: LibraryRow) => {
    setEditingId(row.template.id);
    setDraftWeight(row.template.weightConditions?.weight ?? 1);
    setDraftTimes(row.template.weightConditions?.timeOfDay ?? []);
  };

  const cancelEditing = () => setEditingId(null);

  const saveEditing = async (row: LibraryRow) => {
    await updateLibraryTemplateWeight(row.template.id, row.source, draftWeight, draftTimes);
    setEditingId(null);
    await refresh();
  };

  const toggleDraftTime = (t: TimeOfDay) => {
    setDraftTimes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">템플릿 목록 관리</h1>
          <p className="mt-1 text-sm text-muted">
            기존 템플릿과 이 브라우저에 추가한 템플릿을 한곳에서 켜고 끄고, 확률을 조정하고, 지울 수 있어요.
            여기서의 변경은 이 브라우저에만 저장되고, 실제 배포에는 반영되지 않아요.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/admin/templates" className="rounded border border-ink px-3 py-2 text-xs font-medium">
            ← 업로드로
          </Link>
          <button
            onClick={() => logout()}
            className="rounded border border-hairline px-3 py-2 text-xs font-medium text-muted"
          >
            로그아웃
          </button>
        </div>
      </div>

      <div className="rounded border border-hairline">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-soft">
              <tr>
                <th className="p-3">켜짐</th>
                <th className="p-3">이름</th>
                <th className="p-3">미리보기</th>
                <th className="p-3">출처</th>
                <th className="p-3">카테고리</th>
                <th className="p-3">확률/시간대</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <Fragment key={row.template.id}>
                  <tr className={`border-t border-hairline ${row.enabled ? "" : "opacity-40"}`}>
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={row.enabled}
                        onChange={() => handleToggleEnabled(row)}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-ink">{row.template.name}</div>
                      <div className="text-xs text-muted">{row.template.id}</div>
                    </td>
                    <td className="p-3">
                      <div className="group relative inline-block">
                        {thumbnails[row.template.id] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumbnails[row.template.id]}
                            alt=""
                            className="h-12 w-12 rounded border border-hairline bg-surface-soft object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 animate-pulse rounded border border-hairline bg-surface-soft" />
                        )}
                        {thumbnails[row.template.id] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumbnails[row.template.id]}
                            alt=""
                            className="pointer-events-none absolute left-0 top-0 z-20 hidden h-48 w-48 rounded border border-ink bg-white object-contain shadow-[var(--shadow-card)] group-hover:block"
                          />
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-xs text-muted">{SOURCE_LABEL[row.source]}</td>
                    <td className="p-3 text-xs text-muted">{row.template.category}</td>
                    <td className="p-3 text-xs text-muted">
                      weight {row.template.weightConditions?.weight ?? 1}
                      {row.template.weightConditions?.timeOfDay
                        ? ` · ${row.template.weightConditions.timeOfDay.join(", ")}`
                        : ""}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => (editingId === row.template.id ? cancelEditing() : startEditing(row))}
                          className="rounded border border-ink px-3 py-1 text-xs font-medium"
                        >
                          {editingId === row.template.id ? "취소" : "수정"}
                        </button>
                        <button
                          onClick={() => handleDelete(row)}
                          className="rounded border border-hairline px-3 py-1 text-xs font-medium text-error"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editingId === row.template.id && (
                    <tr className="border-t border-hairline bg-surface-soft">
                      <td colSpan={7} className="p-4">
                        <div className="flex flex-wrap items-center gap-6">
                          <div>
                            <p className="mb-1 text-xs font-medium text-ink">노출 확률</p>
                            <div className="flex gap-2">
                              {WEIGHT_PRESETS.map((preset) => (
                                <button
                                  key={preset.label}
                                  type="button"
                                  onClick={() => setDraftWeight(preset.value)}
                                  className={`rounded-full border px-3 py-1 text-xs ${
                                    draftWeight === preset.value
                                      ? "border-ink bg-ink text-on-primary"
                                      : "border-hairline text-muted"
                                  }`}
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="mb-1 text-xs font-medium text-ink">선호 시간대</p>
                            <div className="flex gap-2">
                              {TIME_OF_DAY.map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => toggleDraftTime(t)}
                                  className={`rounded-full border px-3 py-1 text-xs ${
                                    draftTimes.includes(t)
                                      ? "border-ink bg-ink text-on-primary"
                                      : "border-hairline text-muted"
                                  }`}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() => saveEditing(row)}
                            className="rounded bg-primary px-4 py-2 text-xs font-medium text-on-primary"
                          >
                            저장
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 border-t border-hairline bg-surface-soft p-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded px-2 py-1 text-xs font-medium text-muted disabled:opacity-30"
            >
              이전
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`h-7 w-7 rounded text-xs font-medium ${
                  n === currentPage ? "bg-ink text-on-primary" : "text-muted"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded px-2 py-1 text-xs font-medium text-muted disabled:opacity-30"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
