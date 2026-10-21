/**
 * Hands-Free Voice Command Recognition & Natural Language Parsing.
 * Transcribes spoken speech and dispatches cybernetic commands to the terminal and site systems.
 */

import { speak } from "./vocal-synth";

interface SpeechRecognitionEventLike {
  resultIndex?: number;
  results: {
    length: number;
    [index: number]: {
      isFinal?: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

let activeRecognition: SpeechRecognitionLike | null = null;
let isListeningState = false;
let lastProcessedIndex = -1;
let pendingIndex = -1;
let pendingText = "";
let pendingTimer: ReturnType<typeof setTimeout> | null = null;

export function isVoiceRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function isVoiceRecognitionActive(): boolean {
  return isListeningState;
}

const ARCADE_PHRASES: [string[], string][] = [
  [["gamepad", "controller", "phone", "wireless"], "phonegamepad"],
  [["cockpit", "telemetry", "gauges", "dashboard"], "cockpit"],
  [["race", "game", "cyberracer", "racer", "drive"], "game"],
];

const SYSTEM_PHRASES: [string[], string][] = [
  [["whoami", "who am i", "identity", "who are you", "profile"], "whoami"],
  [["resume", "cv", "curriculum", "experience", "career"], "cv"],
  [
    ["briefing", "status", "report", "brief", "system status", "sitrep"],
    "briefing",
  ],
  [["benchmark", "speed test", "latency", "ping", "performance"], "benchmark"],
];

const MEDIA_THEME_PHRASES: [string[], string][] = [
  [["audio", "synth", "music", "cyberdeck", "sound"], "cyberdeck"],
  [["theme", "dark mode", "light mode", "dark", "light"], "theme"],
  [["eco", "power", "battery", "energy", "battery saver"], "eco"],
  [["clear", "reset", "clean", "cls"], "clear"],
  [["help", "commands", "options", "what can i say"], "help"],
];

const DIRECT_COMMAND_ALIASES: Record<string, string> = {
  status: "briefing",
  briefing: "briefing",
  report: "briefing",
  whoami: "whoami",
  cv: "cv",
  resume: "cv",
  race: "game",
  game: "game",
  cyberracer: "game",
  cockpit: "cockpit",
  telemetry: "cockpit",
  gamepad: "phonegamepad",
  phonegamepad: "phonegamepad",
  theme: "theme",
  eco: "eco",
  clear: "clear",
  help: "help",
  skills: "skills",
  projects: "projects",
  benchmark: "benchmark",
  cyberdeck: "cyberdeck",
  audio: "cyberdeck",
  music: "cyberdeck",
  synth: "cyberdeck",
  date: "date",
  time: "time",
  sysinfo: "sysinfo",
  specs: "sysinfo",
  matrix: "matrix",
};

const KNOWN_COMMANDS = new Set([
  "whoami",
  "help",
  "skills",
  "projects",
  "clear",
  "matrix",
  "date",
  "time",
  "specs",
  "sysinfo",
  "achievements",
  "benchmark",
]);

function cleanTranscript(transcript: string): string {
  return transcript
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");
}

function matchesPhrase(text: string, phrase: string): boolean {
  if (phrase.length > 100) return false;
  const normalized = phrase
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");
  if (!normalized) return false;
  return ` ${text} `.includes(` ${normalized} `);
}

function matchArcadeCommand(clean: string): string | null {
  for (const [phrases, cmd] of ARCADE_PHRASES) {
    if (phrases.some((p) => matchesPhrase(clean, p))) {
      return cmd;
    }
  }
  return null;
}

function matchSystemCommand(clean: string): string | null {
  for (const [phrases, cmd] of SYSTEM_PHRASES) {
    if (phrases.some((p) => matchesPhrase(clean, p))) {
      return cmd;
    }
  }
  return null;
}

function matchMediaAndThemeCommand(clean: string): string | null {
  for (const [phrases, cmd] of MEDIA_THEME_PHRASES) {
    if (phrases.some((p) => matchesPhrase(clean, p))) {
      return cmd;
    }
  }
  return null;
}

function matchKnownTerminalCommand(clean: string): string | null {
  if (KNOWN_COMMANDS.has(clean)) {
    return clean;
  }
  return null;
}

function matchSynonymCommand(clean: string): string | null {
  return (
    matchArcadeCommand(clean) ??
    matchSystemCommand(clean) ??
    matchMediaAndThemeCommand(clean)
  );
}

export function parseVoiceCommand(transcript: string): string | null {
  const clean = cleanTranscript(transcript);
  if (!clean) return null;
  const direct = DIRECT_COMMAND_ALIASES[clean];
  if (direct) return direct;
  return matchSynonymCommand(clean) ?? matchKnownTerminalCommand(clean);
}

const SPOKEN_CONFIRMATIONS: Record<string, string> = {
  game: "Engaging CyberRacer systems.",
  cockpit: "Telemetry cockpit initialized.",
  phonegamepad: "Wireless gamepad pairing online.",
  cyberdeck: "Cyberdeck audio synthesizer ready.",
  whoami: "Identity protocol retrieved.",
  cv: "Displaying curriculum vitae.",
  benchmark: "Edge latency benchmark running.",
  theme: "Visual theme shifted.",
  eco: "Power state toggled.",
  clear: "Terminal cleared.",
  help: "Displaying available commands.",
};

export function getSpokenConfirmation(command: string): string | null {
  if (command === "briefing") return null;
  return SPOKEN_CONFIRMATIONS[command] ?? "Command executed.";
}

export function dispatchTerminalCommand(cmd: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("terminal:execute", { detail: cmd }));
}

const SPEECH_ERRORS: Record<string, string> = {
  "not-allowed":
    "Microphone access denied. Grant microphone permission in Chrome settings and Windows privacy settings.",
  "service-not-allowed":
    "Microphone access denied. Grant microphone permission in Chrome settings and Windows privacy settings.",
  "audio-capture":
    "No microphone detected. Ensure a working microphone is connected.",
  network:
    "Speech recognition network error. Chrome requires an active connection to speech recognition services.",
  "no-speech": "No speech detected.",
};

export function formatSpeechError(error: string): string {
  return SPEECH_ERRORS[error] ?? `Voice recognition error: ${error}`;
}

const FATAL_SPEECH_ERRORS = new Set([
  "not-allowed",
  "service-not-allowed",
  "audio-capture",
  "network",
]);

function isFatalSpeechError(error: string): boolean {
  return FATAL_SPEECH_ERRORS.has(error);
}

function getSpeechLang(): string {
  if (typeof navigator !== "undefined" && navigator.language) {
    return navigator.language;
  }
  return "en-US";
}

function createRecognitionInstance(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const SpeechClass =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechClass) return null;

  const rec = new SpeechClass();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = getSpeechLang();
  return rec;
}

interface ExtractedTranscript {
  index: number;
  text: string;
  isFinal: boolean;
}

function getTranscriptText(
  item: SpeechRecognitionEventLike["results"][number] | undefined,
): string {
  if (!item || !item[0] || !item[0].transcript) return "";
  return item[0].transcript.trim();
}

function extractCurrentTranscript(
  event: SpeechRecognitionEventLike,
): ExtractedTranscript {
  const results = event.results;
  if (!results || results.length === 0)
    return { index: -1, text: "", isFinal: false };
  const idx = results.length - 1;
  const item = results[idx];
  return {
    index: idx,
    text: getTranscriptText(item),
    isFinal: Boolean(item?.isFinal),
  };
}

function clearPendingSilenceTimer(): void {
  if (pendingTimer !== null) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
  }
}

