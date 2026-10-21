export type SolarPhase = "dawn" | "day" | "sunset" | "night";

export interface SolarInfo {
  hour: number;
  phase: SolarPhase;
  isHackerHour: boolean;
  timeString: string;
  description: string;
  atmosphere: string;
}

interface SolarCycleOptions {
  onPhaseChange?: (phase: SolarPhase) => void;
  onHackerHour?: () => void;
}

export function getSolarPhase(
  hour: number = new Date().getHours(),
): SolarPhase {
  if (hour < 6 || hour >= 21) return "night";
  if (hour < 9) return "dawn";
  if (hour < 18) return "day";
  return "sunset";
}

const PHASE_DESCRIPTIONS: Record<
  SolarPhase,
  { description: string; atmosphere: string }
> = {
  dawn: {
    description: "NEO-TOKYO DAWN",
    atmosphere: "Soft pastel violet-pink sunrise aurora mist",
  },
  day: {
    description: "SOLAR GRID NOON",
    atmosphere: "High-energy electric cyan & solar cobalt grid",
  },
  sunset: {
    description: "OUTRUN SUNSET",
    atmosphere: "Deep synthwave magenta & blood-orange horizon",
  },
  night: {
    description: "HACKER MIDNIGHT",
    atmosphere: "Deep space phosphor matrix & cyber-cyan neon",
  },
};

export function getSolarInfo(date: Date = new Date()): SolarInfo {
  const hour = date.getHours();
  const phase = getSolarPhase(hour);
  const isHackerHour = hour === 3;
  const meta = PHASE_DESCRIPTIONS[phase];

  return {
    hour,
    phase,
    isHackerHour,
    timeString: date.toLocaleTimeString(),
    description: meta.description,
    atmosphere: meta.atmosphere,
  };
}

export function applySolarPhase(date: Date = new Date()): SolarPhase {
  if (typeof document === "undefined") {
    return getSolarPhase(date.getHours());
  }

  const info = getSolarInfo(date);
  const root = document.documentElement;
  root.setAttribute("data-solar-phase", info.phase);
  root.setAttribute("data-hacker-hour", info.isHackerHour ? "true" : "false");

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("solar:changed", {
        detail: {
          phase: info.phase,
          isHackerHour: info.isHackerHour,
          hour: info.hour,
        },
      }),
    );
  }

  return info.phase;
}

export function initSolarCycle(options: SolarCycleOptions = {}): () => void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => {};
  }

  let currentPhase = applySolarPhase();
  options.onPhaseChange?.(currentPhase);

  const check = () => {
    const info = getSolarInfo();
    if (info.isHackerHour) {
      options.onHackerHour?.();
    }
    if (info.phase !== currentPhase) {
      currentPhase = applySolarPhase();
      options.onPhaseChange?.(currentPhase);
    }
  };

  check();

  const intervalId = setInterval(check, 60_000);
  const onVisibility = () => {
    if (!document.hidden) check();
  };
  const onPageLoad = () => applySolarPhase();

  document.addEventListener("visibilitychange", onVisibility);
  document.addEventListener("astro:page-load", onPageLoad);
  document.addEventListener("astro:after-swap", onPageLoad);

  return () => {
    clearInterval(intervalId);
    document.removeEventListener("visibilitychange", onVisibility);
    document.removeEventListener("astro:page-load", onPageLoad);
    document.removeEventListener("astro:after-swap", onPageLoad);
  };
}
