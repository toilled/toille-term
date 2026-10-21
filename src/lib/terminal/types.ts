export interface CommandLine {
  text: string;
  tone: string;
}

export interface CommandCtx {
  goto?: (path: string) => void;
  onExit?: () => void;
  onLaunchGame?: () => void;
  onToggleMic?: () => void;
}

export type CommandHandler = (
  arg: string,
  ctx: CommandCtx,
) => CommandLine[] | null;

export function out(text: string, tone = ""): CommandLine {
  return { text, tone };
}
