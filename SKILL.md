---
name: slack-draft-reply
description: |
  Read Slack threads and prepare reply drafts WITHOUT posting them. Reads a
  thread via the Slack Web API (token from SLACK_TOKEN in ~/.envrc), summarizes
  the discussion, and saves reply drafts to ~/.pi/slack-drafts.md. Never posts
  unless the user explicitly says "post it" / "投稿して".
  Use when the user shares a slack.com/archives/... URL and asks for a reply
  draft, summary, or "what does this thread say". Also use when the user says
  "slack draft", "draft a Slack reply", or "save a draft for that thread".
---

# Slack Draft Reply

Read Slack threads with the Slack Web API. Default output is a **draft saved locally**, never a post.

## Rules

- **Never call `chat.postMessage`** (or `slack_draft.py post`) unless the user explicitly asks to post.
- Default behavior: fetch thread → summarize → write draft text → save to `~/.pi/slack-drafts.md`.
- Draft language: match the thread (Japanese thread → Japanese draft, English thread → English draft).
- Slack has no draft API; "save to Slack" means the user pastes the text into the compose box themselves.

## Setup

Token must be a **User OAuth Token** (`xoxp-...`) with `channels:history`
and `channels:read` scopes, in `SLACK_TOKEN` or `~/.envrc`. App-level tokens
(`xapp-...`) authenticate but cannot call `conversations.*`.

This skill directory contains `slack_draft.py` (stdlib-only CLI):

```bash
slack_draft.py read  <channel> <thread_ts>              # print the thread
slack_draft.py draft <channel> <thread_ts> --text "..." # save locally
slack_draft.py post  <channel> <thread_ts> --text "..." # explicit only
```

## 1. Parse the archive URL

`https://<team>.slack.com/archives/<CHANNEL>/p<MSGTS>` → channel = `<CHANNEL>`,
message ts = `<MSGTS>` with a dot inserted before the last 6 digits.
Thread replies: `thread_ts` query param if present, otherwise the message ts.

## 2. Read the thread

```bash
slack_draft.py read "$CHANNEL" "$THREAD_TS"
```

Or call the API directly. Common errors: `not_allowed_token_type` (xapp token),
`invalid_auth` (bad/revoked token), `missing_scope` (add `channels:history`).

## 3. Save the draft

```bash
slack_draft.py draft "$CHANNEL" "$THREAD_TS" --url "$THREAD_URL" --text "..."
```

Then show the draft to the user and wait for edits or approval.

## 4. Posting (explicit only)

Only after the user says "post it" / "投稿して":

```bash
slack_draft.py post "$CHANNEL" "$THREAD_TS" --text "..."
```

Note: the message is attributed to the Slack app, not the user's account.
