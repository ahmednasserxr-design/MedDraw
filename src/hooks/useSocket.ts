"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@/types/socket";

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let singleton: TypedSocket | null = null;

function getSocket(): TypedSocket {
  if (singleton) return singleton;
  singleton = io({
    autoConnect: true,
    transports: ["websocket", "polling"],
    withCredentials: true,
  }) as TypedSocket;
  return singleton;
}

export function useSocket(): { socket: TypedSocket; connected: boolean } {
  const socketRef = useRef<TypedSocket | null>(null);
  if (!socketRef.current) socketRef.current = getSocket();
  const [connected, setConnected] = useState(socketRef.current.connected);

  useEffect(() => {
    const s = socketRef.current!;
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    if (!s.connected) s.connect();
    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
    };
  }, []);

  return { socket: socketRef.current!, connected };
}
