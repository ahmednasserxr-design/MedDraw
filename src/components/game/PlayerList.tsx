"use client";

import { Crown, Pencil, ShieldCheck, UserX, Volume2, VolumeX } from "lucide-react";
import { playSound } from "@/lib/sounds";
import type { GameStateApi } from "@/hooks/useGameState";
import type { VoiceApi } from "@/hooks/useVoice";

export function PlayerList({ api, voice }: { api: GameStateApi; voice?: VoiceApi }) {
  if (!api.snapshot) return null;
  const players = [...api.snapshot.players].sort((a, b) => b.score - a.score);
  const mySocketId = api.socket.id;
  const inWaiting = api.snapshot.status === "waiting";

  function kick(socketId: string) {
    playSound("click-danger");
    api.socket.emit("room:kick_player", { socketId });
  }
  function makeHost(socketId: string) {
    playSound("click");
    api.socket.emit("room:transfer_host", { socketId });
  }

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border text-xs font-semibold uppercase tracking-wider text-fg-muted">
        Players · {players.length}
      </div>
      <ul className="divide-y divide-border">
        {players.map((p, idx) => {
          const isDrawing = api.turn?.drawerSocketId === p.socketId;
          const guessed = p.hasGuessedThisTurn;
          const isMe = p.socketId === mySocketId;
          const inVoice = voice?.inVoice && (isMe || voice.peers.has(p.socketId));
          const peerMuted = voice?.mutedPeers.has(p.socketId) ?? false;
          const isSpeaking = isMe
            ? voice?.hasMic && !voice.micMuted
              ? voice.isSpeakingLocally.current
              : false
            : voice?.speakingPeers.has(p.socketId) ?? false;
          const canManage = api.isHost && !isMe;

          return (
            <li
              key={p.socketId}
              className={`group flex items-center gap-2 px-3 py-2.5 transition-colors duration-100
                ${guessed ? "bg-green-50 dark:bg-green-900/10" : "hover:bg-surface-2"}`}
            >
              <span className="font-mono text-xs text-fg-muted w-4 shrink-0">{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`truncate font-medium text-sm ${isMe ? "text-accent" : ""}`}>
                    {p.nickname}
                  </span>
                  {p.isHost && <Crown size={11} className="text-amber-500 shrink-0" />}
                  {isMe && <span className="text-xs text-fg-muted shrink-0">(you)</span>}
                </div>
                {isDrawing && (
                  <div className="flex items-center gap-1 text-xs text-accent mt-0.5">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                    drawing <Pencil size={9} />
                  </div>
                )}
              </div>

              {/* Voice indicator */}
              {inVoice && (
                <button
                  type="button"
                  title={
                    isMe
                      ? voice?.micMuted ? "Your mic is muted" : "You're in voice"
                      : peerMuted
                        ? "Unmute player"
                        : isSpeaking
                          ? "Speaking — click to mute"
                          : "Mute player"
                  }
                  onClick={() => !isMe && voice?.togglePeerMute(p.socketId)}
                  className={`shrink-0 rounded-md p-1 transition-all duration-100 ${
                    isMe ? "cursor-default" : "cursor-pointer opacity-0 group-hover:opacity-100"
                  } ${
                    peerMuted
                      ? "text-red-500 opacity-100"
                      : isSpeaking
                        ? "text-green-500 opacity-100"
                        : "text-fg-muted hover:text-fg"
                  }`}
                >
                  {peerMuted ? <VolumeX size={12} /> : <Volume2 size={12} className={isSpeaking ? "animate-pulse" : ""} />}
                </button>
              )}

              {/* Host management — only in waiting, only for other players */}
              {canManage && inWaiting && (
                <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => makeHost(p.socketId)}
                    title="Make host"
                    className="rounded-md p-1 text-fg-muted hover:text-amber-500 hover:bg-amber-500/10 transition-colors duration-100 cursor-pointer"
                  >
                    <ShieldCheck size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => kick(p.socketId)}
                    title="Remove from room"
                    className="rounded-md p-1 text-fg-muted hover:text-red-500 hover:bg-red-500/10 transition-colors duration-100 cursor-pointer"
                  >
                    <UserX size={12} />
                  </button>
                </div>
              )}

              <span className="font-mono text-sm font-semibold tabular-nums shrink-0">
                {p.score}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
