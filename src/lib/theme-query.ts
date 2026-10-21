export function isEffectiveLight(): boolean {
  if (typeof document === "undefined") return false;
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light") return true;
  if (attr === "dark") return false;
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: light)").matches
  );
}

export function getNextSystemTheme(): "dark" | "light" {
  const prefersLight =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: light)").matches;
  return prefersLight ? "dark" : "light";
}
