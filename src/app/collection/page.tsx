"use client";

import { useEffect, useState } from "react";
import { useSupabaseUser, signInWithGoogle } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";
import { RARITY_DISPLAY_NAMES } from "@/lib/items/constants";
import { CHARACTER_NAMES, type CharacterName } from "@/lib/characters/constants";
import { CharacterWithHat } from "@/components/character-with-hat";
import { HatIcon } from "@/components/hat-icon";

interface ItemRow {
  id: string;
  name: string;
  category: string;
  rarity: string;
  is_colorable: boolean;
  svg_path: string;
  sort_order: number | null;
}

interface OwnedRow {
  id: string;
  item_id: string;
  color_hex: string | null;
  acquired_at: string;
}

// One grid cell = one item *shape*, not one item+color combo -- matches
// docs/gamtoo-item-system.md 7.4's planned 2-tier structure (a cell will
// later expand into color sub-slots, "비니 — 보유 5색 / 전체 14색"). Phase 1
// has no colorable items yet, so ownedColorCount/totalColorCount aren't
// rendered anywhere yet, but the shape is here so that UI can be added
// later without restructuring this page.
interface CollectionSlot {
  item: ItemRow;
  owned: boolean;
  ownedCount: number;
  acquiredAt: string | null;
  ownedColorCount: number;
  totalColorCount: number | null;
}

// One row per user_items row, not per item shape -- duplicates each take
// their own entry here (7.3: "중복도 각각 한 칸을 차지한다").
interface MyItemEntry {
  id: string;
  item: ItemRow;
  acquiredAt: string;
}

function formatAcquiredAt(iso: string): string {
  const d = new Date(iso);
  const date = `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${date} ${time}`;
}

type View = "collection" | "mine";

