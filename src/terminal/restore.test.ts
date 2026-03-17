import { afterEach, describe, expect, it, vi } from "vitest";

const clearActiveProgressLine = vi.hoisted(() => vi.fn());

vi.mock("./progress-line.js", () => ({
  clearActiveProgressLine,
}));

import { restoreTerminalState } from "./restore.js";

function configureTerminalIO(params: {
  stdinIsTTY: boolean;
  stdoutIsTTY: boolean;
  setRawMode?: (mode: boolean) => void;
  resume?: () => void;
  isPaused?: () => boolean;
}) {
  Object.defineProperty(process.stdin, "isTTY", { value: params.stdinIsTTY, configurable: true });
  Object.defineProperty(process.stdout, "isTTY", { value: params.stdoutIsTTY, configurable: true });
  (process.stdin as { setRawMode?: (mode: boolean) => void }).setRawMode = params.setRawMode;
  (process.stdin as { resume?: () => void }).resume = params.resume;
  (process.stdin as { isPaused?: () => boolean }).isPaused = params.isPaused;
}

function setupPausedTTYStdin() {
  const setRawMode = vi.fn();
  const resume = vi.fn();
  const isPaused = vi.fn(() => true);
  configureTerminalIO({
    stdinIsTTY: true,
    stdoutIsTTY: false,
    setRawMode,
    resume,
    isPaused,
  });
  return { setRawMode, resume };
}

describe("restoreTerminalState", () => {
  const originalStdinIsTTY = process.stdin.isTTY;
  const originalStdoutIsTTY = process.stdout.isTTY;
  const originalSetRawMode = (process.stdin as { setRawMode?: (mode: boolean) => void }).setRawMode;
  const originalResume = (process.stdin as { resume?: () => void }).resume;
  const originalIsPaused = (process.stdin as { isPaused?: () => boolean }).isPaused;

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(process.stdin, "isTTY", {
      value: originalStdinIsTTY,
      configurable: true,
    });
    Object.defineProperty(process.stdout, "isTTY", {
      value: originalStdoutIsTTY,
      configurable: true,
    });
    (process.stdin as { setRawMode?: (mode: boolean) => void }).setRawMode = originalSetRawMode;
    (process.stdin as { resume?: () => void }).resume = originalResume;
    (process.stdin as { isPaused?: () => boolean }).isPaused = originalIsPaused;
  });

  it("does not resume paused stdin by default", () => {
    const { setRawMode, resume } = setupPausedTTYStdin();

    restoreTerminalState("test");

    expect(setRawMode).toHaveBeenCalledWith(false);
    expect(resume).not.toHaveBeenCalled();
  });

  it("resumes paused stdin when resumeStdin is true", () => {
    const { setRawMode, resume } = setupPausedTTYStdin();

    restoreTerminalState("test", { resumeStdinIfPaused: true });

    expect(setRawMode).toHaveBeenCalledWith(false);
    expect(resume).toHaveBeenCalledOnce();
  });

  it("does not touch stdin when stdin is not a TTY", () => {
    const setRawMode = vi.fn();
    const resume = vi.fn();
    const isPaused = vi.fn(() => true);

    configureTerminalIO({
      stdinIsTTY: false,
      stdoutIsTTY: false,
      setRawMode,
      resume,
      isPaused,
    });

    restoreTerminalState("test", { resumeStdinIfPaused: true });

    expect(setRawMode).not.toHaveBeenCalled();
    expect(resume).not.toHaveBeenCalled();
  });

  it("resets stdout TTY state including kitty keyboard protocol", () => {
    configureTerminalIO({
      stdinIsTTY: false,
      stdoutIsTTY: true,
    });
    const write = vi
      .spyOn(process.stdout, "write")
      .mockImplementation((() => true) as typeof process.stdout.write);

    restoreTerminalState("test");

    expect(write).toHaveBeenCalledWith(
      "\x1b[0m\x1b[?25h\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1006l\x1b[?2004l\x1b[?u",
    );
  });
});
