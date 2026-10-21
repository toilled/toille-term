interface BatteryManager extends EventTarget {
  charging: boolean;
  level: number;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
  ): void;
}

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManager>;
}

export type PowerMode = "overclocked" | "normal" | "low" | "critical";

export interface BatteryStatus {
  onBattery: boolean;
  charging: boolean;
  level: number | null;
  powerMode: PowerMode;
}

let isOnBattery = false;
let currentBatteryStatus: BatteryStatus = {
  onBattery: false,
  charging: true,
  level: null,
  powerMode: "normal",
};

function getDischargingPowerMode(level: number | null): PowerMode {
  if (level === null) return "normal";
  if (level <= 0.15) return "critical";
  if (level <= 0.3) return "low";
  return "normal";
}

export function calculatePowerMode(
  charging: boolean,
  level: number | null,
): PowerMode {
  if (charging) {
    return level === null || level >= 0.75 ? "overclocked" : "normal";
  }
  return getDischargingPowerMode(level);
}

export function isDeviceOnBattery(): boolean {
  return isOnBattery;
}

export function getBatteryLevel(): number | null {
  return currentBatteryStatus.level;
}

export function getPowerMode(): PowerMode {
  return currentBatteryStatus.powerMode;
}

export function getBatteryStatus(): BatteryStatus {
  return { ...currentBatteryStatus };
}

export function setBatteryStatusState(
  charging: boolean,
  level: number | null,
): void {
  const onBattery = !charging;
  const powerMode = calculatePowerMode(charging, level);
  isOnBattery = onBattery;
  currentBatteryStatus = {
    onBattery,
    charging,
    level,
    powerMode,
  };

  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-power-mode", powerMode);
  }
}

export function setOnBatteryState(onBattery: boolean): void {
  isOnBattery = onBattery;
  setBatteryStatusState(!onBattery, currentBatteryStatus.level);
}

export function setBatteryLowState(low: boolean): void {
  if (low) {
    isOnBattery = true;
    setBatteryStatusState(false, 0.15);
  } else {
    isOnBattery = false;
    setBatteryStatusState(true, 1.0);
  }
}

export function initBatteryMonitoring(
  onChange?: (onBattery: boolean) => void,
): () => void {
  if (typeof navigator === "undefined" || !("getBattery" in navigator)) {
    return () => {};
  }
  let active = true;
  let batteryRef: BatteryManager | null = null;
  let checkBattery: (() => void) | null = null;

  const nav = navigator as NavigatorWithBattery;
  nav
    .getBattery?.()
    .then((battery) => {
      if (!active || !battery) return;
      batteryRef = battery;
      checkBattery = () => {
        if (!active) return;
        const charging = battery.charging;
        const level = typeof battery.level === "number" ? battery.level : null;
        setBatteryStatusState(charging, level);

        const onBattery = !charging;
        onChange?.(onBattery);

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("power:changed", {
              detail: {
                onBattery,
                charging,
                level,
                powerMode: currentBatteryStatus.powerMode,
              },
            }),
          );
        }
      };
      checkBattery();
      battery.addEventListener("chargingchange", checkBattery);
      battery.addEventListener("levelchange", checkBattery);
    })
    .catch(() => {});

  return () => {
    active = false;
    if (batteryRef && checkBattery) {
      batteryRef.removeEventListener("chargingchange", checkBattery);
      batteryRef.removeEventListener("levelchange", checkBattery);
    }
  };
}
