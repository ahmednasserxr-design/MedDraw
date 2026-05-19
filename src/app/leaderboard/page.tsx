import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { isSupabaseConfigured } from "@/lib/env";
import { readLeaderboard } from "@/lib/supabase/persistence";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const rows = isSupabaseConfigured ? await readLeaderboard() : [];

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl w-full px-4 py-10 flex-1">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg mb-4"
        >
          <ArrowLeft size={14} /> Lobby
        </Link>
        <div className="flex items-center gap-2 mb-6">
          <Trophy className="text-amber-500" size={24} />
          <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
        </div>

        {!isSupabaseConfigured ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-fg-muted">
            Supabase isn't configured — leaderboards are disabled in dev.
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-fg-muted">
            No games played yet. Be the first to finish a round!
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-surface-2">
                <tr className="text-left text-xs uppercase tracking-wider text-fg-muted">
                  <th className="px-4 py-2.5 font-medium">#</th>
                  <th className="px-4 py-2.5 font-medium">Player</th>
                  <th className="px-4 py-2.5 font-medium text-right">Total</th>
                  <th className="px-4 py-2.5 font-medium text-right">Games</th>
                  <th className="px-4 py-2.5 font-medium text-right">Best</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row, idx) => (
                  <tr key={`${row.nickname}-${idx}`}>
                    <td className="px-4 py-2.5 font-mono text-fg-muted">{idx + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{row.nickname}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums font-semibold">
                      {row.total_score}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-fg-muted">
                      {row.games_played}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-fg-muted">
                      {row.best_single_game}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
