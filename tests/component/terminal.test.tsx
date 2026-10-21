import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { flush } from "solid-js";
import { visibleRect, cleanupAfterEach } from "../helpers.js";
import Terminal from "../../src/lib/components/terminal/Terminal";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(
    visibleRect as DOMRect,
  );
});

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-eco");
  cleanupAfterEach();
});

function activate() {
  flush();
  fireEvent.click(screen.getByRole("button", { name: /interact/ }));
  flush();
}

function typeAndSubmit(value: string) {
  const input = screen.getByLabelText("Terminal command input");
  fireEvent.input(input, { target: { value } });
  flush();
  fireEvent.keyDown(input, { key: "Enter" });
  flush();
  return input;
}

describe("Terminal: mounting and activation hint", () => {
  it("shows the boot history and an activation hint", () => {
    render(() => <Terminal />);
    expect(
      screen.getByText(/click terminal or press enter to interact/),
    ).toBeInTheDocument();
    expect(screen.getByText(/PHP · Laravel · Symfony/)).toBeInTheDocument();
  });

  it("activates when the hint button is clicked or on Enter from page root", () => {
    render(() => <Terminal />);
    activate();
    expect(screen.getByLabelText("Terminal command input")).toBeInTheDocument();
  });

  it("does not activate on Enter when a control is focused", () => {
    render(() => <Terminal />);
    fireEvent.keyDown(screen.getByRole("button", { name: /interact/ }), {
      key: "Enter",
    });
    expect(
      screen.queryByLabelText("Terminal command input"),
    ).not.toBeInTheDocument();
  });
});

describe("Terminal — activation lifecycle", () => {
  it("deactivates on Escape and blur", () => {
    render(() => <Terminal />);
    activate();
    fireEvent.keyDown(screen.getByLabelText("Terminal command input"), {
      key: "Escape",
    });
    expect(
      screen.queryByLabelText("Terminal command input"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /interact/ }),
    ).toBeInTheDocument();

    activate();
    fireEvent.blur(screen.getByLabelText("Terminal command input"));
    expect(
      screen.queryByLabelText("Terminal command input"),
    ).not.toBeInTheDocument();
  });
});

describe("Terminal — execution and output", () => {
  it("runs run_experiments, help, and reports unknown commands", () => {
    render(() => <Terminal />);
    activate();
    const body = screen.getByRole("group", { name: /Interactive terminal/ });
    Object.defineProperty(body, "scrollHeight", {
      value: 820,
      configurable: true,
    });

    typeAndSubmit("run_experiments");
    expect(
      screen.getByText("status: dev tool suite fully operational"),
    ).toBeInTheDocument();
    expect(body.scrollTop).toBe(820);

    typeAndSubmit("help");
    expect(screen.getByText("available commands:")).toBeInTheDocument();

    typeAndSubmit("definitely-not-a-command");
    expect(
      screen.getByText(
        "command not found: definitely-not-a-command — try 'help'",
      ),
    ).toBeInTheDocument();
  });

  it("toggles and sets eco mode via eco command", () => {
    render(() => <Terminal />);
    activate();
    typeAndSubmit("eco on");
    expect(screen.getByText("eco mode set to: ON")).toBeInTheDocument();
    expect(document.documentElement.getAttribute("data-eco")).toBe("true");

    typeAndSubmit("eco off");
    expect(screen.getByText("eco mode set to: OFF")).toBeInTheDocument();
    expect(document.documentElement.hasAttribute("data-eco")).toBe(false);
  });
});

describe("Terminal — history navigation and clear", () => {
  it("clears session history with clear and cycles through history with arrows", () => {
    render(() => <Terminal />);
    activate();
    typeAndSubmit("run_experiments");
    expect(
      screen.getByText("status: dev tool suite fully operational"),
    ).toBeInTheDocument();
    typeAndSubmit("clear");
    expect(
      screen.queryByText("status: dev tool suite fully operational"),
    ).not.toBeInTheDocument();

    const input = screen.getByLabelText("Terminal command input");
    typeAndSubmit("whoami");
    typeAndSubmit("ls");

    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect((input as HTMLInputElement).value).toBe("ls");

    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect((input as HTMLInputElement).value).toBe("whoami");

    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect((input as HTMLInputElement).value).toBe("ls");

    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect((input as HTMLInputElement).value).toBe("");
  });
});

describe("Terminal — exit and logout", () => {
  it("deactivates the terminal shortly after exit or logout command", async () => {
    vi.useFakeTimers();
    render(() => <Terminal />);
    activate();
    typeAndSubmit("exit");
    expect(
      screen.getByText("session closed — click terminal to reopen"),
    ).toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(150);
    expect(
      screen.queryByLabelText("Terminal command input"),
    ).not.toBeInTheDocument();
  });
});

describe("Terminal — CYBERRACER", () => {
  it("launches CYBERRACER by opening racer.toille.uk in a new tab", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(() => <Terminal />);
    activate();
    typeAndSubmit("run cyberracer");
    await vi.waitFor(() => {
      expect(openSpy).toHaveBeenCalledWith(
        "https://racer.toille.uk",
        "_blank",
        "noopener,noreferrer",
      );
    });
  });
});

