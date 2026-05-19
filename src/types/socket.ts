import type {
  ChatMessage,
  Difficulty,
  GameEndPayload,
  RoomSnapshot,
  StrokeBatch,
  TurnEndPayload,
  TurnStartPayload,
  WordCategory,
} from "./game";

export type VoiceSignalPayload = RTCSessionDescriptionInit | RTCIceCandidateInit;

export type ClientToServerEvents = {
  "room:create": (
    payload: {
      name: string;
      maxPlayers: number;
      rounds: number;
      isPrivate: boolean;
      difficulty: Difficulty;
      secondsPerTurn: number;
      selectedCategories: WordCategory[];
      hostNickname: string;
      hostUserId?: string | null;
    },
    ack: (res: { ok: true; roomId: string; inviteCode: string } | { ok: false; error: string }) => void,
  ) => void;
  "room:join": (
    payload: { roomId: string; nickname: string; userId?: string | null },
    ack: (res: { ok: true; pending?: boolean } | { ok: false; error: string }) => void,
  ) => void;
  "room:join_code": (
    payload: { code: string; nickname: string; userId?: string | null },
    ack: (res: { ok: true; roomId: string } | { ok: false; error: string }) => void,
  ) => void;
  "room:leave": () => void;
  "lobby:subscribe": () => void;
  "room:approve_join": (payload: { socketId: string }) => void;
  "room:reject_join": (payload: { socketId: string }) => void;
  "room:kick_player": (payload: { socketId: string }) => void;
  "room:transfer_host": (payload: { socketId: string }) => void;
  "room:set_settings": (payload: {
    secondsPerTurn?: number;
    selectedCategories?: WordCategory[];
    totalRounds?: number;
  }) => void;
  "game:start": () => void;
  "game:choose_word": (payload: { word: string }) => void;
  "game:more_choices": () => void;
  "game:vote_rematch": () => void;
  "draw:stroke": (batch: StrokeBatch) => void;
  "draw:clear": () => void;
  "chat:message": (payload: { text: string }) => void;
  "voice:join": () => void;
  "voice:leave": () => void;
  "voice:signal": (payload: { targetSocketId: string; signal: VoiceSignalPayload }) => void;
  "voice:speaking": (payload: { speaking: boolean }) => void;
};

export type ServerToClientEvents = {
  "room:joined": (snapshot: RoomSnapshot) => void;
  "room:updated": (snapshot: RoomSnapshot) => void;
  "room:error": (payload: { message: string }) => void;
  "room:join_rejected": () => void;
  "game:starting": (payload: { countdown: number }) => void;
  "game:choosing": (payload: { drawerSocketId: string; drawerNickname: string; round: number }) => void;
  "game:word_choices": (payload: { words: string[]; canRequestMore: boolean; secondsLeft: number }) => void;
  "game:turn_start": (payload: TurnStartPayload) => void;
  "game:word_for_drawer": (payload: { word: string }) => void;
  "game:turn_end": (payload: TurnEndPayload) => void;
  "game:round_end": (payload: { round: number; totalRounds: number }) => void;
  "game:end": (payload: GameEndPayload) => void;
  "game:tick": (payload: { secondsLeft: number }) => void;
  "game:rematch_update": (payload: { votes: number; required: number; countdown: number }) => void;
  "game:rematch_start": () => void;
  "game:rematch_cancelled": () => void;
  "game:aborted": (payload: { message: string }) => void;
  "lobby:rooms": (payload: { rooms: import("./game").PublicRoomSummary[] }) => void;
  "draw:stroke": (batch: StrokeBatch) => void;
  "draw:clear": () => void;
  "chat:message": (msg: ChatMessage) => void;
  "chat:correct_guess": (payload: { socketId: string; nickname: string }) => void;
  "voice:peers": (payload: { peers: Array<{ socketId: string; nickname: string }> }) => void;
  "voice:peer_joined": (payload: { socketId: string; nickname: string }) => void;
  "voice:peer_left": (payload: { socketId: string }) => void;
  "voice:signal": (payload: { fromSocketId: string; signal: VoiceSignalPayload }) => void;
  "voice:speaking": (payload: { socketId: string; speaking: boolean }) => void;
};
