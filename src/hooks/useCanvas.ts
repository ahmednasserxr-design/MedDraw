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
  // Queue remote strokes until canvas is properly sized
  const canvasReadyRef = useRef(false);
  const strokeQueueRef = useRef<StrokeBatch[]>([]);

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
    // Repaint preserved content
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

      // On first real resize, drain any queued remote strokes
      if (!canvasReadyRef.current) {
        canvasReadyRef.current = true;
        for (const batch of strokeQueueRef.current) renderBatch(batch);
        strokeQueueRef.current = [];
      }
    });
    ro.observe(parent);

    // Force an immediate size check so the canvas is ready before strokes arrive
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
    const unsubClear = opts.subscribeClear(() => clearCanvasOnly());
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
    // If canvas not yet sized, queue the batch for replay after resize
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
      const stroke: Stroke = {
        x: cur.x, y: cur.y, prevX: prev.x, prevY: prev.y,
        color: s.tool === "eraser" ? "#ffffff" : s.color,
        width: s.tool === "eraser" ? s.width * 3 : s.width,
      };
      pendingRef.current.push(stroke);
      renderBatch({ strokes: [stroke] });
      prevPointRef.current = cur;
    },
    [opts.enabled],
  );

  const onPointerUp = useCallback(() => {
    drawingRef.current = false;
    prevPointRef.current = null;
  }, []);

  function setSettings(partial: Partial<DrawingSettings>) {
    settingsRef.current = { ...settingsRef.current, ...partial };
  }

  function setPenOnly(val: boolean) {
    penOnlyRef.current = val;
  }

  function clearAll() {
    clearCanvasOnly();
    opts.onClear?.();
  }

  return { canvasRef, onPointerDown, onPointerMove, onPointerUp, setSettings, setPenOnly, clearAll, getSettings: () => settingsRef.current };
}
