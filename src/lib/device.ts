import {
  hasTouchSupport,
  matchesMediaQuery,
  matchesMobileUserAgent,
} from "./device-detection";

/**
 * Detect whether the client is a mobile or touch-only device where
 * CyberRacer keyboard controls are not supported.
 *
 * Checks in priority order:
 * 1. Mobile user agent strings
 * 2. Primary coarse pointer (touchscreens, styluses)
 * 3. Compact viewport (<768px) with touch support points
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  if (matchesMobileUserAgent()) return true;
  if (matchesMediaQuery("(pointer: coarse)")) return true;
  return matchesMediaQuery("(max-width: 768px)") && hasTouchSupport();
}
