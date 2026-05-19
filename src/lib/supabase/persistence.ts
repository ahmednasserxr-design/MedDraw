import { createClient } from "@supabase/supabase-js";
import { env, isSupabaseConfigured } from "@/lib/env";

type ScoreRow = {
  userId: string | null;
  nickname: string;
  score: number;
};

let serviceClient: ReturnType<typeof createClient> | null = null;

function getServiceClient() {
  if (!isSupabaseConfigured || !env.SUPABASE_SERVICE_ROLE_KEY) return null;
  if (!serviceClient) {
    serviceClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return serviceClient;
}

export async function persistGameScores(roomName: string, scores: ScoreRow[]) {
  const client = getServiceClient();
  if (!client) return;
  if (scores.length === 0) return;
  const rows = scores.map((s) => ({
    user_id: s.userId,
    nickname: s.nickname,
    score: s.score,
    room_name: roomName,
  }));
  try {
    const { error } = await client.from("leaderboard_entries").insert(rows as never);
    if (error) console.warn("[meddraw] persistGameScores error:", error.message);
  } catch (err) {
    console.warn("[meddraw] persistGameScores threw:", err);
  }
}

export type LeaderboardRow = {
  nickname: string;
  total_score: number;
  games_played: number;
  best_single_game: number;
};

export async function readLeaderboard(): Promise<LeaderboardRow[]> {
  const client = getServiceClient();
  if (!client) return [];
  const { data, error } = await client
    .from("leaderboard_all_time")
    .select("nickname,total_score,games_played,best_single_game")
    .limit(50);
  if (error) {
    console.warn("[meddraw] readLeaderboard error:", error.message);
    return [];
  }
  return (data ?? []) as LeaderboardRow[];
}
