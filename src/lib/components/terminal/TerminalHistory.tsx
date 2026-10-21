import { For } from "solid-js";
import type { HistoryEntry } from "./types";

interface TerminalHistoryProps {
  history: HistoryEntry[];
}

export default function TerminalHistory(props: TerminalHistoryProps) {
  return (
    <>
      <div>
        <span class="t-prompt">elliot@grid</span>:<span class="t-blue">~</span>$
        whoami
      </div>
      <div class="t-yellow">
        elliot_dickerson — Senior Web Developer @ RM Assessments
      </div>
      <div>
        <span class="t-prompt">elliot@grid</span>:<span class="t-blue">~</span>$
        cat stack.txt
      </div>
      <div class="t-purple">PHP · Laravel · Symfony</div>
      <div class="t-purple">JS · Svelte · React · SolidJS · TS</div>
      <div class="t-purple">MySQL · Docker · Git · MQTT</div>

      <For each={props.history}>
        {(entry) => (
          <>
            <div>
              <span class="t-prompt">elliot@grid</span>:
              <span class="t-blue">~</span>$&nbsp;
              <span class="t-yellow">{entry.cmd}</span>
            </div>
            <For each={entry.lines}>
              {(line) => <div class={line.tone}>{line.text}</div>}
            </For>
          </>
        )}
      </For>
    </>
  );
}
