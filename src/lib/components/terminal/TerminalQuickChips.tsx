import { For } from "solid-js";

interface TerminalChip {
  label: string;
  cmd: string;
  accent?: "cyan" | "pink" | "purple" | "yellow";
}

const TERMINAL_CHIPS: TerminalChip[] = [
  { label: "whoami", cmd: "whoami", accent: "cyan" },
  { label: "stack", cmd: "cat stack.txt", accent: "purple" },
  { label: "racer", cmd: "racer", accent: "pink" },
  { label: "audio", cmd: "audio", accent: "pink" },
  { label: "sysinfo", cmd: "sysinfo", accent: "yellow" },
  { label: "help", cmd: "help" },
];

interface Props {
  onRunCommand: (cmd: string) => void;
}

export default function TerminalQuickChips(props: Props) {
  function handleChipClick(cmd: string): void {
    props.onRunCommand(cmd);
  }

  return (
    <div
      class="terminal-quick-chips"
      role="toolbar"
      aria-label="Terminal quick commands"
    >
      <span class="chips-label" aria-hidden="true">
        &gt;_ RUN:
      </span>
      <For each={TERMINAL_CHIPS}>
        {(chip) => (
          <button
            type="button"
            class="chip-btn"
            onClick={() => handleChipClick(chip.cmd)}
            title={`Execute '${chip.cmd}'`}
            aria-label={`Run terminal command: ${chip.cmd}`}
          >
            {chip.label}
          </button>
        )}
      </For>
    </div>
  );
}
