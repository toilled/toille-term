import {
  generateSystemBriefing,
  isVoiceMuted,
  playSystemBriefing,
  setVoiceMuted,
  speak,
} from "$lib/vocal-synth";
import {
  isVoiceRecognitionSupported,
  isVoiceRecognitionActive,
} from "$lib/speech-recognition";
import { out, type CommandLine, type CommandCtx } from "./types";

export function handleBriefingCommand(): CommandLine[] {
  const text = generateSystemBriefing();
  void playSystemBriefing();
  return [
    out("// TACTICAL SYNTHETIC AUDIO BRIEFING", "cyan"),
    out(`  "${text}"`, "purple"),
    out("  [AUDIO STATUS: TRANSMITTING · SYNTHETIC VOCAL ACTIVE]", "dim"),
  ];
}

function handleVoiceStatus(): CommandLine[] {
  const muted = isVoiceMuted();
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;
  const statusTone = muted ? "pink" : "yellow";
  const statusLabel = muted
    ? "MUTED [TRANSMISSIONS SILENCED]"
    : "ONLINE [AUDIO ACTIVE]";
  const synthLabel = supported
    ? "WEB SPEECH API SYNTHESIZER READY"
    : "PROCEDURAL DSP FALLBACK";
  return [
    out("// SYNTHETIC CYBERNETIC VOCAL INTERFACE", "cyan"),
    out(`  status:        ${statusLabel}`, statusTone),
    out(`  synthesis:     ${synthLabel}`, "purple"),
    out(
      "  commands:      voice mute | voice unmute | voice toggle | voice say <text> | voice test",
      "dim",
    ),
  ];
}

function handleVoiceMute(mode: string): CommandLine[] {
  if (mode === "mute") setVoiceMuted(true);
  else if (mode === "unmute") setVoiceMuted(false);
  else setVoiceMuted(!isVoiceMuted());

  if (isVoiceMuted()) {
    return [
      out("// VOCAL SYNTHESIS MUTED", "pink"),
      out("  transmissions are now silenced.", "dim"),
    ];
  }
  return [
    out("// VOCAL SYNTHESIS UNMUTED", "cyan"),
    out("  transmissions are now active.", "dim"),
  ];
}

function handleVoiceSay(text: string): CommandLine[] {
  if (!text.trim()) {
    return [out("usage: voice say <message to synthesize>", "dim")];
  }
  void speak(text);
  return [
    out("// TRANSMITTING SYNTHESIZED VOCAL PHRASE", "cyan"),
    out(`  "${text}"`, "purple"),
  ];
}

const VOICE_HANDLERS: Record<string, () => CommandLine[]> = {
  "": handleVoiceStatus,
  status: handleVoiceStatus,
  mute: () => handleVoiceMute("mute"),
  unmute: () => handleVoiceMute("unmute"),
  toggle: () => handleVoiceMute("toggle"),
  test: () =>
    handleVoiceSay(
      "Cyberdeck telemetry operational. Synthetic vocal interface online.",
    ),
  briefing: handleBriefingCommand,
};

export function handleVoiceCommand(arg: string): CommandLine[] {
  const clean = arg.trim();
  const directHandler = VOICE_HANDLERS[clean];
  if (directHandler) {
    return directHandler();
  }
  if (clean === "say" || clean.startsWith("say ")) {
    return handleVoiceSay(clean.slice(3).trim());
  }
  return [
    out(`unknown voice option: ${clean}`, "pink"),
    out(
      "usage: voice [status | mute | unmute | toggle | say <text> | test | briefing]",
      "dim",
    ),
  ];
}

function getListenStatusLines(): CommandLine[] {
  const active = isVoiceRecognitionActive();
  return [
    out("// HANDS-FREE VOICE RECOGNITION STATUS", "purple"),
    out(
      `  status:    ${active ? "ONLINE [LISTENING]" : "OFFLINE [STANDBY]"}`,
      active ? "yellow" : "dim",
    ),
    out(
      "  commands:  race, whoami, briefing, cockpit, theme, audio, clear",
      "dim",
    ),
  ];
}

function dispatchMicToggle(ctx: CommandCtx): void {
  if (ctx.onToggleMic) {
    ctx.onToggleMic();
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("terminal:mic:toggle"));
  }
}

function isStateMatch(clean: string, active: boolean): boolean {
  if (clean === "on") return active;
  if (clean === "off") return !active;
  return false;
}

function formatToggleOutput(engaged: boolean): CommandLine[] {
  if (engaged) {
    return [
      out("// HANDS-FREE RECOGNITION ENGAGED", "purple"),
      out(
        "  Listening for voice commands. Speak clearly into your microphone.",
        "dim",
      ),
    ];
  }
  return [
    out("// HANDS-FREE RECOGNITION DISENGAGED", "dim"),
    out("  Microphone listening suspended.", "dim"),
  ];
}

export function handleListenCommand(
  arg: string,
  ctx: CommandCtx,
): CommandLine[] {
  if (!isVoiceRecognitionSupported()) {
    return [
      out("// HANDS-FREE VOICE RECOGNITION NOT SUPPORTED", "pink"),
      out("  Use Chrome, Edge, or a Web Speech API compatible browser.", "dim"),
    ];
  }
  const clean = arg.trim().toLowerCase();
  const active = isVoiceRecognitionActive();
  if (clean === "status" || isStateMatch(clean, active)) {
    return getListenStatusLines();
  }
  dispatchMicToggle(ctx);
  return formatToggleOutput(!active);
}
