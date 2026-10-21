interface KeyActions {
  onSubmit: () => void;
  onDeactivate: () => void;
  onHistory: (delta: -1 | 1) => void;
  onAutocomplete: () => void;
}

type KeyActionFn = (actions: KeyActions) => void;

const KEY_ACTIONS: Record<string, KeyActionFn> = {
  Enter: (a) => a.onSubmit(),
  Escape: (a) => a.onDeactivate(),
  ArrowUp: (a) => a.onHistory(-1),
  ArrowDown: (a) => a.onHistory(1),
  Tab: (a) => a.onAutocomplete(),
};

export function handleTerminalKey(
  e: KeyboardEvent,
  onSubmit: () => void,
  onDeactivate: () => void,
  onHistory: (delta: -1 | 1) => void,
  onAutocomplete: () => void,
): void {
  const handler = KEY_ACTIONS[e.key];
  if (!handler) return;
  if (e.key !== "Escape") {
    e.preventDefault();
  }
  handler({ onSubmit, onDeactivate, onHistory, onAutocomplete });
}
