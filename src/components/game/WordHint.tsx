"use client";

import type { GameStateApi } from "@/hooks/useGameState";

export function WordHint({ api }: { api: GameStateApi }) {
  if (!api.turn) {
    if (api.snapshot?.status === "waiting") {
      return (
        <div className="rounded-xl border border-border bg-surface px-4 py-3 text-center text-fg-muted text-sm">
          Waiting for host to start the game…
        </div>
      );
    }
    return null;
  }

  const display = api.isDrawer
    ? api.turn.wordForDrawer ?? api.turn.wordMasked
    : api.turn.wordMasked;
  const letterCount = api.turn.wordForDrawer
    ? api.turn.wordForDrawer.replace(/\s/g, "").length
    : api.turn.wordMasked.replace(/[^_]/g, "").length;

  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wider text-fg-muted text-center">
        {api.isDrawer ? "You're drawing" : "Guess the word"}
      </div>
      <div className="font-mono text-lg tracking-[0.2em] font-bold text-center mt-0.5 break-all">
        {display}
      </div>
      <div className="text-[10px] text-fg-muted text-center">{letterCount} letters</div>
    </div>
  );
}
