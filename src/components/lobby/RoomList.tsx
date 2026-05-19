"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RoomCard } from "./RoomCard";
import { useSocket } from "@/hooks/useSocket";
import type { PublicRoomSummary } from "@/types/game";

export function RoomList() {
  const { socket, connected } = useSocket();
  const [rooms, setRooms] = useState<PublicRoomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [flashKeys, setFlashKeys] = useState<Record<string, number>>({});
  const prevRoomsRef = useRef<PublicRoomSummary[]>([]);

  useEffect(() => {
    if (!connected) return;
    socket.emit("lobby:subscribe");
    function onRooms(data: { rooms: PublicRoomSummary[] }) {
      const next = data.rooms ?? [];
      // detect which cards changed so we can flash them
      const changed: Record<string, number> = {};
      for (const r of next) {
        const prev = prevRoomsRef.current.find((p) => p.id === r.id);
        if (prev && JSON.stringify(prev) !== JSON.stringify(r)) {
          changed[r.id] = Date.now();
        }
      }
      if (Object.keys(changed).length > 0) {
        setFlashKeys((fk) => ({ ...fk, ...changed }));
      }
      prevRoomsRef.current = next;
      setRooms(next);
      setLoading(false);
    }
    socket.on("lobby:rooms", onRooms);
    return () => { socket.off("lobby:rooms", onRooms); };
  }, [socket, connected]);

  function refresh() {
    setLoading(true);
    socket.emit("lobby:subscribe");
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight">Public rooms</h2>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-xs text-green-500">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={refresh}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </Button>
      </div>
      {rooms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-fg-muted">
          {loading ? "Looking for rooms…" : "No public rooms right now. Be the first to create one!"}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-stretch">
          {rooms.map((r) => (
            <RoomCard key={r.id} room={r} flashKey={flashKeys[r.id]} />
          ))}
        </div>
      )}
    </section>
  );
}
