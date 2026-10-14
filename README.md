# pi-slack-app

Slack reader/draft CLI for the [pi coding agent](https://github.com/badlogic/pi-mono).
Reads Slack threads via the Slack Web API and manages reply drafts **locally by
default**. Posting is always explicit.

## Install

Requires Python 3.8+ (stdlib only) and a Slack **User OAuth Token** (`xoxp-...`)
with `channels:history`, `channels:read` scopes, exported as `SLACK_TOKEN`
(or defined in `~/.envrc`).

```bash
git clone https://github.com/tkoyama010/pi-slack-app.git
ln -s "$(pwd)/pi-slack-app" ~/.pi/agent/skills/slack-draft-reply
```

## CLI usage

```bash
# Read a thread (channel + thread ts)
./slack_draft.py read C0B5R56EBS9 1791975266.119959

# Save a reply draft locally (appends to ~/.pi/slack-drafts.md)
./slack_draft.py draft C0B5R56EBS9 1791975266.119959 --text "draft text..."

# Post to a thread — explicit only
./slack_draft.py post C0B5R56EBS9 1791975266.119959 --text "message text"
```

Parse a slack.com archive URL:
channel = the `/archives/<CHANNEL>/` segment, message ts = the `p<digits>`
part with a dot before the last 6 digits, `thread_ts` from the query string.

## Use from the dotfiles repo

The `slack-draft-reply` skill can be added to an agent-skills directory as a
git submodule pointing at this repository; the skill definition lives in
[`SKILL.md`](SKILL.md).

## License

MIT
