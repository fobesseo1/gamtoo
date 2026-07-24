"use client";

import { useEffect, useState } from "react";
import type { CharacterName } from "@/lib/characters/constants";

export const MESSAGES = [
  "모찌가 배경을 조물조물 떼어내는 중이에요",
  "판다가 가위질을 연습하는 중이에요",
  "물범이 지느러미로 살살 오려내는 중이에요",
  "비숑이 배경 끝을 살짝 물어보는 중이에요",
  "아기곰이 살금살금 배경을 걷어내는 중이에요",
  "픽셀을 한 땀 한 땀 살펴보는 중이에요",
  "배경아 안녕, 인사하고 오는 중이에요",
  "조금만 더요, 거의 다 됐어요",
];

/** Which single character each message calls out by name, index-matched to
 * MESSAGES — null for the generic messages that don't mention anyone
 * specific, where CharacterLoadingAnimation shows the whole group instead. */
export const MESSAGE_CHARACTERS: (CharacterName | null)[] = [
  "mochi",
  "panda",
  "seal",
  "bichon",
  "bear",
  null,
  null,
  null,
];

export const ROTATE_INTERVAL_MS = 2000;

/** Owns the rotation timer so a parent can drive both the message text and
 * a character animation off the same index — two independent timers would
 * drift out of sync with each other. */
export function useLoadingMessageIndex() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % MESSAGES.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return index;
}

interface BgRemovalLoadingMessageProps {
  index: number;
}

/** Purely presentational — the caller owns the rotation via
 * useLoadingMessageIndex(), so a sibling (e.g. CharacterLoadingAnimation)
 * can stay in sync off the same index instead of running its own timer. */
export function BgRemovalLoadingMessage({ index }: BgRemovalLoadingMessageProps) {
  return <p className="text-[14px] text-body">{MESSAGES[index]}</p>;
}
