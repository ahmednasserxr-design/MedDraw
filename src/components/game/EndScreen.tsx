"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { playSound } from "@/lib/sounds";
import type { GameStateApi } from "@/hooks/useGameState";

export function EndScreen({ api }: { api: GameStateApi }) {
  if (!api.ended) return null;
  const [voting, setVoting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const router = useRouter();

  const top = api.ended.finalScores.slice(0, 5);
  const rematch = api.rematch;
  const hasVoted = voting;

  function voteRematch() {
    playSound("rematch-vote");
    setVoting(true);
    api.socket.emit("game:vote_rematch");
  }

  function leaveToLobby() {
    playSound("click");
    setLeaving(true);
    api.socket.emit("room:leave");
    router.push("/");
  }

  const pct = rematch ? Math.round(((30 - rematch.countdown) / 30) * 100) : 0;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-2xl border border-border max-w-md w-full p-6 shadow-2xl animate-pop-in space-y-5">

        {/* Title */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="text-amber-500" size={20} />
            <h2 className="text-xl font-bold">Game over</h2>
          </div>
          <p className="text-fg-muted text-sm">Final standings</p>
        </div>

        {/* Leaderboard */}
        <ol className="space-y-1.5">
          {top.map((s, i) => (
            <li
              key={s.socketId}
              className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                i === 0
                  ? "bg-amber-100 dark:bg-amber-900/30 border border-amber-300"
                  : "bg-surface-2"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono w-5 text-fg-muted">{i + 1}</span>
                <span className="font-medium">{s.nickname}</span>
              </div>
              <span className="font-mono font-semibold tabular-nums">{s.score}</span>
            </li>
          ))}
        </ol>

        {/* Rematch section */}
        {rematch && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-fg-muted">
                {rematch.votes}/{rematch.required} players want a rematch
              </span>
              <span className="font-mono text-fg-muted tabular-nums">
                {rematch.countdown}s
              </span>
            </div>
            {/* Countdown bar */}
            <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-1000 ease-linear"
                style={{ width: `${100 - pct}%` }}
              />
            </div>
            {!hasVoted ? (
              <Button
                onClick={voteRematch}
                className="w-full transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
              >
                Play again ({rematch.votes}/{rematch.required})
              </Button>
            ) : (
              <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface-2 py-2.5 text-sm text-fg-muted">
                <Loader2 size={14} className="animate-spin" />
                Waiting for others… ({rematch.votes}/{rematch.required})
              </div>
            )}
          </div>
        )}

        {/* Leave button */}
        <Button
          variant="secondary"
          className="w-full"
          onClick={leaveToLobby}
          disabled={leaving}
        >
          {leaving ? <><Loader2 size={14} className="animate-spin" /> Leaving…</> : "Back to lobby"}
        </Button>
      </div>
    </div>
  );
}
