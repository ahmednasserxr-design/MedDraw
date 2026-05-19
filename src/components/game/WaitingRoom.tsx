"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Play, Share2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Label } from "@/components/ui/Label";
import { DifficultyPicker } from "@/components/game/DifficultyPicker";
import { CategoryPicker } from "@/components/game/CategoryPicker";
import { countDifficultyWords, DIFFICULTY_META, CATEGORY_META } from "@/lib/game/wordBank";
import { playSound } from "@/lib/sounds";
import type { GameStateApi } from "@/hooks/useGameState";
import type { Difficulty, WordCategory } from "@/types/game";

const ALL_DIFF: Difficulty[] = ["easy", "medium", "hard"];
const ALL_CAT: WordCategory[] = [
  "biology", "chemistry", "physics", "maths",
  "medicine-academic", "medicine-clinical",
  "engineering-basic", "engineering-advanced",
];

export function WaitingRoom({ api }: { api: GameStateApi }) {
  // Live values from the snapshot — used directly by non-hosts so they always
  // reflect what the host just toggled.
  const snapshotDiff = api.snapshot?.selectedDifficulties?.length
    ? api.snapshot.selectedDifficulties
    : ALL_DIFF;
  const snapshotCat = api.snapshot?.selectedCategories ?? [];
  const snapshotSeconds = api.snapshot?.secondsPerTurn ?? 80;
  const snapshotRounds = api.snapshot?.totalRounds ?? 3;

  const [localDiff, setLocalDiff] = useState<Difficulty[]>(snapshotDiff);
  const [localCat, setLocalCat] = useState<WordCategory[]>(snapshotCat);
  const [localSeconds, setLocalSeconds] = useState(snapshotSeconds);
  const [localRounds, setLocalRounds] = useState(snapshotRounds);

  useEffect(() => {
    if (!api.isHost) {
      setLocalDiff(snapshotDiff);
      setLocalCat(snapshotCat);
      setLocalSeconds(snapshotSeconds);
      setLocalRounds(snapshotRounds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api.isHost, snapshotDiff.join("|"), snapshotCat.join("|"), snapshotSeconds, snapshotRounds]);

  if (!api.snapshot || api.snapshot.status !== "waiting") return null;

  const enoughPlayers = api.snapshot.players.length >= 2;
  const pendingJoins = api.snapshot.pendingJoins ?? [];

  // Host emits every change immediately so non-hosts see it live; no Save button.
  function pushSettings(next: { diff?: Difficulty[]; cat?: WordCategory[]; seconds?: number; rounds?: number }) {
    api.socket.emit("room:set_settings", {
      ...(next.diff !== undefined ? { selectedDifficulties: next.diff } : {}),
      ...(next.cat !== undefined ? { selectedCategories: next.cat } : {}),
      ...(next.seconds !== undefined ? { secondsPerTurn: next.seconds } : {}),
      ...(next.rounds !== undefined ? { totalRounds: next.rounds } : {}),
    });
  }

  function changeDiff(next: Difficulty[]) {
    setLocalDiff(next);
    pushSettings({ diff: next });
  }
  function changeCat(next: WordCategory[]) {
    setLocalCat(next);
    pushSettings({ cat: next });
  }
  function changeSeconds(n: number) {
    setLocalSeconds(n);
    pushSettings({ seconds: n });
  }
  function changeRounds(n: number) {
    setLocalRounds(n);
    pushSettings({ rounds: n });
  }

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

  const displayDiff = api.isHost ? localDiff : snapshotDiff;
  const displayCat = api.isHost ? localCat : snapshotCat;
  const displaySeconds = api.isHost ? localSeconds : snapshotSeconds;
  const displayRounds = api.isHost ? localRounds : snapshotRounds;
  const wordCount = countDifficultyWords(displayDiff, displayCat);
  const canStart = enoughPlayers && displayCat.length > 0;

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

      {/* Start / waiting */}
      {api.isHost ? (
        <Button
          onClick={startGame}
          disabled={!canStart}
          size="lg"
          className="transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Play size={16} />
          {!enoughPlayers
            ? "Need at least 2 players"
            : displayCat.length === 0
              ? "Choose at least one topic"
              : "Start game"}
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

      {/* Game settings — host edits, everyone sees live */}
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
                value={displayRounds}
                onChange={(e) => changeRounds(Number(e.target.value))}
                className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm cursor-pointer"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-fg mt-1">{displayRounds}</p>
            )}
          </div>
          <div>
            <Label htmlFor="wr-seconds">Seconds/turn</Label>
            {api.isHost ? (
              <select
                id="wr-seconds"
                value={displaySeconds}
                onChange={(e) => changeSeconds(Number(e.target.value))}
                className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm cursor-pointer"
              >
                {[30, 45, 60, 80, 90, 120, 150, 180].map((n) => (
                  <option key={n} value={n}>{n}s</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-fg mt-1">{displaySeconds}s</p>
            )}
          </div>
        </div>

        <div>
          <Label>Difficulty</Label>
          <DifficultyPicker
            selected={displayDiff}
            onChange={api.isHost ? changeDiff : undefined}
            readOnly={!api.isHost}
          />
          {!api.isHost && (
            <p className="text-xs text-fg-muted mt-2 italic">
              {displayDiff.length === 3
                ? "All difficulties enabled"
                : `Only ${displayDiff.map((d) => DIFFICULTY_META[d].label).join(", ")}`}
            </p>
          )}
        </div>

        <div>
          <Label>
            Topics{" "}
            <span className="text-fg-muted font-normal">
              {displayCat.length === 0
                ? <span className="text-red-500 font-medium">— choose at least one</span>
                : `(${wordCount} words)`}
            </span>
          </Label>
          <CategoryPicker
            selected={displayCat}
            onChange={api.isHost ? changeCat : undefined}
            readOnly={!api.isHost}
          />
          {!api.isHost && (
            <p className="text-xs text-fg-muted mt-2 italic">
              {displayCat.length === 0
                ? "No topics selected"
                : displayCat.length === ALL_CAT.length
                  ? "All topics enabled"
                  : `Topics: ${displayCat.map((c) => CATEGORY_META[c].label).join(", ")}`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
