"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { playSound } from "@/lib/sounds";
import type {
  ChatMessage,
  GameEndPayload,
  RoomSnapshot,
  StrokeBatch,
  TurnEndPayload,
  TurnStartPayload,
} from "@/types/game";

export type TurnState = {
  drawerSocketId: string;
  drawerNickname: string;
  wordMasked: string;
  wordForDrawer: string | null;
  secondsPerTurn: number;
  round: number;
};

export type EndedState = {
  finalScores: GameEndPayload["finalScores"];
  lastWord: string | null;
};

export type ChoosingState = {
  drawerSocketId: string;
  drawerNickname: string;
  round: number;
  words: string[] | null;
  canRequestMore: boolean;
};

export type RematchState = {
  votes: number;
  required: number;
  countdown: number;
};

type StrokeHandler = (b: StrokeBatch) => void;
type ClearHandler = () => void;

export function useGameState(roomId: string) {
  const { socket, connected } = useSocket();
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [turn, setTurn] = useState<TurnState | null>(null);
  const [turnEnd, setTurnEnd] = useState<TurnEndPayload | null>(null);
  const [ended, setEnded] = useState<EndedState | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [choosing, setChoosing] = useState<ChoosingState | null>(null);
  const [rematch, setRematch] = useState<RematchState | null>(null);
  const [aborted, setAborted] = useState<string | null>(null);

  const strokeSubscribers = useRef<Set<StrokeHandler>>(new Set());
  const clearSubscribers = useRef<Set<ClearHandler>>(new Set());

  useEffect(() => {
    if (!connected) return;

    function onJoined(s: RoomSnapshot) { setSnapshot(s); }
    function onUpdated(s: RoomSnapshot) {
      setSnapshot((prev) => {
        if (prev && s.status === "waiting") {
          if (s.players.length > prev.players.length) playSound("player-join");
          else if (s.players.length < prev.players.length) playSound("player-leave");
        }
        return s;
      });
      if (s.secondsLeft !== null && s.secondsLeft !== undefined) setSecondsLeft(s.secondsLeft);
      // If server reset to waiting (rematch cancelled), clear ended state
      if (s.status === "waiting") {
        setEnded(null);
        setTurnEnd(null);
        setRematch(null);
        setChoosing(null);
        setTurn(null);
        setAborted(null);
      }
    }
    function onError(payload: { message: string }) { toast.error(payload.message); }
    function onJoinRejected() {
      toast.error("Your join request was rejected");
      router.push("/");
    }
    function onChat(msg: ChatMessage) {
      if (msg.kind === "correct") playSound("correct-guess");
      else if (msg.kind === "chat") playSound("chat-incoming");
      setMessages((prev) => [...prev, msg].slice(-100));
    }
    function onStarting(payload: { countdown: number }) {
      playSound("game-start");
      setCountdown(payload.countdown);
      setEnded(null);
      setTurnEnd(null);
      setRematch(null);
      let n = payload.countdown;
      const t = setInterval(() => {
        n -= 1;
        if (n <= 0) { clearInterval(t); setCountdown(null); }
        else setCountdown(n);
      }, 1000);
    }
    function onChoosing(p: { drawerSocketId: string; drawerNickname: string; round: number }) {
      setTurnEnd(null);
      setTurn(null);
      setChoosing({ drawerSocketId: p.drawerSocketId, drawerNickname: p.drawerNickname, round: p.round, words: null, canRequestMore: false });
    }
    function onWordChoices(p: { words: string[]; canRequestMore: boolean }) {
      setChoosing((c) => c ? { ...c, words: p.words, canRequestMore: p.canRequestMore } : c);
    }
    function onTurnStart(p: TurnStartPayload) {
      playSound("turn-start");
      setTurnEnd(null);
      setChoosing(null);
      setTurn({ drawerSocketId: p.drawerSocketId, drawerNickname: p.drawerNickname, wordMasked: p.wordMasked, wordForDrawer: null, secondsPerTurn: p.secondsPerTurn, round: p.round });
      setSecondsLeft(p.secondsPerTurn);
      clearSubscribers.current.forEach((fn) => fn());
    }
    function onWordForDrawer(p: { word: string }) {
      setTurn((t) => t ? { ...t, wordForDrawer: p.word } : t);
    }
    function onTurnEnd(p: TurnEndPayload) { playSound("turn-end"); setTurnEnd(p); setTurn(null); }
    function onTick(p: { secondsLeft: number }) { setSecondsLeft(p.secondsLeft); }
    function onEnd(p: GameEndPayload) {
      playSound("game-end");
      setEnded({ finalScores: p.finalScores, lastWord: null });
      setTurn(null);
      setTurnEnd(null);
      setChoosing(null);
    }
    function onRematchUpdate(p: RematchState) { setRematch(p); }
    function onRematchStart() {
      setRematch(null);
      setEnded(null);
    }
    function onRematchCancelled() {
      setRematch(null);
      setEnded(null);
    }
    function onAborted(p: { message: string }) {
      playSound("aborted");
      setAborted(p.message);
      setTurn(null);
      setTurnEnd(null);
      setChoosing(null);
      setEnded(null);
    }
    function onStroke(b: StrokeBatch) { strokeSubscribers.current.forEach((fn) => fn(b)); }
    function onClear() { clearSubscribers.current.forEach((fn) => fn()); }

    socket.on("room:joined", onJoined);
    socket.on("room:updated", onUpdated);
    socket.on("room:error", onError);
    socket.on("room:join_rejected", onJoinRejected);
    socket.on("chat:message", onChat);
    socket.on("game:starting", onStarting);
    socket.on("game:choosing", onChoosing);
    socket.on("game:word_choices", onWordChoices);
    socket.on("game:turn_start", onTurnStart);
    socket.on("game:word_for_drawer", onWordForDrawer);
    socket.on("game:turn_end", onTurnEnd);
    socket.on("game:tick", onTick);
    socket.on("game:end", onEnd);
    socket.on("game:rematch_update", onRematchUpdate);
    socket.on("game:rematch_start", onRematchStart);
    socket.on("game:rematch_cancelled", onRematchCancelled);
    socket.on("game:aborted", onAborted);
    socket.on("draw:stroke", onStroke);
    socket.on("draw:clear", onClear);

    return () => {
      socket.off("room:joined", onJoined);
      socket.off("room:updated", onUpdated);
      socket.off("room:error", onError);
      socket.off("room:join_rejected", onJoinRejected);
      socket.off("chat:message", onChat);
      socket.off("game:starting", onStarting);
      socket.off("game:choosing", onChoosing);
      socket.off("game:word_choices", onWordChoices);
      socket.off("game:turn_start", onTurnStart);
      socket.off("game:word_for_drawer", onWordForDrawer);
      socket.off("game:turn_end", onTurnEnd);
      socket.off("game:tick", onTick);
      socket.off("game:end", onEnd);
      socket.off("game:rematch_update", onRematchUpdate);
      socket.off("game:rematch_start", onRematchStart);
      socket.off("game:rematch_cancelled", onRematchCancelled);
      socket.off("game:aborted", onAborted);
      socket.off("draw:stroke", onStroke);
      socket.off("draw:clear", onClear);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, connected, roomId, router]);

  const me = useMemo(
    () => snapshot?.players.find((p) => p.socketId === socket.id) ?? null,
    [snapshot, socket.id],
  );
  const isDrawer = !!turn && turn.drawerSocketId === socket.id;
  const isChoosingDrawer = !!choosing && choosing.drawerSocketId === socket.id;
  const isHost = !!me?.isHost;

  function subscribeStrokes(fn: StrokeHandler) {
    strokeSubscribers.current.add(fn);
    return () => strokeSubscribers.current.delete(fn);
  }
  function subscribeClear(fn: ClearHandler) {
    clearSubscribers.current.add(fn);
    return () => clearSubscribers.current.delete(fn);
  }

  return {
    socket, connected, snapshot, me, isDrawer, isChoosingDrawer, isHost,
    turn, turnEnd, ended, countdown, secondsLeft, messages, choosing, rematch, aborted,
    subscribeStrokes, subscribeClear,
  };
}

export type GameStateApi = ReturnType<typeof useGameState>;
