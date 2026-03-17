import { afterEach, describe, expect, it, vi } from "vitest";

async function loadActiveListenerModule() {
  return await import("./active-listener.js");
}

async function clearActiveListeners() {
  const activeListener = await loadActiveListenerModule();
  activeListener.setActiveWebListener(null);
  activeListener.setActiveWebListener("work", null);
}

describe("active-listener registry", () => {
  afterEach(async () => {
    await clearActiveListeners();
    vi.resetModules();
  });

  it("shares active listeners across module reloads", async () => {
    vi.resetModules();
    const first = await loadActiveListenerModule();
    const listener = {
      sendComposingTo: vi.fn(async () => {}),
      sendMessage: vi.fn(async () => ({ messageId: "msg-1" })),
      sendPoll: vi.fn(async () => ({ messageId: "poll-1" })),
      sendReaction: vi.fn(async () => {}),
    };

    first.setActiveWebListener("work", listener);

    vi.resetModules();
    const second = await loadActiveListenerModule();

    expect(second.getActiveWebListener("work")).toBe(listener);
    expect(second.requireActiveWebListener("work")).toEqual({
      accountId: "work",
      listener,
    });
  });
});
