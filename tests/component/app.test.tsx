import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@solidjs/testing-library";
import App from "../../src/App";

describe("Toille Terminal Standalone App", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders application header and title", () => {
    const { getByRole, getByText } = render(() => <App />);

    expect(getByRole("banner")).toBeInTheDocument();
    expect(getByText(/\[INTERACTIVE TERMINAL\]/i)).toBeInTheDocument();
    expect(getByText(/LOCAL REPL ONLINE/i)).toBeInTheDocument();
  });

  it("renders interactive terminal stage", () => {
    const { getByRole } = render(() => <App />);

    expect(getByRole("main")).toBeInTheDocument();
    expect(
      getByRole("group", {
        name: /Interactive terminal — click to type commands/i,
      }),
    ).toBeInTheDocument();
  });
});
