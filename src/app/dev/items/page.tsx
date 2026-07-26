"use client";

import { CHARACTER_NAMES, CHARACTER_DISPLAY_NAMES } from "@/lib/characters/constants";
import { CharacterWithHat } from "@/components/character-with-hat";
import { HatIcon } from "@/components/hat-icon";

const CROWN_SVG_PATH = "/hats/hat_crown.svg";

const ALL_HATS = [
  { path: "/hats/hat_crown.svg", label: "왕관" },
  { path: "/hats/hat_jokduri.svg", label: "족두리" },
  { path: "/hats/hat_cap.svg", label: "야구모자" },
  { path: "/hats/hat_straw.svg", label: "밀짚모자" },
  { path: "/hats/hat_bucket.svg", label: "버킷햇" },
  { path: "/hats/hat_party.svg", label: "파티 고깔" },
];

/** Item-system Phase 1 step (2) check: does layering a hat SVG on top of
 * each character SVG (same shared viewBox, see CharacterWithHat) actually
 * work? Shows all 5, not just the bear, since a per-character SVG bug
 * would only show up on some of them. Also renders each pair again at 80px
 * (docs/gamtoo-item-system.md 7.2's silhouette-legibility size) since
 * that's basically free to check here too. */
export default function ItemsDevPage() {
  return (
    <main className="flex flex-1 flex-col gap-10 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold">캐릭터 + 모자 합성 테스트</h1>
        <p className="mt-1 text-sm text-zinc-500">캐릭터 5종 전부 왕관을 씌워서 확인</p>
      </div>

      <section>
        <h2 className="mb-4 text-sm font-medium text-zinc-500">기본 크기</h2>
        <div className="flex flex-wrap gap-8">
          {CHARACTER_NAMES.map((name) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <CharacterWithHat character={name} hatSvgPath={CROWN_SVG_PATH} className="w-40" />
              <span className="text-sm text-zinc-600">{CHARACTER_DISPLAY_NAMES[name]}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium text-zinc-500">80px (도감 그리드 크기)</h2>
        <div className="flex flex-wrap gap-6 rounded-md border border-dashed border-zinc-300 p-4">
          {CHARACTER_NAMES.map((name) => (
            <CharacterWithHat key={name} character={name} hatSvgPath={CROWN_SVG_PATH} className="w-20" />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium text-zinc-500">
          도감 그리드: 모자 단독 80px (색상 있음 vs 실루엣)
        </h2>
        <div className="flex flex-wrap gap-6 rounded-md border border-dashed border-zinc-300 p-4">
          <div className="flex flex-col items-center gap-1">
            <HatIcon svgPath={CROWN_SVG_PATH} className="w-20" />
            <span className="text-xs text-zinc-500">획득함</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <HatIcon svgPath={CROWN_SVG_PATH} silhouette className="w-20" />
            <span className="text-xs text-zinc-500">미획득 (실루엣)</span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium text-zinc-500">
          6종 전체 80px — 색상 있음 (common 4종은 팔레트 미정, SVG 폴백 색)
        </h2>
        <div className="flex flex-wrap gap-6 rounded-md border border-dashed border-zinc-300 p-4">
          {ALL_HATS.map((hat) => (
            <div key={hat.path} className="flex flex-col items-center gap-1">
              <HatIcon svgPath={hat.path} className="w-20" />
              <span className="text-xs text-zinc-500">{hat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium text-zinc-500">6종 전체 80px — 실루엣 (미획득 상태)</h2>
        <div className="flex flex-wrap gap-6 rounded-md border border-dashed border-zinc-300 p-4">
          {ALL_HATS.map((hat) => (
            <div key={hat.path} className="flex flex-col items-center gap-1">
              <HatIcon svgPath={hat.path} silhouette className="w-20" />
              <span className="text-xs text-zinc-500">{hat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium text-zinc-500">
          야구모자 vs 버킷햇 단독 비교 (헷갈리는지 확인용)
        </h2>
        <div className="flex flex-wrap gap-6 rounded-md border border-dashed border-zinc-300 p-4">
          {["/hats/hat_cap.svg", "/hats/hat_bucket.svg"].map((path) => (
            <div key={path} className="flex gap-3">
              <HatIcon svgPath={path} className="w-20" />
              <HatIcon svgPath={path} silhouette className="w-20" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
