"use client";

import { Shuffle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { playSound } from "@/lib/sounds";
import type { GameStateApi } from "@/hooks/useGameState";

export function WordChoiceOverlay({ api }: { api: GameStateApi }) {
  if (!api.choosing) return null;

  if (!api.isChoosingDrawer) {
    return (
      <Overlay>
        <div className="text-fg-muted text-sm uppercase tracking-wider">
          Round {api.choosing.round}
        </div>
        <div className="text-2xl font-bold">
          {api.choosing.drawerNickname} is choosing a word…
        </div>
        <div className="mt-2 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-accent animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </Overlay>
    );
  }

  const words = api.choosing.words ?? [];

  function pick(word: string) {
    playSound("word-chosen");
    api.socket.emit("game:choose_word", { word });
  }
  function requestMore() {
    playSound("shuffle");
    api.socket.emit("game:more_choices");
  }

  return (
    <Overlay>
      <div className="text-fg-muted text-sm uppercase tracking-wider">
        Round {api.choosing.round} · your turn
      </div>
      <div className="text-2xl font-bold mb-2">Choose a word to draw</div>
      {words.length === 0 ? (
        <div className="text-fg-muted text-sm">Loading options…</div>
      ) : (
        <div className="grid grid-cols-3 gap-3 w-full max-w-2xl">
          {words.map((w, i) => (
            <button
              key={w}
              type="button"
              onClick={() => pick(w)}
              style={{ animationDelay: `${i * 60}ms` }}
              className="h-20 w-full rounded-xl border border-border bg-surface-2 hover:border-accent hover:bg-accent/10 active:scale-95 px-3 py-2 font-mono text-base font-semibold capitalize transition-all duration-150 animate-pop-in hover:scale-105 flex items-center justify-center text-center leading-tight overflow-hidden"
            >
              <span className="line-clamp-2">{w}</span>
            </button>
          ))}
        </div>
      )}
      {words.length > 0 && (
        <Button variant="ghost" size="sm" onClick={requestMore} className="mt-3 gap-1.5">
          <Shuffle size={13} /> Shuffle options
        </Button>
      )}
    </Overlay>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface rounded-2xl px-8 py-6 text-center flex flex-col items-center gap-2 shadow-2xl border border-border max-w-3xl w-full mx-4 pointer-events-auto animate-slide-up">
        {children}
      </div>
    </div>
  );
}
