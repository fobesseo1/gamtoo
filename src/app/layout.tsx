import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { StartupDiagnostics } from "@/components/startup-diagnostics";
import "./globals.css";

export const metadata: Metadata = {
  title: "감투",
  description: "하루의 작은 감탄을 기록하고 포스터로 남기는 앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-canvas text-ink">
        <StartupDiagnostics />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
