"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { playSound } from "@/lib/sounds";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/hooks/useAuth";
import type { PublicRoomSummary } from "@/types/game";

export function RoomCard({ room, flashKey }: { room: PublicRoomSummary; flashKey?: number }) {
  const router = useRouter();
  const { socket } = useSocket();
  const { nickname, userId, setGuestNickname } = useAuth();
  const [joining, setJoining] = useState(false);

  const isFull = room.playerCount >= room.maxPlayers;
  const isPlaying = room.status === "in_progress";

  function join() {
    const nick = (nickname || "").trim();
    if (!nick) {
      const entered = window.prompt("Enter your nickname:");
      if (!entered?.trim()) return;
      setGuestNickname(entered.trim());
    }
    playSound("click");
    setJoining(true);
    socket.emit(
      "room:join",
      { roomId: room.id, nickname: nick || "Player", userId: userId ?? undefined },
      (res) => {
        setJoining(false);
        if (!res.ok) { toast.error(res.error); return; }
        router.push(`/room/${room.id}`);
      },
    );
  }

  const difficulties = room.selectedDifficulties ?? [];
  const diffLabel = difficulties.length === 0 || difficulties.length === 3
    ? "All difficulties"
    : difficulties.map((d) => d[0].toUpperCase() + d.slice(1)).join(" · ");
  const categories = room.selectedCategories ?? [];
  const catLabel = categories.length === 0 || categories.length === 8
    ? null
    : categories.length === 1
      ? categories[0].replace(/-/g, " ")
      : `${categories.length} topics`;

  return (
    <div
      key={flashKey}
      className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-3 hover:border-fg-muted transition-colors duration-150 animate-fade-in"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-fg leading-tight">{room.name}</h3>
        <Badge variant={isPlaying ? "accent" : "muted"}>
          {isPlaying ? "Playing" : "Waiting"}
        </Badge>
      </div>
      <div className="flex flex-col gap-1 text-sm text-fg-muted flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1">
            <Users size={13} /> {room.playerCount}/{room.maxPlayers}
          </span>
          <span>·</span>
          <span>{room.totalRounds} rounds</span>
          <span>·</span>
          <span className="truncate max-w-[120px]" title={`Host: ${room.hostNickname}`}>
            {room.hostNickname}
          </span>
        </div>
        <div className="truncate text-xs" title={catLabel ? `${catLabel} · ${diffLabel}` : diffLabel}>
          {catLabel ? `${catLabel} · ${diffLabel}` : diffLabel}
        </div>
      </div>
      <Button onClick={join} disabled={isFull || isPlaying || joining} size="sm" className="transition-all duration-150 mt-auto">
        {joining ? (
          <><Loader2 size={13} className="animate-spin" /> Joining…</>
        ) : isFull ? (
          "Full"
        ) : isPlaying ? (
          "In progress"
        ) : (
          <>Join <ArrowRight size={13} /></>
        )}
      </Button>
    </div>
  );
}
