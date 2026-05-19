import { customAlphabet, nanoid } from "nanoid";
import type { Server, Socket } from "socket.io";
import type {
  ChatMessage,
  Difficulty,
  Player,
  PublicRoomSummary,
  RoomSnapshot,
  Stroke,
  StrokeBatch,
  WordCategory,
} from "@/types/game";
import type { ClientToServerEvents, ServerToClientEvents } from "@/types/socket";
import { isCorrectGuess, maskWord, pickWords } from "./wordBank";
import { DRAWER_POINTS_PER_GUESS, guesserPoints } from "./scoring";
import { persistGameScores } from "@/lib/supabase/persistence";

const inviteCodeGen = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);
const roomIdGen = customAlphabet("abcdefghijkmnopqrstuvwxyz0123456789", 8);

type IO = Server<ClientToServerEvents, ServerToClientEvents>;
type RoomSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

type GameRoom = {
  id: string;
  inviteCode: string;
  name: string;
  hostSocketId: string;
  hostNickname: string;
  isPrivate: boolean;
  maxPlayers: number;
  totalRounds: number;
  currentRound: number;
  status: "waiting" | "in_progress" | "ended";
  difficulty: Difficulty;
  secondsPerTurn: number;
  selectedCategories: WordCategory[];
  players: Map<string, Player>;
  drawOrder: string[];
  roundDrawOrder: string[];
  currentDrawerSocketId: string | null;
  currentWord: string | null;
  turnTimeoutHandle: NodeJS.Timeout | null;
  tickHandle: NodeJS.Timeout | null;
  turnStartedAt: number | null;
  correctGuessCount: number;
  drawerTurnScore: number;
  pendingChoices: { drawerSocketId: string; words: string[]; offered: string[] } | null;
  choiceTimeoutHandle: NodeJS.Timeout | null;
  choiceStartedAt: number | null;
  pendingJoins: Array<{ socketId: string; nickname: string; userId: string | null }>;
  voiceParticipants: Set<string>;
  // Post-game rematch
  rematchVotes: Set<string>;
  rematchTimerHandle: NodeJS.Timeout | null;
  rematchCountdown: number;
  createdAt: number;
};

type Store = {
  rooms: Map<string, GameRoom>;
  codeToRoomId: Map<string, string>;
  socketRoomBinding: Map<string, string>;
};
const g = globalThis as unknown as { __meddraw_store?: Store };
const store: Store = g.__meddraw_store ?? {
  rooms: new Map(),
  codeToRoomId: new Map(),
  socketRoomBinding: new Map(),
};
g.__meddraw_store = store;
const { rooms, codeToRoomId, socketRoomBinding } = store;

const DEFAULT_SECONDS_PER_TURN = 80;
const POST_TURN_PAUSE_MS = 4000;
const CHOICE_SECONDS = 15;
const CHOICE_INITIAL = 3;
const REMATCH_COUNTDOWN = 30;

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function listPublicRooms(): PublicRoomSummary[] {
  return Array.from(rooms.values())
    .filter((r) => !r.isPrivate && r.status !== "ended")
    .map((r) => ({
      id: r.id,
      name: r.name,
      hostNickname: r.hostNickname,
      playerCount: r.players.size,
      maxPlayers: r.maxPlayers,
      status: r.status,
      difficulty: r.difficulty,
      totalRounds: r.totalRounds,
      selectedCategories: r.selectedCategories,
    }));
}

function broadcastRoomList(io: IO) {
  io.to("lobby").emit("lobby:rooms", { rooms: listPublicRooms() });
}

function buildSnapshot(room: GameRoom): RoomSnapshot {
  const secondsLeft =
    room.status === "in_progress" && room.turnStartedAt
      ? Math.max(0, room.secondsPerTurn - Math.floor((Date.now() - room.turnStartedAt) / 1000))
      : null;
  return {
    id: room.id,
    name: room.name,
    inviteCode: room.inviteCode,
    isPrivate: room.isPrivate,
    maxPlayers: room.maxPlayers,
    totalRounds: room.totalRounds,
    currentRound: room.currentRound,
    status: room.status,
    difficulty: room.difficulty,
    secondsPerTurn: room.secondsPerTurn,
    hostSocketId: room.hostSocketId,
    players: Array.from(room.players.values()),
    currentDrawerSocketId: room.currentDrawerSocketId,
    wordMasked: room.currentWord ? maskWord(room.currentWord) : null,
    secondsLeft,
    pendingJoins: room.pendingJoins.map((p) => ({ socketId: p.socketId, nickname: p.nickname })),
    selectedCategories: room.selectedCategories,
  };
}