describe("Terminal — extra commands & completion", () => {
  it("reads virtual files, triggers easter eggs and autocompletes", () => {
    render(() => <Terminal />);
    activate();

    typeAndSubmit("cat stack.txt");
    expect(
      screen.getAllByText(/PHP · Laravel · Symfony/).length,
    ).toBeGreaterThanOrEqual(1);

    typeAndSubmit("cat cyberracer.txt");
    expect(
      screen.getByText(/CYBERRACER — trackmania-style arcade racer/),
    ).toBeInTheDocument();

    typeAndSubmit("matrix");
    expect(screen.getByText(/W A K E\s+U P\s+N E O/)).toBeInTheDocument();

    typeAndSubmit("skills");
    expect(
      screen.getByText(/TECHNICAL CAPABILITIES MATRIX/),
    ).toBeInTheDocument();

    typeAndSubmit("projects");
    expect(
      screen.getByText(/FEATURED PROJECTS & EXPERIMENTS/),
    ).toBeInTheDocument();

    typeAndSubmit("theme light");
    expect(screen.getByText(/theme mode set to: LIGHT/)).toBeInTheDocument();

    typeAndSubmit("achievements");
    expect(screen.getByText(/SYSTEM ACHIEVEMENT MATRIX/)).toBeInTheDocument();

    typeAndSubmit("power");
    expect(screen.getByText(/SYSTEM POWER MATRIX/)).toBeInTheDocument();

    typeAndSubmit("solar");
    expect(screen.getByText(/SOLAR PHASE :/)).toBeInTheDocument();

    const input = screen.getByLabelText(
      "Terminal command input",
    ) as HTMLInputElement;
    fireEvent.input(input, { target: { value: "who" } });
    fireEvent.keyDown(input, { key: "Tab" });
    expect(input.value).toBe("whoami");

    fireEvent.input(input, { target: { value: "pow" } });
    fireEvent.keyDown(input, { key: "Tab" });
    expect(input.value).toBe("power");

    fireEvent.input(input, { target: { value: "sol" } });
    fireEvent.keyDown(input, { key: "Tab" });
    expect(input.value).toBe("solar");

    fireEvent.input(input, { target: { value: "ski" } });
    fireEvent.keyDown(input, { key: "Tab" });
    expect(input.value).toBe("skills");
  });

  it("responds to terminal:execute CustomEvent to activate, run commands, and scroll to bottom", () => {
    const scrollIntoViewSpy = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoViewSpy;

    render(() => <Terminal />);
    const body = screen.getByRole("group", { name: /Interactive terminal/ });
    Object.defineProperty(body, "scrollHeight", {
      value: 750,
      configurable: true,
    });

    window.dispatchEvent(
      new CustomEvent("terminal:execute", { detail: "power" }),
    );
    flush();

    expect(screen.getByText(/SYSTEM POWER MATRIX/)).toBeInTheDocument();
    expect(scrollIntoViewSpy).toHaveBeenCalled();
    expect(body.scrollTop).toBe(750);
  });

  it("renders quick command chips and executes command on click", () => {
    render(() => <Terminal />);
    expect(
      screen.queryByRole("button", { name: /Run terminal command: projects/ }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: /Run terminal command: contact/ }),
    ).toBeNull();

    const helpChip = screen.getByRole("button", {
      name: /Run terminal command: help/,
    });
    expect(helpChip).toBeInTheDocument();

    fireEvent.click(helpChip);
    flush();

    expect(screen.getByText(/available commands/i)).toBeInTheDocument();

    const racerChip = screen.getByRole("button", {
      name: /Run terminal command: racer/,
    });
    expect(racerChip).toBeInTheDocument();

    fireEvent.click(racerChip);
    flush();

    expect(screen.getByText(/CYBERRACER v1\.0/)).toBeInTheDocument();
  });

  it("toggles microphone and executes voice commands directly into terminal history", () => {
    let mockInstance: any;
    function MockSpeech() {
      const inst = {
        continuous: true,
        interimResults: true,
        lang: "en-US",
        start: vi.fn(),
        stop: vi.fn(),
        abort: vi.fn(),
        onresult: null as any,
        onerror: null as any,
        onend: null as any,
      };
      mockInstance = inst;
      return inst;
    }
    (window as any).SpeechRecognition = MockSpeech;

    render(() => <Terminal />);
    const micBtn = screen.getByRole("button", {
      name: /Toggle Hands-Free Voice Commands/i,
    });
    expect(micBtn.textContent).toContain("MIC");

    fireEvent.click(micBtn);
    flush();

    expect(micBtn.textContent).toContain("REC");
    expect(mockInstance.start).toHaveBeenCalled();

    // Utterance 1: recognized "status"
    mockInstance.onresult({
      results: [{ 0: { transcript: "status" }, isFinal: true, length: 1 }],
    });
    flush();

    expect(
      screen.getByText(/TACTICAL SYNTHETIC AUDIO BRIEFING/),
    ).toBeInTheDocument();
    const input = screen.getByLabelText(
      "Terminal command input",
    ) as HTMLInputElement;
    expect(input.value).toBe("");

    // Utterance 2: unrecognized phrase
    mockInstance.onresult({
      results: [
        { 0: { transcript: "status" }, isFinal: true, length: 1 },
        { 0: { transcript: "random gibberish" }, isFinal: true, length: 1 },
      ],
    });
    flush();

    expect(
      screen.getByText(/UNRECOGNIZED VOICE PHRASE: "random gibberish"/),
    ).toBeInTheDocument();
    expect(input.value).toBe("");

    // Toggle off
    fireEvent.click(micBtn);
    flush();

    expect(micBtn.textContent).toContain("MIC");
    delete (window as any).SpeechRecognition;
  });
});
