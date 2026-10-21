import { describe, it, expect, vi, afterEach } from "vitest";
import { runCommand } from "../../src/lib/terminal/commands.js";

/**
 * @param {import('../../src/lib/terminal/commands.js').CommandLine[] | null} result
 * @returns {string[]}
 */
function texts(result) {
  return (result ?? []).map((line) => line.text);
}

describe("runCommand", () => {
  it("returns an empty array for an empty or blank command", () => {
    expect(runCommand("")).toEqual([]);
    expect(runCommand("   ")).toEqual([]);
  });

  it("collapses repeated whitespace between arguments", () => {
    const goto = vi.fn();
    const result = runCommand("open   about", { goto });
    expect(goto).toHaveBeenCalledWith("/about");
    expect(texts(result)).toEqual(["opening /about …"]);
  });

  it("reports unknown commands", () => {
    const result = runCommand("bogus");
    expect(texts(result)).toEqual(["command not found: bogus — try 'help'"]);
  });

  it("safely rejects Object prototype property names as unknown commands", () => {
    for (const name of ["constructor", "toString", "valueOf", "__proto__"]) {
      const result = runCommand(name);
      expect(texts(result)).toEqual([
        `command not found: ${name} — try 'help'`,
      ]);
    }
  });
});

describe("help", () => {
  it("handles the help command", () => {
    const result = runCommand("help");
    expect(texts(result)[0]).toBe("available commands:");
    expect(texts(result)).toContain(
      "  open <target>      navigate (about, interests, experiments)",
    );
  });
});

describe("whoami", () => {
  it("identifies the user", () => {
    const result = runCommand("whoami");
    expect(texts(result)).toEqual([
      "elliot_dickerson — Senior Web Developer @ RM Assessments [14+ Years Experience]",
    ]);
  });
});

describe("resume & contact", () => {
  it("returns CV summary for resume and cv alias", () => {
    const res = runCommand("resume");
    expect(texts(res)[0]).toBe("// ELLIOT DICKERSON — CURRICULUM VITAE");
    expect(texts(res)).toContain(
      "  Role:        Senior Web Developer @ RM Assessments",
    );
    expect(texts(runCommand("cv"))).toEqual(texts(res));
  });

  it("returns contact channels for contact and email alias", () => {
    const res = runCommand("contact");
    expect(texts(res)[0]).toBe("// VERIFIED CHANNELS & PROFILES");
    expect(texts(res)).toContain("  GitHub:    https://github.com/toilled");
    expect(texts(res)).toContain(
      "  YouTube:   https://www.youtube.com/@toilled",
    );
    expect(texts(runCommand("email"))).toEqual(texts(res));
  });
});

describe("fx", () => {
  it("is no longer a registered command after CRT removal", () => {
    const res = runCommand("fx");
    expect(texts(res)).toEqual(["command not found: fx — try 'help'"]);
  });
});

describe("cat", () => {
  it("reads the tech stack via cat stack.txt", () => {
    const result = runCommand("cat stack.txt");
    expect(texts(result)).toEqual([
      "PHP · Laravel · Symfony",
      "JS · Svelte · React · SolidJS · TS",
      "MySQL · Docker · Git · MQTT",
    ]);
  });

  it("accepts the short alias cat stack", () => {
    expect(texts(runCommand("cat stack"))).toEqual(
      texts(runCommand("cat stack.txt")),
    );
  });

  it("rejects unknown files for cat", () => {
    const result = runCommand("cat resume.pdf");
    expect(texts(result)).toEqual([
      "cat: resume.pdf: no such file — try 'cat stack.txt'",
    ]);
  });

  it("handles cat with no argument", () => {
    const result = runCommand("cat");
    expect(texts(result)).toEqual([
      "cat: file: no such file — try 'cat stack.txt'",
    ]);
  });

  it("reads the race manual via cat cyberracer.txt", () => {
    const result = runCommand("cat cyberracer.txt");
    expect(texts(result)[0]).toBe("CYBERRACER — trackmania-style arcade racer");
    expect(texts(result)).toContain(
      "tracks: neon-loop · grid-circuit · helix-rush",
    );
    expect(texts(runCommand("cat racer"))).toEqual(texts(result));
    expect(texts(runCommand("cat racer.txt"))).toEqual(texts(result));
  });
});

describe("ls", () => {
  it("lists files", () => {
    expect(texts(runCommand("ls"))).toEqual([
      "about/  interests/  stack.txt  experiments/  cyberracer.bin  tracks.db",
    ]);
  });
});

describe("pwd", () => {
  it("prints the working directory", () => {
    expect(texts(runCommand("pwd"))).toEqual(["~/dev/identity"]);
  });
});

