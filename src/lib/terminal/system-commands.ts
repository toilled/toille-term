import { unlockAchievement } from "$lib/game/achievements";
import { applyTheme, toggleTheme } from "$lib/theme";
import { applyEco, toggleEco, type EcoMode } from "$lib/eco";
import { getBatteryStatus } from "$lib/battery";
import { getSolarInfo } from "$lib/solar";
import { getNetworkTelemetry } from "$lib/network";
import { getHardwareTelemetry, computeParticleBudget } from "$lib/hardware";
import { out, type CommandLine } from "./types";

const VALID_THEMES = new Set<string>(["light", "dark", "system"]);
const VALID_ECO_MODES = new Set<string>(["on", "off", "auto"]);

export function handleTheme(arg: string): CommandLine[] {
  const mode = arg.toLowerCase().trim();
  if (VALID_THEMES.has(mode)) {
    applyTheme(mode as Parameters<typeof applyTheme>[0]);
    return [out(`theme mode set to: ${mode.toUpperCase()}`, "cyan")];
  }
  if (mode === "toggle" || !mode) {
    const next = toggleTheme();
    return [out(`theme switched to: ${next.toUpperCase()}`, "cyan")];
  }
  return [out("usage: theme <dark|light|system|toggle>", "pink")];
}

export function handleEco(arg: string): CommandLine[] {
  const mode = arg.toLowerCase().trim();
  if (VALID_ECO_MODES.has(mode)) {
    applyEco(mode as EcoMode);
    return [out(`eco mode set to: ${mode.toUpperCase()}`, "cyan")];
  }
  if (mode === "toggle" || !mode) {
    const next = toggleEco();
    return [out(`eco mode switched to: ${next.toUpperCase()}`, "cyan")];
  }
  return [out("usage: eco <on|off|auto|toggle>", "pink")];
}

function getPowerBadge(mode: string): string {
  if (mode === "overclocked") return "⚡ OVERCLOCKED [SURGE VOLTAGE ACTIVE]";
  if (mode === "critical") return "⚠️ CRITICAL [EMERGENCY POWER RESERVES]";
  if (mode === "low") return "🟡 LOW POWER";
  return "NORMAL";
}

function formatBatteryLevel(level: number | null): string {
  return level !== null ? `${Math.round(level * 100)}%` : "UNKNOWN";
}

function formatPowerSource(charging: boolean): { label: string; tone: string } {
  return charging
    ? { label: "CONNECTED (AC GRID)", tone: "cyan" }
    : { label: "DISCHARGING (INTERNAL CELL)", tone: "yellow" };
}

export function handlePower(): CommandLine[] {
  const status = getBatteryStatus();
  const pct = formatBatteryLevel(status.level);
  const source = formatPowerSource(status.charging);
  const modeBadge = getPowerBadge(status.powerMode);
  const isCritical = status.powerMode === "critical";

  return [
    out("── SYSTEM POWER MATRIX ──", "cyan"),
    out(`  BATTERY LEVEL : ${pct}`, isCritical ? "pink" : "cyan"),
    out(`  POWER SOURCE  : ${source.label}`, source.tone),
    out(`  GRID MODE     : ${modeBadge}`, isCritical ? "pink" : "purple"),
    out("tip: use 'eco <mode>' to adjust CPU & animation power draw", "dim"),
  ];
}

export function handleSolar(): CommandLine[] {
  const info = getSolarInfo();
  if (info.phase === "night" || info.isHackerHour) {
    unlockAchievement("NIGHT_RUNNER");
  }
  const lines = [
    out(`LOCAL TIME  : ${info.timeString}`, "cyan"),
    out(
      `SOLAR PHASE : ${info.phase.toUpperCase()} — ${info.description}`,
      info.isHackerHour ? "pink" : "purple",
    ),
    out(`ATMOSPHERE  : ${info.atmosphere}`, "dim"),
  ];
  if (info.isHackerHour) {
    lines.push(
      out("⚡ 03:00 HACKER PROTOCOL ENGAGED // THE NET NEVER SLEEPS", "pink"),
    );
  }
  return lines;
}

function formatOfflinePing(): CommandLine[] {
  return [
    out("// NEURAL LINK: OFFLINE [DISCONNECTED]", "pink"),
    out("  status:        OFFLINE · ZERO SIGNAL DETECTED", "yellow"),
    out("  carrier:       LINK TERMINATED · NO ROUTE TO HOST", "dim"),
    out("  cache:         SERVICE WORKER RUNNING STANDALONE", "purple"),
    out("  data saver:    ACTIVE (LOCAL STORAGE ONLY)", "dim"),
  ];
}

function formatRtt(rtt: number | null): string {
  return rtt !== null ? `${rtt} ms` : "< 20 ms (estimated)";
}

function formatDownlink(dl: number | null): string {
  return dl !== null ? `${dl} Mbps` : "adaptive";
}

function formatDataSaver(saveData: boolean): { label: string; tone: string } {
  return saveData
    ? { label: "ENABLED (LOW BANDWIDTH)", tone: "pink" }
    : { label: "DISABLED", tone: "dim" };
}

export function handlePing(): CommandLine[] {
  unlockAchievement("NET_RUNNER");
  const net = getNetworkTelemetry();
  if (!net.online) {
    return formatOfflinePing();
  }
  const rttStr = formatRtt(net.rttMs);
  const dlStr = formatDownlink(net.downlinkMb);
  const typeLabel = net.effectiveType.toUpperCase();
  const saver = formatDataSaver(net.saveData);

  return [
    out("// NEURAL LINK TELEMETRY", "cyan"),
    out("  status:        ONLINE [LINK ESTABLISHED]", "yellow"),
    out(`  throughput:    ${typeLabel} · ${dlStr}`, "purple"),
    out(`  latency:       ${rttStr} (ROUND TRIP)`, "purple"),
    out(`  data saver:    ${saver.label}`, saver.tone),
    out("  service worker: CACHE ACTIVE (toille-pages-v1)", "dim"),
  ];
}

function getTierTone(tier: string): string {
  if (tier === "high") return "cyan";
  if (tier === "low") return "pink";
  return "yellow";
}

export function handleSysinfo(): CommandLine[] {
  unlockAchievement("CYBER_SPEC");
  const hw = getHardwareTelemetry();
  const memStr = hw.memoryGb
    ? `${hw.memoryGb} GB RAM (DEVICE ESTIMATE)`
    : "UNRESTRICTED / OS MANAGED";
  const touchStr =
    hw.maxTouchPoints > 0
      ? `${hw.maxTouchPoints} TOUCH POINTS (HYBRID/MOBILE)`
      : "NONE (DESKTOP RIG)";
  const tierTone = getTierTone(hw.tier);
  const dNodes = computeParticleBudget(false, hw.tier);
  const mNodes = computeParticleBudget(true, hw.tier);

  return [
    out("// CYBERDECK HARDWARE & THREADING DIAGNOSTICS", "cyan"),
    out(
      `  Processor Units:  ${hw.cores} LOGICAL CORES / WORKER THREADS`,
      "yellow",
    ),
    out(`  System Memory:    ${memStr}`, "purple"),
    out(`  Touch Interface:  ${touchStr}`, "purple"),
    out(
      `  Performance Tier: [${hw.tier.toUpperCase()}] — ADAPTIVE CANVAS ENGINE`,
      tierTone,
    ),
    out(
      `  Particle Density: ${dNodes} NODES (DESKTOP) / ${mNodes} NODES (MOBILE)`,
      "dim",
    ),
  ];
}
