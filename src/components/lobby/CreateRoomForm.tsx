"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { playSound } from "@/lib/sounds";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { NicknameField } from "@/components/auth/NicknameField";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/hooks/useAuth";

export function CreateRoomForm() {
  const router = useRouter();
  const { socket } = useSocket();
  const { userId, setGuestNickname, isGuest } = useAuth();

  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [rounds, setRounds] = useState(3);
  const [secondsPerTurn, setSecondsPerTurn] = useState(80);
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const nick = nickname.trim();
    if (!nick) { toast.error("Pick a nickname"); return; }
    const roomName = name.trim();
    if (!roomName) { toast.error("Give your room a name"); return; }
    playSound("click-primary");
    if (isGuest) setGuestNickname(nick);
    setLoading(true);
    socket.emit(
      "room:create",
      {
        name: roomName,
        maxPlayers,
        rounds,
        isPrivate,
        secondsPerTurn,
        selectedDifficulties: ["easy", "medium", "hard"],
        selectedCategories: [],
        hostNickname: nick,
        hostUserId: userId ?? undefined,
      },
      (res) => {
        setLoading(false);
        if (!res.ok) { toast.error(res.error); return; }
        router.push(`/room/${res.roomId}`);
      },
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <NicknameField value={nickname} onChange={setNickname} />

      <div>
        <Label htmlFor="room-name">Room name <span className="text-red-500">*</span></Label>
        <Input
          id="room-name"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 40))}
          maxLength={40}
          placeholder="Give your room a name…"
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label htmlFor="max-players">Players</Label>
          <select id="max-players" value={maxPlayers} onChange={(e) => setMaxPlayers(Number(e.target.value))}
            className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm cursor-pointer">
            {[2,3,4,5,6,7,8,9,10].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <Label htmlFor="rounds">Rounds</Label>
          <select id="rounds" value={rounds} onChange={(e) => setRounds(Number(e.target.value))}
            className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm cursor-pointer">
            {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <Label htmlFor="seconds">Seconds/turn</Label>
          <select id="seconds" value={secondsPerTurn} onChange={(e) => setSecondsPerTurn(Number(e.target.value))}
            className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm cursor-pointer">
            {[30,45,60,80,90,120,150,180].map((n) => <option key={n} value={n}>{n}s</option>)}
          </select>
        </div>
      </div>

      <p className="text-xs text-fg-muted">
        Topics and difficulty can be adjusted in the waiting room before the game starts.
      </p>

      <label className="flex items-center gap-2 select-none cursor-pointer">
        <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)}
          className="h-4 w-4 accent-[var(--accent)]" />
        <span className="text-sm">Private — only joinable with invite code</span>
      </label>

      <Button type="submit" disabled={loading} className="w-full" size="lg">
        {loading ? <><Loader2 size={15} className="animate-spin" /> Creating…</> : "Create room"}
      </Button>
    </form>
  );
}
