"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Stroke, StrokeBatch } from "@/types/game";

type Tool = "pen" | "eraser";

export type DrawingSettings = {
  color: string;
  width: number;
  tool: Tool;
};

const DEFAULTS: DrawingSettings = {
  color: "#111111",
  width: 4,
  tool: "pen",
};

export function useCanvas(opts: {
  enabled: boolean;
  onBatch?: (b: StrokeBatch) => void;
  onClear?: () => void;
  onResync?: (batches: StrokeBatch[]) => void;
  subscribeStrokes: (fn: (b: StrokeBatch) => void) => () => void;
  subscribeClear: (fn: () => void) => () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const settingsRef = useRef<DrawingSettings>({ ...DEFAULTS });
  const penOnlyRef = useRef(false);
  const drawingRef = useRef(false);
  const prevPointRef = useRef<{ x: number; y: number } | null>(null);
  const pendingRef = useRef<Stroke[]>([]);
  const flushTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasReadyRef = useRef(false);
  const strokeQueueRef = useRef<StrokeBatch[]>([]);

  // Undo / redo history (local stroke sessions only)
  const currentSessionRef = useRef<Stroke[]>([]);
  const historyRef = useRef<Stroke[][]>([]);
  const redoStackRef = useRef<Stroke[][]>([]);

  function applyCanvasSize(canvas: HTMLCanvasElement, w: number, h: number) {
    const dpr = window.devicePixelRatio || 1;
    const tmp = document.createElement("canvas");
    tmp.width = canvas.width;
    tmp.height = canvas.height;
    tmp.getContext("2d")!.drawImage(canvas, 0, 0);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.drawImage(tmp, 0, 0, tmp.width, tmp.height, 0, 0, w, h);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement!;
    const ro = new ResizeObserver(() => {
      const rect = parent.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      applyCanvasSize(canvas, w, h);
      if (!canvasReadyRef.current) {
        canvasReadyRef.current = true;
        for (const batch of strokeQueueRef.current) renderBatch(batch);
        strokeQueueRef.current = [];
      }
    });
    ro.observe(parent);
    const rect = parent.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      applyCanvasSize(canvas, Math.floor(rect.width), Math.floor(rect.height));
      canvasReadyRef.current = true;
    }
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unsub = opts.subscribeStrokes((b) => renderBatch(b));
    const unsubClear = opts.subscribeClear(() => {
      clearCanvasOnly();
      historyRef.current = [];
      redoStackRef.current = [];
      currentSessionRef.current = [];
    });
    return () => { unsub(); unsubClear(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!opts.enabled) return;
    flushTimer.current = setInterval(() => {
      if (pendingRef.current.length === 0) return;
      const batch: StrokeBatch = { strokes: pendingRef.current };
      pendingRef.current = [];
      opts.onBatch?.(batch);
    }, 50);
    return () => {
      if (flushTimer.current) clearInterval(flushTimer.current);
      flushTimer.current = null;
    };
  }, [opts.enabled, opts.onBatch]);

  // Keyboard shortcuts: Ctrl+Z undo, Ctrl+Y / Ctrl+Shift+Z redo
  useEffect(() => {
    if (!opts.enabled) return;
    function onKey(e: KeyboardEvent) {
      if (!e.ctrlKey && !e.metaKey) return;
      if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if (e.key === "y" || (e.key === "z" && e.shiftKey)) { e.preventDefault(); redo(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.enabled]);

  function clearCanvasOnly() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  function renderBatch(batch: StrokeBatch) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!canvasReadyRef.current) {
      strokeQueueRef.current.push(batch);
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    for (const s of batch.strokes) {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
      ctx.beginPath();
      ctx.moveTo(s.prevX * w, s.prevY * h);
      ctx.lineTo(s.x * w, s.y * h);
      ctx.stroke();
    }
  }

  function pointFromEvent(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
  }

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!opts.enabled) return;
      if (penOnlyRef.current && e.pointerType !== "pen") return;
      e.preventDefault();
      (e.target as HTMLCanvasElement).setPointerCapture?.(e.pointerId);
      drawingRef.current = true;
      currentSessionRef.current = [];
      prevPointRef.current = pointFromEvent(e);
    },
    [opts.enabled],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!opts.enabled || !drawingRef.current) return;
      if (penOnlyRef.current && e.pointerType !== "pen") return;
      const cur = pointFromEvent(e);
      const prev = prevPointRef.current ?? cur;
      const s = settingsRef.current;
      // Barrel button (bit 32) on stylus pens temporarily switches to eraser
      const barrelHeld = e.pointerType === "pen" && !!(e.buttons & 32);
      const effectiveTool = barrelHeld ? "eraser" : s.tool;
      const stroke: Stroke = {
        x: cur.x, y: cur.y, prevX: prev.x, prevY: prev.y,
        color: effectiveTool === "eraser" ? "#ffffff" : s.color,
        width: effectiveTool === "eraser" ? s.width * 3 : s.width,
      };
      pendingRef.current.push(stroke);
      currentSessionRef.current.push(stroke);
      renderBatch({ strokes: [stroke] });
      prevPointRef.current = cur;
    },
    [opts.enabled],
  );

  const onPointerUp = useCallback(() => {
    drawingRef.current = false;
    prevPointRef.current = null;
    if (currentSessionRef.current.length > 0) {
      historyRef.current.push([...currentSessionRef.current]);
      redoStackRef.current = []; // new stroke invalidates redo history
      currentSessionRef.current = [];
    }
  }, []);

  function undo() {
    if (!opts.enabled || historyRef.current.length === 0) return;
    redoStackRef.current.push(historyRef.current.pop()!);
    clearCanvasOnly();
    for (const session of historyRef.current) {
      renderBatch({ strokes: session });
    }
    opts.onResync?.(historyRef.current.map((s) => ({ strokes: s })));
  }

  function redo() {
    if (!opts.enabled || redoStackRef.current.length === 0) return;
    const next = redoStackRef.current.pop()!;
    historyRef.current.push(next);
    renderBatch({ strokes: next });
    opts.onResync?.(historyRef.current.map((s) => ({ strokes: s })));
  }

  function setSettings(partial: Partial<DrawingSettings>) {
    settingsRef.current = { ...settingsRef.current, ...partial };
  }

  function setPenOnly(val: boolean) {
    penOnlyRef.current = val;
  }

  function clearAll() {
    clearCanvasOnly();
    historyRef.current = [];
    redoStackRef.current = [];
    currentSessionRef.current = [];
    opts.onClear?.();
  }

  function canUndo() { return opts.enabled && historyRef.current.length > 0; }
  function canRedo() { return opts.enabled && redoStackRef.current.length > 0; }

  return {
    canvasRef, onPointerDown, onPointerMove, onPointerUp,
    setSettings, setPenOnly, clearAll, undo, redo, canUndo, canRedo,
    getSettings: () => settingsRef.current,
  };
}
