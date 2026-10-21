/**
 * Network Telemetry & Low-Bandwidth Subsystem
 * Monitors connection quality (4G/3G/2G, RTT, downlink, Data Saver)
 * and online/offline availability to adapt animations and UI.
 */

export type EffectiveConnectionType =
  "slow-2g" | "2g" | "3g" | "4g" | "unknown";
export type NetworkStatus = "online" | "offline";

export interface NetworkTelemetry {
  online: boolean;
  status: NetworkStatus;
  effectiveType: EffectiveConnectionType;
  saveData: boolean;
  downlinkMb: number | null;
  rttMs: number | null;
  isLowBandwidth: boolean;
}

export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine !== false;
}

const VALID_TYPES = new Set<EffectiveConnectionType>([
  "slow-2g",
  "2g",
  "3g",
  "4g",
]);
const LOW_BANDWIDTH_TYPES = new Set<EffectiveConnectionType>(["slow-2g", "2g"]);

function resolveEffectiveType(
  rawType: unknown,
  online: boolean,
): EffectiveConnectionType {
  if (
    typeof rawType === "string" &&
    VALID_TYPES.has(rawType as EffectiveConnectionType)
  ) {
    return rawType as EffectiveConnectionType;
  }
  return online ? "4g" : "unknown";
}

interface NetworkConnection {
  effectiveType?: string;
  saveData?: boolean;
  downlink?: number;
  rtt?: number;
}

function parseConnection(conn?: NetworkConnection) {
  if (!conn) {
    return {
      rawType: undefined,
      saveData: false,
      downlinkMb: null,
      rttMs: null,
    };
  }
  return {
    rawType: conn.effectiveType,
    saveData: Boolean(conn.saveData),
    downlinkMb: typeof conn.downlink === "number" ? conn.downlink : null,
    rttMs: typeof conn.rtt === "number" ? conn.rtt : null,
  };
}

export function getNetworkTelemetry(): NetworkTelemetry {
  const online = isOnline();
  if (typeof navigator === "undefined") {
    return {
      online: true,
      status: "online",
      effectiveType: "unknown",
      saveData: false,
      downlinkMb: null,
      rttMs: null,
      isLowBandwidth: false,
    };
  }

  const nav = navigator as Navigator & { connection?: NetworkConnection };
  const parsed = parseConnection(nav.connection);
  const effectiveType = resolveEffectiveType(parsed.rawType, online);
  const isLow = LOW_BANDWIDTH_TYPES.has(effectiveType);

  return {
    online,
    status: online ? "online" : "offline",
    effectiveType,
    saveData: parsed.saveData,
    downlinkMb: parsed.downlinkMb,
    rttMs: parsed.rttMs,
    isLowBandwidth: parsed.saveData || isLow,
  };
}

export function applyNetworkAttributes(
  telemetry = getNetworkTelemetry(),
): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  root.setAttribute("data-network-status", telemetry.status);
  root.setAttribute("data-connection-type", telemetry.effectiveType);

  if (telemetry.saveData) {
    root.setAttribute("data-save-data", "true");
  } else {
    root.removeAttribute("data-save-data");
  }

  if (telemetry.isLowBandwidth) {
    root.setAttribute("data-low-bandwidth", "true");
  } else {
    root.removeAttribute("data-low-bandwidth");
  }
}

export function initNetworkMonitoring(
  onChange?: (telemetry: NetworkTelemetry) => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  applyNetworkAttributes();

  const handleUpdate = () => {
    const telemetry = getNetworkTelemetry();
    applyNetworkAttributes(telemetry);
    window.dispatchEvent(
      new CustomEvent("network:changed", { detail: telemetry }),
    );
    onChange?.(telemetry);
  };

  window.addEventListener("online", handleUpdate);
  window.addEventListener("offline", handleUpdate);

  const nav = navigator as Navigator & {
    connection?: {
      addEventListener?: (type: string, listener: EventListener) => void;
      removeEventListener?: (type: string, listener: EventListener) => void;
    };
  };
  nav.connection?.addEventListener?.("change", handleUpdate);

  return () => {
    window.removeEventListener("online", handleUpdate);
    window.removeEventListener("offline", handleUpdate);
    nav.connection?.removeEventListener?.("change", handleUpdate);
  };
}