export default function CollectionPage() {
  const { user, loading: userLoading } = useSupabaseUser();
  const [view, setView] = useState<View>("collection");
  const [slots, setSlots] = useState<CollectionSlot[] | null>(null);
  const [myItems, setMyItems] = useState<MyItemEntry[] | null>(null);
  const [mainCharacter, setMainCharacter] = useState<CharacterName>("bear");
  const [amazeCount, setAmazeCount] = useState<number | null>(null);
  const [selected, setSelected] = useState<CollectionSlot | null>(null);

  useEffect(() => {
    if (userLoading || !user) return;
    let cancelled = false;

    (async () => {
      const [itemsResult, ownedResult, profileResult] = await Promise.all([
        supabase.from("items").select("*").order("sort_order", { ascending: true }),
        supabase
          .from("user_items")
          .select("id, item_id, color_hex, acquired_at")
          .eq("user_id", user.id),
        supabase.from("profiles").select("main_character, amaze_count").eq("id", user.id).maybeSingle(),
      ]);
      if (cancelled) return;

      const items = (itemsResult.data as ItemRow[] | null) ?? [];
      const itemsById = new Map(items.map((item) => [item.id, item]));
      const owned = (ownedResult.data as OwnedRow[] | null) ?? [];

      const nextSlots: CollectionSlot[] = items.map((item) => {
        const ownedRows = owned.filter((row) => row.item_id === item.id);
        const acquiredAt = ownedRows.length
          ? ownedRows.reduce((earliest, row) => (row.acquired_at < earliest ? row.acquired_at : earliest), ownedRows[0].acquired_at)
          : null;
        return {
          item,
          owned: ownedRows.length > 0,
          ownedCount: ownedRows.length,
          acquiredAt,
          ownedColorCount: new Set(ownedRows.map((row) => row.color_hex).filter(Boolean)).size,
          totalColorCount: null,
        };
      });
      setSlots(nextSlots);

      // Newest first (7.1/7.3) -- this view is about the rhythm of
      // acquisitions over time, not "what shapes exist," so it never
      // groups or sorts by rarity.
      const nextMyItems: MyItemEntry[] = owned
        .slice()
        .sort((a, b) => (a.acquired_at < b.acquired_at ? 1 : -1))
        .flatMap((row) => {
          const item = itemsById.get(row.item_id);
          return item ? [{ id: row.id, item, acquiredAt: row.acquired_at }] : [];
        });
      setMyItems(nextMyItems);

      const character = profileResult.data?.main_character as CharacterName | undefined;
      if (character && (CHARACTER_NAMES as readonly string[]).includes(character)) setMainCharacter(character);
      setAmazeCount(profileResult.data?.amaze_count ?? 0);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, userLoading]);

  if (userLoading) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-24">
        <p className="text-[14px] text-muted">불러오는 중...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <h1 className="text-[20px] font-semibold">감투</h1>
        <p className="text-[14px] text-muted">로그인하면 모은 감투를 볼 수 있어요.</p>
        <button
          onClick={() => {
            signInWithGoogle(`${window.location.origin}/collection`).catch((error) => console.error(error));
          }}
          className="flex h-12 items-center rounded-sm bg-primary px-6 text-[16px] font-medium text-on-primary"
        >
          구글로 로그인
        </button>
      </main>
    );
  }

  if (slots === null || myItems === null) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-24">
        <p className="text-[14px] text-muted">불러오는 중...</p>
      </main>
    );
  }

  const ownedCount = slots.filter((slot) => slot.owned).length;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="mb-4 flex items-baseline justify-between">
        <h1 className="text-[20px] font-semibold">감투</h1>
        <p className="text-[13px] text-muted">감탄 누적 {amazeCount ?? 0}회</p>
      </div>

      <div className="mb-6 flex w-fit gap-1 rounded-md border border-hairline p-1">
        <button
          type="button"
          onClick={() => setView("collection")}
          className={`h-9 rounded-sm px-4 text-[14px] font-medium transition-colors ${
            view === "collection" ? "bg-ink text-on-primary" : "text-muted"
          }`}
        >
          도감
        </button>
        <button
          type="button"
          onClick={() => setView("mine")}
          className={`h-9 rounded-sm px-4 text-[14px] font-medium transition-colors ${
            view === "mine" ? "bg-ink text-on-primary" : "text-muted"
          }`}
        >
          내 감투
        </button>
      </div>

      {view === "collection" ? (
        <>
          <p className="mb-4 text-[14px] text-muted">
            {ownedCount} / {slots.length}
          </p>
          <div className="grid grid-cols-4 gap-4 sm:grid-cols-5 lg:grid-cols-6">
            {slots.map((slot) => (
              <button
                key={slot.item.id}
                onClick={() => setSelected(slot)}
                className="flex flex-col items-center gap-1 rounded-md border border-hairline p-2"
              >
                <HatIcon svgPath={slot.item.svg_path} silhouette={!slot.owned} className="w-20" />
                <span className="text-[12px] text-muted">
                  {slot.owned ? slot.item.name : "???"}
                  {slot.owned && slot.ownedCount > 1 && ` ×${slot.ownedCount}`}
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="mb-4 text-[15px] font-semibold text-ink">총 {myItems.length}개 보유</p>
          {myItems.length === 0 ? (
            <p className="text-[14px] text-muted">아직 모은 감투가 없어요.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {myItems.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 rounded-md border border-hairline p-2"
                >
                  <HatIcon svgPath={entry.item.svg_path} className="w-12 shrink-0" />
                  <div className="flex-1">
                    <p className="text-[14px] font-medium text-ink">{entry.item.name}</p>
                    <p className="text-[12px] text-muted">
                      {RARITY_DISPLAY_NAMES[entry.item.rarity] ?? entry.item.rarity}
                    </p>
                  </div>
                  <p className="text-[12px] text-muted">{formatAcquiredAt(entry.acquiredAt)}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {selected && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50 px-6"
          onClick={() => setSelected(null)}
        >
          <div
            className="flex w-full max-w-sm flex-col items-center gap-3 rounded-lg bg-canvas p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <CharacterWithHat
              character={mainCharacter}
              hatSvgPath={selected.item.svg_path}
              hatSilhouette={!selected.owned}
              className="w-40"
            />
            <p className="text-[16px] font-semibold text-ink">{selected.owned ? selected.item.name : "???"}</p>
            <p className="text-[13px] text-muted">{RARITY_DISPLAY_NAMES[selected.item.rarity] ?? selected.item.rarity}</p>
            {selected.owned && selected.acquiredAt && (
              <p className="text-[13px] text-muted">{formatAcquiredAt(selected.acquiredAt)} 최초 획득</p>
            )}
            <button onClick={() => setSelected(null)} className="mt-2 text-[14px] text-muted underline">
              닫기
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
