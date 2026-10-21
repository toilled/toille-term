import { vi } from "vitest";
import { cleanup } from "@solidjs/testing-library";

export const visibleRect = {
  top: 0,
  bottom: 600,
  height: 600,
  width: 400,
  left: 0,
  right: 400,
  x: 0,
  y: 0,
  toJSON: () => ({}),
};

export function cleanupAfterEach() {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  if (typeof window !== "undefined") {
    if (window.location?.hash) {
      window.location.hash = "";
    }
    try {
      window.localStorage?.clear();
    } catch {
      /* ignore */
    }
  }
}
