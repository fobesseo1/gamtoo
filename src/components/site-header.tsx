"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/make", label: "기록하기" },
  { href: "/archive", label: "보관함" },
  { href: "/profile", label: "내 캐릭터" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="flex h-16 items-center justify-between border-b border-hairline bg-canvas px-6">
      <Link href="/make" className="text-[20px] font-bold text-primary">
        감투
      </Link>
      <nav className="flex gap-6">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`text-[16px] font-semibold pb-1 ${
                active ? "text-ink border-b-2 border-ink" : "text-muted"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
