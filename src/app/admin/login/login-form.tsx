"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const INITIAL_STATE: LoginState = {};

export function LoginForm({ from }: { from: string }) {
  const [state, formAction, pending] = useActionState(login, INITIAL_STATE);

  return (
    <form action={formAction} className="flex w-full max-w-xs flex-col gap-3">
      <input type="hidden" name="from" value={from} />
      <input
        type="password"
        name="password"
        placeholder="관리자 비밀번호"
        autoFocus
        required
        className="w-full rounded-sm border border-hairline px-3 py-3 text-[16px] outline-none focus:border-2 focus:border-ink"
      />
      {state.error && <p className="text-[14px] text-error">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-sm bg-primary text-[16px] font-medium text-on-primary disabled:opacity-50"
      >
        {pending ? "확인하는 중..." : "입장하기"}
      </button>
    </form>
  );
}
