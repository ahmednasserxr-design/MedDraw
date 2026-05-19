"use client";

import { useEffect, useRef } from "react";
import { Timer } from "lucide-react";
import { playSound } from "@/lib/sounds";
import type { GameStateApi } from "@/hooks/useGameState";

export function RoundTimer({ api }: { api: GameStateApi }) {
  const lastTickRef = useRef<number | null>(null);

  useEffect(() => {
    if (api.secondsLeft == null || api.secondsLeft > 10) { lastTickRef.current = null; return; }
    if (lastTickRef.current === api.secondsLeft) return;
    lastTickRef.current = api.secondsLeft;
    playSound(api.secondsLeft <= 5 ? "timer-warning" : "timer-tick");
  }, [api.secondsLeft]);

  if (!api.turn || api.secondsLeft == null) return null;
  const pct = Math.max(0, Math.min(1, api.secondsLeft / api.turn.secondsPerTurn));
  const danger = api.secondsLeft <= 10;

  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <Timer size={14} className={danger ? "text-red-500" : "text-fg-muted"} />
      <div className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden">
        <div
          className={`h-full transition-all ${danger ? "bg-red-500" : "bg-accent"}`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <span
        className={`font-mono text-sm tabular-nums ${danger ? "text-red-500 font-semibold" : "text-fg"}`}
      >
        {api.secondsLeft}s
      </span>
    </div>
  );
}
