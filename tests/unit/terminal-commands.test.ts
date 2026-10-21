import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  handleBriefingCommand,
  handleVoiceCommand,
  handleListenCommand,
} from "../../src/lib/terminal/voice-commands";
import {
  launchCyberracer,
  handleAchievements,
  handleGamepad,
  handlePhoneGamepad,
  handleCockpit,
} from "../../src/lib/terminal/game-commands";
import * as vocalSynth from "$lib/vocal-synth";
import * as speechRec from "$lib/speech-recognition";
import * as deviceModule from "$lib/device";
import * as achievementsModule from "$lib/game/achievements";
import * as gamepadDeviceModule from "$lib/game/gamepad-device";
import type { CommandCtx } from "../../src/lib/terminal/types";

describe("Terminal voice-commands", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("handleBriefingCommand plays briefing and returns tactical lines", () => {
    vi.spyOn(vocalSynth, "generateSystemBriefing").mockReturnValue(
      "All systems nominal.",
    );
    const playSpy = vi
      .spyOn(vocalSynth, "playSystemBriefing")
      .mockResolvedValue(undefined);

    const lines = handleBriefingCommand();
    expect(playSpy).toHaveBeenCalled();
    expect(lines.length).toBe(3);
    expect(lines[0].text).toContain("TACTICAL SYNTHETIC AUDIO BRIEFING");
    expect(lines[1].text).toContain("All systems nominal.");
  });

  describe("handleVoiceCommand", () => {
    it("handles status and default empty argument", () => {
      vi.spyOn(vocalSynth, "isVoiceMuted").mockReturnValue(false);
      const lines = handleVoiceCommand("");
      expect(lines.some((l) => l.text.includes("ONLINE [AUDIO ACTIVE]"))).toBe(
        true,
      );

      vi.spyOn(vocalSynth, "isVoiceMuted").mockReturnValue(true);
      const mutedLines = handleVoiceCommand("status");
      expect(
        mutedLines.some((l) =>
          l.text.includes("MUTED [TRANSMISSIONS SILENCED]"),
        ),
      ).toBe(true);
    });

    it("handles mute, unmute, and toggle", () => {
      const setMuteSpy = vi.spyOn(vocalSynth, "setVoiceMuted");
      vi.spyOn(vocalSynth, "isVoiceMuted").mockReturnValue(true);

      const muteLines = handleVoiceCommand("mute");
      expect(setMuteSpy).toHaveBeenCalledWith(true);
      expect(muteLines[0].text).toContain("VOCAL SYNTHESIS MUTED");

      vi.spyOn(vocalSynth, "isVoiceMuted").mockReturnValue(false);
      const unmuteLines = handleVoiceCommand("unmute");
      expect(setMuteSpy).toHaveBeenCalledWith(false);
      expect(unmuteLines[0].text).toContain("VOCAL SYNTHESIS UNMUTED");

      handleVoiceCommand("toggle");
      expect(setMuteSpy).toHaveBeenCalled();
    });

    it("handles voice say and test", () => {
      const speakSpy = vi
        .spyOn(vocalSynth, "speak")
        .mockResolvedValue(undefined);

      const emptySay = handleVoiceCommand("say   ");
      expect(emptySay[0].text).toContain("usage: voice say");

      const validSay = handleVoiceCommand("say Greetings pilot");
      expect(speakSpy).toHaveBeenCalledWith("Greetings pilot");
      expect(validSay[1].text).toContain("Greetings pilot");

      handleVoiceCommand("test");
      expect(speakSpy).toHaveBeenCalledWith(
        expect.stringContaining("Cyberdeck telemetry"),
      );
    });

    it("handles voice briefing delegation and unknown options", () => {
      vi.spyOn(vocalSynth, "generateSystemBriefing").mockReturnValue(
        "Briefing active",
      );
      vi.spyOn(vocalSynth, "playSystemBriefing").mockResolvedValue(undefined);

      const briefingLines = handleVoiceCommand("briefing");
      expect(briefingLines[0].text).toContain(
        "TACTICAL SYNTHETIC AUDIO BRIEFING",
      );

      const unknownLines = handleVoiceCommand("invalid-command");
      expect(unknownLines[0].text).toContain(
        "unknown voice option: invalid-command",
      );
    });
  });

  describe("handleListenCommand", () => {
    it("returns error when speech recognition is not supported", () => {
      vi.spyOn(speechRec, "isVoiceRecognitionSupported").mockReturnValue(false);
      const ctx: CommandCtx = {};

      const lines = handleListenCommand("on", ctx);
      expect(lines[0].text).toContain("NOT SUPPORTED");
    });

    it("handles status and matching active/inactive states", () => {
      vi.spyOn(speechRec, "isVoiceRecognitionSupported").mockReturnValue(true);
      vi.spyOn(speechRec, "isVoiceRecognitionActive").mockReturnValue(true);
      const ctx: CommandCtx = {};

      const statusLines = handleListenCommand("status", ctx);
      expect(
        statusLines.some((l) => l.text.includes("ONLINE [LISTENING]")),
      ).toBe(true);

      const matchLines = handleListenCommand("on", ctx);
      expect(
        matchLines.some((l) => l.text.includes("ONLINE [LISTENING]")),
      ).toBe(true);
    });

    it("toggles microphone and dispatches event when state differs", () => {
      vi.spyOn(speechRec, "isVoiceRecognitionSupported").mockReturnValue(true);
      vi.spyOn(speechRec, "isVoiceRecognitionActive").mockReturnValue(false);

      const toggleMicMock = vi.fn();
      const ctx: CommandCtx = { onToggleMic: toggleMicMock };

      const dispatchSpy = vi.spyOn(window, "dispatchEvent");

      const lines = handleListenCommand("", ctx);
      expect(toggleMicMock).toHaveBeenCalled();
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: "terminal:mic:toggle" }),
      );
      expect(lines[0].text).toContain("HANDS-FREE RECOGNITION ENGAGED");
    });
  });
});

