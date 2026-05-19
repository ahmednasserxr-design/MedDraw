"use client";

import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import type { VoiceApi } from "@/hooks/useVoice";

export function VoiceControls({ voice }: { voice: VoiceApi }) {
  const activePeers = voice.peers.size;

  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 flex items-center gap-2">
      <button
        type="button"
        onClick={voice.toggleMic}
        title={voice.enabled ? "Leave voice chat" : "Join voice chat"}
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150
          ${voice.enabled
            ? "bg-accent/10 text-accent hover:bg-accent/20"
            : "bg-surface-2 text-fg-muted hover:bg-border hover:text-fg"
          }`}
      >
        {voice.enabled ? <Mic size={13} /> : <MicOff size={13} />}
        {voice.enabled ? (activePeers > 0 ? `${activePeers + 1} in voice` : "In voice") : "Voice"}
      </button>

      {voice.enabled && (
        <>
          <button
            type="button"
            onClick={voice.toggleMicMute}
            title={voice.micMuted ? "Unmute mic" : "Mute mic"}
            className={`rounded-lg p-1.5 transition-all duration-150
              ${voice.micMuted
                ? "text-red-500 hover:bg-red-500/10"
                : "text-fg-muted hover:bg-surface-2 hover:text-fg"
              }`}
          >
            {voice.micMuted ? <MicOff size={14} /> : <Mic size={14} />}
          </button>

          <button
            type="button"
            onClick={voice.toggleGlobalMute}
            title={voice.globalMute ? "Unmute all" : "Mute all speakers"}
            className={`rounded-lg p-1.5 transition-all duration-150
              ${voice.globalMute
                ? "text-red-500 hover:bg-red-500/10"
                : "text-fg-muted hover:bg-surface-2 hover:text-fg"
              }`}
          >
            {voice.globalMute ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </>
      )}
    </div>
  );
}
