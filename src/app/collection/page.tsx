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

// One grid cell = one item *shape*, not one item+color combo -- matches
// docs/gamtoo-item-system.md 7.1's planned 2-tier structure (a cell will
// later expand into color sub-slots, "비니 — 보유 5색 / 전체 14색"). Phase 1
// has no colorable items yet, so ownedColorCount/totalColorCount aren't
// rendered anywhere yet, but the shape is here so that UI can be added
// later without restructuring this page.
interface CollectionSlot {
  item: ItemRow;
  owned: boolean;
  acquiredAt: string | null;
  ownedColorCount: number;
  totalColorCount: number | null;
}

function formatDisplayDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function CollectionPage() {
  const { user, loading: userLoading } = useSupabaseUser();
  const [slots, setSlots] = useState<CollectionSlot[] | null>(null);
  const [mainCharacter, setMainCharacter] = useState<CharacterName>("bear");
  const [selected, setSelected] = useState<CollectionSlot | null>(null);

  useEffect(() => {
    if (userLoading || !user) return;
    let cancelled = false;

    (async () => {
      const [itemsResult, ownedResult, profileResult] = await Promise.all([
        supabase.from("items").select("*").order("sort_order", { ascending: true }),
        supabase.from("user_items").select("item_id, color_hex, acquired_at").eq("user_id", user.id),
        supabase.from("profiles").select("main_character").eq("id", user.id).maybeSingle(),
      ]);
      if (cancelled) return;

      const items = (itemsResult.data as ItemRow[] | null) ?? [];
      const owned = ownedResult.data ?? [];

      const nextSlots: CollectionSlot[] = items.map((item) => {
        const ownedRows = owned.filter((row) => row.item_id === item.id);
        const acquiredAt = ownedRows.length
          ? ownedRows.reduce((earliest, row) => (row.acquired_at < earliest ? row.acquired_at : earliest), ownedRows[0].acquired_at)
          : null;
        return {
          item,
          owned: ownedRows.length > 0,
          acquiredAt,
          ownedColorCount: new Set(ownedRows.map((row) => row.color_hex).filter(Boolean)).size,
          totalColorCount: null,
        };
      });

      setSlots(nextSlots);
      const character = profileResult.data?.main_character as CharacterName | undefined;
      if (character && (CHARACTER_NAMES as readonly string[]).includes(character)) setMainCharacter(character);
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
        <h1 className="text-[20px] font-semibold">도감</h1>
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

  if (slots === null) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-24">
        <p className="text-[14px] text-muted">불러오는 중...</p>
      </main>
    );
  }

  const ownedCount = slots.filter((slot) => slot.owned).length;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[20px] font-semibold">도감</h1>
        <p className="text-[14px] text-muted">
          {ownedCount} / {slots.length}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 sm:grid-cols-5 lg:grid-cols-6">
        {slots.map((slot) => (
          <button
            key={slot.item.id}
            onClick={() => setSelected(slot)}
            className="flex flex-col items-center gap-1 rounded-md border border-hairline p-2"
          >
            <HatIcon svgPath={slot.item.svg_path} silhouette={!slot.owned} className="w-20" />
            <span className="text-[12px] text-muted">{slot.owned ? slot.item.name : "???"}</span>
          </button>
        ))}
      </div>

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
              <p className="text-[13px] text-muted">{formatDisplayDate(selected.acquiredAt)} 획득</p>
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
