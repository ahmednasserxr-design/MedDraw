"use client";

import { Check } from "lucide-react";
import type { WordCategory } from "@/types/game";
import { CATEGORY_META } from "@/lib/game/wordBank";

type Props = {
  selected: WordCategory[];
  onChange?: (next: WordCategory[]) => void;
  readOnly?: boolean;
};

const ALL: WordCategory[] = [
  "biology", "chemistry", "physics", "maths",
  "medicine-academic", "medicine-clinical",
  "engineering-basic", "engineering-advanced",
];

const COLOR_ON: Record<string, string> = {
  emerald: "bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300",
  sky:     "bg-sky-500/15 border-sky-500 text-sky-700 dark:text-sky-300",
  violet:  "bg-violet-500/15 border-violet-500 text-violet-700 dark:text-violet-300",
  orange:  "bg-orange-500/15 border-orange-500 text-orange-700 dark:text-orange-300",
  rose:    "bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300",
  pink:    "bg-pink-500/15 border-pink-500 text-pink-700 dark:text-pink-300",
  amber:   "bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300",
  indigo:  "bg-indigo-500/15 border-indigo-500 text-indigo-700 dark:text-indigo-300",
};

const COLOR_OFF: Record<string, string> = {
  emerald: "hover:border-emerald-500/40",
  sky:     "hover:border-sky-500/40",
  violet:  "hover:border-violet-500/40",
  orange:  "hover:border-orange-500/40",
  rose:    "hover:border-rose-500/40",
  pink:    "hover:border-pink-500/40",
  amber:   "hover:border-amber-500/40",
  indigo:  "hover:border-indigo-500/40",
};

export function CategoryPicker({ selected, onChange, readOnly }: Props) {
  function toggle(cat: WordCategory) {
    if (readOnly || !onChange) return;
    const isOn = selected.includes(cat);
    const next = isOn ? selected.filter((x) => x !== cat) : [...selected, cat];
    onChange(next);
  }

  const groups: { label: string; cats: WordCategory[] }[] = [
    { label: "School", cats: ["biology", "chemistry", "physics", "maths"] },
    { label: "University", cats: ["medicine-academic", "medicine-clinical", "engineering-basic", "engineering-advanced"] },
  ];

  return (
    <div className="space-y-2 mt-1.5">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted mb-1">{g.label}</p>
          <div className="grid grid-cols-2 gap-1.5">
            {g.cats.map((cat) => {
              const on = selected.includes(cat);
              const color = CATEGORY_META[cat].color;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggle(cat)}
                  aria-pressed={on}
                  className={`relative rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all duration-150 text-left ${
                    on
                      ? COLOR_ON[color]
                      : `border-border text-fg-muted ${readOnly ? "" : COLOR_OFF[color]}`
                  } ${readOnly ? "cursor-default pointer-events-none" : "cursor-pointer"}`}
                >
                  <span className="flex items-center gap-1">
                    {on && <Check size={11} className="shrink-0" />}
                    {CATEGORY_META[cat].label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
