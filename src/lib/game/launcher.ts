import { isMobileDevice } from "../device";

export { isMobileDevice };

export async function launchCyberRacer(): Promise<void> {
  if (typeof window !== "undefined") {
    window.open("https://racer.toille.uk", "_blank", "noopener,noreferrer");
  }
}
