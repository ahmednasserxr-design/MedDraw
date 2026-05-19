"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Users } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ChatPanel } from "@/components/game/ChatPanel";
import { GameCanvas } from "@/components/game/GameCanvas";
import { PlayerList } from "@/components/game/PlayerList";
import { RoundTimer } from "@/components/game/RoundTimer";
import { WordHint } from "@/components/game/WordHint";
import { WaitingRoom } from "@/components/game/WaitingRoom";
import { EndScreen } from "@/components/game/EndScreen";
import { VoiceControls } from "@/components/game/VoiceControls";
import { useAuth } from "@/hooks/useAuth";
import { useGameState } from "@/hooks/useGameState";
import { useSocket } from "@/hooks/useSocket";
import { useVoice } from "@/hooks/useVoice";

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();
  const { socket, connected } = useSocket();
  const { nickname, userId, isGuest, setGuestNickname, loading } = useAuth();
  const api = useGameState(roomId);
  const voice = useVoice(api.socket);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [tempNick, setTempNick] = useState("");
  const [watching, setWatching] = useState(false);

  // Clear watching state when game returns to waiting
  useEffect(() => {
    if (api.snapshot?.status === "waiting") setWatching(false);
  }, [api.snapshot?.status]);

  // Attempt auto-join when connected and we have a nickname
  useEffect(() => {
    if (loading) return;
    if (!connected) return;
    if (joined) return;
    if (pendingApproval) return;
    if (!nickname) return;
    if (api.snapshot && api.snapshot.players.some((p) => p.socketId === socket.id)) {
      setJoined(true);
      setPendingApproval(false);
      return;
    }
    setJoining(true);
    socket.emit(
      "room:join",
      { roomId, nickname, userId: userId ?? undefined },
      (res) => {
        setJoining(false);
        if (!res.ok) {
          toast.error(res.error);
          router.push("/");
          return;
        }
        if (res.pending) {
          setPendingApproval(true);
          toast.info("Waiting for host to approve your request…");
          return;
        }
        setJoined(true);
      },
    );
  }, [loading, connected, nickname, joined, pendingApproval, api.snapshot, roomId, socket, userId, router]);

  const gameInProgress = api.snapshot?.status === "in_progress";

  // Warn before tab close / navigation away mid-game
  useEffect(() => {
    if (!gameInProgress) return;
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [gameInProgress]);

  const handleLobbyClick = useCallback(
    (e: React.MouseEvent) => {
      if (gameInProgress && !watching) {
        e.preventDefault();
        setWatching(true);
      }
    },
    [gameInProgress, watching],
  );

  // We intentionally don't emit room:leave on unmount — React strict-mode double
  // effects would leak-delete the room if the host is alone. Server cleans up on
  // socket disconnect; explicit leave happens via the "Back to lobby" link.

  if (loading || !connected) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center text-fg-muted">
          Connecting…
        </main>
      </>
    );
  }

  if (!nickname) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const n = tempNick.trim();
              if (!n) return;
              setGuestNickname(n);
            }}
            className="rounded-2xl border border-border bg-surface p-6 w-full max-w-sm space-y-3 animate-pop-in"
          >
            <h2 className="text-xl font-semibold">Pick a nickname</h2>
            <p className="text-fg-muted text-sm">
              You're joining a room. Choose a name your opponents will see.
            </p>
            <Input
              autoFocus
              value={tempNick}
              onChange={(e) => setTempNick(e.target.value.slice(0, 20))}
              placeholder="Dr. Strange"
              maxLength={20}
            />
            <Button type="submit" className="w-full" disabled={!tempNick.trim()}>
              Join room
            </Button>
          </form>
        </main>
      </>
    );
  }

  if (pendingApproval && !api.snapshot) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="rounded-2xl border border-border bg-surface p-8 text-center space-y-3 max-w-sm w-full animate-pop-in">
            <div className="mx-auto w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <Clock size={20} className="text-accent animate-pulse" />
            </div>
            <h2 className="text-lg font-semibold">Waiting for approval</h2>
            <p className="text-fg-muted text-sm">
              The host needs to accept your request before you can enter the room.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setPendingApproval(false);
                router.push("/");
              }}
            >
              Cancel
            </Button>
          </div>
        </main>
      </>
    );
  }

  if (joining || !api.snapshot) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center text-fg-muted">
          Entering room…
        </main>
      </>
    );
  }

  const status = api.snapshot.status;

  return (
    <>
      <Header />
      <main className="flex-1 mx-auto w-full max-w-[1600px] px-3 py-3 flex flex-col gap-3 min-h-0">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/"
            onClick={handleLobbyClick}
            className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg transition-colors duration-100"
          >
            <ArrowLeft size={14} /> Lobby
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-fg-muted">Round</span>{" "}
              <span className="font-semibold">
                {api.snapshot.currentRound}/{api.snapshot.totalRounds}
              </span>
            </div>
            <RoundTimer api={api} />
          </div>
        </div>

        {/* Aborted: not enough players */}
        {api.aborted && (
          <AbortedBanner message={api.aborted} />
        )}

        {status === "waiting" ? (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-4">
            <WaitingRoom api={api} />
            <div className="flex flex-col gap-2">
              <PlayerList api={api} voice={voice} />
              <VoiceControls voice={voice} />
            </div>
          </div>
        ) : watching ? (
          /* Player stepped back while game is in progress */
          <div className="rounded-2xl border border-border bg-surface p-8 flex flex-col items-center gap-4 text-center animate-pop-in">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
              <Users size={22} className="text-accent animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Game in progress</h2>
              <p className="text-fg-muted text-sm mt-1">
                {api.snapshot?.players.length ?? 0} players still playing. You'll be brought back when the round ends.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <PlayerList api={api} voice={voice} />
            </div>
            <Button variant="secondary" size="sm" onClick={() => { socket.emit("room:leave"); router.push("/"); }}>
              Leave room
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_280px] gap-3 flex-1 min-h-0">
            <div className="hidden md:flex flex-col gap-2">
              <PlayerList api={api} voice={voice} />
              <VoiceControls voice={voice} />
            </div>
            <div className="flex flex-col gap-3 min-h-0">
              <GameCanvas api={api} />
            </div>
            <div className="flex flex-col min-h-0 gap-2">
              <div className="md:hidden">
                <PlayerList api={api} voice={voice} />
              </div>
              <WordHint api={api} />
              <ChatPanel api={api} />
            </div>
          </div>
        )}

        <EndScreen api={api} />
      </main>
    </>
  );
}

function AbortedBanner({ message }: { message: string }) {
  const [countdown, setCountdown] = useState(5);
  useEffect(() => {
    const t = setInterval(() => setCountdown((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="rounded-xl border border-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 flex items-center justify-between gap-3 animate-slide-up">
      <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{message}</p>
      <span className="text-xs text-amber-600 dark:text-amber-400 shrink-0 tabular-nums">
        {countdown}s
      </span>
    </div>
  );
}
