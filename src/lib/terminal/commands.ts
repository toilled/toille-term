import { unlockAchievement } from "$lib/game/achievements";
import { PROFILE } from "$lib/data/profile";
import {
  out,
  type CommandLine,
  type CommandCtx,
  type CommandHandler,
} from "./types";
import {
  handleTheme,
  handleEco,
  handlePower,
  handleSolar,
  handlePing,
  handleSysinfo,
} from "./system-commands";
import {
  handleBriefingCommand,
  handleVoiceCommand,
  handleListenCommand,
} from "./voice-commands";
import {
  launchCyberracer,
  handleAchievements,
  handleGamepad,
  handlePhoneGamepad,
  handleCockpit,
} from "./game-commands";

export type { CommandLine, CommandCtx };

const executedCommands = new Set<string>();

const targets: Record<string, string> = {
  about: "/about",
  interests: "/interests",
  experiments: "/experiments",
  playground: "https://ide.toille.uk",
  home: "/",
  root: "/",
  audio: "/#audio-lab",
  music: "/#audio-lab",
  cyberdeck: "/#audio-lab",
  ide: "https://ide.toille.uk",
  racer: "/racer",
  cockpit: "/arcade/telemetry",
  telemetry: "/arcade/telemetry",
  gamepad: "/arcade/gamepad",
  phonegamepad: "/arcade/gamepad",
  pair: "/arcade/gamepad",
};

const RACER_ALIASES = new Set(["cyberracer", "game", "racer"]);
const AUDIO_ALIASES = new Set(["cyberdeck", "audio", "synth", "music"]);
const STACK_FILES = new Set(["stack.txt", "stack"]);
const RACER_FILES = new Set([
  "cyberracer.txt",
  "cyberracer",
  "racer.txt",
  "racer",
]);

function handleCatCommand(arg: string): CommandLine[] {
  if (STACK_FILES.has(arg)) {
    unlockAchievement("POLYGLOT");
    return [
      out("PHP · Laravel · Symfony", "purple"),
      out("JS · Svelte · React · SolidJS · TS", "purple"),
      out("MySQL · Docker · Git · MQTT", "purple"),
    ];
  }
  if (RACER_FILES.has(arg)) {
    return [
      out("CYBERRACER — trackmania-style arcade racer", "cyan"),
      out("physics: stadium car · grip model · top speed 1000", "dim"),
      out("tracks: neon-loop · grid-circuit · helix-rush", "dim"),
      out("medals: author · gold · silver · bronze", "dim"),
      out("leaderboard: fastest lap per track (local)", "dim"),
      out(
        "launch with 'racer' or 'run cyberracer' · controls: WASD / arrows / Gamepad",
        "yellow",
      ),
    ];
  }
  return [
    out(`cat: ${arg || "file"}: no such file — try 'cat stack.txt'`, "pink"),
  ];
}

function handleAudioStatus(): CommandLine[] {
  const isPlaying =
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("data-audio-active") === "true";
  if (isPlaying) {
    return [
      out("// CYBERDECK AUDIO SUBSYSTEM [ACTIVE]", "cyan"),
      out("  status:      ONLINE · SYNCHRONIZED", "yellow"),
      out("  dsp engine:  4-stem synthesizer & visualizer", "purple"),
      out("  background:  audio-reactive mesh active", "pink"),
      out("tip: type 'open audio' to visit audio lab", "dim"),
    ];
  }
  return [
    out("// CYBERDECK AUDIO SUBSYSTEM [STANDBY]", "cyan"),
    out("  status:      STANDBY · READY", "dim"),
    out("  dsp engine:  multi-stem Web Audio synth & DSP rack", "purple"),
    out("  interactive: 8-key pentatonic jam pad + presets", "purple"),
    out("tip: type 'open audio' to launch synthesizer", "yellow"),
  ];
}

