#!/usr/bin/env python3
"""Slack Web API CLI: read threads, save local drafts, post (explicit only).

Stdlib only. Token from SLACK_TOKEN env var or ~/.envrc (must be xoxp-...).
"""

import argparse
import json
import os
import sys
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

API = "https://slack.com/api/"
DRAFTS_FILE = Path.home() / ".pi" / "slack-drafts.md"


def token() -> str:
    t = os.environ.get("SLACK_TOKEN", "")
    if not t:
        envrc = Path.home() / ".envrc"
        if envrc.exists():
            for line in envrc.read_text().splitlines():
                if line.split("SLACK_TOKEN=", 1)[0].strip() in ("", "export") \
                        and "SLACK_TOKEN=" in line:
                    t = line.split("=", 1)[1].strip().strip("'\"")
                    break
    if not t.startswith("xoxp-"):
        sys.exit("error: SLACK_TOKEN must be an xoxp-... user token")
    return t


def call(method: str, **params):
    req = urllib.request.Request(
        API + method,
        data=urllib.parse.urlencode(params).encode(),
        headers={"Authorization": f"Bearer {token()}"},
    )
    with urllib.request.urlopen(req) as r:
        d = json.load(r)
    if not d.get("ok"):
        sys.exit(f"error: {method}: {d.get('error')}")
    return d


def read(args):
    d = call("conversations.replies", channel=args.channel,
             ts=args.thread_ts, limit=100)
    for m in d.get("messages", []):
        who = m.get("user", m.get("username", "bot"))
        print(f"[{who}] {m.get('text', '')}\n---")


def draft(args):
    DRAFTS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(DRAFTS_FILE, "a") as f:
        f.write(f"\n## {date.today()} {args.url or args.channel}\n{args.text}\n")
    print(f"saved draft to {DRAFTS_FILE}")


def post(args):
    call("chat.postMessage", channel=args.channel, thread_ts=args.thread_ts,
         text=args.text)
    print("posted (attributed to the Slack app, not your user account)")


def main():
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest="cmd", required=True)
    for name in ("read", "draft", "post"):
        s = sub.add_parser(name)
        s.add_argument("channel")
        s.add_argument("thread_ts")
        if name != "read":
            s.add_argument("--text", required=True)
        if name == "draft":
            s.add_argument("--url", default=None,
                           help="thread URL stored in the drafts file")
        s.set_defaults(fn=globals()[name])
    args = p.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
