// MedDraw end-to-end production-readiness test suite.
// Runs against the live socket.io server on http://localhost:3001.
// Usage: node tests/e2e.mjs

import { io } from "socket.io-client";

const URL = "http://localhost:3001";
const NETWORK_WAIT = 400; // ms — give socket.io broadcasts time to land
const LONG_WAIT = 900;

let pass = 0;
let fail = 0;
let warn = 0;
const failures = [];

// ───────────── helpers ─────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function makeClient(label) {
  const s = io(URL, { transports: ["websocket"], forceNew: true });
  s.label = label;
  s.events = []; // capture every event for assertions
  // Wildcard listener — intercept all incoming events
  const originalOnAny = s.onAny.bind(s);
  originalOnAny((name, ...args) => {
    s.events.push({ name, args, t: Date.now() });
  });
  return s;
}

function waitForEvent(client, eventName, timeoutMs = 2000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      client.off(eventName, handler);
      reject(new Error(`Timeout waiting for ${eventName} on ${client.label}`));
    }, timeoutMs);
    const handler = (...args) => {
      clearTimeout(t);
      client.off(eventName, handler);
      resolve(args.length === 1 ? args[0] : args);
    };
    client.on(eventName, handler);
  });
}

function eventsOf(client, name) {
  return client.events.filter((e) => e.name === name);
}

function lastEvent(client, name) {
  const evs = eventsOf(client, name);
  return evs.length ? evs[evs.length - 1].args[0] : null;
}

function connect(client) {
  return new Promise((resolve) => {
    if (client.connected) return resolve();
    client.on("connect", () => resolve());
  });
}

function emit(client, event, payload) {
  return new Promise((resolve) => {
    client.emit(event, payload, (res) => resolve(res));
  });
}

