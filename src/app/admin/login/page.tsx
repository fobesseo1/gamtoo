import { LoginForm } from "./login-form";

interface PageProps {
  searchParams: Promise<{ from?: string }>;
}

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const { from } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 px-6 py-24">
      <h1 className="text-[20px] font-semibold">관리자 로그인</h1>
      <LoginForm from={from ?? "/admin/templates"} />
    </main>
  );
}
