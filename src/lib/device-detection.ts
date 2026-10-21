/**
 * Low-level DOM and Navigator environment detection primitives.
 */

export function matchesMediaQuery(query: string): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return Boolean(window.matchMedia(query).matches);
}

export function hasTouchSupport(): boolean {
  if (typeof navigator === "undefined") return false;
  return (navigator.maxTouchPoints ?? 0) > 0;
}

export function matchesMobileUserAgent(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent ?? "";
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    ua,
  );
}