describe("run / run_experiments", () => {
  it("launches experiments for run_experiments", () => {
    const result = runCommand("run_experiments");
    expect(texts(result)).toContain("booting dev tool suite …");
    expect(texts(result)).toContain("status: dev tool suite fully operational");
    expect(texts(result)).toContain("▸ json formatter ......... ONLINE");
    expect(texts(result)).toContain("▸ base64 & url converter . ONLINE");
  });

  it("launches CYBERRACER via run cyberracer and invokes onLaunchGame", () => {
    const onLaunchGame = vi.fn();
    const result = runCommand("run cyberracer", { onLaunchGame });
    expect(onLaunchGame).toHaveBeenCalledTimes(1);
    expect(texts(result)).toContain("▸ CYBERRACER v1.0 ............ FOUND");
    expect(texts(result)).toContain("engaging racing systems …");
  });

  it("aliases cyberracer, game, and racer to the racer launcher", () => {
    for (const cmd of ["cyberracer", "game", "racer"]) {
      const onLaunchGame = vi.fn();
      runCommand(cmd, { onLaunchGame });
      expect(onLaunchGame).toHaveBeenCalledTimes(1);
    }
  });

  it("rejects unknown programs for run", () => {
    const onLaunchGame = vi.fn();
    const result = runCommand("run portal", { onLaunchGame });
    expect(onLaunchGame).not.toHaveBeenCalled();
    expect(texts(result)).toEqual([
      "run: unknown program 'portal' — try 'run cyberracer'",
    ]);
  });

  it("outputs disabled message when cyberracer is run on mobile devices", () => {
    const origMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes("max-width") || query.includes("coarse"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const onLaunchGame = vi.fn();
    const result = runCommand("run cyberracer", { onLaunchGame });
    expect(onLaunchGame).not.toHaveBeenCalled();
    expect(texts(result)).toContain(
      "▸ CYBERRACER is disabled on mobile devices.",
    );

    window.matchMedia = origMatchMedia;
  });
});

describe("date", () => {
  it("returns the current time in UTC", () => {
    const result =
      /** @type {import('../../src/lib/terminal/commands.js').CommandLine[]} */ (
        runCommand("date")
      );
    expect(result).toHaveLength(1);
    expect(new Date(result[0].text).toString()).not.toBe("Invalid Date");
  });
});

describe("clear", () => {
  it("returns null", () => {
    expect(runCommand("clear")).toBeNull();
  });
});

describe("open", () => {
  it("navigates to a valid target", () => {
    const goto = vi.fn();
    const result = runCommand("open interests", { goto });
    expect(goto).toHaveBeenCalledWith("/interests");
    expect(texts(result)).toEqual(["opening /interests …"]);
  });

  it("navigates to the experiments playground and ide", () => {
    const goto = vi.fn();
    runCommand("open experiments", { goto });
    expect(goto).toHaveBeenCalledWith("/experiments");

    const gotoAlias = vi.fn();
    runCommand("open playground", { goto: gotoAlias });
    expect(gotoAlias).toHaveBeenCalledWith("https://ide.toille.uk");

    const gotoIde = vi.fn();
    const resultIde = runCommand("open ide", { goto: gotoIde });
    expect(gotoIde).toHaveBeenCalledWith("https://ide.toille.uk");
    expect(texts(resultIde)).toEqual(["opening https://ide.toille.uk …"]);

    const gotoDirect = vi.fn();
    const resultDirect = runCommand("ide", { goto: gotoDirect });
    expect(gotoDirect).toHaveBeenCalledWith("https://ide.toille.uk");
    expect(texts(resultDirect)).toEqual(["opening https://ide.toille.uk …"]);
  });

  it("maps racer to /racer via open shortcut", () => {
    const gotoRacer = vi.fn();
    const result = runCommand("open racer", { goto: gotoRacer });
    expect(gotoRacer).toHaveBeenCalledWith("/racer");
    expect(texts(result)).toEqual(["opening /racer …"]);
  });

  it("maps home and root to the home route", () => {
    const gotoHome = vi.fn();
    runCommand("open home", { goto: gotoHome });
    expect(gotoHome).toHaveBeenCalledWith("/");

    const gotoRoot = vi.fn();
    runCommand("open root", { goto: gotoRoot });
    expect(gotoRoot).toHaveBeenCalledWith("/");
  });

  it("rejects unknown targets", () => {
    const goto = vi.fn();
    const result = runCommand("open nowhere", { goto });
    expect(goto).not.toHaveBeenCalled();
    expect(texts(result)).toEqual([
      "open: unknown target 'nowhere' — try about, interests, experiments, home",
    ]);
  });

  it("handles open with no target", () => {
    const result = runCommand("open", {});
    expect(texts(result)).toEqual([
      "open: unknown target '' — try about, interests, experiments, home",
    ]);
  });
});

describe("exit / logout", () => {
  it("closes the session for exit and invokes onExit", () => {
    const onExit = vi.fn();
    const result = runCommand("exit", { onExit });
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(texts(result)).toEqual([
      "session closed — click terminal to reopen",
    ]);
  });

  it("aliases logout to exit", () => {
    const onExit = vi.fn();
    runCommand("logout", { onExit });
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});

describe("achievements", () => {
  it("lists achievements and progress", () => {
    const result = runCommand("achievements");
    expect(texts(result)[0]).toMatch(/\/\/ SYSTEM ACHIEVEMENT MATRIX/);
    expect(texts(result).some((line) => line.includes("FIRST SIGNAL"))).toBe(
      true,
    );
  });
});

describe("matrix & hack easter eggs", () => {
  it("runs matrix digital rain simulation", () => {
    const result = runCommand("matrix");
    expect(texts(result)).toContain("▲ 0 1 0 1  W A K E U P N E O  1 0 1 0 ▲");
    expect(texts(result)).toContain("system integrity: 100% · bridge online");
    expect(texts(result).every((line) => line.length <= 40)).toBe(true);
  });

  it("runs hack protocol simulation", () => {
    const result = runCommand("hack");
    expect(texts(result)).toContain("initiating neural bypass protocol …");
    expect(texts(result)).toContain("root permission: GRANTED");
  });
});

describe("theme command", () => {
  it("sets theme mode for light, dark, and system", () => {
    expect(texts(runCommand("theme dark"))).toEqual([
      "theme mode set to: DARK",
    ]);
    expect(texts(runCommand("theme light"))).toEqual([
      "theme mode set to: LIGHT",
    ]);
    expect(texts(runCommand("theme system"))).toEqual([
      "theme mode set to: SYSTEM",
    ]);
  });

  it("toggles theme when passed toggle or no argument", () => {
    expect(texts(runCommand("theme toggle"))[0]).toMatch(/theme switched to:/);
    expect(texts(runCommand("theme"))[0]).toMatch(/theme switched to:/);
  });

  it("shows usage message for invalid theme argument", () => {
    expect(texts(runCommand("theme neon"))).toEqual([
      "usage: theme <dark|light|system|toggle>",
    ]);
  });
});

describe("eco command", () => {
  it("sets eco mode for on, off, and auto", () => {
    expect(texts(runCommand("eco on"))).toEqual(["eco mode set to: ON"]);
    expect(texts(runCommand("eco off"))).toEqual(["eco mode set to: OFF"]);
    expect(texts(runCommand("eco auto"))).toEqual(["eco mode set to: AUTO"]);
  });

  it("toggles eco mode when passed toggle or no argument", () => {
    expect(texts(runCommand("eco toggle"))[0]).toMatch(/eco mode switched to:/);
    expect(texts(runCommand("eco"))[0]).toMatch(/eco mode switched to:/);
  });

  it("shows usage message for invalid eco argument", () => {
    expect(texts(runCommand("eco turbo"))).toEqual([
      "usage: eco <on|off|auto|toggle>",
    ]);
  });
});

describe("audio command & cyberdeck launcher", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("data-audio-active");
  });

  it("reports standby state when audio is inactive", () => {
    const result = runCommand("audio");
    expect(texts(result)[0]).toBe("// CYBERDECK AUDIO SUBSYSTEM [STANDBY]");
    expect(texts(result)).toContain("  status:      STANDBY · READY");
  });

  it("reports active state when audio is playing", () => {
    document.documentElement.setAttribute("data-audio-active", "true");
    const result = runCommand("audio");
    expect(texts(result)[0]).toBe("// CYBERDECK AUDIO SUBSYSTEM [ACTIVE]");
    expect(texts(result)).toContain("  status:      ONLINE · SYNCHRONIZED");
    expect(texts(runCommand("music"))).toEqual(texts(result));
    expect(texts(runCommand("synth"))).toEqual(texts(result));
    expect(texts(runCommand("cyberdeck"))).toEqual(texts(result));
  });

  it("launches cyberdeck synthesizer via run cyberdeck", () => {
    const goto = vi.fn();
    const result = runCommand("run cyberdeck", { goto });
    expect(goto).toHaveBeenCalledWith("/#audio-lab");
    expect(texts(result)).toContain("booting CYBERDECK audio synthesis lab …");
    expect(texts(result)).toContain("▸ 4-stem sequencer .......... ARMED");
  });
});

