"use client";

import { Check } from "lucide-react";
import type { Difficulty } from "@/types/game";
import { DIFFICULTY_META } from "@/lib/game/wordBank";

type Props = {
  selected: Difficulty[];
  onChange?: (next: Difficulty[]) => void;
  // When read-only, renders chips that show the current selection without
  // allowing the viewer to toggle them.
  readOnly?: boolean;
};

const ALL: Difficulty[] = ["easy", "medium", "hard"];

const COLORS: Record<Difficulty, { on: string; off: string }> = {
  easy: {
    on: "bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300",
    off: "border-border text-fg-muted hover:border-emerald-500/40",
  },
  medium: {
    on: "bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300",
    off: "border-border text-fg-muted hover:border-amber-500/40",
  },
  hard: {
    on: "bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300",
    off: "border-border text-fg-muted hover:border-rose-500/40",
  },
};

export function DifficultyPicker({ selected, onChange, readOnly }: Props) {
  function toggle(d: Difficulty) {
    if (readOnly || !onChange) return;
    const isOn = selected.includes(d);
    let next = isOn ? selected.filter((x) => x !== d) : [...selected, d];
    // Disallow empty selection — at least one difficulty must remain on.
    if (next.length === 0) next = [d];
    onChange(next);
  }

  return (
    <div className="grid grid-cols-3 gap-2 mt-1.5">
      {ALL.map((d) => {
        const on = selected.includes(d);
        const palette = COLORS[d];
        return (
          <button
            key={d}
            type="button"
            onClick={() => toggle(d)}
            aria-pressed={on}
            className={`relative rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
              on ? palette.on : (readOnly ? "border-border text-fg-muted" : palette.off)
            } ${readOnly ? "cursor-default pointer-events-none" : "cursor-pointer hover:scale-[1.02] active:scale-[0.98]"}`}
          >
            <span className="flex items-center justify-center gap-1.5">
              {on && <Check size={13} />}
              {DIFFICULTY_META[d].label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
