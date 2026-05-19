"use client";

import type { GameStateApi } from "@/hooks/useGameState";

export function TurnOverlay({ api }: { api: GameStateApi }) {
  // Countdown before game start
  if (api.countdown !== null && api.countdown > 0) {
    return (
      <Overlay>
        <div className="text-fg-muted text-sm uppercase tracking-wider">Starting in</div>
        <div className="text-7xl font-bold text-accent animate-pulse">{api.countdown}</div>
      </Overlay>
    );
  }

  // Turn end summary (brief)
  if (api.turnEnd && !api.ended) {
    return (
      <Overlay>
        <div className="text-fg-muted text-sm uppercase tracking-wider">The word was</div>
        <div className="text-4xl font-bold">{api.turnEnd.word}</div>
        <div className="text-fg-muted text-sm mt-1">Next turn starting…</div>
      </Overlay>
    );
  }

  return null;
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none animate-fade-in">
      <div className="bg-surface rounded-2xl px-10 py-8 text-center flex flex-col items-center gap-2 shadow-xl border border-border animate-pop-in">
        {children}
      </div>
    </div>
  );
}