function broadcastRoom(io: IO, room: GameRoom) {
  io.to(room.id).emit("room:updated", buildSnapshot(room));
}

function systemMessage(io: IO, roomId: string, text: string) {
  const msg: ChatMessage = {
    id: nanoid(8),
    socketId: null,
    nickname: "system",
    text,
    kind: "system",
    ts: Date.now(),
  };
  io.to(roomId).emit("chat:message", msg);
}

function clampMaxPlayers(n: number) {
  if (!Number.isFinite(n)) return 8;
  return Math.max(2, Math.min(10, Math.floor(n)));
}

function clampRounds(n: number) {
  if (!Number.isFinite(n)) return 3;
  return Math.max(1, Math.min(5, Math.floor(n)));
}

function clampSeconds(n: number) {
  if (!Number.isFinite(n)) return DEFAULT_SECONDS_PER_TURN;
  return Math.max(30, Math.min(180, Math.floor(n)));
}

function findRoomBySocketId(socketId: string): GameRoom | undefined {
  const roomId = socketRoomBinding.get(socketId);
  if (!roomId) return undefined;
  return rooms.get(roomId);
}

function leaveCurrentRoom(io: IO, socket: RoomSocket) {
  const room = findRoomBySocketId(socket.id);
  if (!room) {
    for (const r of rooms.values()) {
      const idx = r.pendingJoins.findIndex((p) => p.socketId === socket.id);
      if (idx !== -1) {
        r.pendingJoins.splice(idx, 1);
        broadcastRoom(io, r);
      }
    }
    return;
  }

  const player = room.players.get(socket.id);
  room.players.delete(socket.id);
  if (room.voiceParticipants.has(socket.id)) {
    room.voiceParticipants.delete(socket.id);
    socket.to(room.id).emit("voice:peer_left", { socketId: socket.id });
  }
  room.rematchVotes.delete(socket.id);
  socketRoomBinding.delete(socket.id);
  socket.leave(room.id);

  if (player) systemMessage(io, room.id, `${player.nickname} left`);

  if (room.players.size === 0) {
    cleanupRoom(room, io);
    return;
  }

  // Host migration
  if (room.hostSocketId === socket.id) {
    const next = room.players.values().next().value;
    if (next) {
      next.isHost = true;
      room.hostSocketId = next.socketId;
      systemMessage(io, room.id, `${next.nickname} is now host`);
    }
  }

  // Drawer left mid-turn
  if (room.status === "in_progress" && room.currentDrawerSocketId === socket.id) {
    if (room.pendingChoices?.drawerSocketId === socket.id) {
      if (room.choiceTimeoutHandle) clearTimeout(room.choiceTimeoutHandle);
      room.choiceTimeoutHandle = null;
      room.pendingChoices = null;
      room.choiceStartedAt = null;
      room.currentDrawerSocketId = null;
      systemMessage(io, room.id, "Drawer left during word selection");
      setTimeout(() => { if (rooms.has(room.id)) startTurn(io, room); }, 500);
    } else {
      endTurn(io, room, { drawerLeft: true });
    }
    return;
  }

  // Only 1 player left during a game — abort immediately
  if (room.status === "in_progress" && room.players.size < 2) {
    abortGame(io, room);
    return;
  }

  broadcastRoom(io, room);
  broadcastRoomList(io);
}

function leaveVoice(io: IO, room: GameRoom, socketId: string) {
  if (!room.voiceParticipants.has(socketId)) return;
  room.voiceParticipants.delete(socketId);
  io.to(room.id).emit("voice:peer_left", { socketId });
}

function cleanupRoom(room: GameRoom, io?: IO) {
  if (room.turnTimeoutHandle) clearTimeout(room.turnTimeoutHandle);
  if (room.tickHandle) clearInterval(room.tickHandle);
  if (room.choiceTimeoutHandle) clearTimeout(room.choiceTimeoutHandle);
  if (room.rematchTimerHandle) clearInterval(room.rematchTimerHandle);
  rooms.delete(room.id);
  codeToRoomId.delete(room.inviteCode);
  if (io) broadcastRoomList(io);
}

