"use client";

import { useEffect, useState } from "react";
import { Eraser, Expand, Paintbrush, PenLine, Redo2, Shrink, Trash2, Undo2 } from "lucide-react";
import type { DrawingSettings } from "@/hooks/useCanvas";

const COLORS = [
  { hex: "#111111", label: "Black" },
  { hex: "#ffffff", label: "White" },
  { hex: "#ef4444", label: "Red" },
  { hex: "#f59e0b", label: "Orange" },
  { hex: "#84cc16", label: "Lime" },
  { hex: "#10b981", label: "Teal" },
  { hex: "#0ea5e9", label: "Blue" },
  { hex: "#6366f1", label: "Indigo" },
  { hex: "#a855f7", label: "Purple" },
  { hex: "#ec4899", label: "Pink" },
  { hex: "#92400e", label: "Brown" },
  { hex: "#94a3b8", label: "Gray" },
];

const WIDTHS: Array<{ px: number; label: string }> = [
  { px: 3, label: "Thin" },
  { px: 6, label: "Medium" },
  { px: 12, label: "Thick" },
];

const PEN_ONLY_KEY = "meddraw:pen-only";

export function DrawingToolbar({
  onChange,
  onClear,
  onUndo,
  onRedo,
  onFullscreen,
  onPenOnly,
  canUndo,
  canRedo,
  disabled,
  isFullscreen,
}: {
  onChange: (partial: Partial<DrawingSettings>) => void;
  onClear: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onFullscreen?: () => void;
  onPenOnly?: (val: boolean) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  disabled?: boolean;
  isFullscreen?: boolean;
}) {
  const [color, setColor] = useState("#111111");
  const [width, setWidth] = useState(4);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [penOnly, setPenOnly] = useState(false);

  // Load pen-only preference from localStorage on mount
  useEffect(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem(PEN_ONLY_KEY) === "true";
    if (saved) {
      setPenOnly(true);
      onPenOnly?.(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pickColor(c: string) {
    setColor(c);
    setTool("pen");
    onChange({ color: c, tool: "pen" });
  }
  function pickWidth(w: number) {
    setWidth(w);
    onChange({ width: w });
  }
  function pickTool(t: "pen" | "eraser") {
    setTool(t);
    onChange({ tool: t });
  }
  function togglePenOnly() {
    const next = !penOnly;
    setPenOnly(next);
    if (typeof window !== "undefined") localStorage.setItem(PEN_ONLY_KEY, String(next));
    onPenOnly?.(next);
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface/90 backdrop-blur-sm px-2.5 py-2 shadow-sm ${
        disabled ? "opacity-40 pointer-events-none select-none" : ""
      }`}
    >
      {/* Color swatches — 2 rows × 6 columns, compact */}
      <div className="grid grid-cols-6 grid-rows-2 gap-1">
        {COLORS.map(({ hex, label }) => (
          <button
            key={hex}
            type="button"
            title={label}
            onClick={() => pickColor(hex)}
            className={`h-5 w-5 rounded cursor-pointer border transition-all duration-100 ${
              color === hex && tool === "pen"
                ? "scale-125 ring-2 ring-accent border-accent z-10"
                : "border-border hover:scale-110 hover:border-fg-muted"
            }`}
            style={{ background: hex }}
          />
        ))}
      </div>

      <div className="w-px h-6 bg-border shrink-0" />

      {/* Brush widths */}
      <div className="flex items-center gap-1">
        {WIDTHS.map(({ px, label }) => (
          <button
            key={px}
            type="button"
            title={`${label} brush`}
            onClick={() => pickWidth(px)}
            className={`h-8 w-8 cursor-pointer inline-flex items-center justify-center rounded-lg border transition-all duration-100 ${
              width === px
                ? "border-accent bg-accent/10"
                : "border-border hover:border-fg-muted hover:bg-surface-2"
            }`}
          >
            <span
              className="rounded-full"
              style={{
                width: `${Math.min(px + 2, 14)}px`,
                height: `${Math.min(px + 2, 14)}px`,
                background: color === "#ffffff" ? "#94a3b8" : color,
              }}
            />
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-border shrink-0" />

      {/* Pen / Eraser */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          title="Pen"
          onClick={() => pickTool("pen")}
          className={`h-8 w-8 cursor-pointer inline-flex items-center justify-center rounded-lg border transition-all duration-100 ${
            tool === "pen"
              ? "border-accent bg-accent text-accent-fg"
              : "border-border text-fg-muted hover:border-fg-muted hover:bg-surface-2 hover:text-fg"
          }`}
        >
          <Paintbrush size={14} />
        </button>
        <button
          type="button"
          title="Eraser"
          onClick={() => pickTool("eraser")}
          className={`h-8 w-8 cursor-pointer inline-flex items-center justify-center rounded-lg border transition-all duration-100 ${
            tool === "eraser"
              ? "border-accent bg-accent text-accent-fg"
              : "border-border text-fg-muted hover:border-fg-muted hover:bg-surface-2 hover:text-fg"
          }`}
        >
          <Eraser size={14} />
        </button>
      </div>

      <div className="w-px h-6 bg-border shrink-0" />

      {/* Undo / Redo */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          title="Undo (Ctrl+Z)"
          onClick={onUndo}
          disabled={!canUndo}
          className="h-8 w-8 cursor-pointer inline-flex items-center justify-center rounded-lg border border-border text-fg-muted hover:border-fg-muted hover:bg-surface-2 hover:text-fg transition-all duration-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Undo2 size={14} />
        </button>
        <button
          type="button"
          title="Redo (Ctrl+Y)"
          onClick={onRedo}
          disabled={!canRedo}
          className="h-8 w-8 cursor-pointer inline-flex items-center justify-center rounded-lg border border-border text-fg-muted hover:border-fg-muted hover:bg-surface-2 hover:text-fg transition-all duration-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Redo2 size={14} />
        </button>
      </div>

      <div className="w-px h-6 bg-border shrink-0" />

      {/* Pen-only (stylus) mode — persisted to localStorage */}
      <button
        type="button"
        title={penOnly ? "Pen-only mode: ON — finger/mouse ignored" : "Enable pen-only mode (stylus/tablet)"}
        onClick={togglePenOnly}
        className={`h-8 w-8 cursor-pointer inline-flex items-center justify-center rounded-lg border transition-all duration-100 ${
          penOnly
            ? "border-accent bg-accent/10 text-accent"
            : "border-border text-fg-muted hover:border-fg-muted hover:bg-surface-2 hover:text-fg"
        }`}
      >
        <PenLine size={14} />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Clear */}
      <button
        type="button"
        title="Clear canvas"
        onClick={onClear}
        className="h-8 w-8 cursor-pointer inline-flex items-center justify-center rounded-lg border border-border text-fg-muted hover:border-red-400 hover:bg-red-500/10 hover:text-red-500 transition-all duration-100"
      >
        <Trash2 size={14} />
      </button>

      {/* Fullscreen toggle — expand when normal, shrink when fullscreen */}
      {onFullscreen && (
        <button
          type="button"
          title={isFullscreen ? "Exit fullscreen" : "Expand canvas (fullscreen)"}
          onClick={onFullscreen}
          className="h-8 w-8 cursor-pointer inline-flex items-center justify-center rounded-lg border border-border text-fg-muted hover:border-fg-muted hover:bg-surface-2 hover:text-fg transition-all duration-100"
        >
          {isFullscreen ? <Shrink size={14} /> : <Expand size={14} />}
        </button>
      )}
    </div>
  );
}
