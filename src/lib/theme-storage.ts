/**
 * Preference storage operations for theme selection.
 */

export type ThemeMode = "dark" | "light" | "system";

export const THEME_KEY = "toille.theme.v1";

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    const val = localStorage.getItem(THEME_KEY);
    if (val === "dark" || val === "light") return val;
  } catch {
    // ignore storage access errors
  }
  return "system";
}

export function saveStoredTheme(mode: ThemeMode): void {
  if (typeof window === "undefined") return;
  try {
    if (mode === "system") {
      localStorage.removeItem(THEME_KEY);
    } else {
      localStorage.setItem(THEME_KEY, mode);
    }
  } catch {
    // ignore storage access errors
  }
}
