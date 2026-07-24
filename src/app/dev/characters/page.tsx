"use client";

import { useState } from "react";
import { MESSAGES } from "@/components/bg-removal-loading-message";
import { CharacterLoadingAnimation } from "@/components/character-loading-animation";

export default function CharactersDevPage() {
  const [messageIndex, setMessageIndex] = useState(0);

  return (
    <main className="flex flex-1 flex-col gap-4 px-6 py-10">
      <h1 className="text-2xl font-semibold">캐릭터 로딩 애니메이션 테스트</h1>
      <div className="flex flex-wrap gap-2">
        {MESSAGES.map((message, i) => (
          <button
            key={message}
            onClick={() => setMessageIndex(i)}
            className={`rounded border px-3 py-2 text-xs ${
              i === messageIndex ? "border-ink bg-ink text-white" : "border-zinc-300"
            }`}
          >
            {i}: {message}
          </button>
        ))}
      </div>

      <div className="relative mx-auto mt-16 h-[300px] w-56 rounded-lg border border-dashed border-zinc-300">
        <CharacterLoadingAnimation messageIndex={messageIndex} />
      </div>
    </main>
  );
}