function clearPendingUtterance(): void {
  clearPendingSilenceTimer();
  pendingIndex = -1;
  pendingText = "";
}

function dispatchUtterance(
  text: string,
  onCommand?: (command: string, phrase: string) => void,
  onUnrecognized?: (phrase: string) => void,
): void {
  const cmd = parseVoiceCommand(text);
  if (cmd) {
    dispatchRecognizedVoiceCommand(cmd, text, onCommand);
  } else if (onUnrecognized) {
    onUnrecognized(text);
  }
}

function dispatchRecognizedVoiceCommand(
  cmd: string,
  text: string,
  onCommand?: (command: string, phrase: string) => void,
): void {
  if (onCommand) {
    onCommand(cmd, text);
  } else {
    dispatchTerminalCommand(cmd);
  }
  const confirm = getSpokenConfirmation(cmd);
  if (confirm) {
    void speak(confirm);
  }
}

function executeUtterance(
  index: number,
  text: string,
  onTranscript?: (text: string, isFinal: boolean) => void,
  onCommand?: (command: string, phrase: string) => void,
  onUnrecognized?: (phrase: string) => void,
): void {
  if (index <= lastProcessedIndex || !text) return;
  lastProcessedIndex = index;
  clearPendingUtterance();

  if (onTranscript) onTranscript(text, true);
  dispatchUtterance(text, onCommand, onUnrecognized);
}

function scheduleSilenceFinalize(
  index: number,
  text: string,
  onTranscript?: (text: string, isFinal: boolean) => void,
  onCommand?: (command: string, phrase: string) => void,
  onUnrecognized?: (phrase: string) => void,
): void {
  clearPendingSilenceTimer();
  pendingIndex = index;
  pendingText = text;
  const delayMs = parseVoiceCommand(text) ? 500 : 850;
  pendingTimer = setTimeout(() => {
    executeUtterance(index, text, onTranscript, onCommand, onUnrecognized);
  }, delayMs);
}

function isTranscriptProcessable(index: number, text: string): boolean {
  return index >= 0 && index > lastProcessedIndex && Boolean(text);
}

