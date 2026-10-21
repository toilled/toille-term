/**
 * Synthetic Cybernetic Vocal Interface Engine.
 * Formulates robotic voice briefings and vocal command confirmations using Web Speech API & Web Audio DSP.
 */

import { getSolarInfo } from "$lib/solar";
import { getHardwareTelemetry } from "$lib/hardware";

const VOICE_MUTED_STORAGE_KEY = "toille.voice.muted";

let isSpeakingState = false;

export function isVoiceMuted(): boolean {
  if (typeof window === "undefined" || !window.localStorage) return false;
  try {
    return window.localStorage.getItem(VOICE_MUTED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setVoiceMuted(muted: boolean): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(VOICE_MUTED_STORAGE_KEY, muted ? "1" : "0");
  } catch {
    // Storage access restricted
  }
}

export function isSpeaking(): boolean {
  return isSpeakingState;
}

export function cancelSpeech(): void {
  isSpeakingState = false;
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

function isSpeechSupported(): boolean {
  if (typeof window === "undefined") return false;
  if (!("speechSynthesis" in window)) return false;
  return typeof window.SpeechSynthesisUtterance !== "undefined";
}

const ROBOTIC_VOICE_NAMES = [
  "google uk english male",
  "daniel",
  "david",
  "george",
];

function matchesRoboticName(name: string): boolean {
  const lower = name.toLowerCase();
  return ROBOTIC_VOICE_NAMES.some((n) => lower.includes(n));
}

function selectBestVoice(
  robotic: SpeechSynthesisVoice | undefined,
  english: SpeechSynthesisVoice[],
  all: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  if (robotic) return robotic;
  if (english.length > 0) return english[0];
  if (all.length > 0) return all[0];
  return null;
}

function findRoboticVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | null {
  if (typeof synth.getVoices !== "function") return null;
  const voices = synth.getVoices();
  if (!voices || voices.length === 0) return null;

  const englishVoices = voices.filter((v) => v.lang.startsWith("en"));
  const roboticVoice = englishVoices.find((v) => matchesRoboticName(v.name));
  return selectBestVoice(roboticVoice, englishVoices, voices);
}

function createUtterance(
  text: string,
  voice: SpeechSynthesisVoice | null,
): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.pitch = 0.82;
  utterance.rate = 1.06;
  utterance.volume = 0.85;
  if (voice) {
    utterance.voice = voice;
  }
  return utterance;
}

function speakWithBrowserSynthesis(text: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!isSpeechSupported()) {
      resolve(false);
      return;
    }
    const synth = window.speechSynthesis;
    synth.cancel();

    const voice = findRoboticVoice(synth);
    const utterance = createUtterance(text, voice);
    isSpeakingState = true;

    utterance.onend = () => {
      isSpeakingState = false;
      resolve(true);
    };

    utterance.onerror = () => {
      isSpeakingState = false;
      resolve(false);
    };

    synth.speak(utterance);
  });
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

function playTelemetryBeep(): void {
  if (typeof window === "undefined") return;
  const AC = window.AudioContext ?? window.webkitAudioContext;
  if (!AC) return;
  try {
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  } catch {
    // AudioContext blocked
  }
}

export async function speak(
  text: string,
  options: { force?: boolean } = {},
): Promise<boolean> {
  if (isVoiceMuted() && !options.force) {
    return false;
  }

  const success = await speakWithBrowserSynthesis(text);
  if (!success) {
    playTelemetryBeep();
  }
  return true;
}

export function generateSystemBriefing(): string {
  const solar = getSolarInfo();
  const hw = getHardwareTelemetry();
  const solarPhase =
    solar.phase === "night" ? "Night cycle" : `${solar.phase} cycle`;
  const tier = hw.tier.toUpperCase();
  const cores = hw.cores;

  return `Cyberdeck systems online. Solar phase: ${solarPhase}. Engine tier: ${tier}. Processing cores: ${cores} units. Security clearance: Granted. Ready for commands.`;
}

export async function playSystemBriefing(): Promise<boolean> {
  const briefing = generateSystemBriefing();
  return speak(briefing);
}
