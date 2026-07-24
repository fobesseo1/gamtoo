"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPosterStorage, type PosterRecord } from "@/lib/storage";

interface PosterItem {
  record: PosterRecord;
  url: string;
}

function formatDisplayDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function ArchivePage() {
  const [items, setItems] = useState<PosterItem[] | null>(null);
  const [selected, setSelected] = useState<PosterItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPosterStorage()
      .getAll()
      .then((records) => {
        if (cancelled) return;
        setItems(records.map((record) => ({ record, url: URL.createObjectURL(record.imageBlob) })));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDownload = (item: PosterItem) => {
    const a = document.createElement("a");
    a.href = item.url;
    a.download = `gamtoo-${item.record.id}.png`;
    a.click();
  };

  const handleDelete = async (item: PosterItem) => {
    await getPosterStorage().remove(item.record.id);
    setItems((prev) => prev?.filter((i) => i.record.id !== item.record.id) ?? null);
    setSelected(null);
  };

  if (items === null) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-24">
        <p className="text-[14px] text-muted">불러오는 중...</p>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <h1 className="text-[20px] font-semibold">보관함</h1>
        <p className="text-[14px] text-muted">아직 저장된 기록이 없어요.</p>
        <Link
          href="/make"
          className="flex h-12 items-center rounded-sm bg-primary px-6 text-[16px] font-medium text-on-primary"
        >
          첫 감탄 기록하기
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <h1 className="mb-6 text-[20px] font-semibold">보관함 ({items.length})</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <button
            key={item.record.id}
            onClick={() => setSelected(item)}
            className="text-left"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt={item.record.userText ?? "저장된 포스터"}
              className="aspect-[4/5] w-full rounded-md object-cover shadow-[var(--shadow-card)] transition-shadow hover:shadow-lg"
            />
            <p className="mt-2 text-[13px] text-muted">{formatDisplayDate(item.record.createdAt)}</p>
          </button>
        ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50 px-6"
          onClick={() => setSelected(null)}
        >
          <div
            className="flex w-full max-w-sm flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selected.url}
              alt={selected.record.userText ?? "저장된 포스터"}
              className="w-full rounded-lg shadow-[var(--shadow-card)]"
            />
            <div className="flex w-full gap-3">
              <button
                onClick={() => handleDownload(selected)}
                className="h-12 flex-1 rounded-sm border border-ink bg-canvas text-[16px] font-medium text-ink"
              >
                다운로드
              </button>
              <button
                onClick={() => handleDelete(selected)}
                className="h-12 flex-1 rounded-sm border border-hairline bg-canvas text-[16px] font-medium text-error"
              >
                삭제
              </button>
            </div>
            <button onClick={() => setSelected(null)} className="text-[14px] text-white underline">
              닫기
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
