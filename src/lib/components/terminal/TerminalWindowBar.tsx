interface Props {
  isListening?: boolean;
  onBriefing?: (e: MouseEvent) => void;
  onToggleMic?: (e: MouseEvent) => void;
}

const MIC_BUTTON_CONFIG = {
  active: {
    className: "term-bar-btn term-bar-btn-mic term-bar-btn-listening",
    title: "Stop Hands-Free Voice Commands",
    pressed: "true",
    icon: "🔴",
    label: "REC",
  },
  inactive: {
    className: "term-bar-btn term-bar-btn-mic",
    title: "Toggle Hands-Free Voice Commands",
    pressed: "false",
    icon: "🎙️",
    label: "MIC",
  },
} as const;

function getMicConfig(isListening?: boolean) {
  return isListening ? MIC_BUTTON_CONFIG.active : MIC_BUTTON_CONFIG.inactive;
}

export default function TerminalWindowBar(props: Props) {
  const mic = () => getMicConfig(props.isListening);

  return (
    <div class="bar">
      <span class="dot" style={{ background: "#ff5f57" }} />
      <span class="dot" style={{ background: "#febc2e" }} />
      <span class="dot" style={{ background: "#28c840" }} />
      <span class="t-comment term-bar-title">~/dev/identity — zsh</span>

      <div class="term-bar-controls">
        <button
          type="button"
          class="term-bar-btn"
          onClick={(e) => props.onBriefing?.(e)}
          title="Synthesize Cybernetic Voice Briefing"
          aria-label="Synthesize Cybernetic Voice Briefing"
        >
          🔊 BRIEFING
        </button>
        <button
          type="button"
          class={mic().className}
          onClick={(e) => props.onToggleMic?.(e)}
          title={mic().title}
          aria-label="Toggle Hands-Free Voice Commands"
          aria-pressed={mic().pressed}
        >
          <span class="term-mic-indicator" aria-hidden="true">
            {mic().icon}
          </span>
          <span>{mic().label}</span>
        </button>
      </div>
    </div>
  );
}