function buildDrawOrder(room: GameRoom): string[] {
  // Follow the pre-shuffled round order; skip players who've already drawn or left
  return room.roundDrawOrder.filter(
    (sid) => room.players.has(sid) && !room.players.get(sid)!.hasDrawnThisRound,
  );
}

function resetRoundDrawOrder(room: GameRoom) {
  room.roundDrawOrder = shuffle(Array.from(room.players.keys()));
}

function startTurn(io: IO, room: GameRoom) {
  const order = buildDrawOrder(room);
  if (order.length === 0) { endRound(io, room); return; }
  const drawerId = order[0];
  const drawer = room.players.get(drawerId);
  if (!drawer) { endRound(io, room); return; }

  for (const p of room.players.values()) p.hasGuessedThisTurn = false;

  const choices = pickWords(room.selectedCategories, CHOICE_INITIAL);
  room.pendingChoices = { drawerSocketId: drawerId, words: choices, offered: [...choices] };
  room.currentDrawerSocketId = drawerId;
  room.currentWord = null;
  room.choiceStartedAt = Date.now();

  io.to(room.id).emit("game:choosing", {
    drawerSocketId: drawerId,
    drawerNickname: drawer.nickname,
    round: room.currentRound,
  });
  io.to(drawerId).emit("game:word_choices", {
    words: choices,
    canRequestMore: true,
    secondsLeft: CHOICE_SECONDS,
  });
  systemMessage(io, room.id, `${drawer.nickname} is choosing a word…`);

  if (room.choiceTimeoutHandle) clearTimeout(room.choiceTimeoutHandle);
  room.choiceTimeoutHandle = setTimeout(() => {
    if (room.pendingChoices?.drawerSocketId === drawerId) {
      const auto = room.pendingChoices.words[Math.floor(Math.random() * room.pendingChoices.words.length)];
      commitTurn(io, room, auto);
    }
  }, CHOICE_SECONDS * 1000);

  broadcastRoom(io, room);
}

function commitTurn(io: IO, room: GameRoom, word: string) {
  if (!room.pendingChoices) return;
  const drawerId = room.pendingChoices.drawerSocketId;
  const drawer = room.players.get(drawerId);
  if (!drawer) return;

  if (room.choiceTimeoutHandle) { clearTimeout(room.choiceTimeoutHandle); room.choiceTimeoutHandle = null; }
  room.pendingChoices = null;
  room.choiceStartedAt = null;
  room.currentWord = word;
  room.correctGuessCount = 0;
  room.drawerTurnScore = 0;
  room.turnStartedAt = Date.now();

  io.to(room.id).emit("game:turn_start", {
    drawerSocketId: drawerId,
    drawerNickname: drawer.nickname,
    wordMasked: maskWord(word),
    secondsPerTurn: room.secondsPerTurn,
    round: room.currentRound,
  });
  io.to(drawerId).emit("game:word_for_drawer", { word });
  io.to(room.id).emit("draw:clear");
  systemMessage(io, room.id, `${drawer.nickname} is drawing now`);

  if (room.turnTimeoutHandle) clearTimeout(room.turnTimeoutHandle);
  room.turnTimeoutHandle = setTimeout(() => endTurn(io, room, { drawerLeft: false }), room.secondsPerTurn * 1000);

  if (room.tickHandle) clearInterval(room.tickHandle);
  room.tickHandle = setInterval(() => {
    if (!room.turnStartedAt) return;
    const sl = room.secondsPerTurn - Math.floor((Date.now() - room.turnStartedAt) / 1000);
    io.to(room.id).emit("game:tick", { secondsLeft: Math.max(0, sl) });
  }, 1000);

  broadcastRoom(io, room);
}

