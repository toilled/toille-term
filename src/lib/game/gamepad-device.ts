/**
 * Gamepad API Device Access & Detection
 * Provides low-level browser Gamepad API detection and active device enumeration.
 */

export function isGamepadSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.getGamepads === "function"
  );
}

function isConnectedGamepad(gp: Gamepad | null | undefined): gp is Gamepad {
  return Boolean(gp?.connected);
}

export function getConnectedGamepads(): Gamepad[] {
  if (!isGamepadSupported()) return [];
  const raw = navigator.getGamepads();
  if (!raw) return [];
  return Array.from(raw).filter(isConnectedGamepad);
}

export function isGamepadConnected(): boolean {
  return getConnectedGamepads().length > 0;
}
