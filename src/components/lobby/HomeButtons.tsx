"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { playSound } from "@/lib/sounds";
import { useAuth } from "@/hooks/useAuth";

export function HomeButtons() {
  const { nickname, setGuestNickname, loading } = useAuth();
  const [draft, setDraft] = useState("");

  function saveNickname(e: React.FormEvent) {
    e.preventDefault();
    const n = draft.trim();
    if (!n) return;
    playSound("success");
    setGuestNickname(n);
  }

  if (loading) return null;

  if (!nickname) {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-sm animate-pop-in">
        <form onSubmit={saveNickname} className="w-full space-y-3">
          <p className="text-fg-muted text-sm text-center">
            Pick a nickname to get started
          </p>
          <div className="flex gap-2">
            <Input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 20))}
              placeholder="Dr. Strange"
              maxLength={20}
              className="flex-1"
            />
            <Button type="submit" disabled={!draft.trim()}>
              <ArrowRight size={16} />
            </Button>
          </div>
        </form>
        <div className="flex gap-3 opacity-40 pointer-events-none select-none">
          <Button size="lg" className="gap-2 px-7 whitespace-nowrap">
            <Plus size={18} /> Create room
          </Button>
          <Button variant="secondary" size="lg" className="gap-2 px-7 whitespace-nowrap">
            <Search size={18} /> Join a room
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <Link href="/room/new">
        <Button
          size="lg"
          className="gap-2 px-7 transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] whitespace-nowrap"
          onClick={() => playSound("click-primary")}
        >
          <Plus size={18} /> Create room
        </Button>
      </Link>
      <Link href="/rooms">
        <Button
          variant="secondary"
          size="lg"
          className="gap-2 px-7 transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] whitespace-nowrap"
          onClick={() => playSound("click")}
        >
          <Search size={18} /> Join a room
        </Button>
      </Link>
    </div>
  );
}
