"use client";

import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@/types/socket";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export type VoicePeer = {
  socketId: string;
  nickname: string;
  stream: MediaStream | null;
};

export type VoiceApi = ReturnType<typeof useVoice>;

export function useVoice(socket: TypedSocket) {
  // inVoice: receiving audio from peers (true once we've joined the room).
  // hasMic: we've been granted mic permission and have a local stream attached.
  // micMuted: our local mic track is muted (always starts true).
  const [inVoice, setInVoice] = useState(false);
  const [hasMic, setHasMic] = useState(false);
  const [micMuted, setMicMuted] = useState(true);
  const [globalMute, setGlobalMute] = useState(false);
  const [mutedPeers, setMutedPeers] = useState<Set<string>>(new Set());
  const [peers, setPeers] = useState<Map<string, VoicePeer>>(new Map());
  const [speakingPeers, setSpeakingPeers] = useState<Set<string>>(new Set());

  const localStreamRef = useRef<MediaStream | null>(null);
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioElemsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const globalMuteRef = useRef(false);
  const mutedPeersRef = useRef<Set<string>>(new Set());
  const inVoiceRef = useRef(false);
  const vadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSpeakingRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  function applyAudioMute(socketId: string, audio: HTMLAudioElement) {
    audio.muted = globalMuteRef.current || mutedPeersRef.current.has(socketId);
  }

  function createPeerConnection(remoteSocketId: string): RTCPeerConnection {
    const existing = pcsRef.current.get(remoteSocketId);
    if (existing) return existing;

    const pc = new RTCPeerConnection(ICE_CONFIG);
    pcsRef.current.set(remoteSocketId, pc);

    // Attach our outgoing audio if we have it; otherwise receive-only.
    if (localStreamRef.current) {
      for (const track of localStreamRef.current.getTracks()) {
        pc.addTrack(track, localStreamRef.current);
      }
    } else {
      pc.addTransceiver("audio", { direction: "recvonly" });
    }

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      let audio = audioElemsRef.current.get(remoteSocketId);
      if (!audio) {
        // Must be in DOM for autoplay policy to allow playback
        audio = document.createElement("audio");
        audio.setAttribute("playsinline", "true");
        audio.style.display = "none";
        document.body.appendChild(audio);
        audioElemsRef.current.set(remoteSocketId, audio);
      }
      audio.srcObject = stream;
      audio.autoplay = true;
      applyAudioMute(remoteSocketId, audio);
      audio.play().catch(() => {
        const resume = () => { audio!.play().catch(() => {}); document.removeEventListener("click", resume); };
        document.addEventListener("click", resume, { once: true });
      });
      setPeers((prev) => {
        const next = new Map(prev);
        const p = next.get(remoteSocketId);
        if (p) next.set(remoteSocketId, { ...p, stream });
        return next;
      });
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("voice:signal", {
          targetSocketId: remoteSocketId,
          signal: event.candidate.toJSON() as RTCIceCandidateInit,
        });
      }
    };

    return pc;
  }

  function setupVAD(stream: MediaStream) {
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    audioCtxRef.current = ctx;
    analyserRef.current = analyser;
    const buf = new Uint8Array(analyser.frequencyBinCount);
    vadIntervalRef.current = setInterval(() => {
      analyser.getByteFrequencyData(buf);
      const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
      const speaking = avg > 15;
      if (speaking !== isSpeakingRef.current) {
        isSpeakingRef.current = speaking;
        socket.emit("voice:speaking", { speaking });
      }
    }, 100);
  }

  function teardownVAD() {
    if (vadIntervalRef.current) { clearInterval(vadIntervalRef.current); vadIntervalRef.current = null; }
    analyserRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    isSpeakingRef.current = false;
  }

  function joinVoice() {
    if (inVoiceRef.current) return;
    inVoiceRef.current = true;
    setInVoice(true);
    socket.emit("voice:join");
  }

  function leaveVoice() {
    if (!inVoiceRef.current) return;
    teardownVAD();
    socket.emit("voice:leave");
    for (const pc of pcsRef.current.values()) pc.close();
    pcsRef.current.clear();
    for (const track of (localStreamRef.current?.getTracks() ?? [])) track.stop();
    localStreamRef.current = null;
    for (const audio of audioElemsRef.current.values()) {
      audio.pause();
      audio.srcObject = null;
      audio.remove();
    }
    audioElemsRef.current.clear();
    setPeers(new Map());
    setSpeakingPeers(new Set());
    inVoiceRef.current = false;
    setInVoice(false);
    setMicMuted(true);
    setHasMic(false);
  }

  // Lazy mic request — fires getUserMedia, adds the track to every existing PC,
  // and renegotiates by sending fresh offers so peers start hearing us.
  async function requestMicAndAttach(): Promise<boolean> {
    if (localStreamRef.current) return true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      // Start muted — user must explicitly unmute.
      for (const track of stream.getAudioTracks()) track.enabled = false;
      setHasMic(true);
      setupVAD(stream);

      // Attach to existing PCs and renegotiate (one fresh offer per peer).
      for (const [remoteSocketId, pc] of pcsRef.current.entries()) {
        for (const track of stream.getTracks()) {
          pc.addTrack(track, stream);
        }
        if (pc.signalingState === "stable") {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("voice:signal", {
              targetSocketId: remoteSocketId,
              signal: pc.localDescription as RTCSessionDescriptionInit,
            });
          } catch {
            // ignore; peer may be gone
          }
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  async function toggleMicMute() {
    // No mic yet → request permission, attach tracks, leave muted (one more
    // click will unmute). If denial, we silently stay receive-only.
    if (!localStreamRef.current) {
      const ok = await requestMicAndAttach();
      if (!ok) return;
      // After permission, immediately unmute so a single click is enough.
      const stream = localStreamRef.current as MediaStream | null;
      if (stream) {
        for (const track of stream.getAudioTracks()) track.enabled = true;
      }
      setMicMuted(false);
      return;
    }
    setMicMuted((prev) => {
      const next = !prev;
      if (localStreamRef.current) {
        for (const track of localStreamRef.current.getAudioTracks()) {
          track.enabled = !next;
        }
      }
      return next;
    });
  }

  function toggleGlobalMute() {
    const next = !globalMuteRef.current;
    globalMuteRef.current = next;
    setGlobalMute(next);
    for (const [sid, audio] of audioElemsRef.current.entries()) {
      audio.muted = next || mutedPeersRef.current.has(sid);
    }
    // Muting all peers also mutes our outgoing mic.
    if (next && localStreamRef.current) {
      for (const track of localStreamRef.current.getAudioTracks()) {
        track.enabled = false;
      }
      setMicMuted(true);
    }
  }

  function togglePeerMute(socketId: string) {
    setMutedPeers((prev) => {
      const next = new Set(prev);
      if (next.has(socketId)) next.delete(socketId);
      else next.add(socketId);
      mutedPeersRef.current = next;
      const audio = audioElemsRef.current.get(socketId);
      if (audio) audio.muted = globalMuteRef.current || next.has(socketId);
      return next;
    });
  }

  useEffect(() => {
    async function onVoicePeers(payload: { peers: Array<{ socketId: string; nickname: string }> }) {
      const map = new Map<string, VoicePeer>();
      for (const p of payload.peers) {
        map.set(p.socketId, { socketId: p.socketId, nickname: p.nickname, stream: null });
      }
      setPeers(map);
      // Even without a local mic stream we create PCs so we can hear them.
      for (const p of payload.peers) {
        const pc = createPeerConnection(p.socketId);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("voice:signal", {
            targetSocketId: p.socketId,
            signal: pc.localDescription as RTCSessionDescriptionInit,
          });
        } catch {
          // ignore
        }
      }
    }

    function onVoicePeerJoined(payload: { socketId: string; nickname: string }) {
      // Create our side of the PC (no local stream yet is fine — recvonly).
      createPeerConnection(payload.socketId);
      setPeers((prev) => {
        const next = new Map(prev);
        if (!next.has(payload.socketId)) {
          next.set(payload.socketId, { socketId: payload.socketId, nickname: payload.nickname, stream: null });
        }
        return next;
      });
    }

    function onVoicePeerLeft(payload: { socketId: string }) {
      const pc = pcsRef.current.get(payload.socketId);
      if (pc) { pc.close(); pcsRef.current.delete(payload.socketId); }
      const audio = audioElemsRef.current.get(payload.socketId);
      if (audio) { audio.pause(); audio.srcObject = null; audio.remove(); audioElemsRef.current.delete(payload.socketId); }
      setPeers((prev) => { const next = new Map(prev); next.delete(payload.socketId); return next; });
    }

    async function onVoiceSignal(payload: {
      fromSocketId: string;
      signal: RTCSessionDescriptionInit | RTCIceCandidateInit;
    }) {
      const desc = payload.signal as RTCSessionDescriptionInit;
      if (desc.type === "offer") {
        let pc = pcsRef.current.get(payload.fromSocketId);
        if (!pc) pc = createPeerConnection(payload.fromSocketId);
        await pc.setRemoteDescription(new RTCSessionDescription(desc));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("voice:signal", {
          targetSocketId: payload.fromSocketId,
          signal: pc.localDescription as RTCSessionDescriptionInit,
        });
      } else if (desc.type === "answer") {
        const pc = pcsRef.current.get(payload.fromSocketId);
        if (pc && pc.signalingState !== "stable") {
          await pc.setRemoteDescription(new RTCSessionDescription(desc)).catch(() => {});
        }
      } else {
        const pc = pcsRef.current.get(payload.fromSocketId);
        if (pc) {
          await pc.addIceCandidate(
            new RTCIceCandidate(payload.signal as RTCIceCandidateInit),
          ).catch(() => {});
        }
      }
    }

    function onVoiceSpeaking(payload: { socketId: string; speaking: boolean }) {
      setSpeakingPeers((prev) => {
        const next = new Set(prev);
        if (payload.speaking) next.add(payload.socketId);
        else next.delete(payload.socketId);
        return next;
      });
    }

    socket.on("voice:peers", onVoicePeers);
    socket.on("voice:peer_joined", onVoicePeerJoined);
    socket.on("voice:peer_left", onVoicePeerLeft);
    socket.on("voice:signal", onVoiceSignal);
    socket.on("voice:speaking", onVoiceSpeaking);

    return () => {
      socket.off("voice:peers", onVoicePeers);
      socket.off("voice:peer_joined", onVoicePeerJoined);
      socket.off("voice:peer_left", onVoicePeerLeft);
      socket.off("voice:signal", onVoiceSignal);
      socket.off("voice:speaking", onVoiceSpeaking);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  useEffect(() => {
    return () => {
      if (inVoiceRef.current) leaveVoice();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    inVoice,
    hasMic,
    micMuted,
    globalMute,
    mutedPeers,
    peers,
    speakingPeers,
    isSpeakingLocally: isSpeakingRef,
    joinVoice,
    leaveVoice,
    toggleMicMute,
    toggleGlobalMute,
    togglePeerMute,
  };
}
