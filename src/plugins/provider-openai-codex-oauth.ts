import { loginOpenAICodex, type OAuthCredentials } from "@mariozechner/pi-ai/oauth";
import type { RuntimeEnv } from "../runtime.js";
import type { WizardPrompter } from "../wizard/prompts.js";
import { createVpsAwareOAuthHandlers } from "./provider-oauth-flow.js";
import {
  formatOpenAIOAuthTlsPreflightFix,
  runOpenAIOAuthTlsPreflight,
} from "./provider-openai-codex-oauth-tls.js";

const OPENAI_RESPONSES_WRITE_SCOPE = "api.responses.write";

export function ensureOpenAIResponsesWriteScope(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "auth.openai.com" || parsed.pathname !== "/oauth/authorize") {
      return url;
    }
    const rawScope = parsed.searchParams.get("scope");
    if (!rawScope) {
      return url;
    }
    const scopes = rawScope
      .split(/\s+/)
      .map((scope) => scope.trim())
      .filter((scope) => scope.length > 0);
    if (scopes.includes(OPENAI_RESPONSES_WRITE_SCOPE)) {
      return url;
    }
    parsed.searchParams.set("scope", [...scopes, OPENAI_RESPONSES_WRITE_SCOPE].join(" "));
    return parsed.toString();
  } catch {
    return url;
  }
}

export async function loginOpenAICodexOAuth(params: {
  prompter: WizardPrompter;
  runtime: RuntimeEnv;
  isRemote: boolean;
  openUrl: (url: string) => Promise<void>;
  localBrowserMessage?: string;
}): Promise<OAuthCredentials | null> {
  const { prompter, runtime, isRemote, openUrl, localBrowserMessage } = params;
  const preflight = await runOpenAIOAuthTlsPreflight();
  if (!preflight.ok && preflight.kind === "tls-cert") {
    const hint = formatOpenAIOAuthTlsPreflightFix(preflight);
    runtime.error(hint);
    await prompter.note(hint, "OAuth prerequisites");
    throw new Error(preflight.message);
  }

  await prompter.note(
    isRemote
      ? [
          "You are running in a remote/VPS environment.",
          "A URL will be shown for you to open in your LOCAL browser.",
          "After signing in, paste the redirect URL back here.",
        ].join("\n")
      : [
          "Browser will open for OpenAI authentication.",
          "If the callback doesn't auto-complete, paste the redirect URL.",
          "OpenAI OAuth uses localhost:1455 for the callback.",
        ].join("\n"),
    "OpenAI Codex OAuth",
  );

  const spin = prompter.progress("Starting OAuth flow…");
  try {
    const { onAuth: baseOnAuth, onPrompt } = createVpsAwareOAuthHandlers({
      isRemote,
      prompter,
      runtime,
      spin,
      openUrl,
      localBrowserMessage: localBrowserMessage ?? "Complete sign-in in browser…",
    });

    const onAuth = async (event: { url: string; instructions?: string }) =>
      baseOnAuth({
        ...event,
        url: ensureOpenAIResponsesWriteScope(event.url),
      });

    const creds = await loginOpenAICodex({
      onAuth,
      onPrompt,
      onProgress: (msg: string) => spin.update(msg),
    });
    spin.stop("OpenAI OAuth complete");
    return creds ?? null;
  } catch (err) {
    spin.stop("OpenAI OAuth failed");
    runtime.error(String(err));
    await prompter.note("Trouble with OAuth? See https://docs.openclaw.ai/start/faq", "OAuth help");
    throw err;
  }
}
