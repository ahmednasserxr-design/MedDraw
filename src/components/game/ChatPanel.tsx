"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { playSound } from "@/lib/sounds";
import type { GameStateApi } from "@/hooks/useGameState";

export function ChatPanel({ api }: { api: GameStateApi }) {
  const { messages, socket, me, isDrawer } = api;
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const canChat = !isDrawer && !(me?.hasGuessedThisTurn);
  const placeholder = isDrawer
    ? "Drawers can't chat 🤐"
    : me?.hasGuessedThisTurn
      ? "You already guessed!"
      : api.turn
        ? "Type your guess…"
        : "Send a message…";

  function send(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t || !canChat) return;
    playSound("click");
    socket.emit("chat:message", { text: t });
    setText("");
  }

  return (
    <div className="rounded-2xl border border-border bg-surface flex flex-col min-h-0 flex-1">
      <div className="px-4 py-2.5 border-b border-border text-xs font-semibold uppercase tracking-wider text-fg-muted">
        Chat
      </div>
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-1 text-sm"
      >
        {messages.map((m) => (
          <div key={m.id} className="leading-snug">
            {m.kind === "system" ? (
              <p className="text-xs text-fg-muted italic">— {m.text}</p>
            ) : m.kind === "correct" ? (
              <p className="text-green-600 dark:text-green-400 font-medium">
                ✓ {m.nickname}: {m.text}
              </p>
            ) : (
              <p>
                <span className="font-semibold text-fg">{m.nickname}:</span>{" "}
                <span className="text-fg">{m.text}</span>
              </p>
            )}
          </div>
        ))}
      </div>
      <form onSubmit={send} className="border-t border-border p-2 flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 120))}
          placeholder={placeholder}
          disabled={!canChat}
          maxLength={120}
        />
        <Button type="submit" size="md" disabled={!canChat || !text.trim()}>
          <Send size={14} />
        </Button>
      </form>
    </div>
  );
}
