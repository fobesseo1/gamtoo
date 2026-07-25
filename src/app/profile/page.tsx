"use client";

import { useEffect, useState } from "react";
import { useSupabaseUser, signInWithGoogle } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";
import { CHARACTER_NAMES, CHARACTER_DISPLAY_NAMES, type CharacterName } from "@/lib/characters/constants";
import { InlineSvgContent } from "@/components/inline-svg-content";

export default function ProfilePage() {
  const { user, loading: userLoading } = useSupabaseUser();
  const [mainCharacter, setMainCharacter] = useState<CharacterName | null>(null);
  const [amazeCount, setAmazeCount] = useState<number | null>(null);
  const [saving, setSaving] = useState<CharacterName | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userLoading || !user) return;
    supabase
      .from("profiles")
      .select("main_character, amaze_count")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
          return;
        }
        setMainCharacter((data?.main_character as CharacterName | undefined) ?? "bear");
        setAmazeCount(data?.amaze_count ?? 0);
      });
  }, [user, userLoading]);

  const handleSelect = async (name: CharacterName) => {
    if (!user || saving) return;
    setSaving(name);
    setError(null);
    // Upsert, not update -- a profiles row should always exist by the time
    // someone reaches this page (auto-created on first login, see
    // supabase-setup.sql's handle_new_user trigger), but this is cheap
    // insurance against that row somehow not being there yet.
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, main_character: name }, { onConflict: "id" });
    setSaving(null);
    if (error) {
      setError("저장하는 중 문제가 생겼어요. 다시 시도해주세요.");
      return;
    }
    setMainCharacter(name);
  };

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
        <h1 className="text-[20px] font-semibold">내 캐릭터</h1>
        <p className="text-[14px] text-muted">로그인하면 대표 캐릭터를 고를 수 있어요.</p>
        <button
          onClick={() => {
            signInWithGoogle(`${window.location.origin}/profile`).catch((err) => console.error(err));
          }}
          className="flex h-12 items-center rounded-sm bg-primary px-6 text-[16px] font-medium text-on-primary"
        >
          구글로 로그인
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-10">
      <h1 className="mb-2 text-[20px] font-semibold">내 캐릭터</h1>
      <p className="text-[14px] text-muted">대표 캐릭터는 언제든 바꿀 수 있어요.</p>
      <p className="mb-6 text-[13px] text-muted">감탄 누적 {amazeCount ?? 0}회</p>

      {error && <p className="mb-4 text-[14px] text-error">{error}</p>}

      <div className="grid grid-cols-3 gap-4">
        {CHARACTER_NAMES.map((name) => (
          <button
            key={name}
            onClick={() => handleSelect(name)}
            disabled={saving !== null}
            className={`flex flex-col items-center gap-2 rounded-md border p-3 transition-colors disabled:opacity-60 ${
              mainCharacter === name ? "border-primary bg-primary/5" : "border-hairline"
            }`}
          >
            <svg viewBox="0 -100 270 370" className="w-full">
              <InlineSvgContent src={`/characters/char_${name}.svg`} />
            </svg>
            <span className="text-[13px] font-medium text-ink">
              {CHARACTER_DISPLAY_NAMES[name]}
              {saving === name && " ..."}
            </span>
          </button>
        ))}
      </div>
    </main>
  );
}