describe("ping / net command", () => {
  it("displays online network telemetry and aliases", () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
    const res = runCommand("ping");
    expect(texts(res)[0]).toBe("// NEURAL LINK TELEMETRY");
    expect(texts(res)).toContain("  status:        ONLINE [LINK ESTABLISHED]");
    expect(texts(runCommand("net"))).toEqual(texts(res));
    expect(texts(runCommand("network"))).toEqual(texts(res));
  });

  it("displays offline warning when connection is severed", () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    const res = runCommand("ping");
    expect(texts(res)[0]).toBe("// NEURAL LINK: OFFLINE [DISCONNECTED]");
    expect(texts(res)).toContain(
      "  status:        OFFLINE · ZERO SIGNAL DETECTED",
    );
  });
});

describe("gamepad command", () => {
  it("reports no gamepad detected when no controller is attached", () => {
    Object.defineProperty(navigator, "getGamepads", {
      value: vi.fn().mockReturnValue([]),
      configurable: true,
    });

    const result = runCommand("gamepad");
    expect(texts(result)[0]).toBe(
      "// CONTROLLER SUBSYSTEM: NO GAMEPAD DETECTED",
    );
    expect(texts(runCommand("pad"))).toEqual(texts(result));
    expect(texts(runCommand("controller"))).toEqual(texts(result));
  });

  it("displays device details when gamepad is connected", () => {
    const pad = {
      id: "Xbox Wireless Controller",
      index: 0,
      connected: true,
      mapping: "standard",
      buttons: Array(17).fill({ pressed: false }),
      axes: [0, 0, 0, 0],
    };
    Object.defineProperty(navigator, "getGamepads", {
      value: vi.fn().mockReturnValue([pad]),
      configurable: true,
    });

    const result = runCommand("gamepad");
    expect(texts(result)[0]).toBe(
      "// CONTROLLER SUBSYSTEM: 1 DEVICE(S) DETECTED",
    );
    expect(texts(result)[1]).toContain("[PAD #0] Xbox Wireless Controller");
    expect(texts(result)[2]).toContain("Buttons: 17 · Axes: 4");
  });
});

