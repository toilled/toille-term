import type { CommandLine } from "$lib/terminal/commands";

export interface HistoryEntry {
  cmd: string;
  lines: CommandLine[];
}
