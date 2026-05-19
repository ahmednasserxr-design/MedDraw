"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Sun, Brush } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const { theme, setTheme } = useTheme();
  const { nickname, isGuest, loading } = useAuth();

  return (
    <header className="border-b border-border bg-surface/70 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto max-w-6xl flex items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-fg">
            <Brush size={16} />
          </span>
          <span>MedDraw</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/leaderboard"
            className="text-sm text-fg-muted hover:text-fg transition-colors"
          >
            Leaderboard
          </Link>
          {!loading && (
            <span className="hidden sm:inline text-xs text-fg-muted">
              {nickname ? `${nickname}${isGuest ? " (guest)" : ""}` : "no nickname"}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
        </nav>
      </div>
    </header>
  );
}
