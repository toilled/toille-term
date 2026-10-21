export function navigateTo(path: string): void {
  if (typeof window !== "undefined") {
    if (path.startsWith("http")) {
      window.open(path, "_blank", "noopener,noreferrer");
    } else {
      window.open(`https://toille.uk${path}`, "_blank", "noopener,noreferrer");
    }
  }
}
