import { describe, expect, it } from "vitest";
import { ensureOpenAIResponsesWriteScope } from "./provider-openai-codex-oauth.js";

describe("ensureOpenAIResponsesWriteScope", () => {
  it("appends api.responses.write to the OpenAI authorize scope", () => {
    expect(
      ensureOpenAIResponsesWriteScope(
        "https://auth.openai.com/oauth/authorize?scope=openid+profile+email+offline_access&state=abc",
      ),
    ).toBe(
      "https://auth.openai.com/oauth/authorize?scope=openid+profile+email+offline_access+api.responses.write&state=abc",
    );
  });

  it("does not duplicate api.responses.write when already present", () => {
    expect(
      ensureOpenAIResponsesWriteScope(
        "https://auth.openai.com/oauth/authorize?scope=openid+profile+api.responses.write&state=abc",
      ),
    ).toBe(
      "https://auth.openai.com/oauth/authorize?scope=openid+profile+api.responses.write&state=abc",
    );
  });

  it("leaves non-OpenAI URLs unchanged", () => {
    expect(
      ensureOpenAIResponsesWriteScope(
        "https://example.com/oauth/authorize?scope=openid+profile+email+offline_access&state=abc",
      ),
    ).toBe("https://example.com/oauth/authorize?scope=openid+profile+email+offline_access&state=abc");
  });
});
