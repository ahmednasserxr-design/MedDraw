export function guesserPoints(
  rank: number,
  secondsLeft: number,
  secondsPerTurn: number,
): number {
  const base = rank === 1 ? 100 : rank === 2 ? 75 : rank === 3 ? 50 : 25;
  const bonus = Math.floor((Math.max(secondsLeft, 0) / secondsPerTurn) * 50);
  return base + bonus;
}

export const DRAWER_POINTS_PER_GUESS = 25;
