import {
  isDeviceOnBattery,
  setOnBatteryState,
  setBatteryLowState,
} from "./battery";

export type EcoMode = "auto" | "on" | "off";

export const ECO_KEY = "toille.eco.v1";

const VALID_MODES = new Set<EcoMode>(["on", "off", "auto"]);

export function getStoredEco(): EcoMode {
  if (typeof window === "undefined") return "auto";
  try {
    const val = localStorage.getItem(ECO_KEY) as EcoMode;
    if (VALID_MODES.has(val)) return val;
  } catch {
    // ignore
  }
  return "auto";
}

export { setOnBatteryState, setBatteryLowState };

export function isEffectiveEco(): boolean {
  if (typeof document !== "undefined") {
    const attr = document.documentElement.getAttribute("data-eco");
    if (attr !== null) return attr === "true";
  }
  const stored = getStoredEco();
  if (stored !== "auto") return stored === "on";
  return isDeviceOnBattery();
}

function persistEcoMode(mode: EcoMode): void {
  try {
    if (mode === "auto") {
      localStorage.removeItem(ECO_KEY);
    } else {
      localStorage.setItem(ECO_KEY, mode);
    }
  } catch {
    // ignore
  }
}

export function applyEco(mode: EcoMode): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  persistEcoMode(mode);

  const effective = mode === "auto" ? isDeviceOnBattery() : mode === "on";

  if (effective) {
    root.setAttribute("data-eco", "true");
  } else {
    root.removeAttribute("data-eco");
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("eco:changed", { detail: { mode, effective } }),
    );
  }
}

export function toggleEco(): EcoMode {
  const current = getStoredEco();
  const next: EcoMode = current === "on" ? "off" : "on";
  applyEco(next);
  return next;
}