describe("sysinfo / specs command", () => {
  it("outputs hardware diagnostics and core details", () => {
    Object.defineProperty(navigator, "hardwareConcurrency", {
      value: 8,
      configurable: true,
    });
    Object.defineProperty(navigator, "deviceMemory", {
      value: 8,
      configurable: true,
    });

    const result = runCommand("sysinfo");
    expect(texts(result)[0]).toBe(
      "// CYBERDECK HARDWARE & THREADING DIAGNOSTICS",
    );
    expect(texts(result)[1]).toContain("8 LOGICAL CORES");
    expect(texts(runCommand("specs"))).toEqual(texts(result));
    expect(texts(runCommand("hardware"))).toEqual(texts(result));
    expect(texts(runCommand("cpu"))).toEqual(texts(result));
  });
});

describe("briefing, voice, listen commands", () => {
  it("runs tactical briefing command and status alias", () => {
    const result = runCommand("briefing");
    expect(texts(result)[0]).toBe("// TACTICAL SYNTHETIC AUDIO BRIEFING");
    expect(texts(result)[1]).toContain("Cyberdeck systems online.");

    const statusResult = runCommand("status");
    expect(texts(statusResult)[0]).toBe("// TACTICAL SYNTHETIC AUDIO BRIEFING");
  });

  it("runs voice status, mute, unmute, toggle, say commands", () => {
    const status = runCommand("voice");
    expect(texts(status)[0]).toBe("// SYNTHETIC CYBERNETIC VOCAL INTERFACE");

    const mute = runCommand("voice mute");
    expect(texts(mute)[0]).toBe("// VOCAL SYNTHESIS MUTED");

    const unmute = runCommand("voice unmute");
    expect(texts(unmute)[0]).toBe("// VOCAL SYNTHESIS UNMUTED");

    const toggle = runCommand("voice toggle");
    expect(texts(toggle)[0]).toContain("VOCAL SYNTHESIS");

    const say = runCommand("voice say Hello Operator");
    expect(texts(say)[0]).toBe("// TRANSMITTING SYNTHESIZED VOCAL PHRASE");
    expect(texts(say)[1]).toBe('  "Hello Operator"');

    const test = runCommand("voice test");
    expect(texts(test)[0]).toBe("// TRANSMITTING SYNTHESIZED VOCAL PHRASE");

    expect(texts(runCommand("voice bogus"))[0]).toBe(
      "unknown voice option: bogus",
    );
  });

  it("runs listen / mic commands", () => {
    const onToggleMic = vi.fn();
    const result = runCommand("listen", { onToggleMic });
    expect(texts(result)[0]).toContain("HANDS-FREE");
    expect(texts(runCommand("mic", { onToggleMic }))).toEqual(texts(result));
  });
});
