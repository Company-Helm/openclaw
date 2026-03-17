import { jidToE164, normalizeE164 } from "openclaw/plugin-sdk/text-runtime";
import type { WebInboundMsg } from "../types.js";

export function resolveDirectConversationId(
  msg: Pick<WebInboundMsg, "conversationId" | "from">,
): string | undefined {
  const candidate = msg.conversationId ?? msg.from;
  return typeof candidate === "string" && candidate.trim() ? candidate : undefined;
}

export function resolvePeerId(msg: WebInboundMsg) {
  if (msg.chatType === "group") {
    return resolveDirectConversationId(msg) ?? "unknown";
  }
  if (msg.senderE164) {
    return normalizeE164(msg.senderE164) ?? msg.senderE164;
  }
  const directConversationId = resolveDirectConversationId(msg);
  if (!directConversationId) {
    return "unknown";
  }
  if (directConversationId.includes("@")) {
    return jidToE164(directConversationId) ?? directConversationId;
  }
  return normalizeE164(directConversationId) ?? directConversationId;
}
