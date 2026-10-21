/**
 * Hardware Telemetry & Adaptive Threading Subsystem
 * Inspects logical CPU cores (hardwareConcurrency), memory capacity (deviceMemory),
 * and touch interface capabilities to dynamically tune canvas simulation fidelity.
 */

export type HardwareTier = "high" | "medium" | "low";

export interface HardwareTelemetry {
  cores: number;
  memoryGb: number | null;
  maxTouchPoints: number;
  tier: HardwareTier;
  isMultiThreaded: boolean;
}

function isLowHardwareTier(cores: number, memoryGb: number | null): boolean {
  if (cores <= 2) return true;
  return memoryGb !== null && memoryGb <= 2;
}

function isHighHardwareTier(cores: number, memoryGb: number | null): boolean {
  if (cores < 8) return false;
  return memoryGb === null || memoryGb >= 8;
}

export function resolveHardwareTier(
  cores: number,
  memoryGb: number | null,
): HardwareTier {
  if (isLowHardwareTier(cores, memoryGb)) return "low";
  if (isHighHardwareTier(cores, memoryGb)) return "high";
  return "medium";
}

function readHardwareCores(): number {
  if (
    typeof navigator.hardwareConcurrency === "number" &&
    navigator.hardwareConcurrency > 0
  ) {
    return navigator.hardwareConcurrency;
  }
  return 4;
}

function readDeviceMemoryGb(): number | null {
  const nav = navigator as Navigator & { deviceMemory?: number };
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory > 0) {
    return nav.deviceMemory;
  }
  return null;
}

export function getHardwareTelemetry(): HardwareTelemetry {
  if (typeof navigator === "undefined") {
    return {
      cores: 4,
      memoryGb: null,
      maxTouchPoints: 0,
      tier: "medium",
      isMultiThreaded: true,
    };
  }

  const cores = readHardwareCores();
  const memoryGb = readDeviceMemoryGb();
  const maxTouchPoints =
    typeof navigator.maxTouchPoints === "number" ? navigator.maxTouchPoints : 0;
  const tier = resolveHardwareTier(cores, memoryGb);

  return {
    cores,
    memoryGb,
    maxTouchPoints,
    tier,
    isMultiThreaded: cores > 1,
  };
}

const PARTICLE_BUDGETS: Record<
  HardwareTier,
  { compact: number; standard: number }
> = {
  high: { compact: 24, standard: 48 },
  low: { compact: 12, standard: 20 },
  medium: { compact: 18, standard: 36 },
};

export function computeParticleBudget(
  isCompact: boolean,
  tier: HardwareTier,
): number {
  const budget = PARTICLE_BUDGETS[tier] || PARTICLE_BUDGETS.medium;
  return isCompact ? budget.compact : budget.standard;
}

export function applyHardwareAttributes(
  telemetry = getHardwareTelemetry(),
): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  root.setAttribute("data-hardware-tier", telemetry.tier);
  root.setAttribute("data-cores", String(telemetry.cores));

  if (telemetry.tier === "high") {
    root.setAttribute("data-high-performance", "true");
  } else {
    root.removeAttribute("data-high-performance");
  }
}
