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
  const [enabled, setEnabled] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [globalMute, setGlobalMute] = useState(false);
  const [mutedPeers, setMutedPeers] = useState<Set<string>>(new Set());
  const [peers, setPeers] = useState<Map<string, VoicePeer>>(new Map());

  const [speakingPeers, setSpeakingPeers] = useState<Set<string>>(new Set());
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioElemsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const globalMuteRef = useRef(false);
  const mutedPeersRef = useRef<Set<string>>(new Set());
  const enabledRef = useRef(false);
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

    // Add our local tracks so the remote peer can hear us
    if (localStreamRef.current) {
      for (const track of localStreamRef.current.getTracks()) {
        pc.addTrack(track, localStreamRef.current);
      }
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
        // Retry once on next user gesture via resumed AudioContext
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

  async function enableMic() {
    if (enabledRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      enabledRef.current = true;
      setEnabled(true);
      setupVAD(stream);
      socket.emit("voice:join");
    } catch {
      // Mic access denied — silently ignore
    }
  }

  function disableMic() {
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
    enabledRef.current = false;
    setEnabled(false);
    setMicMuted(false);
  }

  function toggleMic() {
    if (enabledRef.current) {
      disableMic();
    } else {
      void enableMic();
    }
  }

  function toggleMicMute() {
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
      if (next.has(socketId)) {
        next.delete(socketId);
      } else {
        next.add(socketId);
      }
      mutedPeersRef.current = next;
      const audio = audioElemsRef.current.get(socketId);
      if (audio) audio.muted = globalMuteRef.current || next.has(socketId);
      return next;
    });
  }

  useEffect(() => {
    // The NEWCOMER creates offers to all existing peers.
    // Existing peers just create PCs (add their tracks) and wait for the offer.
    async function onVoicePeers(payload: { peers: Array<{ socketId: string; nickname: string }> }) {
      const map = new Map<string, VoicePeer>();
      for (const p of payload.peers) {
        map.set(p.socketId, { socketId: p.socketId, nickname: p.nickname, stream: null });
      }
      setPeers(map);
      if (!localStreamRef.current) return;
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
          // Ignore — peer may have already left
        }
      }
    }

    function onVoicePeerJoined(payload: { socketId: string; nickname: string }) {
      // A new peer joined — create our side of the PC (adds our tracks).
      // They will send us an offer; we answer in onVoiceSignal.
      if (!localStreamRef.current) return;
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
      if (pc) {
        pc.close();
        pcsRef.current.delete(payload.socketId);
      }
      const audio = audioElemsRef.current.get(payload.socketId);
      if (audio) {
        audio.pause();
        audio.srcObject = null;
        audio.remove();
        audioElemsRef.current.delete(payload.socketId);
      }
      setPeers((prev) => {
        const next = new Map(prev);
        next.delete(payload.socketId);
        return next;
      });
    }

    async function onVoiceSignal(payload: {
      fromSocketId: string;
      signal: RTCSessionDescriptionInit | RTCIceCandidateInit;
    }) {
      const desc = payload.signal as RTCSessionDescriptionInit;
      if (desc.type === "offer") {
        if (!localStreamRef.current) return;
        // Use existing PC if already created via onVoicePeerJoined, else create new
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
        // ICE candidate
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
      if (enabledRef.current) disableMic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    enabled,
    micMuted,
    globalMute,
    mutedPeers,
    peers,
    speakingPeers,
    isSpeakingLocally: isSpeakingRef,
    toggleMic,
    toggleMicMute,
    toggleGlobalMute,
    togglePeerMute,
  };
}
