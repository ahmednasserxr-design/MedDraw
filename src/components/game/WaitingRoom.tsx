"use client";

import { useState } from "react";
import { Check, Copy, Play, Share2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Label } from "@/components/ui/Label";
import { CategoryPicker } from "@/components/game/CategoryPicker";
import { countCategoryWords } from "@/lib/game/wordBank";
import { playSound } from "@/lib/sounds";
import type { GameStateApi } from "@/hooks/useGameState";
import type { WordCategory } from "@/types/game";

export function WaitingRoom({ api }: { api: GameStateApi }) {
  if (!api.snapshot || api.snapshot.status !== "waiting") return null;

  const enoughPlayers = api.snapshot.players.length >= 2;
  const pendingJoins = api.snapshot.pendingJoins ?? [];

  const [localCategories, setLocalCategories] = useState<WordCategory[]>(
    api.snapshot.selectedCategories ?? ["medicine-clinical"],
  );
  const [localSeconds, setLocalSeconds] = useState(
    api.snapshot.secondsPerTurn ?? 80,
  );
  const [localRounds, setLocalRounds] = useState(api.snapshot.totalRounds ?? 3);

  const wordCount = countCategoryWords(localCategories);
  const settingsDirty =
    JSON.stringify(localCategories.slice().sort()) !==
      JSON.stringify((api.snapshot.selectedCategories ?? []).slice().sort()) ||
    localSeconds !== (api.snapshot.secondsPerTurn ?? 80) ||
    localRounds !== api.snapshot.totalRounds;

  function copyCode() {
    playSound("click");
    navigator.clipboard.writeText(api.snapshot!.inviteCode);
    toast.success("Invite code copied");
  }
  function copyLink() {
    playSound("click");
    const url = `${window.location.origin}/room/${api.snapshot!.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Room link copied");
  }
  function startGame() {
    playSound("click-primary");
    if (settingsDirty) applySettings();
    api.socket.emit("game:start");
  }
  function approve(socketId: string) {
    playSound("click");
    api.socket.emit("room:approve_join", { socketId });
  }
  function reject(socketId: string) {
    playSound("click-danger");
    api.socket.emit("room:reject_join", { socketId });
  }
  function applySettings() {
    if (localCategories.length === 0) { toast.error("Select at least one topic"); return; }
    playSound("click");
    api.socket.emit("room:set_settings", {
      selectedCategories: localCategories,
      secondsPerTurn: localSeconds,
      totalRounds: localRounds,
    });
    toast.success("Settings saved");
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 space-y-5 animate-slide-up">
      {/* Room header */}
      <div>
        <Badge variant="muted">Waiting for players</Badge>
        <h2 className="text-2xl font-bold mt-2">{api.snapshot.name}</h2>
        <p className="text-fg-muted text-sm">
          {api.snapshot.players.length} of {api.snapshot.maxPlayers} players
        </p>
      </div>

      {!api.snapshot.isPrivate && (
        <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-fg-muted">
          Public room — players must be approved before joining
        </div>
      )}

      {/* Invite code */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-lg tracking-widest">
          {api.snapshot.inviteCode}
        </div>
        <Button variant="secondary" size="sm" onClick={copyCode}>
          <Copy size={14} /> Copy code
        </Button>
        <Button variant="secondary" size="sm" onClick={copyLink}>
          <Share2 size={14} /> Share link
        </Button>
      </div>

      {/* Start / waiting — above settings */}
      {api.isHost ? (
        <Button
          onClick={startGame}
          disabled={!enoughPlayers || localCategories.length === 0}
          size="lg"
          className="transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Play size={16} />
          {enoughPlayers ? "Start game" : "Need at least 2 players"}
        </Button>
      ) : (
        <p className="text-fg-muted text-sm italic">
          Waiting for host to start the game…
        </p>
      )}

      {/* Pending join requests — host only */}
      {api.isHost && pendingJoins.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
            Join requests
          </p>
          <ul className="space-y-1.5">
            {pendingJoins.map((p) => (
              <li
                key={p.socketId}
                className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 animate-slide-in-right"
              >
                <span className="flex-1 font-medium text-sm">{p.nickname}</span>
                <button
                  type="button"
                  onClick={() => approve(p.socketId)}
                  className="rounded-md p-1.5 text-green-600 hover:bg-green-500/10 transition-colors duration-100 cursor-pointer"
                  title="Approve"
                >
                  <Check size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => reject(p.socketId)}
                  className="rounded-md p-1.5 text-red-500 hover:bg-red-500/10 transition-colors duration-100 cursor-pointer"
                  title="Reject"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Game settings — editable by host, read-only for others */}
      <div className="space-y-4 rounded-xl border border-border bg-surface-2 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
          Game settings {!api.isHost && <span className="font-normal normal-case">(host only)</span>}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="wr-rounds">Rounds</Label>
            {api.isHost ? (
              <select
                id="wr-rounds"
                value={localRounds}
                onChange={(e) => setLocalRounds(Number(e.target.value))}
                className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm cursor-pointer"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-fg mt-1">{api.snapshot.totalRounds}</p>
            )}
          </div>
          <div>
            <Label htmlFor="wr-seconds">Seconds/turn</Label>
            {api.isHost ? (
              <select
                id="wr-seconds"
                value={localSeconds}
                onChange={(e) => setLocalSeconds(Number(e.target.value))}
                className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm cursor-pointer"
              >
                {[30, 45, 60, 80, 90, 120, 150, 180].map((n) => (
                  <option key={n} value={n}>{n}s</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-fg mt-1">{api.snapshot.secondsPerTurn}s</p>
            )}
          </div>
        </div>

        <div>
          <Label>
            Topics{" "}
            <span className="text-fg-muted font-normal">
              ({wordCount} words)
            </span>
          </Label>
          {api.isHost ? (
            <CategoryPicker
              selected={localCategories}
              onChange={setLocalCategories}
            />
          ) : (
            <div className="flex flex-wrap gap-2 mt-1.5">
              {(api.snapshot.selectedCategories ?? []).map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-fg-muted"
                >
                  {cat.replace(/-/g, " ")}
                </span>
              ))}
            </div>
          )}
        </div>

        {api.isHost && settingsDirty && (
          <Button variant="secondary" size="sm" onClick={applySettings}>
            Save settings
          </Button>
        )}
      </div>

    </div>
  );
}
