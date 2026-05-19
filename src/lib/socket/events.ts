export const EVT = {
  room: {
    create: "room:create",
    join: "room:join",
    joinCode: "room:join_code",
    leave: "room:leave",
    joined: "room:joined",
    updated: "room:updated",
    error: "room:error",
  },
  game: {
    start: "game:start",
    starting: "game:starting",
    turnStart: "game:turn_start",
    wordForDrawer: "game:word_for_drawer",
    turnEnd: "game:turn_end",
    roundEnd: "game:round_end",
    end: "game:end",
    tick: "game:tick",
  },
  draw: {
    stroke: "draw:stroke",
    clear: "draw:clear",
  },
  chat: {
    message: "chat:message",
    correctGuess: "chat:correct_guess",
  },
} as const;
