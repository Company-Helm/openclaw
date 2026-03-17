import { describe, expect, it } from "vitest";
import { resolveDirectConversationId, resolvePeerId } from "./peer.js";

describe("resolvePeerId", () => {
  it("falls back to conversationId when direct messages omit from", () => {
    expect(
      resolvePeerId({
        chatType: "direct",
        conversationId: "15551234567@s.whatsapp.net",
      } as never),
    ).toBe("+15551234567");
  });

  it("returns unknown when direct messages omit both from and conversationId", () => {
    expect(
      resolvePeerId({
        chatType: "direct",
      } as never),
    ).toBe("unknown");
  });
});

describe("resolveDirectConversationId", () => {
  it("prefers conversationId over from", () => {
    expect(
      resolveDirectConversationId({
        conversationId: "+15550001111",
        from: "+19990002222",
      } as never),
    ).toBe("+15550001111");
  });
});
