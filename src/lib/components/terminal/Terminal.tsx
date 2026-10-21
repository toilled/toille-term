import { createEffect, createSignal, onCleanup, onSettled } from "solid-js";
import "./Terminal.css";
import TerminalWindowBar from "./TerminalWindowBar";
import TerminalHistory from "./TerminalHistory";
import TerminalInputLine from "./TerminalInputLine";
import TerminalQuickChips from "./TerminalQuickChips";
import { useTerminalState } from "./useTerminalState";
import { handleTerminalKey } from "./key-handler";
import {
  formatSpeechError,
  startVoiceRecognition,
  stopVoiceRecognition,
} from "$lib/speech-recognition";
import { triggerBackgroundSurge } from "$lib/components/background/surge";
import { launchCyberRacer } from "$lib/game/launcher";

const INTERACTIVE_TAGS = new Set([
  "INPUT",
  "TEXTAREA",
  "BUTTON",
  "A",
  "SELECT",
]);

function isRootDocumentTarget(target: EventTarget | null): boolean {
  return (
    !target ||
    target === document.body ||
    target === document.documentElement ||
    target === document
  );
}

function targetEligible(target: EventTarget | null): boolean {
  if (isRootDocumentTarget(target)) return true;
  if (target instanceof HTMLElement) {
    return !INTERACTIVE_TAGS.has(target.tagName.toUpperCase());
  }
  return false;
}

function dispatchTerminalSurge(el?: HTMLElement, intensity = 1.4): void {
  if (!el) {
    triggerBackgroundSurge({ intensity });
    return;
  }
  const rect = el.getBoundingClientRect();
  triggerBackgroundSurge({
    x: rect.left + rect.width / 2,
    y: rect.top + Math.min(rect.height / 2, 220),
    intensity,
    speed: 6.0,
    radius: 280,
  });
}

