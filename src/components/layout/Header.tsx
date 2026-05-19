"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Sun, Brush, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { nickname, isGuest, loading, setGuestNickname } = useAuth();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    setDraft(nickname);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function save() {
    const n = draft.trim();
    if (n) setGuestNickname(n);
    setEditing(false);
  }

  function cancel() {
    setEditing(false);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") save();
    if (e.key === "Escape") cancel();
  }

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
          {!loading && isGuest && (
            editing ? (
              <div className="hidden sm:flex items-center gap-1">
                <Input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.slice(0, 20))}
                  onKeyDown={onKey}
                  maxLength={20}
                  className="h-7 text-xs w-32 px-2"
                />
                <button type="button" onClick={save} title="Save" className="text-green-500 hover:text-green-400">
                  <Check size={14} />
                </button>
                <button type="button" onClick={cancel} title="Cancel" className="text-fg-muted hover:text-fg">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startEdit}
                title="Edit nickname"
                className="hidden sm:inline-flex items-center gap-1 text-xs text-fg-muted hover:text-fg transition-colors group"
              >
                <span>{nickname || "no nickname"}{isGuest ? " (guest)" : ""}</span>
                <Pencil size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )
          )}
          {!loading && !isGuest && nickname && (
            <span className="hidden sm:inline text-xs text-fg-muted">{nickname}</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {mounted ? (theme === "dark" ? <Sun size={16} /> : <Moon size={16} />) : <Moon size={16} />}
          </Button>
        </nav>
      </div>
    </header>
  );
}
