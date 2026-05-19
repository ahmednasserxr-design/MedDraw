"use client";

import { useState } from "react";
import { Eraser, Expand, Paintbrush, PenLine, Trash2 } from "lucide-react";
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

export function DrawingToolbar({
  onChange,
  onClear,
  onFullscreen,
  onPenOnly,
  disabled,
}: {
  onChange: (partial: Partial<DrawingSettings>) => void;
  onClear: () => void;
  onFullscreen?: () => void;
  onPenOnly?: (val: boolean) => void;
  disabled?: boolean;
}) {
  const [color, setColor] = useState("#111111");
  const [width, setWidth] = useState(4);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [penOnly, setPenOnly] = useState(false);

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
    onPenOnly?.(next);
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface/90 backdrop-blur-sm px-2.5 py-2 shadow-sm ${
        disabled ? "opacity-40 pointer-events-none select-none" : ""
      }`}
    >
      {/* Color swatches */}
      <div className="flex flex-wrap gap-1">
        {COLORS.map(({ hex, label }) => (
          <button
            key={hex}
            type="button"
            title={label}
            onClick={() => pickColor(hex)}
            className={`h-6 w-6 rounded cursor-pointer border transition-all duration-100 ${
              color === hex && tool === "pen"
                ? "scale-125 ring-2 ring-accent border-accent"
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

      {/* Pen-only (stylus) mode */}
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

      {/* Fullscreen */}
      {onFullscreen && (
        <button
          type="button"
          title="Expand canvas (fullscreen)"
          onClick={onFullscreen}
          className="h-8 w-8 cursor-pointer inline-flex items-center justify-center rounded-lg border border-border text-fg-muted hover:border-fg-muted hover:bg-surface-2 hover:text-fg transition-all duration-100"
        >
          <Expand size={14} />
        </button>
      )}
    </div>
  );
}