function handleRunCommand(arg: string, ctx: CommandCtx): CommandLine[] {
  if (RACER_ALIASES.has(arg)) {
    return launchCyberracer(ctx);
  }
  if (AUDIO_ALIASES.has(arg)) {
    ctx.goto?.("/#audio-lab");
    return [
      out("booting CYBERDECK audio synthesis lab …", "cyan"),
      out("▸ Web Audio DSP engine ...... READY", "purple"),
      out("▸ 4-stem sequencer .......... ARMED", "purple"),
      out("navigating to audio lab …", "yellow"),
    ];
  }
  return [
    out(`run: unknown program '${arg || ""}' — try 'run cyberracer'`, "pink"),
  ];
}

function handleAiCommand(arg: string): CommandLine[] {
  const query = arg.trim();
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("neural:open", {
        detail: query ? { query } : undefined,
      }),
    );
  }
  return [
    out("// ED-AI NEUROMORPHIC CORE [ONLINE]", "cyan"),
    out("  uplink:    https://ai.toille.uk (On-Device WebGPU SLM)", "yellow"),
    out(
      query
        ? `  dispatch:  "${query}" sent to neural HUD uplink`
        : "  usage:     ai <prompt>  or  ask <question>",
      "purple",
    ),
    out("  action:    holographic HUD modal engaged", "dim"),
  ];
}