function endTurn(io: IO, room: GameRoom, opts: { drawerLeft: boolean }) {
  if (room.turnTimeoutHandle) { clearTimeout(room.turnTimeoutHandle); room.turnTimeoutHandle = null; }
  if (room.tickHandle) { clearInterval(room.tickHandle); room.tickHandle = null; }

  const word = room.currentWord ?? "";
  const drawerId = room.currentDrawerSocketId;
  const drawer = drawerId ? room.players.get(drawerId) : null;
  if (drawer) drawer.hasDrawnThisRound = true;

  const scores = Array.from(room.players.values()).map((p) => ({
    socketId: p.socketId, nickname: p.nickname, score: p.score, delta: 0,
  }));
  io.to(room.id).emit("game:turn_end", { word, scores });

  systemMessage(io, room.id, opts.drawerLeft
    ? `Drawer left — the word was "${word}"`
    : `Time's up! The word was "${word}"`);

  room.currentDrawerSocketId = null;
  room.currentWord = null;
  room.turnStartedAt = null;

  setTimeout(() => {
    if (!rooms.has(room.id) || room.status !== "in_progress") return;
    if (buildDrawOrder(room).length === 0) endRound(io, room);
    else startTurn(io, room);
  }, POST_TURN_PAUSE_MS);
}

function endRound(io: IO, room: GameRoom) {
  io.to(room.id).emit("game:round_end", { round: room.currentRound, totalRounds: room.totalRounds });
  if (room.currentRound >= room.totalRounds) { endGame(io, room); return; }
  room.currentRound += 1;
  for (const p of room.players.values()) p.hasDrawnThisRound = false;
  resetRoundDrawOrder(room);
  systemMessage(io, room.id, `Round ${room.currentRound} of ${room.totalRounds}`);
  startTurn(io, room);
}

function endGame(io: IO, room: GameRoom) {
  room.status = "ended";
  if (room.turnTimeoutHandle) { clearTimeout(room.turnTimeoutHandle); room.turnTimeoutHandle = null; }
  if (room.tickHandle) { clearInterval(room.tickHandle); room.tickHandle = null; }

  const finalScores = Array.from(room.players.values())
    .map((p) => ({ socketId: p.socketId, userId: p.userId, nickname: p.nickname, score: p.score }))
    .sort((a, b) => b.score - a.score);

  io.to(room.id).emit("game:end", { finalScores });
  systemMessage(io, room.id, `Game over! Winner: ${finalScores[0]?.nickname ?? "—"}`);

  void persistGameScores(
    room.name,
    finalScores.map((s) => ({ userId: s.userId, nickname: s.nickname, score: s.score })),
  );

  // Start 30-second rematch countdown
  room.rematchVotes = new Set();
  room.rematchCountdown = REMATCH_COUNTDOWN;

  function emitRematch() {
    io.to(room.id).emit("game:rematch_update", {
      votes: room.rematchVotes.size,
      required: room.players.size,
      countdown: room.rematchCountdown,
    });
  }

  emitRematch();
  room.rematchTimerHandle = setInterval(() => {
    room.rematchCountdown -= 1;
    emitRematch();
    if (room.rematchCountdown <= 0) {
      if (room.rematchTimerHandle) clearInterval(room.rematchTimerHandle);
      room.rematchTimerHandle = null;
      io.to(room.id).emit("game:rematch_cancelled");
      // Reset room to waiting
      resetToWaiting(io, room);
    }
  }, 1000);

  broadcastRoom(io, room);
}

function abortGame(io: IO, room: GameRoom) {
  room.status = "ended";
  if (room.turnTimeoutHandle) { clearTimeout(room.turnTimeoutHandle); room.turnTimeoutHandle = null; }
  if (room.tickHandle) { clearInterval(room.tickHandle); room.tickHandle = null; }
  if (room.choiceTimeoutHandle) { clearTimeout(room.choiceTimeoutHandle); room.choiceTimeoutHandle = null; }
  room.currentDrawerSocketId = null;
  room.currentWord = null;
  io.to(room.id).emit("game:aborted", { message: "Not enough players — returning to waiting room" });
  broadcastRoom(io, room);
  broadcastRoomList(io);
  setTimeout(() => {
    if (!rooms.has(room.id)) return;
    resetToWaiting(io, room);
  }, 5000);
}

function resetToWaiting(io: IO, room: GameRoom) {
  room.status = "waiting";
  room.currentRound = 1;
  room.currentDrawerSocketId = null;
  room.currentWord = null;
  room.turnStartedAt = null;
  room.rematchVotes = new Set();
  for (const p of room.players.values()) {
    p.score = 0;
    p.hasDrawnThisRound = false;
    p.hasGuessedThisTurn = false;
  }
  broadcastRoom(io, room);
  broadcastRoomList(io);
  systemMessage(io, room.id, "Returned to lobby — host can start a new game");
}