export default function Terminal() {
  let bodyEl!: HTMLDivElement;
  let inputEl!: HTMLInputElement;
  let hintEl!: HTMLButtonElement;
  let isVisible = false;

  async function openGame() {
    state.deactivate();
    await launchCyberRacer();
    setTimeout(() => (inputEl || hintEl)?.focus(), 0);
  }

  const state = useTerminalState(openGame);
  const [isListening, setIsListening] = createSignal(false);

  function handleBriefing() {
    state.setActive(true);
    dispatchTerminalSurge(bodyEl);
    state.submit("briefing", () => {
      scrollToBottom();
    });
  }

  function handleToggleMic() {
    if (isListening()) {
      stopVoiceRecognition();
      setIsListening(false);
      state.setInput("");
      return;
    }
    state.setActive(true);
    const started = startVoiceRecognition(
      (text, isFinal) => {
        if (!isFinal) {
          state.setInput(text);
        }
      },
      (command) => {
        state.setActive(true);
        state.setInput("");
        dispatchTerminalSurge(bodyEl);
        state.submit(command, () => {
          scrollToBottom();
        });
      },
      (err) => {
        setIsListening(false);
        const errorMsg = formatSpeechError(err);
        state.printLines([
          { text: `// VOICE RECOGNITION ERROR [${err}]`, tone: "pink" },
          { text: `  ${errorMsg}`, tone: "dim" },
        ]);
        scrollToBottom();
      },
      () => {
        setIsListening(false);
      },
      (unrecognizedPhrase) => {
        state.printLines([
          {
            text: `// UNRECOGNIZED VOICE PHRASE: "${unrecognizedPhrase}"`,
            tone: "yellow",
          },
          {
            text: "  Available commands: status, race, whoami, briefing, cockpit, theme, help",
            tone: "dim",
          },
        ]);
        state.setInput("");
        scrollToBottom();
      },
    );
    setIsListening(started);
    if (!started) {
      state.printLines([
        { text: "// VOICE RECOGNITION UNAVAILABLE", tone: "pink" },
        {
          text: "  Web Speech API is not supported in this browser.",
          tone: "dim",
        },
      ]);
      scrollToBottom();
    }
  }

  onCleanup(() => {
    stopVoiceRecognition();
  });

  function checkVisibility(): boolean {
    if (!bodyEl) return false;
    const rect = bodyEl.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }

  function scrollToBottom() {
    if (bodyEl) {
      bodyEl.scrollTop = bodyEl.scrollHeight;
    }
  }

  createEffect(
    () => [state.history().length, state.active()] as const,
    () => {
      scrollToBottom();
      requestAnimationFrame(() => {
        scrollToBottom();
      });
      setTimeout(scrollToBottom, 40);
    },
  );

  function checkAutoexecCommand(): void {
    if (typeof sessionStorage === "undefined") return;
    const pendingCmd = sessionStorage.getItem("toille.terminal.autoexec");
    if (!pendingCmd) return;
    sessionStorage.removeItem("toille.terminal.autoexec");
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("terminal:execute", { detail: pendingCmd }),
      );
    }, 150);
  }

  function isMobileTerminal(): boolean {
    return (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(max-width: 760px)").matches
    );
  }

  function setupTerminalObserver(
    el: HTMLElement | undefined,
    onChange: (visible: boolean) => void,
    fallbackCheck: () => boolean,
  ): { observer: IntersectionObserver | null; isVisible: boolean } {
    if (!el) return { observer: null, isVisible: false };
    if (typeof IntersectionObserver !== "undefined") {
      const observer = new IntersectionObserver(
        ([entry]) => onChange(entry.isIntersecting),
        {
          threshold: 0,
        },
      );
      observer.observe(el);
      return { observer, isVisible: false };
    }
    return { observer: null, isVisible: fallbackCheck() };
  }

  function activate() {
    if (isMobileTerminal() || state.active()) return;
    state.setActive(true);
    setTimeout(() => {
      if (inputEl) inputEl.focus();
      else if (hintEl) hintEl.focus();
      scrollToBottom();
    }, 0);
    setTimeout(scrollToBottom, 40);
  }

  onSettled(() => {
    const onTerminalExecute = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      state.setActive(true);
      if (detail) {
        dispatchTerminalSurge(bodyEl);
        state.submit(detail, () => {
          scrollToBottom();
        });
      }
      setTimeout(() => {
        if (!isMobileTerminal()) {
          inputEl?.focus({ preventScroll: true });
        }
        scrollToBottom();
      }, 0);
      setTimeout(scrollToBottom, 50);
      setTimeout(scrollToBottom, 150);
      bodyEl?.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    window.addEventListener(
      "terminal:execute",
      onTerminalExecute as EventListener,
    );

    checkAutoexecCommand();

    if (isMobileTerminal()) {
      return () => {
        window.removeEventListener(
          "terminal:execute",
          onTerminalExecute as EventListener,
        );
      };
    }

    const { observer, isVisible: initialVisible } = setupTerminalObserver(
      bodyEl,
      (v) => {
        isVisible = v;
      },
      checkVisibility,
    );
    isVisible = initialVisible;

    const clickHandler = () => activate();
    bodyEl?.addEventListener("click", clickHandler);

    function shouldActivateKey(e: KeyboardEvent): boolean {
      if (e.key !== "Enter" || state.active()) return false;
      if (!isVisible) isVisible = checkVisibility();
      return isVisible && targetEligible(e.target);
    }

    const onWindowKey = (e: KeyboardEvent) => {
      if (shouldActivateKey(e)) activate();
    };
    window.addEventListener("keydown", onWindowKey);
    const onMicToggle = () => handleToggleMic();
    window.addEventListener("terminal:mic:toggle", onMicToggle);

    return () => {
      observer?.disconnect();
      bodyEl?.removeEventListener("click", clickHandler);
      window.removeEventListener("keydown", onWindowKey);
      window.removeEventListener(
        "terminal:execute",
        onTerminalExecute as EventListener,
      );
      window.removeEventListener("terminal:mic:toggle", onMicToggle);
    };
  });

  function handleChipRun(cmd: string) {
    state.setActive(true);
    dispatchTerminalSurge(bodyEl);
    state.submit(cmd, () => {
      scrollToBottom();
    });
    setTimeout(() => {
      if (
        typeof window !== "undefined" &&
        !window.matchMedia?.("(max-width: 760px)")?.matches
      ) {
        inputEl?.focus({ preventScroll: true });
      }
      scrollToBottom();
    }, 40);
  }

  return (
    <div class="terminal terminal-window">
      <TerminalWindowBar
        isListening={isListening()}
        onBriefing={handleBriefing}
        onToggleMic={handleToggleMic}
      />
      <div
        class="body"
        role="group"
        aria-label="Interactive terminal — click to type commands"
        ref={bodyEl!}
      >
        <TerminalHistory history={state.history()} />
        <TerminalInputLine
          active={state.active()}
          input={state.input()}
          onInput={(val) => {
            state.setInput(val);
            triggerBackgroundSurge({ intensity: 0.15 });
          }}
          onKeyDown={(e) =>
            handleTerminalKey(
              e,
              () => {
                dispatchTerminalSurge(bodyEl);
                state.submit(() => scrollToBottom());
              },
              state.deactivate,
              state.navigateHistory,
              state.autocomplete,
            )
          }
          onBlur={state.deactivate}
          onActivate={activate}
          inputRef={(el) => {
            inputEl = el;
          }}
          hintRef={(el) => {
            hintEl = el;
          }}
        />
      </div>
      <TerminalQuickChips onRunCommand={handleChipRun} />
    </div>
  );
}
