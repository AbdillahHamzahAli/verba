"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Database02Icon,
  Settings01Icon,
  ServerStack01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/connections",
    label: "Connections",
    icon: ServerStack01Icon,
  },
  {
    href: "/setup",
    label: "Settings",
    icon: Settings01Icon,
  },
];

export function Navbar() {
  const pathname = usePathname();

  // Hide navbar on chat pages — chat has its own header
  if (pathname.startsWith("/chat")) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-card/70 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/connections" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
            <HugeiconsIcon
              icon={Database02Icon}
              className="w-4 h-4 text-primary"
            />
          </div>
          <span className="font-semibold text-sm tracking-tight">Verba</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all",
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <HugeiconsIcon icon={icon} className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
