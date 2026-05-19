"use client";

import { Check } from "lucide-react";
import { CATEGORY_META, countCategoryWords } from "@/lib/game/wordBank";
import { playSound } from "@/lib/sounds";
import type { WordCategory } from "@/types/game";

const COLOR_MAP: Record<string, string> = {
  emerald: "border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  sky:     "border-sky-400 bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400",
  violet:  "border-violet-400 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400",
  orange:  "border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
  rose:    "border-rose-400 bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400",
  pink:    "border-pink-400 bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400",
  amber:   "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  indigo:  "border-indigo-400 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400",
};

const CATEGORIES = Object.entries(CATEGORY_META) as [WordCategory, typeof CATEGORY_META[WordCategory]][];
const GROUPS = [...new Set(CATEGORIES.map(([, m]) => m.group))];

export function CategoryPicker({
  selected,
  onChange,
  disabled,
}: {
  selected: WordCategory[];
  onChange: (cats: WordCategory[]) => void;
  disabled?: boolean;
}) {
  function toggle(cat: WordCategory) {
    if (disabled) return;
    playSound("click");
    if (selected.includes(cat)) {
      onChange(selected.filter((c) => c !== cat));
    } else {
      onChange([...selected, cat]);
    }
  }

  return (
    <div className={`space-y-3 mt-1.5 ${disabled ? "opacity-60 pointer-events-none" : ""}`}>
      {GROUPS.map((group) => (
        <div key={group}>
          <p className="text-xs text-fg-muted font-medium uppercase tracking-wider mb-1.5">{group}</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.filter(([, m]) => m.group === group).map(([cat, meta]) => {
              const active = selected.includes(cat);
              const colorCls = active ? COLOR_MAP[meta.color] : "border-border bg-surface-2 text-fg-muted hover:border-fg-muted hover:text-fg";
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggle(cat)}
                  title={`${countCategoryWords([cat])} words`}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium cursor-pointer transition-all duration-100 ${colorCls} ${active ? "" : "hover:scale-[1.02]"}`}
                >
                  {active && <Check size={12} />}
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
