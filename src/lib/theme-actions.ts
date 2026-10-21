import {
  type ThemeMode,
  getStoredTheme,
  saveStoredTheme,
} from "./theme-storage";
import { isEffectiveLight, getNextSystemTheme } from "./theme-query";

function updateThemeAttribute(root: HTMLElement, mode: ThemeMode): void {
  if (mode === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", mode);
  }
}

function notifyThemeChanged(mode: ThemeMode): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("theme:changed", {
      detail: { theme: mode, isLight: isEffectiveLight() },
    }),
  );
}

export function applyTheme(mode: ThemeMode): void {
  if (typeof document === "undefined") return;
  updateThemeAttribute(document.documentElement, mode);
  saveStoredTheme(mode);
  notifyThemeChanged(mode);
}

export function toggleTheme(): ThemeMode {
  const current = getStoredTheme();
  const next: ThemeMode =
    current === "system"
      ? getNextSystemTheme()
      : current === "dark"
        ? "light"
        : "dark";
  applyTheme(next);
  return next;
}