function handleSpeechResult(
  e: SpeechRecognitionEventLike,
  onTranscript?: (text: string, isFinal: boolean) => void,
  onCommand?: (command: string, phrase: string) => void,
  onUnrecognized?: (phrase: string) => void,
): void {
  const { index, text, isFinal } = extractCurrentTranscript(e);
  if (!isTranscriptProcessable(index, text)) return;

  if (isFinal) {
    executeUtterance(index, text, onTranscript, onCommand, onUnrecognized);
    return;
  }

  if (onTranscript) onTranscript(text, false);
  scheduleSilenceFinalize(index, text, onTranscript, onCommand, onUnrecognized);
}

function isIgnorableSpeechError(error: string): boolean {
  return error === "no-speech" || error === "aborted";
}

function handleSpeechError(
  error: string,
  onError?: (err: string) => void,
  onEnd?: () => void,
): void {
  if (isIgnorableSpeechError(error)) {
    return;
  }
  if (onError) onError(error);
  if (isFatalSpeechError(error)) {
    stopVoiceRecognition();
    if (onEnd) onEnd();
  }
}

function tryRestartRecognition(rec: SpeechRecognitionLike): boolean {
  if (!isListeningState || activeRecognition !== rec) return false;
  try {
    rec.start();
    lastProcessedIndex = -1;
    return true;
  } catch {
    return false;
  }
}

function handleSpeechEnd(
  rec: SpeechRecognitionLike,
  onTranscript?: (text: string, isFinal: boolean) => void,
  onCommand?: (command: string, phrase: string) => void,
  onUnrecognized?: (phrase: string) => void,
  onEnd?: () => void,
): void {
  if (pendingIndex > lastProcessedIndex && pendingText) {
    executeUtterance(
      pendingIndex,
      pendingText,
      onTranscript,
      onCommand,
      onUnrecognized,
    );
  }
  clearPendingSilenceTimer();

  if (tryRestartRecognition(rec)) return;

  stopVoiceRecognition();
  if (onEnd) onEnd();
}

function bindRecognitionEvents(
  rec: SpeechRecognitionLike,
  callbacks: {
    onTranscript?: (text: string, isFinal: boolean) => void;
    onCommand?: (command: string, phrase: string) => void;
    onError?: (err: string) => void;
    onEnd?: () => void;
    onUnrecognized?: (phrase: string) => void;
  },
): void {
  rec.onresult = (e: SpeechRecognitionEventLike) => {
    handleSpeechResult(
      e,
      callbacks.onTranscript,
      callbacks.onCommand,
      callbacks.onUnrecognized,
    );
  };

  rec.onerror = (e) => {
    handleSpeechError(e.error, callbacks.onError, callbacks.onEnd);
  };

  rec.onend = () => {
    handleSpeechEnd(
      rec,
      callbacks.onTranscript,
      callbacks.onCommand,
      callbacks.onUnrecognized,
      callbacks.onEnd,
    );
  };
}

function handleStartFailure(
  err: unknown,
  onError?: (err: string) => void,
  onEnd?: () => void,
): void {
  stopVoiceRecognition();
  const message = err instanceof Error ? err.message : "start-failed";
  if (onError) onError(message);
  if (onEnd) onEnd();
}

export function startVoiceRecognition(
  onTranscript?: (text: string, isFinal: boolean) => void,
  onCommand?: (command: string, phrase: string) => void,
  onError?: (err: string) => void,
  onEnd?: () => void,
  onUnrecognized?: (phrase: string) => void,
): boolean {
  if (isListeningState) return true;
  const rec = createRecognitionInstance();
  if (!rec) return false;

  isListeningState = true;
  lastProcessedIndex = -1;
  pendingIndex = -1;
  pendingText = "";
  activeRecognition = rec;

  bindRecognitionEvents(rec, {
    onTranscript,
    onCommand,
    onError,
    onEnd,
    onUnrecognized,
  });

  try {
    rec.start();
    return true;
  } catch (err: unknown) {
    handleStartFailure(err, onError, onEnd);
    return false;
  }
}

export function stopVoiceRecognition(): void {
  isListeningState = false;
  lastProcessedIndex = -1;
  pendingIndex = -1;
  pendingText = "";
  clearPendingSilenceTimer();
  if (activeRecognition) {
    const rec = activeRecognition;
    activeRecognition = null;
    try {
      rec.stop();
    } catch {
      // Already stopped
    }
  }
}

export function toggleVoiceRecognition(
  onTranscript?: (text: string, isFinal: boolean) => void,
  onCommand?: (command: string, phrase: string) => void,
  onError?: (err: string) => void,
  onEnd?: () => void,
  onUnrecognized?: (phrase: string) => void,
): boolean {
  if (isListeningState) {
    stopVoiceRecognition();
    onEnd?.();
    return false;
  }
  return startVoiceRecognition(
    onTranscript,
    onCommand,
    onError,
    onEnd,
    onUnrecognized,
  );
}
