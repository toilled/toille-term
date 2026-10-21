import {
  getAchievements,
  getAchievementProgress,
  unlockAchievement,
} from "$lib/game/achievements";
import { getConnectedGamepads } from "$lib/game/gamepad-device";
import { isMobileDevice } from "$lib/device";
import { out, type CommandLine, type CommandCtx } from "./types";

export function launchCyberracer(ctx: CommandCtx): CommandLine[] {
  if (isMobileDevice()) {
    return [
      out("▸ CYBERRACER is disabled on mobile devices.", "pink"),
      out("▸ physical keyboard required (WASD / arrow keys).", "dim"),
    ];
  }
  unlockAchievement("FIRST_SIGNAL");
  ctx.onLaunchGame?.();
  return [
    out("▸ CYBERRACER v1.0 ............ FOUND", "cyan"),
    out("▸ stadium physics ........... ONLINE", "purple"),
    out("▸ tracks .................... 3 AVAILABLE", "purple"),
    out("▸ leaderboard ............... READY", "purple"),
    out("engaging racing systems …", "yellow"),
    out("tip: check the readme via cat cyberracer.txt", "dim"),
  ];
}

export function handleAchievements(): CommandLine[] {
  const list = getAchievements();
  const progress = getAchievementProgress();
  const lines: CommandLine[] = [
    out(
      `// SYSTEM ACHIEVEMENT MATRIX — [${progress.unlocked}/${progress.total}] (${progress.percent}%)`,
      "yellow",
    ),
  ];
  for (const a of list) {
    const status = a.unlocked
      ? `[✓] ${a.icon} ${a.title}`
      : `[ ] 🔒 ${a.title}`;
    const tone = a.unlocked ? "cyan" : "dim";
    lines.push(out(`  ${status} — ${a.description}`, tone));
  }
  return lines;
}

function formatNoGamepad(): CommandLine[] {
  return [
    out("// CONTROLLER SUBSYSTEM: NO GAMEPAD DETECTED", "pink"),
    out(
      "  Connect any USB or Bluetooth controller (PlayStation, Xbox, Switch, or Arcade Stick).",
      "dim",
    ),
    out(
      "  Supported in: CYBERRACER (steering, throttle, brake, respawn).",
      "dim",
    ),
    out(
      "  tip: type 'phonegamepad' to turn your phone into a wireless motion controller!",
      "yellow",
    ),
  ];
}

function formatPadDetail(pad: {
  id: string;
  index: number;
  mapping: string;
  buttons?: readonly unknown[];
  axes?: readonly unknown[];
}): CommandLine[] {
  const btnCount = pad.buttons ? pad.buttons.length : 0;
  const axisCount = pad.axes ? pad.axes.length : 0;
  return [
    out(`  [PAD #${pad.index}] ${pad.id}`, "yellow"),
    out(
      `    Mapping: ${pad.mapping} · Buttons: ${btnCount} · Axes: ${axisCount}`,
      "purple",
    ),
  ];
}

export function handleGamepad(): CommandLine[] {
  const pads = getConnectedGamepads();
  if (pads.length === 0) {
    return formatNoGamepad();
  }
  const lines: CommandLine[] = [
    out(`// CONTROLLER SUBSYSTEM: ${pads.length} DEVICE(S) DETECTED`, "cyan"),
  ];
  for (const pad of pads) {
    lines.push(...formatPadDetail(pad));
  }
  lines.push(
    out(
      "  CyberRacer mapped: D-Pad/Left Stick (Steer), A/R2 (Gas), B/L2 (Brake), Y (Respawn)",
      "dim",
    ),
  );
  return lines;
}

export function handlePhoneGamepad(_ctx: CommandCtx): CommandLine[] {
  if (typeof window !== "undefined") {
    window.open(
      "https://racer.toille.uk/gamepad",
      "_blank",
      "noopener,noreferrer",
    );
  }
  return [
    out("// WIRELESS WEBRTC SMARTPHONE GAMEPAD [PAIRING]", "cyan"),
    out("  target:       https://racer.toille.uk/gamepad", "purple"),
    out(
      "  sensors:      DEVICE_ORIENTATION GYROSCOPE (TILT-TO-STEER)",
      "yellow",
    ),
    out("  feedback:     VIBRATION HAPTICS (GEAR SHIFTS & COLLISIONS)", "pink"),
    out("opening smartphone gamepad on racer.toille.uk …", "dim"),
  ];
}

export function handleCockpit(): CommandLine[] {
  if (typeof window !== "undefined") {
    window.open(
      "https://racer.toille.uk/telemetry",
      "_blank",
      "noopener,noreferrer",
    );
  }
  return [
    out("// CYBERRACER DETACHED TELEMETRY COCKPIT [OPENED]", "cyan"),
    out("  target:        https://racer.toille.uk/telemetry", "purple"),
    out(
      "  telemetry:     G-FORCE · TACHOMETER · 4-TIRE SENSORS · TRACE LOG",
      "yellow",
    ),
    out("  dual-screen:   MOVE POPUP WINDOW TO SECONDARY MONITOR", "cyan"),
    out("opening telemetry cockpit on racer.toille.uk …", "dim"),
  ];
}