describe("Terminal game-commands", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("launchCyberracer", () => {
    it("shows mobile warning if called on mobile device", () => {
      vi.spyOn(deviceModule, "isMobileDevice").mockReturnValue(true);
      const ctx: CommandCtx = {};

      const lines = launchCyberracer(ctx);
      expect(lines[0].text).toContain("disabled on mobile devices");
    });

    it("launches Cyberracer, unlocks FIRST_SIGNAL and calls onLaunchGame on desktop", () => {
      vi.spyOn(deviceModule, "isMobileDevice").mockReturnValue(false);
      const unlockSpy = vi.spyOn(achievementsModule, "unlockAchievement");
      const launchMock = vi.fn();
      const ctx: CommandCtx = { onLaunchGame: launchMock };

      const lines = launchCyberracer(ctx);
      expect(unlockSpy).toHaveBeenCalledWith("FIRST_SIGNAL");
      expect(launchMock).toHaveBeenCalled();
      expect(lines[0].text).toContain("CYBERRACER v1.0");
    });
  });

  describe("handleAchievements", () => {
    it("formats unlocked and locked achievements", () => {
      vi.spyOn(achievementsModule, "getAchievementProgress").mockReturnValue({
        unlocked: 1,
        total: 2,
        percent: 50,
      });
      vi.spyOn(achievementsModule, "getAchievements").mockReturnValue([
        {
          id: "FIRST_SIGNAL",
          title: "First Signal",
          description: "Launch cyberracer",
          icon: "🏁",
          accent: "cyan",
          unlocked: true,
          unlockedAt: "12345",
        },
        {
          id: "POLYGLOT",
          title: "Polyglot",
          description: "View stack",
          icon: "💻",
          accent: "purple",
          unlocked: false,
        },
      ]);

      const lines = handleAchievements();
      expect(lines[0].text).toContain("ACHIEVEMENT MATRIX — [1/2] (50%)");
      expect(lines[1].text).toContain("[✓] 🏁 First Signal");
      expect(lines[2].text).toContain("[ ] 🔒 Polyglot");
    });
  });

  describe("handleGamepad", () => {
    it("returns guidance when no gamepad is connected", () => {
      vi.spyOn(gamepadDeviceModule, "getConnectedGamepads").mockReturnValue([]);

      const lines = handleGamepad();
      expect(lines[0].text).toContain("NO GAMEPAD DETECTED");
      expect(lines.some((l) => l.text.includes("phonegamepad"))).toBe(true);
    });

    it("formats connected gamepad device details", () => {
      vi.spyOn(gamepadDeviceModule, "getConnectedGamepads").mockReturnValue([
        {
          id: "Wireless Controller (DualSense)",
          index: 0,
          mapping: "standard",
          buttons: new Array(16) as any,
          axes: new Array(4) as any,
        } as unknown as Gamepad,
      ]);

      const lines = handleGamepad();
      expect(lines[0].text).toContain("1 DEVICE(S) DETECTED");
      expect(lines[1].text).toContain(
        "[PAD #0] Wireless Controller (DualSense)",
      );
      expect(lines[2].text).toContain(
        "Mapping: standard · Buttons: 16 · Axes: 4",
      );
    });
  });

  describe("handlePhoneGamepad & handleCockpit", () => {
    it("handlePhoneGamepad outputs pairing guide and opens racer.toille.uk", () => {
      const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
      const ctx: CommandCtx = {};

      const lines = handlePhoneGamepad(ctx);
      expect(lines[0].text).toContain("WIRELESS WEBRTC SMARTPHONE GAMEPAD");
      expect(openSpy).toHaveBeenCalledWith(
        "https://racer.toille.uk/gamepad",
        "_blank",
        "noopener,noreferrer",
      );
    });

    it("handleCockpit outputs telemetry detached window notice and opens racer.toille.uk", () => {
      const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
      const lines = handleCockpit();
      expect(lines[0].text).toContain("DETACHED TELEMETRY COCKPIT [OPENED]");
      expect(openSpy).toHaveBeenCalledWith(
        "https://racer.toille.uk/telemetry",
        "_blank",
        "noopener,noreferrer",
      );
    });
  });
});