function handleCorrectGuess(io: IO, room: GameRoom, guesser: Player) {
  if (guesser.hasGuessedThisTurn || !room.currentWord) return;
  if (room.currentDrawerSocketId === guesser.socketId) return;

  guesser.hasGuessedThisTurn = true;
  room.correctGuessCount += 1;

  const secondsLeft = room.turnStartedAt
    ? Math.max(0, room.secondsPerTurn - Math.floor((Date.now() - room.turnStartedAt) / 1000))
    : 0;
  const points = guesserPoints(room.correctGuessCount, secondsLeft, room.secondsPerTurn);
  guesser.score += points;

  const drawer = room.currentDrawerSocketId ? room.players.get(room.currentDrawerSocketId) : null;
  if (drawer) { drawer.score += DRAWER_POINTS_PER_GUESS; room.drawerTurnScore += DRAWER_POINTS_PER_GUESS; }

  io.to(room.id).emit("chat:correct_guess", { socketId: guesser.socketId, nickname: guesser.nickname });
  systemMessage(io, room.id, `${guesser.nickname} guessed the word! (+${points})`);

  const nonDrawerCount = Array.from(room.players.values()).filter(
    (p) => p.socketId !== room.currentDrawerSocketId,
  ).length;
  if (room.correctGuessCount >= nonDrawerCount) {
    endTurn(io, room, { drawerLeft: false });
  } else {
    broadcastRoom(io, room);
  }
}

function attachPlayer(
  io: IO, socket: RoomSocket, room: GameRoom, nickname: string, userId: string | null,
) {
  const currentRoomId = socketRoomBinding.get(socket.id);
  if (currentRoomId === room.id) {
    if (room.players.has(socket.id)) {
      socket.emit("room:joined", buildSnapshot(room));
      return;
    }
  }
  if (currentRoomId && currentRoomId !== room.id) leaveCurrentRoom(io, socket);

  const player: Player = {
    socketId: socket.id,
    userId,
    nickname: (nickname || "Player").slice(0, 20),
    score: 0,
    hasDrawnThisRound: false,
    hasGuessedThisTurn: false,
    isHost: false,
  };
  room.players.set(socket.id, player);
  socketRoomBinding.set(socket.id, room.id);
  socket.join(room.id);
  socket.emit("room:joined", buildSnapshot(room));
  systemMessage(io, room.id, `${player.nickname} joined`);
  broadcastRoom(io, room);
  broadcastRoomList(io);
}