const commands: Record<string, CommandHandler> = {
  help() {
    unlockAchievement("FIRST_SIGNAL");
    return [
      out("available commands:", "dim"),
      out("  whoami             identity module", ""),
      out("  resume / cv        curriculum vitae & background", "cyan"),
      out("  skills             view technical skills matrix", ""),
      out("  contact            verified communication channels", ""),
      out("  projects           featured projects & experiments", ""),
      out(
        "  theme <mode>       change theme (dark, light, system, toggle)",
        "",
      ),
      out(
        "  eco <mode>         battery saver mode (on, off, auto, toggle)",
        "",
      ),
      out(
        "  power / battery    inspect battery status and grid power mode",
        "cyan",
      ),
      out("  cat stack.txt      view tech stack", ""),
      out("  cat cyberracer.txt race manual", ""),
      out("  audio              cyberdeck audio status & synthesizer", "pink"),
      out("  gamepad            controller & arcade rig status", ""),
      out("  specs / sysinfo    cyberdeck hardware & core diagnostics", "cyan"),
      out("  achievements       view unlocked achievements", "cyan"),
      out("  matrix             engage digital rain simulation", "purple"),
      out(
        "  cockpit            open detached dual-screen racing telemetry",
        "cyan",
      ),
      out("  ping / net         network telemetry & link status", "cyan"),
      out("  ls                 list files", ""),
      out("  pwd                print working dir", ""),
      out("  open <target>      navigate (about, interests, experiments)", ""),
      out("  racer / game       launch CYBERRACER arcade racer", "pink"),
      out("  run cyberracer     launch CYBERRACER arcade racer", ""),
      out("  run_experiments    launch experiments", ""),
      out("  ctrl+k             command palette search", ""),
      out("  date               system time", ""),
      out("  briefing           synthesize tactical audio briefing", "cyan"),
      out(
        "  ai <prompt>        query on-device neuromorphic brain (ED-AI)",
        "cyan",
      ),
      out("  brain              open holographic neural HUD dialog", "purple"),
      out("  voice <option>     cybernetic speech & audio interface", ""),
      out(
        "  listen             toggle hands-free speech recognition",
        "purple",
      ),
      out("  clear              clear screen", ""),
      out("  exit / logout      close terminal session", "dim"),
    ];
  },
  whoami() {
    unlockAchievement("FIRST_SIGNAL");
    return [
      out(
        `${PROFILE.identity.name.toLowerCase().replace(" ", "_")} — ${PROFILE.identity.role} [${PROFILE.identity.experienceYears} Years Experience]`,
        "yellow",
      ),
    ];
  },
  resume() {
    return [
      out(
        `// ${PROFILE.identity.name.toUpperCase()} — CURRICULUM VITAE`,
        "cyan",
      ),
      out(`  Role:        ${PROFILE.identity.role}`, "yellow"),
      out(
        `  Experience:  ${PROFILE.identity.experienceYears} years (RM Assessments, Synetiq, SoCrowd, Rawnet)`,
        "purple",
      ),
      out(
        `  Education:   ${PROFILE.identity.education} (UWE) · ND Software Dev (Gloucestershire College)`,
        "purple",
      ),
      out(
        "  Core Tech:   PHP (Laravel, Symfony), JavaScript, SQL (MySQL, PostgreSQL, Redis), React, Vue",
        "purple",
      ),
      out(
        "  Profile:     Visit /about for interactive experience timeline & skills matrix",
        "dim",
      ),
    ];
  },
  cv(_arg, ctx) {
    return commands.resume(_arg, ctx);
  },
  contact() {
    return [
      out("// VERIFIED CHANNELS & PROFILES", "cyan"),
      out(`  GitHub:    ${PROFILE.identity.social.github}`, "purple"),
      out(`  YouTube:   ${PROFILE.identity.social.youtube}`, "purple"),
      out(`  Location:  ${PROFILE.identity.location}`, "yellow"),
    ];
  },
  email(_arg, ctx) {
    return commands.contact(_arg, ctx);
  },
  skills() {
    return [
      out("// TECHNICAL CAPABILITIES MATRIX", "cyan"),
      out(
        "  Backend:  PHP 5-8, Laravel, Symfony, Zend, MySQL, PostgreSQL, Redis, APIs",
        "yellow",
      ),
      out(
        "  Frontend: TypeScript, SolidJS, Astro, React, Vue, Svelte, XML",
        "purple",
      ),
      out(
        "  CMS/Dev:  WordPress, Concrete, Joomla, Docker, Linux, Git, WCAG, Agile",
        "purple",
      ),
    ];
  },
  projects() {
    return [
      out("// FEATURED PROJECTS & EXPERIMENTS", "cyan"),
      out(
        "  [1] CYBERRACER 2088  — 2D canvas racer & edge leaderboards",
        "yellow",
      ),
      out(
        "  [2] CYBERDECK AUDIO  — 4-stem real-time DSP web synthesizer",
        "pink",
      ),
      out(
        "  [3] DEV TOOL SUITE   — Browser-local formatter & crypto tools",
        "purple",
      ),
      out("tip: type 'open experiments' or 'run cyberracer'", "dim"),
    ];
  },
  theme(arg) {
    return handleTheme(arg);
  },
  eco(arg) {
    return handleEco(arg);
  },
  power() {
    return handlePower();
  },
  battery() {
    return handlePower();
  },
  cat(arg) {
    return handleCatCommand(arg);
  },
  achievements() {
    return handleAchievements();
  },
  matrix() {
    unlockAchievement("MATRIX_BREACH");
    return [
      out("// DIGITAL RAIN PROTOCOL ENGAGED", "cyan"),
      out("01000101 01001100 01001100", "cyan"),
      out("01001001 01001111 01010100", "cyan"),
      out("01000100 01001001 01000011", "purple"),
      out("01001011 01000101 01010010", "purple"),
      out("▲ 0 1 0 1  W A K E U P N E O  1 0 1 0 ▲", "yellow"),
      out("system integrity: 100% · bridge online", "yellow"),
    ];
  },
  hack() {
    unlockAchievement("FIRST_SIGNAL");
    return [
      out("initiating neural bypass protocol …", "pink"),
      out("accessing classified system memory [OK]", "purple"),
      out("root permission: GRANTED", "cyan"),
    ];
  },
  ls() {
    return [
      out(
        "about/  interests/  stack.txt  experiments/  cyberracer.bin  tracks.db",
        "dim",
      ),
    ];
  },
  pwd() {
    return [out("~/dev/identity", "cyan")];
  },
  open(arg, { goto }) {
    const dest = targets[arg];
    if (!dest) {
      return [
        out(
          `open: unknown target '${arg}' — try about, interests, experiments, home`,
          "pink",
        ),
      ];
    }
    goto?.(dest);
    return [out(`opening ${dest} …`, "cyan")];
  },
  run(arg, ctx) {
    return handleRunCommand(arg, ctx);
  },
  audio() {
    return handleAudioStatus();
  },
  music(_arg, ctx) {
    return commands.audio(_arg, ctx);
  },
  synth(_arg, ctx) {
    return commands.audio(_arg, ctx);
  },
  cyberdeck(_arg, ctx) {
    return commands.audio(_arg, ctx);
  },
  cyberracer(_arg, ctx) {
    return launchCyberracer(ctx);
  },
  game(_arg, ctx) {
    return launchCyberracer(ctx);
  },
  racer(_arg, ctx) {
    return launchCyberracer(ctx);
  },
  cockpit() {
    return handleCockpit();
  },
  telemetry(_arg, ctx) {
    return commands.cockpit(_arg, ctx);
  },
  run_experiments() {
    return [
      out("booting dev tool suite …", "cyan"),
      out("▸ json formatter ......... ONLINE", "purple"),
      out("▸ regex tester ........... ONLINE", "purple"),
      out("▸ colour converter ........ ONLINE", "purple"),
      out("▸ edge latency probe ..... ONLINE", "purple"),
      out("▸ base64 & url converter . ONLINE", "purple"),
      out("tip: try 'open experiments'", "dim"),
      out("status: dev tool suite fully operational", "yellow"),
    ];
  },
  ide(_arg, { goto }) {
    goto?.("https://ide.toille.uk");
    return [out("opening https://ide.toille.uk …", "cyan")];
  },
  gamepad() {
    return handleGamepad();
  },
  phonegamepad(_arg, ctx) {
    return handlePhoneGamepad(ctx);
  },
  pair(_arg, ctx) {
    return commands.phonegamepad(_arg, ctx);
  },
  pad(_arg, ctx) {
    return commands.gamepad(_arg, ctx);
  },
  controller(_arg, ctx) {
    return commands.gamepad(_arg, ctx);
  },
  sysinfo() {
    return handleSysinfo();
  },
  specs(_arg, ctx) {
    return commands.sysinfo(_arg, ctx);
  },
  hardware(_arg, ctx) {
    return commands.sysinfo(_arg, ctx);
  },
  cpu(_arg, ctx) {
    return commands.sysinfo(_arg, ctx);
  },
  date() {
    return [out(new Date().toUTCString(), "dim")];
  },
  solar() {
    return handleSolar();
  },
  time() {
    return handleSolar();
  },
  ping() {
    return handlePing();
  },
  net(_arg, ctx) {
    return commands.ping(_arg, ctx);
  },
  network(_arg, ctx) {
    return commands.ping(_arg, ctx);
  },
  clear() {
    return null;
  },
  exit(_arg, { onExit }) {
    onExit?.();
    return [out("session closed — click terminal to reopen", "dim")];
  },
  logout(_arg, ctx) {
    return commands.exit(_arg, ctx);
  },
  briefing() {
    return handleBriefingCommand();
  },
  status() {
    return handleBriefingCommand();
  },
  voice(arg) {
    return handleVoiceCommand(arg);
  },
  speech(arg) {
    return handleVoiceCommand(arg);
  },
  listen(arg, ctx) {
    return handleListenCommand(arg, ctx);
  },
  mic(arg, ctx) {
    return handleListenCommand(arg, ctx);
  },
  ai(arg) {
    return handleAiCommand(arg);
  },
  ask(arg) {
    return handleAiCommand(arg);
  },
  brain() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("neural:open"));
    }
    return [
      out("// ED-AI NEUROMORPHIC CORE ENGAGED", "cyan"),
      out("  opening holographic neural HUD uplink …", "yellow"),
      out("  standalone core: https://ai.toille.uk", "dim"),
    ];
  },
};

/**
 * Parse and dispatch a raw terminal command.
 */
export function runCommand(
  raw: string,
  ctx: CommandCtx = {},
): CommandLine[] | null {
  const cmd = raw.trim().replace(/\s+/g, " ");
  if (!cmd) return [];
  const [name, ...rest] = cmd.split(" ");
  const arg = rest.join(" ");
  if (!Object.prototype.hasOwnProperty.call(commands, name)) {
    return [out(`command not found: ${name} — try 'help'`, "pink")];
  }

  executedCommands.add(name);
  if (executedCommands.size >= 5) {
    unlockAchievement("TERMINAL_ROOT");
  }

  const handler = commands[name];
  return handler(arg, ctx);
}
