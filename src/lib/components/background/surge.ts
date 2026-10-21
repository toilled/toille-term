export interface BackgroundSurgeDetail {
  x?: number;
  y?: number;
  intensity?: number;
  speed?: number;
  radius?: number;
}

export function triggerBackgroundSurge(detail?: BackgroundSurgeDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("background:surge", { detail }));
}
