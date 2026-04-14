"""
CLI for the social posting pipeline.

Usage:
  python -m social.cli load [--file content_queue.json]
  python -m social.cli preview [--limit 10]
  python -m social.cli run-once
  python -m social.cli run-loop [--interval 60]
  python -m social.cli list [--status pending|posted|failed] [--limit 20]
"""
import argparse
import json

from .queue import load_from_file, list_posts, get_due_posts, CONTENT_FILE
from .runner import SocialRunner


def cmd_load(args):
    f = args.file or CONTENT_FILE
    loaded, skipped = load_from_file(f)
    print(f"Loaded {loaded} posts, skipped {skipped} already in queue.")


def cmd_preview(args):
    posts = get_due_posts()[:args.limit]
    if not posts:
        print("No posts currently due.")
        return
    for p in posts:
        print(f"[{p['scheduled_at']}] {p['platform'].upper()} — {p['hook'][:80]}")


def cmd_run_once(args):
    SocialRunner().run_once()


def cmd_run_loop(args):
    SocialRunner().run_loop(interval_seconds=args.interval)


def cmd_list(args):
    posts = list_posts(status=args.status or None, limit=args.limit)
    for p in posts:
        print(json.dumps({
            "id": p["id"],
            "platform": p["platform"],
            "scheduled_at": p["scheduled_at"],
            "status": p["status"],
            "hook": p["hook"][:60],
        }))


def main():
    parser = argparse.ArgumentParser(prog="social")
    sub = parser.add_subparsers(dest="command", required=True)

    p_load = sub.add_parser("load", help="Load content queue from JSON file")
    p_load.add_argument("--file", default=None)
    p_load.set_defaults(func=cmd_load)

    p_preview = sub.add_parser("preview", help="Preview due posts")
    p_preview.add_argument("--limit", type=int, default=10)
    p_preview.set_defaults(func=cmd_preview)

    p_once = sub.add_parser("run-once", help="Post all due items once")
    p_once.set_defaults(func=cmd_run_once)

    p_loop = sub.add_parser("run-loop", help="Continuously poll and post")
    p_loop.add_argument("--interval", type=int, default=60)
    p_loop.set_defaults(func=cmd_run_loop)

    p_list = sub.add_parser("list", help="List posts in queue")
    p_list.add_argument("--status", default=None, choices=["pending", "posted", "failed"])
    p_list.add_argument("--limit", type=int, default=20)
    p_list.set_defaults(func=cmd_list)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
