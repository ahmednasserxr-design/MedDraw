let _ctx: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === "suspended") _ctx.resume().catch(() => {});
  return _ctx;
}

function tone(
  freq: number,
  dur: number,
  opts: { type?: OscillatorType; vol?: number; delay?: number } = {},
) {
  const c = ctx();
  if (!c) return;
  const { type = "sine", vol = 0.18, delay = 0 } = opts;
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise(dur: number, vol = 0.1, delay = 0) {
  const c = ctx();
  if (!c) return;
  const bufSize = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, bufSize, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol, c.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + delay + dur);
  src.connect(gain);
  gain.connect(c.destination);
  src.start(c.currentTime + delay);
}

export type SoundName =
  | "click"
  | "click-primary"
  | "click-danger"
  | "success"
  | "turn-start"
  | "turn-end"
  | "game-start"
  | "game-end"
  | "word-chosen"
  | "shuffle"
  | "timer-tick"
  | "timer-warning"
  | "rematch-vote"
  | "player-join"
  | "player-leave"
  | "chat-incoming"
  | "correct-guess"
  | "aborted";

export function playSound(name: SoundName) {
  try {
    switch (name) {
      // UI clicks
      case "click":
        tone(700, 0.055, { vol: 0.1 });
        break;
      case "click-primary":
        tone(900, 0.06, { vol: 0.14 });
        tone(1100, 0.08, { delay: 0.05, vol: 0.1 });
        break;
      case "click-danger":
        tone(280, 0.12, { type: "sawtooth", vol: 0.1 });
        break;

      // Correct guess — bright ascending arpeggio
      case "success":
      case "correct-guess":
        tone(523, 0.12, { vol: 0.2 });
        tone(659, 0.12, { delay: 0.09, vol: 0.22 });
        tone(784, 0.22, { delay: 0.18, vol: 0.25 });
        break;

      // Turn transitions
      case "turn-start":
        tone(440, 0.1, { vol: 0.15 });
        tone(880, 0.18, { delay: 0.09, vol: 0.2 });
        break;
      case "turn-end":
        tone(500, 0.08, { vol: 0.14 });
        tone(380, 0.1, { delay: 0.07, vol: 0.16 });
        tone(250, 0.2, { delay: 0.16, vol: 0.13 });
        break;

      // Game start — four rising notes
      case "game-start":
        tone(330, 0.09, { vol: 0.18 });
        tone(440, 0.09, { delay: 0.11, vol: 0.2 });
        tone(550, 0.09, { delay: 0.22, vol: 0.22 });
        tone(660, 0.28, { delay: 0.33, vol: 0.25 });
        break;

      // Game end — four falling notes
      case "game-end":
        tone(660, 0.1, { vol: 0.2 });
        tone(550, 0.1, { delay: 0.12, vol: 0.2 });
        tone(440, 0.1, { delay: 0.24, vol: 0.2 });
        tone(330, 0.3, { delay: 0.36, vol: 0.18 });
        break;

      // Aborted — low descending
      case "aborted":
        tone(400, 0.1, { vol: 0.16 });
        tone(300, 0.2, { delay: 0.1, vol: 0.14 });
        break;

      // Word pick confirmation
      case "word-chosen":
        tone(620, 0.07, { vol: 0.16 });
        tone(930, 0.14, { delay: 0.06, vol: 0.2 });
        break;

      // Shuffle options — quick noise whoosh
      case "shuffle":
        noise(0.05, 0.14);
        tone(450, 0.07, { delay: 0.02, vol: 0.1 });
        break;

      // Timer sounds
      case "timer-tick":
        tone(900, 0.022, { vol: 0.07 });
        break;
      case "timer-warning":
        tone(1050, 0.04, { vol: 0.15 });
        break;

      // Rematch vote — double chime
      case "rematch-vote":
        tone(660, 0.08, { vol: 0.15 });
        tone(880, 0.14, { delay: 0.08, vol: 0.2 });
        break;

      // Social events
      case "player-join":
        tone(520, 0.07, { vol: 0.11 });
        tone(720, 0.12, { delay: 0.06, vol: 0.14 });
        break;
      case "player-leave":
        tone(520, 0.07, { vol: 0.1 });
        tone(370, 0.15, { delay: 0.06, vol: 0.11 });
        break;

      // Incoming chat message
      case "chat-incoming":
        tone(750, 0.04, { vol: 0.07 });
        break;
    }
  } catch {
    // AudioContext may be unavailable (SSR, sandboxed iframe, etc.)
  }
}
