"use client";

import { useEffect, useRef, useState } from "react";
import { Shrink } from "lucide-react";
import { useCanvas } from "@/hooks/useCanvas";
import { DrawingToolbar } from "./DrawingToolbar";
import { TurnOverlay } from "./TurnOverlay";
import { WordChoiceOverlay } from "./WordChoiceOverlay";
import type { GameStateApi } from "@/hooks/useGameState";

export function GameCanvas({ api }: { api: GameStateApi }) {
  const { isDrawer, socket, subscribeStrokes, subscribeClear } = api;
  const canvas = useCanvas({
    enabled: isDrawer,
    onBatch: (b) => socket.emit("draw:stroke", b),
    onClear: () => socket.emit("draw:clear"),
    subscribeStrokes,
    subscribeClear,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-full ${isFullscreen ? "bg-bg p-2 gap-2" : "gap-2"}`}
    >
      {/* Toolbar — sticky below the app header when the page scrolls */}
      {isDrawer && (
        <div className={`sticky z-30 ${isFullscreen ? "top-0" : "top-14"}`}>
          <DrawingToolbar
            disabled={false}
            onChange={canvas.setSettings}
            onClear={canvas.clearAll}
            onFullscreen={toggleFullscreen}
            onPenOnly={canvas.setPenOnly}
          />
        </div>
      )}

      {/* Canvas — fixed 4:3 aspect ratio so all users see identical proportions */}
      <div className="relative w-full aspect-[4/3] rounded-2xl border border-border bg-white overflow-hidden">
        <canvas
          ref={canvas.canvasRef}
          onPointerDown={canvas.onPointerDown}
          onPointerMove={canvas.onPointerMove}
          onPointerUp={canvas.onPointerUp}
          onPointerLeave={canvas.onPointerUp}
          className={`absolute inset-0 h-full w-full ${
            isDrawer ? "cursor-crosshair touch-none" : "cursor-not-allowed"
          }`}
        />
        {!isDrawer && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 text-white text-xs px-3 py-1 pointer-events-none">
            Watching…
          </div>
        )}

        {/* Overlays scoped to the canvas area only */}
        <TurnOverlay api={api} />
        <WordChoiceOverlay api={api} />

        {/* Fullscreen exit button in canvas corner */}
        {isFullscreen && (
          <button
            type="button"
            title="Exit fullscreen"
            onClick={toggleFullscreen}
            className="absolute top-2 right-2 z-10 h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border bg-surface/80 backdrop-blur-sm text-fg-muted hover:text-fg cursor-pointer transition-colors duration-100"
          >
            <Shrink size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
