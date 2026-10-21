import { createSignal, type Setter } from "solid-js";
import type { HistoryEntry } from "./types";
import { runCommand, type CommandLine } from "$lib/terminal/commands";

const AUTOCOMPLETE_CANDIDATES = [
  "whoami",
  "help",
  "skills",
  "projects",
  "theme",
  "theme dark",
  "theme light",
  "theme toggle",
  "cat stack.txt",
  "cat cyberracer.txt",
  "achievements",
  "matrix",
  "ls",
  "pwd",
  "open about",
  "open interests",
  "open experiments",
  "open audio",
  "racer",
  "cyberracer",
  "run cyberracer",
  "run cyberdeck",
  "run_experiments",
  "clear",
  "exit",
  "date",
  "power",
  "battery",
  "eco",
  "solar",
  "time",
  "audio",
  "ping",
  "net",
  "network",
  "gamepad",
  "pad",
  "controller",
  "sysinfo",
  "specs",
  "hardware",
  "cpu",
  "briefing",
  "voice",
  "listen",
  "mic",
];

function stepHistoryBack(
  hist: string[],
  curIdx: number,
  currentInput: string,
  tempInput: string,
): { nextIdx: number; nextInput: string; savedTemp: string } {
  const saved = curIdx === -1 ? currentInput : tempInput;
  const nextIdx = curIdx === -1 ? hist.length - 1 : Math.max(0, curIdx - 1);
  return { nextIdx, nextInput: hist[nextIdx] ?? "", savedTemp: saved };
}

function stepHistoryForward(
  hist: string[],
  curIdx: number,
  currentInput: string,
  tempInput: string,
): { nextIdx: number; nextInput: string; savedTemp: string } {
  if (curIdx === -1) {
    return { nextIdx: -1, nextInput: currentInput, savedTemp: tempInput };
  }
  if (curIdx < hist.length - 1) {
    const nextIdx = curIdx + 1;
    return { nextIdx, nextInput: hist[nextIdx] ?? "", savedTemp: tempInput };
  }
  return { nextIdx: -1, nextInput: tempInput, savedTemp: tempInput };
}

function stepHistory(
  direction: -1 | 1,
  hist: string[],
  curIdx: number,
  currentInput: string,
  tempInput: string,
): { nextIdx: number; nextInput: string; savedTemp: string } {
  if (hist.length === 0) {
    return { nextIdx: curIdx, nextInput: currentInput, savedTemp: tempInput };
  }
  return direction === -1
    ? stepHistoryBack(hist, curIdx, currentInput, tempInput)
    : stepHistoryForward(hist, curIdx, currentInput, tempInput);
}

function parseSubmitArgs(
  commandOrDone?: string | (() => void),
  onDone?: () => void,
  fallbackInput = "",
): { cmd: string; callback?: () => void } {
  if (typeof commandOrDone === "function") {
    return { cmd: fallbackInput, callback: commandOrDone };
  }
  return {
    cmd: typeof commandOrDone === "string" ? commandOrDone : fallbackInput,
    callback: onDone,
  };
}

function applyCommandResult(
  result: CommandLine[] | null,
  cmd: string,
  setHistory: Setter<HistoryEntry[]>,
): void {
  if (result === null) {
    setHistory([]);
  } else {
    setHistory((prev) => [...prev, { cmd, lines: result }]);
  }
}

function invokeSubmitCallbacks(callback?: () => void): void {
  if (!callback) return;
  callback();
  setTimeout(callback, 0);
}

function navigateTarget(path: string): void {
  if (path.startsWith("http")) {
    window.open(path, "_blank", "noopener,noreferrer");
    return;
  }
  void import("$lib/navigation").then((m) => m.navigateTo(path));
}

export function useTerminalState(onLaunchGame: () => Promise<void>) {
  const [active, setActive] = createSignal(false);
  const [input, setInput] = createSignal("");
  const [history, setHistory] = createSignal<HistoryEntry[]>([]);
  const [commandHistory, setCommandHistory] = createSignal<string[]>([]);
  const [historyIndex, setHistoryIndex] = createSignal(-1);
  let tempInput = "";

  const deactivate = () => {
    if (active()) {
      setActive(false);
      setInput("");
    }
  };

  function submit(onDone?: () => void): void;
  function submit(commandToRun: string, onDone?: () => void): void;
  function submit(commandOrDone?: string | (() => void), onDone?: () => void) {
    const { cmd, callback } = parseSubmitArgs(commandOrDone, onDone, input());
    const trimmed = cmd.trim();
    if (trimmed) setCommandHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);
    tempInput = "";

    const result = runCommand(cmd, {
      goto: navigateTarget,
      onExit: () => setTimeout(deactivate, 150),
      onLaunchGame,
    });

    applyCommandResult(result, cmd, setHistory);
    setInput("");
    invokeSubmitCallbacks(callback);
  }

  return {
    active,
    setActive,
    input,
    setInput,
    history,
    deactivate,
    submit,
    printLines: (lines: CommandLine[], cmd = "mic") => {
      setHistory((prev) => [...prev, { cmd, lines }]);
    },
    navigateHistory: (dir: -1 | 1) => {
      const res = stepHistory(
        dir,
        commandHistory(),
        historyIndex(),
        input(),
        tempInput,
      );
      setHistoryIndex(res.nextIdx);
      tempInput = res.savedTemp;
      setInput(res.nextInput);
    },
    autocomplete: () => {
      const current = input().trim();
      if (!current) return;
      const match = AUTOCOMPLETE_CANDIDATES.find((c) => c.startsWith(current));
      if (match) setInput(match);
    },
  };
}
