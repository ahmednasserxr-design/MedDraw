"use client";

import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import type { VoiceApi } from "@/hooks/useVoice";

export function VoiceControls({ voice }: { voice: VoiceApi }) {
  const totalInVoice = voice.peers.size + 1;
  const connecting = !voice.inVoice;

  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 flex items-center gap-2">
      <span className="text-xs text-fg-muted font-medium">
        {connecting
          ? "Connecting voice…"
          : totalInVoice > 1
            ? `${totalInVoice} in voice`
            : "Voice"}
      </span>

      <div className="flex-1" />

      {/* Mic toggle — first click requests permission, subsequent clicks toggle mute */}
      <button
        type="button"
        onClick={voice.toggleMicMute}
        disabled={connecting}
        title={
          connecting
            ? "Joining voice…"
            : !voice.hasMic
              ? "Click to unmute your mic"
              : voice.micMuted
                ? "Unmute mic"
                : "Mute mic"
        }
        className={`rounded-lg p-1.5 cursor-pointer transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed
          ${voice.micMuted
            ? "text-red-500 hover:bg-red-500/10"
            : "text-green-500 hover:bg-green-500/10"
          }`}
      >
        {voice.micMuted ? <MicOff size={14} /> : <Mic size={14} />}
      </button>

      {/* Global mute — silences all peers AND your mic */}
      <button
        type="button"
        onClick={voice.toggleGlobalMute}
        disabled={connecting}
        title={voice.globalMute ? "Unmute everyone" : "Mute everyone (also mutes you)"}
        className={`rounded-lg p-1.5 cursor-pointer transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed
          ${voice.globalMute
            ? "text-red-500 hover:bg-red-500/10"
            : "text-fg-muted hover:bg-surface-2 hover:text-fg"
          }`}
      >
        {voice.globalMute ? <VolumeX size={14} /> : <Volume2 size={14} />}
      </button>
    </div>
  );
}