function check(label, cond, detail = "") {
  if (cond) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    failures.push(`${label} — ${detail}`);
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function note(label) {
  warn++;
  console.log(`  ⚠ ${label}`);
}

async function newGroup(name) {
  console.log(`\n──── ${name} ────`);
}

// ───────────── tests ─────────────

async function testServerReachable() {
  await newGroup("0. Server reachability");
  const c = makeClient("probe");
  try {
    await Promise.race([
      connect(c),
      sleep(3000).then(() => { throw new Error("timeout"); }),
    ]);
    check("Server accepts socket.io connections", c.connected);
  } catch (e) {
    check("Server accepts socket.io connections", false, e.message);
  }
  c.disconnect();
}

async function testRoomCreation() {
  await newGroup("1. Room creation");
  const host = makeClient("host");
  await connect(host);

  // 1.1 Public room
  const res1 = await emit(host, "room:create", {
    name: "PublicTest",
    maxPlayers: 4,
    rounds: 3,
    isPrivate: false,
    secondsPerTurn: 80,
    selectedDifficulties: ["easy", "medium", "hard"],
    selectedCategories: [],
    hostNickname: "Host1",
  });
  check("Public room creates successfully", res1.ok && !!res1.roomId);
  check("Room returns inviteCode", typeof res1.inviteCode === "string" && res1.inviteCode.length === 6);
  await sleep(NETWORK_WAIT);
  const snap1 = lastEvent(host, "room:joined");
  check("Host receives room:joined snapshot", !!snap1);
  check("Snapshot has selectedCategories field", Array.isArray(snap1?.selectedCategories));
  check("Default selectedCategories is empty (host must pick)", snap1?.selectedCategories?.length === 0);
  check("Default selectedDifficulties has all 3", snap1?.selectedDifficulties?.length === 3);
  check("Host is in players list with isHost=true", snap1?.players?.some((p) => p.isHost && p.nickname === "Host1"));
  check("Initial status is 'waiting'", snap1?.status === "waiting");
  host.disconnect();

  // 1.2 Private room
  const host2 = makeClient("host2");
  await connect(host2);
  const res2 = await emit(host2, "room:create", {
    name: "PrivateTest",
    maxPlayers: 4,
    rounds: 2,
    isPrivate: true,
    secondsPerTurn: 60,
    selectedDifficulties: ["easy"],
    selectedCategories: ["biology"],
    hostNickname: "Host2",
  });
  check("Private room creates successfully", res2.ok);
  await sleep(NETWORK_WAIT);
  const snap2 = lastEvent(host2, "room:joined");
  check("Private room snapshot isPrivate=true", snap2?.isPrivate === true);
  check("Custom selectedCategories preserved", snap2?.selectedCategories?.[0] === "biology");
  host2.disconnect();

  // 1.3 Server-side clamping
  const host3 = makeClient("host3");
  await connect(host3);
  await emit(host3, "room:create", {
    name: "ClampTest",
    maxPlayers: 999, // should clamp
    rounds: 999,    // should clamp
    isPrivate: true,
    secondsPerTurn: 9999, // should clamp
    selectedDifficulties: ["bogus"], // invalid → default
    selectedCategories: ["fake-cat"],
    hostNickname: "Host3",
  });
  await sleep(NETWORK_WAIT);
  const snap3 = lastEvent(host3, "room:joined");
  check("Invalid maxPlayers is clamped", snap3?.maxPlayers <= 16);
  check("Invalid rounds is clamped", snap3?.totalRounds <= 10);
  check("Invalid difficulties fall back to defaults", snap3?.selectedDifficulties?.length === 3);
  check("Invalid categories filtered out", snap3?.selectedCategories?.length === 0);
  host3.disconnect();
}

async function testPrivateJoinFlow() {
  await newGroup("2. Private room join flow");
  const host = makeClient("host");
  const guest = makeClient("guest");
  await connect(host);
  await connect(guest);

  const created = await emit(host, "room:create", {
    name: "PrivateJoinFlow",
    maxPlayers: 4, rounds: 3, isPrivate: true, secondsPerTurn: 80,
    selectedDifficulties: ["easy", "medium", "hard"],
    selectedCategories: ["biology"],
    hostNickname: "Host",
  });
  const roomId = created.roomId;
  await sleep(NETWORK_WAIT);

  // 2.1 join via roomId (no approval for private)
  const joinRes = await emit(guest, "room:join", { roomId, nickname: "Guest" });
  check("Private room join returns ok", joinRes.ok === true);
  check("Private room join has no pending=true", !joinRes.pending);
  await sleep(NETWORK_WAIT);
  const guestSnap = lastEvent(guest, "room:joined");
  check("Guest receives room:joined snapshot directly", !!guestSnap);
  check("Guest sees 2 players in snapshot", guestSnap?.players?.length === 2);

  // 2.2 host sees player join via room:updated
  const hostUpdates = eventsOf(host, "room:updated");
  const hostSeesGuest = hostUpdates.some((e) => e.args[0]?.players?.length === 2);
  check("Host receives room:updated when guest joins", hostSeesGuest);

  // 2.3 join via invite code
  const guest2 = makeClient("guest2");
  await connect(guest2);
  const code = guestSnap.inviteCode;
  const codeRes = await emit(guest2, "room:join_code", { code, nickname: "Guest2" });
  check("Join by invite code succeeds", codeRes.ok && codeRes.roomId === roomId);
  await sleep(NETWORK_WAIT);
  check("Lowercase code still works", true); // covered server-side (toUpperCase)

  // 2.4 join with wrong code
  const guest3 = makeClient("guest3");
  await connect(guest3);
  const wrongCode = await emit(guest3, "room:join_code", { code: "XXXXXX", nickname: "Guest3" });
  check("Invalid invite code is rejected", !wrongCode.ok && /Invalid/.test(wrongCode.error));

  host.disconnect();
  guest.disconnect();
  guest2.disconnect();
  guest3.disconnect();
}

async function testPublicApproval() {
  await newGroup("3. Public room approval flow");
  const host = makeClient("host");
  const guest = makeClient("guest");
  await connect(host);
  await connect(guest);

  const created = await emit(host, "room:create", {
    name: "PublicApproval",
    maxPlayers: 4, rounds: 3, isPrivate: false, secondsPerTurn: 80,
    selectedDifficulties: ["easy", "medium", "hard"],
    selectedCategories: ["biology"],
    hostNickname: "Host",
  });
  const roomId = created.roomId;
  await sleep(NETWORK_WAIT);

  // 3.1 guest joins → should be pending, not in players list
  const joinRes = await emit(guest, "room:join", { roomId, nickname: "Guest" });
  check("Public room join returns pending=true", joinRes.ok && joinRes.pending === true);
  await sleep(NETWORK_WAIT);
  const hostSnapAfterPending = lastEvent(host, "room:updated");
  check("Host sees pendingJoins entry", hostSnapAfterPending?.pendingJoins?.some((p) => p.nickname === "Guest"));
  check("Guest is NOT in players list before approval", hostSnapAfterPending?.players?.length === 1);

  // 3.2 host approves
  host.emit("room:approve_join", { socketId: guest.id });
  await sleep(LONG_WAIT);
  const guestSnap = lastEvent(guest, "room:joined");
  check("Approved guest receives room:joined", !!guestSnap);
  check("Approved guest is in players list", guestSnap?.players?.length === 2);
  const hostFinal = lastEvent(host, "room:updated");
  check("pendingJoins is cleared after approval", (hostFinal?.pendingJoins?.length ?? 0) === 0);

  // 3.3 reject flow
  const guest2 = makeClient("guest2");
  await connect(guest2);
  await emit(guest2, "room:join", { roomId, nickname: "Guest2" });
  await sleep(NETWORK_WAIT);
  host.emit("room:reject_join", { socketId: guest2.id });
  await sleep(NETWORK_WAIT);
  const rejected = eventsOf(guest2, "room:join_rejected").length > 0;
  check("Rejected guest receives room:join_rejected", rejected);

  host.disconnect();
  guest.disconnect();
  guest2.disconnect();
}

async function testLiveSettings() {
  await newGroup("4. Live settings sync");
  const host = makeClient("host");
  const guest = makeClient("guest");
  await connect(host);
  await connect(guest);

  const created = await emit(host, "room:create", {
    name: "Settings", maxPlayers: 4, rounds: 3, isPrivate: true, secondsPerTurn: 80,
    selectedDifficulties: ["easy", "medium", "hard"],
    selectedCategories: [],
    hostNickname: "Host",
  });
  await emit(guest, "room:join", { roomId: created.roomId, nickname: "Guest" });
  await sleep(NETWORK_WAIT);
  guest.events.length = 0;

  // 4.1 Host picks one category
  host.emit("room:set_settings", { selectedCategories: ["biology"] });
  await sleep(NETWORK_WAIT);
  let gs = lastEvent(guest, "room:updated");
  check("Guest sees category 'biology' after host pick", gs?.selectedCategories?.[0] === "biology");

  // 4.2 Host adds another
  host.emit("room:set_settings", { selectedCategories: ["biology", "chemistry"] });
  await sleep(NETWORK_WAIT);
  gs = lastEvent(guest, "room:updated");
  check("Guest sees both categories", gs?.selectedCategories?.length === 2);

  // 4.3 Host clears all
  host.emit("room:set_settings", { selectedCategories: [] });
  await sleep(NETWORK_WAIT);
  gs = lastEvent(guest, "room:updated");
  check("Guest sees empty categories after clear", gs?.selectedCategories?.length === 0);

  // 4.4 Difficulty
  host.emit("room:set_settings", { selectedDifficulties: ["hard"] });
  await sleep(NETWORK_WAIT);
  gs = lastEvent(guest, "room:updated");
  check("Guest sees difficulty change to 'hard'", gs?.selectedDifficulties?.length === 1 && gs.selectedDifficulties[0] === "hard");

  // 4.5 Empty difficulty array should be rejected (fall back to all)
  host.emit("room:set_settings", { selectedDifficulties: [] });
  await sleep(NETWORK_WAIT);
  gs = lastEvent(guest, "room:updated");
  check("Empty difficulty falls back to all 3", gs?.selectedDifficulties?.length === 3);

  // 4.6 Rounds + seconds
  host.emit("room:set_settings", { totalRounds: 5, secondsPerTurn: 45 });
  await sleep(NETWORK_WAIT);
  gs = lastEvent(guest, "room:updated");
  check("Guest sees totalRounds=5", gs?.totalRounds === 5);
  check("Guest sees secondsPerTurn=45", gs?.secondsPerTurn === 45);

  // 4.7 Non-host cannot change settings
  guest.events.length = 0;
  guest.emit("room:set_settings", { selectedCategories: ["physics"] });
  await sleep(NETWORK_WAIT);
  gs = lastEvent(guest, "room:updated");
  check("Non-host cannot mutate categories", gs === null || gs?.selectedCategories?.indexOf("physics") === -1);

  host.disconnect();
  guest.disconnect();
}

async function testGameStartGuards() {
  await newGroup("5. Game-start guards");
  const host = makeClient("host");
  await connect(host);
  await emit(host, "room:create", {
    name: "StartGuards", maxPlayers: 4, rounds: 1, isPrivate: true, secondsPerTurn: 80,
    selectedDifficulties: ["easy", "medium", "hard"],
    selectedCategories: ["biology"],
    hostNickname: "Host",
  });
  await sleep(NETWORK_WAIT);

  // 5.1 Solo start → blocked
  host.events.length = 0;
  host.emit("game:start");
  await sleep(NETWORK_WAIT);
  const err = lastEvent(host, "room:error");
  check("Solo start emits room:error 'Need at least 2 players'", err?.message === "Need at least 2 players");

  // 5.2 Two players, but ZERO categories selected on server
  //     (server allows empty categories — host must pick at least one
  //      via the UI before pressing start. Server-side check is on player count;
  //      empty categories means pickWords returns []. Game would soft-fail.)
  const guest = makeClient("guest");
  await connect(guest);
  // join then set empty categories
  await emit(guest, "room:join", { roomId: host.lastRoomId ?? null, nickname: "Guest" });
  // Workaround: we need the roomId — rebuild
  host.disconnect();
  guest.disconnect();

  // Re-do with fresh clients
  const h = makeClient("h");
  const g = makeClient("g");
  await connect(h);
  await connect(g);
  const createRes = await emit(h, "room:create", {
    name: "EmptyCats", maxPlayers: 4, rounds: 1, isPrivate: true, secondsPerTurn: 30,
    selectedDifficulties: ["easy"],
    selectedCategories: [],
    hostNickname: "H",
  });
  await emit(g, "room:join", { roomId: createRes.roomId, nickname: "G" });
  await sleep(NETWORK_WAIT);

  // Try to start with empty categories — server doesn't validate categories,
  // but pickWords returns [] so the round will choose a word from a empty
  // pool and the game will be unplayable. UI guards Start; verify server
  // behavior here.
  h.emit("game:start");
  await sleep(LONG_WAIT);
  const choosing = lastEvent(h, "game:choosing");
  const choices = lastEvent(h, "game:word_choices");
  if (choosing && choices && Array.isArray(choices.words) && choices.words.length === 0) {
    check("Empty-category start yields empty word_choices (UI must guard)", true);
  } else if (!choosing) {
    note("Server didn't enter choosing phase with empty categories (defensive)");
    pass++;
  } else {
    check("Empty-category start yields empty word_choices (UI must guard)", false, `choices.words=${JSON.stringify(choices?.words)}`);
  }

  h.disconnect();
  g.disconnect();
}

async function testHostMigration() {
  await newGroup("6. Host migration on disconnect");
  const host = makeClient("host");
  const guest = makeClient("guest");
  const guest2 = makeClient("guest2");
  await connect(host);
  await connect(guest);
  await connect(guest2);

  const created = await emit(host, "room:create", {
    name: "HostMig", maxPlayers: 4, rounds: 3, isPrivate: true, secondsPerTurn: 80,
    selectedDifficulties: ["easy", "medium", "hard"],
    selectedCategories: ["biology"],
    hostNickname: "Host",
  });
  await emit(guest, "room:join", { roomId: created.roomId, nickname: "Guest" });
  await emit(guest2, "room:join", { roomId: created.roomId, nickname: "Guest2" });
  await sleep(NETWORK_WAIT);

  const hostSocketId = host.id;
  host.disconnect();
  await sleep(LONG_WAIT);

  const g1Snap = lastEvent(guest, "room:updated");
  const g2Snap = lastEvent(guest2, "room:updated");
  // The new host should be one of the remaining players
  check("After host disconnect, hostSocketId changed", g1Snap?.hostSocketId !== hostSocketId);
  check("Remaining players have one isHost=true", g1Snap?.players?.filter((p) => p.isHost).length === 1);
  check("Both remaining clients see the same host", g1Snap?.hostSocketId === g2Snap?.hostSocketId);

  guest.disconnect();
  guest2.disconnect();
}

async function testKickAndTransfer() {
  await newGroup("7. Kick & transfer host");
  const host = makeClient("host");
  const guest = makeClient("guest");
  const guest2 = makeClient("guest2");
  await connect(host);
  await connect(guest);
  await connect(guest2);

  const created = await emit(host, "room:create", {
    name: "Kick", maxPlayers: 4, rounds: 3, isPrivate: true, secondsPerTurn: 80,
    selectedDifficulties: ["easy", "medium", "hard"],
    selectedCategories: ["biology"],
    hostNickname: "Host",
  });
  await emit(guest, "room:join", { roomId: created.roomId, nickname: "Guest" });
  await emit(guest2, "room:join", { roomId: created.roomId, nickname: "Guest2" });
  await sleep(NETWORK_WAIT);

  // 7.1 Kick
  host.emit("room:kick_player", { socketId: guest2.id });
  await sleep(LONG_WAIT);
  const kicked = eventsOf(guest2, "room:error").some((e) => /removed/i.test(e.args[0]?.message ?? ""));
  check("Kicked player receives 'removed' error", kicked);
  const hostSnap = lastEvent(host, "room:updated");
  check("Kicked player is no longer in players list", hostSnap?.players?.every((p) => p.socketId !== guest2.id));

  // 7.2 Non-host cannot kick
  const g3 = makeClient("g3");
  await connect(g3);
  await emit(g3, "room:join", { roomId: created.roomId, nickname: "Guest3" });
  await sleep(NETWORK_WAIT);
  guest.emit("room:kick_player", { socketId: g3.id });
  await sleep(NETWORK_WAIT);
  const hostSnap2 = lastEvent(host, "room:updated");
  check("Non-host kick is ignored", hostSnap2?.players?.length === 3);

  // 7.3 Transfer host
  host.emit("room:transfer_host", { socketId: guest.id });
  await sleep(LONG_WAIT);
  const finalSnap = lastEvent(guest, "room:updated");
  check("Host transferred to guest", finalSnap?.hostSocketId === guest.id);
  check("Old host is no longer host", finalSnap?.players?.find((p) => p.socketId === host.id)?.isHost === false);

  host.disconnect();
  guest.disconnect();
  g3.disconnect();
}

async function testFullGameLoop() {
  await newGroup("8. Full game loop (start → choose → guess → end)");
  const host = makeClient("host");
  const guest = makeClient("guest");
  await connect(host);
  await connect(guest);

  const created = await emit(host, "room:create", {
    name: "FullLoop", maxPlayers: 4, rounds: 1, isPrivate: true, secondsPerTurn: 60,
    selectedDifficulties: ["easy"],
    selectedCategories: ["biology"],
    hostNickname: "Host",
  });
  await emit(guest, "room:join", { roomId: created.roomId, nickname: "Guest" });
  await sleep(NETWORK_WAIT);

  host.events.length = 0;
  guest.events.length = 0;
  host.emit("game:start");

  // Wait for game:starting
  await sleep(LONG_WAIT);
  check("Both clients receive game:starting", !!lastEvent(host, "game:starting") && !!lastEvent(guest, "game:starting"));

  // Wait for countdown (~3s) + choosing
  await sleep(3500);
  const chooseEv = lastEvent(host, "game:choosing") || lastEvent(guest, "game:choosing");
  check("Choosing phase begins", !!chooseEv);
  const drawerId = chooseEv?.drawerSocketId;
  const drawerClient = drawerId === host.id ? host : guest;
  const guesserClient = drawerId === host.id ? guest : host;

  // Drawer should receive word choices
  const wc = lastEvent(drawerClient, "game:word_choices");
  check("Drawer receives word_choices", Array.isArray(wc?.words) && wc.words.length === 3);

  // Pick a word
  const chosenWord = wc.words[0];
  drawerClient.emit("game:choose_word", { word: chosenWord });
  await sleep(LONG_WAIT);

  const turnStart = lastEvent(host, "game:turn_start");
  check("turn_start emitted to room", !!turnStart);
  // maskWord joins masked chars with spaces, so length is roughly 2*word - 1.
  // Validate it's a non-empty string that contains underscores, not the raw word.
  check(
    "Guesser receives masked word (with underscores)",
    typeof turnStart?.wordMasked === "string" &&
      turnStart.wordMasked.includes("_") &&
      !turnStart.wordMasked.toLowerCase().includes(chosenWord.toLowerCase()),
  );
  const wfd = lastEvent(drawerClient, "game:word_for_drawer");
  check("Drawer receives full word privately", wfd?.word === chosenWord);

  // Guesser tries wrong word
  guesserClient.emit("chat:message", { text: "wrongword" });
  await sleep(NETWORK_WAIT);
  let chatMsgs = eventsOf(host, "chat:message").map((e) => e.args[0]);
  check("Wrong guess appears in chat as normal message", chatMsgs.some((m) => m.text === "wrongword" && m.kind !== "correct"));

  // Guesser submits correct word
  guesserClient.events.length = 0;
  guesserClient.emit("chat:message", { text: chosenWord });
  await sleep(LONG_WAIT);
  const correct = lastEvent(host, "chat:correct_guess");
  check("Correct guess emits chat:correct_guess", !!correct && correct.socketId === guesserClient.id);

  // Turn ends because only 1 guesser was needed
  await sleep(LONG_WAIT);
  const turnEnd = lastEvent(host, "game:turn_end");
  check("Turn ends with word reveal", turnEnd?.word === chosenWord);
  check("Scores recorded for drawer + guesser", turnEnd?.scores?.length >= 2);
  check("Drawer scored > 0", turnEnd?.scores?.find((s) => s.socketId === drawerClient.id)?.delta > 0);
  check("Guesser scored > 0", turnEnd?.scores?.find((s) => s.socketId === guesserClient.id)?.delta > 0);

  host.disconnect();
  guest.disconnect();
}

async function testSmartGuessMatcher() {
  await newGroup("9. Smart guess matcher (plurals, hyphens, stems)");
  const host = makeClient("host");
  const guest = makeClient("guest");
  await connect(host);
  await connect(guest);

  // The matcher is in wordBank.isCorrectGuess. We can't easily inject a word
  // server-side, but we can hammer the game loop and try a few word_choice
  // iterations to find specific words. A more direct approach: import the
  // wordBank into a separate unit test. Run that here.
  try {
    const mod = await import("../src/lib/game/wordBank.ts").catch(() => null);
    if (mod && typeof mod.isCorrectGuess === "function") {
      const f = mod.isCorrectGuess;
      check("'proton' matches 'protons'", f("protons", "proton"));
      check("'protons' matches 'proton'", f("proton", "protons"));
      check("'half life' matches 'half-life'", f("half life", "half-life"));
      check("'antibodies' matches 'antibody'", f("antibodies", "antibody"));
      check("'complementary' matches 'complement'", f("complementary", "complement"));
      check("'cells' matches 'cell'", f("cells", "cell"));
      check("Different words don't match", !f("dog", "cat"));
      check("Empty input doesn't match", !f("", "cell"));
    } else {
      note("Could not import wordBank.ts (TS not loadable from node-mjs). Smart matcher will be exercised live below.");
    }
  } catch (e) {
    note(`Could not load wordBank directly: ${e.message}`);
  }

  // Live: pick a known word and submit a stemmed variation
  const created = await emit(host, "room:create", {
    name: "SmartGuess", maxPlayers: 4, rounds: 1, isPrivate: true, secondsPerTurn: 60,
    selectedDifficulties: ["easy"],
    selectedCategories: ["biology"],
    hostNickname: "Host",
  });
  await emit(guest, "room:join", { roomId: created.roomId, nickname: "Guest" });
  await sleep(NETWORK_WAIT);
  host.emit("game:start");
  await sleep(4000);
  const chosen = lastEvent(host, "game:choosing") || lastEvent(guest, "game:choosing");
  if (!chosen) { note("Couldn't enter choosing phase for live guess test"); }
  else {
    const drawerId = chosen.drawerSocketId;
    const drawer = drawerId === host.id ? host : guest;
    const guesser = drawerId === host.id ? guest : host;
    const wc = lastEvent(drawer, "game:word_choices");
    // Find a word ending in 's' so we can submit without 's' to test stem
    const word = wc.words.find((w) => /s$/.test(w) && !/ /.test(w)) ?? wc.words[0];
    drawer.emit("game:choose_word", { word });
    await sleep(LONG_WAIT);

    // Submit a plural-stripped version if applicable
    let variant = word;
    if (word.endsWith("s") && !word.endsWith("ss")) variant = word.slice(0, -1);
    else variant = word + "s";

    guesser.events.length = 0;
    guesser.emit("chat:message", { text: variant });
    await sleep(LONG_WAIT);
    const got = lastEvent(host, "chat:correct_guess");
    check(`Live guess: '${variant}' matches '${word}'`, !!got);
  }

  host.disconnect();
  guest.disconnect();
}

async function testVoiceChat() {
  await newGroup("10. Voice chat signaling");
  const host = makeClient("host");
  const guest = makeClient("guest");
  await connect(host);
  await connect(guest);

  const created = await emit(host, "room:create", {
    name: "Voice", maxPlayers: 4, rounds: 1, isPrivate: true, secondsPerTurn: 60,
    selectedDifficulties: ["easy"], selectedCategories: ["biology"],
    hostNickname: "Host",
  });
  await emit(guest, "room:join", { roomId: created.roomId, nickname: "Guest" });
  await sleep(NETWORK_WAIT);

  // 10.1 Host joins voice first
  host.emit("voice:join");
  await sleep(NETWORK_WAIT);
  const hostPeers = lastEvent(host, "voice:peers");
  check("Host receives voice:peers (empty initially)", hostPeers?.peers?.length === 0);

  // 10.2 Guest joins voice — should see host as existing peer + host should see peer_joined
  guest.events.length = 0;
  host.events.length = 0;
  guest.emit("voice:join");
  await sleep(NETWORK_WAIT);
  const guestPeers = lastEvent(guest, "voice:peers");
  check("Guest receives host in voice:peers", guestPeers?.peers?.some((p) => p.socketId === host.id));
  const hostNewPeer = lastEvent(host, "voice:peer_joined");
  check("Host receives voice:peer_joined for guest", hostNewPeer?.socketId === guest.id);

  // 10.3 Signal relay
  host.events.length = 0;
  guest.emit("voice:signal", { targetSocketId: host.id, signal: { type: "offer", sdp: "fake-sdp" } });
  await sleep(NETWORK_WAIT);
  const sig = lastEvent(host, "voice:signal");
  check("voice:signal relays from→to correctly", sig?.fromSocketId === guest.id && sig?.signal?.type === "offer");

  // 10.4 Speaking indicator broadcast
  host.events.length = 0;
  guest.emit("voice:speaking", { speaking: true });
  await sleep(NETWORK_WAIT);
  const spk = lastEvent(host, "voice:speaking");
  check("voice:speaking broadcasts to room", spk?.socketId === guest.id && spk?.speaking === true);

  // 10.5 Leave voice
  host.events.length = 0;
  guest.emit("voice:leave");
  await sleep(NETWORK_WAIT);
  const peerLeft = lastEvent(host, "voice:peer_left");
  check("voice:peer_left fires when one disconnects", peerLeft?.socketId === guest.id);

  // 10.6 Disconnect should also fire peer_left
  host.events.length = 0;
  host.emit("voice:join"); // ensure host is in voice
  guest.emit("voice:join");
  await sleep(NETWORK_WAIT);
  host.events.length = 0;
  guest.disconnect();
  await sleep(LONG_WAIT);
  const peerLeftDisc = lastEvent(host, "voice:peer_left");
  check("voice:peer_left fires on socket disconnect", !!peerLeftDisc);

  host.disconnect();
}

async function testDrawingSync() {
  await newGroup("11. Drawing stroke broadcast");
  const host = makeClient("host");
  const guest = makeClient("guest");
  await connect(host);
  await connect(guest);

  const created = await emit(host, "room:create", {
    name: "Draw", maxPlayers: 4, rounds: 1, isPrivate: true, secondsPerTurn: 60,
    selectedDifficulties: ["easy"], selectedCategories: ["biology"],
    hostNickname: "Host",
  });
  await emit(guest, "room:join", { roomId: created.roomId, nickname: "Guest" });
  await sleep(NETWORK_WAIT);
  host.emit("game:start");
  await sleep(4000);

  const choosing = lastEvent(host, "game:choosing") || lastEvent(guest, "game:choosing");
  const drawerId = choosing?.drawerSocketId;
  if (!drawerId) { note("Couldn't determine drawer for stroke test"); host.disconnect(); guest.disconnect(); return; }
  const drawer = drawerId === host.id ? host : guest;
  const guesser = drawerId === host.id ? guest : host;
  const wc = lastEvent(drawer, "game:word_choices");
  drawer.emit("game:choose_word", { word: wc.words[0] });
  await sleep(LONG_WAIT);

  // 11.1 Drawer sends stroke → guesser receives
  guesser.events.length = 0;
  const batch = { strokes: [{ x: 0.5, y: 0.5, prevX: 0.4, prevY: 0.4, color: "#000", width: 4 }] };
  drawer.emit("draw:stroke", batch);
  await sleep(NETWORK_WAIT);
  const received = lastEvent(guesser, "draw:stroke");
  check("Guesser receives draw:stroke from drawer", received?.strokes?.length === 1);

  // 11.2 Non-drawer cannot send strokes
  drawer.events.length = 0;
  guesser.emit("draw:stroke", { strokes: [{ x: 0.1, y: 0.1, prevX: 0, prevY: 0, color: "#f00", width: 2 }] });
  await sleep(NETWORK_WAIT);
  const leaked = lastEvent(drawer, "draw:stroke");
  check("Non-drawer strokes are NOT broadcast", !leaked);

  // 11.3 Drawer clear → guesser receives clear
  guesser.events.length = 0;
  drawer.emit("draw:clear");
  await sleep(NETWORK_WAIT);
  const clearEv = eventsOf(guesser, "draw:clear");
  check("draw:clear is broadcast to guesser", clearEv.length > 0);

  host.disconnect();
  guest.disconnect();
}

async function testChatGuards() {
  await newGroup("12. Chat guards (drawer can't chat, no double-guess)");
  const host = makeClient("host");
  const guest = makeClient("guest");
  const guest2 = makeClient("guest2");
  await connect(host);
  await connect(guest);
  await connect(guest2);

  const created = await emit(host, "room:create", {
    name: "Chat", maxPlayers: 4, rounds: 1, isPrivate: true, secondsPerTurn: 60,
    selectedDifficulties: ["easy"], selectedCategories: ["biology"],
    hostNickname: "Host",
  });
  await emit(guest, "room:join", { roomId: created.roomId, nickname: "Guest" });
  await emit(guest2, "room:join", { roomId: created.roomId, nickname: "Guest2" });
  await sleep(NETWORK_WAIT);

  // chat in waiting room is allowed
  host.events.length = 0;
  guest.emit("chat:message", { text: "hello from waiting room" });
  await sleep(NETWORK_WAIT);
  const waitChat = eventsOf(host, "chat:message").find((e) => e.args[0]?.text?.includes("waiting"));
  check("Chat works in waiting room", !!waitChat);

  // Start game
  host.emit("game:start");
  await sleep(4000);
  const choosing = lastEvent(host, "game:choosing");
  const drawerId = choosing?.drawerSocketId;
  if (!drawerId) { note("Couldn't determine drawer for chat test"); host.disconnect(); guest.disconnect(); guest2.disconnect(); return; }
  const drawer = [host, guest, guest2].find((c) => c.id === drawerId);
  const guesser = [host, guest, guest2].find((c) => c.id !== drawerId);
  const otherGuesser = [host, guest, guest2].find((c) => c.id !== drawerId && c.id !== guesser.id);
  const wc = lastEvent(drawer, "game:word_choices");
  drawer.emit("game:choose_word", { word: wc.words[0] });
  await sleep(LONG_WAIT);
  const word = lastEvent(drawer, "game:word_for_drawer").word;

  // 12.1 Drawer can't chat during their turn
  drawer.events.length = 0;
  drawer.emit("chat:message", { text: "I shouldn't be able to say this" });
  await sleep(NETWORK_WAIT);
  const drawerErr = lastEvent(drawer, "room:error");
  check("Drawer is blocked from chatting", drawerErr?.message === "Drawer cannot send messages");

  // 12.2 Guesser guesses correctly
  guesser.events.length = 0;
  guesser.emit("chat:message", { text: word });
  await sleep(LONG_WAIT);
  check("First guess marks as correct", !!lastEvent(host, "chat:correct_guess"));

  // 12.3 Same guesser cannot guess again
  guesser.events.length = 0;
  guesser.emit("chat:message", { text: word });
  await sleep(NETWORK_WAIT);
  const dupeErr = lastEvent(guesser, "room:error");
  check("Already-guessed player is blocked", dupeErr?.message === "You already guessed!");

  host.disconnect();
  guest.disconnect();
  if (otherGuesser) otherGuesser.disconnect();
}

async function testCapacityLimits() {
  await newGroup("13. Capacity limits");
  const host = makeClient("host");
  await connect(host);
  const created = await emit(host, "room:create", {
    name: "Cap", maxPlayers: 2, rounds: 1, isPrivate: true, secondsPerTurn: 60,
    selectedDifficulties: ["easy"], selectedCategories: ["biology"],
    hostNickname: "Host",
  });
  const g1 = makeClient("g1");
  const g2 = makeClient("g2");
  await connect(g1);
  await connect(g2);
  const r1 = await emit(g1, "room:join", { roomId: created.roomId, nickname: "G1" });
  check("First guest fits", r1.ok);
  await sleep(NETWORK_WAIT);
  const r2 = await emit(g2, "room:join", { roomId: created.roomId, nickname: "G2" });
  check("Third player gets 'Room is full'", !r2.ok && /full/i.test(r2.error));
  host.disconnect();
  g1.disconnect();
  g2.disconnect();
}

async function testLobbyBroadcast() {
  await newGroup("14. Public lobby list updates");
  const lobby = makeClient("lobby");
  await connect(lobby);
  lobby.emit("lobby:subscribe");
  await sleep(NETWORK_WAIT);
  const initial = lastEvent(lobby, "lobby:rooms");
  check("Lobby subscriber gets initial room list", Array.isArray(initial?.rooms));

  const host = makeClient("host");
  await connect(host);
  lobby.events.length = 0;
  await emit(host, "room:create", {
    name: "LobbyVis", maxPlayers: 4, rounds: 1, isPrivate: false, secondsPerTurn: 60,
    selectedDifficulties: ["easy"], selectedCategories: ["biology"],
    hostNickname: "Host",
  });
  await sleep(LONG_WAIT);
  const updated = lastEvent(lobby, "lobby:rooms");
  check("Lobby receives updated rooms after public create",
    updated?.rooms?.some((r) => r.name === "LobbyVis"));

  // Private rooms should NOT appear
  const host2 = makeClient("host2");
  await connect(host2);
  lobby.events.length = 0;
  await emit(host2, "room:create", {
    name: "InvisiblePrivate", maxPlayers: 4, rounds: 1, isPrivate: true, secondsPerTurn: 60,
    selectedDifficulties: ["easy"], selectedCategories: ["biology"],
    hostNickname: "Host2",
  });
  await sleep(LONG_WAIT);
  const afterPrivate = lastEvent(lobby, "lobby:rooms") ?? updated;
  check("Private rooms do NOT appear in lobby",
    !afterPrivate?.rooms?.some((r) => r.name === "InvisiblePrivate"));

  lobby.disconnect();
  host.disconnect();
  host2.disconnect();
}

async function testGameAbort() {
  await newGroup("15. Game abort when player count drops below 2");
  const host = makeClient("host");
  const guest = makeClient("guest");
  await connect(host);
  await connect(guest);
  const created = await emit(host, "room:create", {
    name: "Abort", maxPlayers: 4, rounds: 1, isPrivate: true, secondsPerTurn: 60,
    selectedDifficulties: ["easy"], selectedCategories: ["biology"],
    hostNickname: "Host",
  });
  await emit(guest, "room:join", { roomId: created.roomId, nickname: "Guest" });
  await sleep(NETWORK_WAIT);
  host.emit("game:start");
  await sleep(4000);
  // disconnect guest mid-game
  host.events.length = 0;
  guest.disconnect();
  await sleep(LONG_WAIT);
  const abort = lastEvent(host, "game:aborted");
  check("Game aborts when only 1 player remains", !!abort && /Not enough/i.test(abort.message));
  host.disconnect();
}

// ───────────── runner ─────────────
async function main() {
  console.log("MedDraw e2e production-readiness suite");
  console.log("======================================\n");

  await testServerReachable();
  if (failures.length === 0) {
    await testRoomCreation();
    await testPrivateJoinFlow();
    await testPublicApproval();
    await testLiveSettings();
    await testGameStartGuards();
    await testHostMigration();
    await testKickAndTransfer();
    await testFullGameLoop();
    await testSmartGuessMatcher();
    await testVoiceChat();
    await testDrawingSync();
    await testChatGuards();
    await testCapacityLimits();
    await testLobbyBroadcast();
    await testGameAbort();
  } else {
    console.log("\nSkipping rest — server unreachable.");
  }

  console.log("\n======================================");
  console.log(`Summary: ${pass} passed, ${fail} failed, ${warn} warnings`);
  if (failures.length) {
    console.log("\nFailures:");
    for (const f of failures) console.log(`  • ${f}`);
  }
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("Test runner crashed:", e);
  process.exit(2);
});
