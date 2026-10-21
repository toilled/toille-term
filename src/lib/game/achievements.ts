/**
 * Cyberpunk Achievement & Gamification Matrix
 * Manages persistent unlocks, progress tracking, and event dispatching.
 */

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  accent: "cyan" | "pink" | "purple" | "yellow";
  unlocked: boolean;
  unlockedAt?: string;
}

const ACHIEVEMENTS_STORAGE_KEY = "toille.achievements.v1";

export const ACHIEVEMENT_DEFS: Omit<Achievement, "unlocked" | "unlockedAt">[] =
  [
    {
      id: "FIRST_SIGNAL",
      title: "FIRST SIGNAL",
      description: "Engage with the terminal or system command palette.",
      icon: "⚡",
      accent: "cyan",
    },
    {
      id: "RACER_ROOKIE",
      title: "STREET LEGAL",
      description: "Complete your first high-speed lap in CyberRacer.",
      icon: "🏎️",
      accent: "pink",
    },
    {
      id: "CYBER_GOLD",
      title: "GOLD STANDARD",
      description: "Earn a Gold or Author medal on any race track.",
      icon: "🥇",
      accent: "yellow",
    },
    {
      id: "SPEED_DEMON",
      title: "APEX DRIVER",
      description: "Finish a race in under 45 seconds.",
      icon: "⏱️",
      accent: "cyan",
    },
    {
      id: "TERMINAL_ROOT",
      title: "ROOT ACCESS",
      description: "Execute 5 distinct commands in the interactive terminal.",
      icon: "💻",
      accent: "purple",
    },
    {
      id: "MATRIX_BREACH",
      title: "MATRIX RAIN",
      description: "Discovered the hidden digital rain simulation command.",
      icon: "🕶️",
      accent: "cyan",
    },
    {
      id: "KONAMI_GOD",
      title: "GOD MODE OVERRIDE",
      description: "Entered the classic Konami code sequence.",
      icon: "👾",
      accent: "pink",
    },
    {
      id: "POLYGLOT",
      title: "SYSTEM ARCHITECT",
      description: "Inspected the complete engineering tech stack.",
      icon: "🌐",
      accent: "purple",
    },
    {
      id: "SIGNAL_LOST",
      title: "SIGNAL RESTORED",
      description: "Switched frequencies and re-established the neural uplink.",
      icon: "📡",
      accent: "cyan",
    },
    {
      id: "NIGHT_RUNNER",
      title: "NIGHT CRAWLER",
      description:
        "Engaged the cyberdeck terminal during late-night hacker hours.",
      icon: "🌙",
      accent: "purple",
    },
    {
      id: "SYNTH_WAVE",
      title: "AUDIO OVERDRIVE",
      description: "Engaged the Cyberdeck synthesizer audio engine.",
      icon: "🎛️",
      accent: "pink",
    },
    {
      id: "NET_RUNNER",
      title: "DATA RUNNER",
      description: "Probed network telemetry and link connection parameters.",
      icon: "📡",
      accent: "cyan",
    },
    {
      id: "GAMEPAD_RIG",
      title: "ARCADE RIG",
      description: "Connected a physical game controller or arcade stick.",
      icon: "🎮",
      accent: "pink",
    },
    {
      id: "CYBER_SPEC",
      title: "RIG INSPECTOR",
      description:
        "Executed system hardware diagnostics to inspect cyberdeck specs.",
      icon: "🎛️",
      accent: "cyan",
    },
  ];

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readStoredUnlocks(): Record<string, string> {
  const s = getStorage();
  if (!s) return {};
  try {
    const raw = s.getItem(ACHIEVEMENTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStoredUnlocks(data: Record<string, string>): void {
  const s = getStorage();
  if (!s) return;
  try {
    s.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function getAchievements(): Achievement[] {
  const stored = readStoredUnlocks();
  return ACHIEVEMENT_DEFS.map((def) => ({
    ...def,
    unlocked: !!stored[def.id],
    unlockedAt: stored[def.id],
  }));
}

export function getAchievementProgress(): {
  unlocked: number;
  total: number;
  percent: number;
} {
  const list = getAchievements();
  const unlocked = list.filter((a) => a.unlocked).length;
  const total = list.length;
  const percent = total > 0 ? Math.round((unlocked / total) * 100) : 0;
  return { unlocked, total, percent };
}

export function unlockAchievement(id: string): Achievement | null {
  const def = ACHIEVEMENT_DEFS.find((a) => a.id === id);
  if (!def) return null;

  const stored = readStoredUnlocks();
  if (stored[id]) {
    // Already unlocked
    return null;
  }

  const now = new Date().toISOString();
  stored[id] = now;
  writeStoredUnlocks(stored);

  const unlockedAchievement: Achievement = {
    ...def,
    unlocked: true,
    unlockedAt: now,
  };

  if (typeof window !== "undefined") {
    const event = new CustomEvent("achievement:unlocked", {
      detail: unlockedAchievement,
    });
    window.dispatchEvent(event);
  }

  return unlockedAchievement;
}

export function resetAchievements(): void {
  const s = getStorage();
  if (!s) return;
  try {
    s.removeItem(ACHIEVEMENTS_STORAGE_KEY);
  } catch {
    // ignore
  }
}