export function registerSocketHandlers(io: IO) {
  io.on("connection", (socket: RoomSocket) => {

    socket.on("room:create", (payload, ack) => {
      try {
        const id = roomIdGen();
        const inviteCode = inviteCodeGen();
        const hostNick = (payload.hostNickname || "Player").slice(0, 20);
        const room: GameRoom = {
          id, inviteCode,
          name: (payload.name || "Untitled Room").slice(0, 40),
          hostSocketId: socket.id,
          hostNickname: hostNick,
          isPrivate: !!payload.isPrivate,
          maxPlayers: clampMaxPlayers(payload.maxPlayers),
          totalRounds: clampRounds(payload.rounds),
          currentRound: 1,
          status: "waiting",
          difficulty: payload.difficulty ?? "medium",
          secondsPerTurn: clampSeconds(payload.secondsPerTurn ?? DEFAULT_SECONDS_PER_TURN),
          selectedCategories: Array.isArray(payload.selectedCategories) ? payload.selectedCategories : [],
          players: new Map(),
          drawOrder: [],
          roundDrawOrder: [],
          currentDrawerSocketId: null,
          currentWord: null,
          turnTimeoutHandle: null,
          tickHandle: null,
          turnStartedAt: null,
          correctGuessCount: 0,
          drawerTurnScore: 0,
          pendingChoices: null,
          choiceTimeoutHandle: null,
          choiceStartedAt: null,
          pendingJoins: [],
          voiceParticipants: new Set(),
          rematchVotes: new Set(),
          rematchTimerHandle: null,
          rematchCountdown: 0,
          createdAt: Date.now(),
        };
        const host: Player = {
          socketId: socket.id,
          userId: payload.hostUserId ?? null,
          nickname: (payload.hostNickname || "Player").slice(0, 20),
          score: 0, hasDrawnThisRound: false, hasGuessedThisTurn: false, isHost: true,
        };
        room.players.set(socket.id, host);
        rooms.set(id, room);
        codeToRoomId.set(inviteCode, id);
        socketRoomBinding.set(socket.id, id);
        socket.join(id);
        ack({ ok: true, roomId: id, inviteCode });
        socket.emit("room:joined", buildSnapshot(room));
        broadcastRoomList(io);
      } catch (e) {
        ack({ ok: false, error: (e as Error).message });
      }
    });

    socket.on("room:join", (payload, ack) => {
      const room = rooms.get(payload.roomId);
      if (!room) { ack({ ok: false, error: "Room not found" }); return; }
      if (room.status === "in_progress") { ack({ ok: false, error: "Game is already in progress" }); return; }
      if (room.status === "ended") { ack({ ok: false, error: "Game has ended" }); return; }
      if (room.players.size >= room.maxPlayers) { ack({ ok: false, error: "Room is full" }); return; }

      const currentRoomId = socketRoomBinding.get(socket.id);
      if (currentRoomId === room.id && room.players.has(socket.id)) {
        socket.emit("room:joined", buildSnapshot(room));
        ack({ ok: true });
        return;
      }
      if (!room.isPrivate) {
        const nickname = (payload.nickname || "Player").slice(0, 20);
        if (!room.pendingJoins.some((p) => p.socketId === socket.id)) {
          room.pendingJoins.push({ socketId: socket.id, nickname, userId: payload.userId ?? null });
          broadcastRoom(io, room);
        }
        ack({ ok: true, pending: true });
        return;
      }
      attachPlayer(io, socket, room, payload.nickname, payload.userId ?? null);
      ack({ ok: true });
    });

    socket.on("room:approve_join", (payload) => {
      const room = findRoomBySocketId(socket.id);
      if (!room || room.hostSocketId !== socket.id) return;
      const pending = room.pendingJoins.find((p) => p.socketId === payload.socketId);
      if (!pending) return;
      room.pendingJoins = room.pendingJoins.filter((p) => p.socketId !== payload.socketId);
      if (room.status !== "waiting") { broadcastRoom(io, room); return; }
      if (room.players.size >= room.maxPlayers) {
        io.to(pending.socketId).emit("room:error", { message: "Room is full" });
        broadcastRoom(io, room);
        return;
      }
      const targetSocket = io.sockets.sockets.get(pending.socketId);
      if (!targetSocket) { broadcastRoom(io, room); return; }
      attachPlayer(io, targetSocket as RoomSocket, room, pending.nickname, pending.userId);
    });

    socket.on("room:reject_join", (payload) => {
      const room = findRoomBySocketId(socket.id);
      if (!room || room.hostSocketId !== socket.id) return;
      room.pendingJoins = room.pendingJoins.filter((p) => p.socketId !== payload.socketId);
      io.to(payload.socketId).emit("room:join_rejected");
      broadcastRoom(io, room);
    });

    socket.on("room:join_code", (payload, ack) => {
      const roomId = codeToRoomId.get(payload.code.toUpperCase());
      if (!roomId) { ack({ ok: false, error: "Invalid invite code" }); return; }
      const room = rooms.get(roomId);
      if (!room) { ack({ ok: false, error: "Room not found" }); return; }
      if (room.players.size >= room.maxPlayers) { ack({ ok: false, error: "Room is full" }); return; }
      if (room.status === "in_progress") { ack({ ok: false, error: "Game is already in progress" }); return; }
      if (room.status === "ended") { ack({ ok: false, error: "Game has ended" }); return; }
      attachPlayer(io, socket, room, payload.nickname, payload.userId ?? null);
      ack({ ok: true, roomId });
    });

    socket.on("room:leave", () => leaveCurrentRoom(io, socket));

    socket.on("room:kick_player", (payload) => {
      const room = findRoomBySocketId(socket.id);
      if (!room || room.hostSocketId !== socket.id) return;
      if (payload.socketId === socket.id) return; // can't kick yourself
      const target = room.players.get(payload.socketId);
      if (!target) return;
      const targetSocket = io.sockets.sockets.get(payload.socketId);
      if (targetSocket) leaveCurrentRoom(io, targetSocket as RoomSocket);
      io.to(payload.socketId).emit("room:error", { message: "You were removed from the room" });
      systemMessage(io, room.id, `${target.nickname} was removed`);
    });

    socket.on("room:transfer_host", (payload) => {
      const room = findRoomBySocketId(socket.id);
      if (!room || room.hostSocketId !== socket.id) return;
      const target = room.players.get(payload.socketId);
      if (!target || payload.socketId === socket.id) return;
      const prev = room.players.get(socket.id);
      if (prev) prev.isHost = false;
      target.isHost = true;
      room.hostSocketId = payload.socketId;
      room.hostNickname = target.nickname;
      systemMessage(io, room.id, `${target.nickname} is now host`);
      broadcastRoom(io, room);
      broadcastRoomList(io);
    });

    socket.on("room:set_settings", (payload) => {
      const room = findRoomBySocketId(socket.id);
      if (!room || room.hostSocketId !== socket.id || room.status !== "waiting") return;
      if (payload.secondsPerTurn !== undefined) room.secondsPerTurn = clampSeconds(payload.secondsPerTurn);
      if (payload.selectedCategories !== undefined) room.selectedCategories = payload.selectedCategories;
      if (payload.totalRounds !== undefined) room.totalRounds = clampRounds(payload.totalRounds);
      broadcastRoom(io, room);
      broadcastRoomList(io);
    });

    socket.on("game:start", () => {
      const room = findRoomBySocketId(socket.id);
      if (!room || room.hostSocketId !== socket.id) return;
      if (room.players.size < 2) { socket.emit("room:error", { message: "Need at least 2 players" }); return; }
      if (room.status !== "waiting") return;
      room.status = "in_progress";
      room.currentRound = 1;
      for (const p of room.players.values()) {
        p.score = 0; p.hasDrawnThisRound = false; p.hasGuessedThisTurn = false;
      }
      resetRoundDrawOrder(room);
      io.to(room.id).emit("game:starting", { countdown: 3 });
      broadcastRoomList(io);
      systemMessage(io, room.id, `Round 1 of ${room.totalRounds}`);
      setTimeout(() => { if (rooms.has(room.id)) startTurn(io, room); }, 3000);
    });

    socket.on("game:vote_rematch", () => {
      const room = findRoomBySocketId(socket.id);
      if (!room || room.status !== "ended") return;
      if (!room.players.has(socket.id)) return;
      room.rematchVotes.add(socket.id);
      const required = room.players.size;
      io.to(room.id).emit("game:rematch_update", {
        votes: room.rematchVotes.size,
        required,
        countdown: room.rematchCountdown,
      });
      if (room.rematchVotes.size >= required) {
        if (room.rematchTimerHandle) { clearInterval(room.rematchTimerHandle); room.rematchTimerHandle = null; }
        io.to(room.id).emit("game:rematch_start");
        setTimeout(() => {
          if (!rooms.has(room.id)) return;
          resetToWaiting(io, room);
          // Auto-start game
          room.status = "in_progress";
          room.currentRound = 1;
          for (const p of room.players.values()) {
            p.score = 0; p.hasDrawnThisRound = false; p.hasGuessedThisTurn = false;
          }
          resetRoundDrawOrder(room);
          io.to(room.id).emit("game:starting", { countdown: 3 });
          systemMessage(io, room.id, `Round 1 of ${room.totalRounds}`);
          setTimeout(() => { if (rooms.has(room.id)) startTurn(io, room); }, 3000);
        }, 1000);
      }
    });

    socket.on("game:choose_word", (payload) => {
      const room = findRoomBySocketId(socket.id);
      if (!room?.pendingChoices || room.pendingChoices.drawerSocketId !== socket.id) return;
      const word = payload?.word;
      if (typeof word !== "string" || !room.pendingChoices.words.includes(word)) return;
      commitTurn(io, room, word);
    });

    socket.on("game:more_choices", () => {
      const room = findRoomBySocketId(socket.id);
      if (!room?.pendingChoices || room.pendingChoices.drawerSocketId !== socket.id) return;
      const offered = room.pendingChoices.offered;
      const extra = pickWords(room.selectedCategories, CHOICE_INITIAL, offered);
      // If we've exhausted the word bank, reset so we can cycle again
      const actualOffered = extra.length > 0 ? offered : [];
      const fresh = extra.length > 0 ? extra : pickWords(room.selectedCategories, CHOICE_INITIAL, []);
      room.pendingChoices.words = fresh;
      room.pendingChoices.offered = [...actualOffered, ...fresh];
      const secondsLeft = room.choiceStartedAt
        ? Math.max(0, CHOICE_SECONDS - Math.floor((Date.now() - room.choiceStartedAt) / 1000))
        : CHOICE_SECONDS;
      socket.emit("game:word_choices", { words: fresh, canRequestMore: true, secondsLeft });
    });

    socket.on("draw:stroke", (batch: StrokeBatch) => {
      const room = findRoomBySocketId(socket.id);
      if (!room || room.currentDrawerSocketId !== socket.id) return;
      if (!batch?.strokes || !Array.isArray(batch.strokes)) return;
      const sanitized: Stroke[] = batch.strokes
        .filter((s) => s && Number.isFinite(s.x) && Number.isFinite(s.y))
        .slice(0, 200);
      if (sanitized.length === 0) return;
      socket.to(room.id).emit("draw:stroke", { strokes: sanitized });
    });

    socket.on("draw:clear", () => {
      const room = findRoomBySocketId(socket.id);
      if (!room || room.currentDrawerSocketId !== socket.id) return;
      socket.to(room.id).emit("draw:clear");
    });

    socket.on("chat:message", (payload) => {
      const room = findRoomBySocketId(socket.id);
      if (!room) return;
      const player = room.players.get(socket.id);
      if (!player) return;
      const text = (payload?.text || "").trim().slice(0, 120);
      if (!text) return;
      if (room.status === "in_progress" && room.currentDrawerSocketId === socket.id) {
        socket.emit("room:error", { message: "Drawer cannot send messages" });
        return;
      }
      if (room.status === "in_progress" && room.currentWord && !player.hasGuessedThisTurn &&
          isCorrectGuess(text, room.currentWord)) {
        handleCorrectGuess(io, room, player);
        return;
      }
      if (player.hasGuessedThisTurn) {
        socket.emit("room:error", { message: "You already guessed!" });
        return;
      }
      const msg: ChatMessage = {
        id: nanoid(8), socketId: socket.id, nickname: player.nickname,
        text, kind: "chat", ts: Date.now(),
      };
      io.to(room.id).emit("chat:message", msg);
    });

    socket.on("voice:join", () => {
      const room = findRoomBySocketId(socket.id);
      if (!room) return;
      const player = room.players.get(socket.id);
      if (!player || room.voiceParticipants.has(socket.id)) return;
      const existingPeers = Array.from(room.voiceParticipants)
        .map((sid) => { const p = room.players.get(sid); return p ? { socketId: sid, nickname: p.nickname } : null; })
        .filter((p): p is { socketId: string; nickname: string } => p !== null);
      socket.emit("voice:peers", { peers: existingPeers });
      socket.to(room.id).emit("voice:peer_joined", { socketId: socket.id, nickname: player.nickname });
      room.voiceParticipants.add(socket.id);
    });

    socket.on("voice:leave", () => {
      const room = findRoomBySocketId(socket.id);
      if (room) leaveVoice(io, room, socket.id);
    });

    socket.on("voice:signal", (payload) => {
      const room = findRoomBySocketId(socket.id);
      if (!room) return;
      io.to(payload.targetSocketId).emit("voice:signal", { fromSocketId: socket.id, signal: payload.signal });
    });

    socket.on("voice:speaking", (payload) => {
      const room = findRoomBySocketId(socket.id);
      if (!room) return;
      // Relay to all room members
      socket.to(room.id).emit("voice:speaking", { socketId: socket.id, speaking: payload.speaking });
    });

    socket.on("lobby:subscribe", () => {
      socket.join("lobby");
      socket.emit("lobby:rooms", { rooms: listPublicRooms() });
    });

    socket.on("disconnect", () => leaveCurrentRoom(io, socket));
  });
}
