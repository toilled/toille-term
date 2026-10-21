import Terminal from "./lib/components/terminal/Terminal";
import "./styles.css";

export default function App() {
  return (
    <div class="term-shell">
      <header class="term-nav" role="banner">
        <div class="term-nav-left">
          <a href="https://toille.uk" class="term-nav-back mono">
            ← TOILLE.UK
          </a>
          <div class="term-nav-title mono">
            <span class="term-tag">[INTERACTIVE TERMINAL]</span>
            <span class="term-version">v1.4</span>
            <span class="term-status-badge">● LOCAL REPL ONLINE</span>
          </div>
        </div>

        <div class="term-nav-controls">
          <a
            href="https://github.com/toilled/toille-term"
            target="_blank"
            rel="noopener noreferrer"
            class="term-btn-control mono"
          >
            SOURCE CODE ↗
          </a>
        </div>
      </header>

      <main class="term-main-stage" role="main">
        <div class="term-container">
          <Terminal />
        </div>
      </main>
    </div>
  );
}
