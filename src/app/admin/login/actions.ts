"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, checkAdminPassword, getAdminSessionToken } from "@/lib/admin-auth";

export interface LoginState {
  error?: string;
}

const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  const from = String(formData.get("from") ?? "/admin/templates");

  if (!checkAdminPassword(password)) {
    return { error: "비밀번호가 틀렸어요." };
  }

  const token = getAdminSessionToken();
  if (!token) {
    return { error: "서버에 ADMIN_PASSWORD가 설정되어 있지 않아요." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS_SECONDS,
  });

  redirect(from.startsWith("/admin") ? from : "/admin/templates");
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  redirect("/admin/login");
}
