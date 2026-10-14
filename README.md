# pi-slack-app

Slack thread reader / draft-reply extension for the
[pi coding agent](https://github.com/badlogic/pi-mono).

Reads Slack threads via the Slack Web API and manages reply drafts **locally
by default**. Posting to Slack only happens through an explicit request.
Posted messages are attributed to the Slack app, not the user's account.

## Install

Requires a Slack **User OAuth Token** (`xoxp-...`) with `channels:history`
and `channels:read` scopes, exported as `SLACK_TOKEN` (or defined in
`~/.envrc`). App-level tokens (`xapp-...`) cannot call `conversations.*`.

```bash
git clone https://github.com/tkoyama010/pi-slack-app.git
ln -s "$(pwd)/pi-slack-app" ~/.pi/agent/extensions/slack-draft-reply
```

Or add to `~/.pi/agent/settings.json`:

```json
{
  "extensions": ["/path/to/pi-slack-app"]
}
```

## Tools

| Tool | Behavior |
|------|----------|
| `slack_read_thread` | Read a thread (channel ID + thread ts) |
| `slack_save_draft` | Append a reply draft to `~/.pi/slack-drafts.md` — default workflow |
| `slack_post_message` | Post to a thread — only on explicit user request |

Parse a slack.com archive URL: channel = the `/archives/<CHANNEL>/` segment,
message ts = the `p<digits>` part with a dot before the last 6 digits,
`thread_ts` from the query string.

Note: Slack has no draft API. "Save to Slack" means pasting the draft text
into the Slack compose box, where Slack auto-saves it.

## Use from the dotfiles repo

Add this repository as a git submodule (e.g.
`modules/home-manager/pi/extensions/slack-draft-reply`) and deploy
`index.ts` via home-manager `home.file`.

## License

MIT
