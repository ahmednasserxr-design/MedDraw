export type Difficulty = "easy" | "medium" | "hard";
export type WordCategory =
  | "biology" | "chemistry" | "physics" | "maths"
  | "medicine-academic" | "medicine-clinical"
  | "engineering-basic" | "engineering-advanced";

export type Player = {
  socketId: string;
  userId: string | null;
  nickname: string;
  score: number;
  hasDrawnThisRound: boolean;
  hasGuessedThisTurn: boolean;
  isHost: boolean;
};

export type RoomStatus = "waiting" | "in_progress" | "ended";

export type ChatMessage = {
  id: string;
  socketId: string | null;
  nickname: string;
  text: string;
  kind: "chat" | "system" | "correct";
  ts: number;
};

export type Stroke = {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  color: string;
  width: number;
};

export type StrokeBatch = {
  strokes: Stroke[];
};

export type PublicRoomSummary = {
  id: string;
  name: string;
  hostNickname: string;
  playerCount: number;
  maxPlayers: number;
  status: RoomStatus;
  totalRounds: number;
  selectedDifficulties: Difficulty[];
  selectedCategories: WordCategory[];
};

export type PendingJoin = {
  socketId: string;
  nickname: string;
};

export type RoomSnapshot = {
  id: string;
  name: string;
  inviteCode: string;
  isPrivate: boolean;
  maxPlayers: number;
  totalRounds: number;
  currentRound: number;
  status: RoomStatus;
  secondsPerTurn: number;
  hostSocketId: string;
  players: Player[];
  currentDrawerSocketId: string | null;
  wordMasked: string | null;
  secondsLeft: number | null;
  pendingJoins: PendingJoin[];
  selectedDifficulties: Difficulty[];
  selectedCategories: WordCategory[];
};

export type TurnStartPayload = {
  drawerSocketId: string;
  drawerNickname: string;
  wordMasked: string;
  secondsPerTurn: number;
  round: number;
};

export type TurnEndPayload = {
  word: string;
  scores: Array<{ socketId: string; nickname: string; score: number; delta: number }>;
};

export type GameEndPayload = {
  finalScores: Array<{ socketId: string; userId: string | null; nickname: string; score: number }>;
};
