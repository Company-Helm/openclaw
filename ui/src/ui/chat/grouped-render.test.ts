/* @vitest-environment jsdom */

import { render } from "lit";
import { describe, expect, it } from "vitest";
import type { MessageGroup } from "../types/chat-types.ts";
import { renderMessageGroup } from "./grouped-render.ts";

describe("renderMessageGroup metadata", () => {
  it("uses the latest assistant input for context percent and accepts snake_case usage keys", () => {
    const group: MessageGroup = {
      kind: "group",
      key: "assistant-group",
      role: "assistant",
      timestamp: 1_710_000_000_000,
      isStreaming: false,
      messages: [
        {
          key: "a1",
          message: {
            role: "assistant",
            content: "first",
            timestamp: 1_710_000_000_000,
            usage: {
              input_tokens: 40_000,
              output_tokens: 5_000,
            },
          },
        },
        {
          key: "a2",
          message: {
            role: "assistant",
            content: "second",
            timestamp: 1_710_000_000_001,
            usage: {
              input_tokens: 10_000,
              output_tokens: 2_000,
              cache_read_input_tokens: 30_000,
            },
          },
        },
      ],
    };

    const container = document.createElement("div");
    render(
      renderMessageGroup(group, {
        showReasoning: false,
        contextWindow: 100_000,
      }),
      container,
    );

    const meta = container.querySelector(".msg-meta");
    expect(meta?.textContent).toContain("↑50k");
    expect(meta?.textContent).toContain("↓7k");
    expect(meta?.textContent).toContain("R30k");
    expect(container.querySelector(".msg-meta__ctx")?.textContent).toBe("10% ctx");
  });
});
