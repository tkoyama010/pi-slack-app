/**
 * Slack draft-reply extension for pi.
 *
 * Registers three LLM-callable tools:
 * - slack_read_thread   : read a thread via the Slack Web API
 * - slack_save_draft    : save a reply draft locally (default workflow)
 * - slack_post_message  : post to a thread — ONLY on explicit user request
 *
 * Token: SLACK_TOKEN env var or ~/.envrc, must be an xoxp-... user token
 * with channels:history and channels:read scopes.
 */
import { homedir } from "node:os";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const API = "https://slack.com/api/";
const DRAFTS_FILE = `${homedir()}/.pi/slack-drafts.md`;

function token(): string {
  let t = process.env.SLACK_TOKEN ?? "";
  if (!t) {
    const envrc = `${homedir()}/.envrc`;
    if (existsSync(envrc)) {
      for (const line of readFileSync(envrc, "utf8").split("\n")) {
        const m = line.match(/^(?:export )?SLACK_TOKEN=(.*)$/);
        if (m) {
          t = m[1].trim().replace(/^['"]|['"]$/g, "");
          break;
        }
      }
    }
  }
  if (!t.startsWith("xoxp-")) {
    throw new Error("SLACK_TOKEN must be an xoxp-... user token (see README)");
  }
  return t;
}

async function call(
  method: string,
  params: Record<string, string>,
): Promise<any> {
  const res = await fetch(API + method, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  const d = (await res.json()) as { ok: boolean; error?: string; [k: string]: any };
  if (!d.ok) throw new Error(`${method}: ${d.error}`);
  return d;
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "slack_read_thread",
    label: "Slack: read thread",
    description:
      "Read a Slack thread via the Slack Web API. Pass the channel ID and " +
      "thread ts (from a slack.com archive URL: channel is the " +
      "/archives/<CHANNEL>/ segment; ts is the p<digits> part with a dot " +
      "before the last 6 digits, or the thread_ts query param).",
    parameters: Type.Object({
      channel: Type.String({ description: "Slack channel ID, e.g. C0B5R56EBS9" }),
      thread_ts: Type.String({ description: "Thread timestamp, e.g. 1791975266.119959" }),
    }),
    async execute(_id, params) {
      const d = await call("conversations.replies", {
        channel: params.channel,
        ts: params.thread_ts,
        limit: "100",
      });
      const text = (d.messages as any[])
        .map((m) => `[${m.user ?? m.username ?? "bot"}] ${m.text ?? ""}`)
        .join("\n---\n");
      return {
        content: [{ type: "text", text }],
        details: { count: (d.messages as any[]).length },
      };
    },
  });

  pi.registerTool({
    name: "slack_save_draft",
    label: "Slack: save draft",
    description:
      "Save a Slack reply draft locally to ~/.pi/slack-drafts.md. This is the " +
      "default workflow: drafts are NOT posted to Slack.",
    parameters: Type.Object({
      channel: Type.String({ description: "Slack channel ID" }),
      thread_ts: Type.String({ description: "Thread timestamp" }),
      text: Type.String({ description: "Draft reply text" }),
      url: Type.Optional(Type.String({ description: "Thread archive URL for the drafts file" })),
    }),
    async execute(_id, params) {
      const heading = `## ${new Date().toISOString().slice(0, 10)} ${params.url ?? params.channel}`;
      appendFileSync(DRAFTS_FILE, `\n${heading}\n${params.text}\n`);
      return {
        content: [{ type: "text", text: `Saved draft to ${DRAFTS_FILE} (not posted)` }],
        details: { file: DRAFTS_FILE },
      };
    },
  });

  pi.registerTool({
    name: "slack_post_message",
    label: "Slack: post message",
    description:
      "Post a message to a Slack thread. ONLY call this when the user has " +
      "explicitly asked to post/send the message (e.g. 'post it', '投稿して'). " +
      "Otherwise use slack_save_draft. The message is attributed to the Slack " +
      "app, not the user's account.",
    parameters: Type.Object({
      channel: Type.String({ description: "Slack channel ID" }),
      thread_ts: Type.String({ description: "Thread timestamp" }),
      text: Type.String({ description: "Message text" }),
    }),
    async execute(_id, params) {
      await call("chat.postMessage", {
        channel: params.channel,
        thread_ts: params.thread_ts,
        text: params.text,
      });
      return {
        content: [{ type: "text", text: "Posted (as the Slack app, not your user account)" }],
        details: {},
      };
    },
  });
}
