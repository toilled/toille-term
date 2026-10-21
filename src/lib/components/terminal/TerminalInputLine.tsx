import { Show } from "solid-js";

interface Props {
  active: boolean;
  input: string;
  onInput: (val: string) => void;
  onKeyDown: (e: KeyboardEvent) => void;
  onBlur: () => void;
  onActivate: () => void;
  inputRef: (el: HTMLInputElement) => void;
  hintRef: (el: HTMLButtonElement) => void;
}

export default function TerminalInputLine(props: Props) {
  return (
    <Show
      when={props.active}
      fallback={
        <button
          type="button"
          class="hint"
          ref={props.hintRef}
          onClick={() => props.onActivate()}
        >
          ▸ click terminal or press enter to interact
        </button>
      }
    >
      <div class="input-line">
        <span class="t-prompt">elliot@grid</span>:<span class="t-blue">~</span>
        $&nbsp;
        <input
          ref={props.inputRef}
          value={props.input}
          onInput={(e) => props.onInput(e.currentTarget.value)}
          class="term-input"
          aria-label="Terminal command input"
          autocomplete="off"
          autocapitalize="off"
          spellcheck={false}
          onKeyDown={(e) => props.onKeyDown(e)}
          onBlur={() => props.onBlur()}
        />
      </div>
    </Show>
  );
}
