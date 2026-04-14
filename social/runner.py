"""
SocialRunner: runs due posts with 1-retry policy and failure alerting.
"""
import os
import time
import logging
from typing import Optional

from .queue import get_due_posts, mark_posted, mark_failed, reset_failed_for_retry
from .poster import TwitterPoster, LinkedInPoster

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger(__name__)

ALERT_WEBHOOK = os.environ.get("ALERT_WEBHOOK_URL")  # optional


def _alert(message: str):
    if not ALERT_WEBHOOK:
        log.error("ALERT: %s", message)
        return
    import urllib.request, json
    payload = json.dumps({"text": message}).encode()
    try:
        urllib.request.urlopen(urllib.request.Request(
            ALERT_WEBHOOK, data=payload,
            headers={"Content-Type": "application/json"}, method="POST"
        ))
    except Exception as e:
        log.error("Failed to send alert: %s", e)


class SocialRunner:
    def __init__(self):
        self._twitter: Optional[TwitterPoster] = None
        self._linkedin: Optional[LinkedInPoster] = None

    @property
    def twitter(self) -> TwitterPoster:
        if self._twitter is None:
            self._twitter = TwitterPoster()
        return self._twitter

    @property
    def linkedin(self) -> LinkedInPoster:
        if self._linkedin is None:
            self._linkedin = LinkedInPoster()
        return self._linkedin

    def _post(self, post: dict):
        platform = post["platform"]
        body = post["body"] or post["hook"]
        if platform == "twitter":
            return self.twitter.post(body)
        elif platform == "linkedin":
            return self.linkedin.post(body)
        else:
            raise ValueError(f"Unknown platform: {platform}")

    def _handle_post(self, post: dict) -> bool:
        """Returns True on success, False on permanent failure."""
        post_id = post["id"]
        platform = post["platform"]
        try:
            result = self._post(post)
            mark_posted(post_id)
            log.info("Posted %s to %s: %s", post_id, platform, result)
            return True
        except Exception as e:
            log.warning("First attempt failed for %s: %s — retrying once", post_id, e)
            time.sleep(5)
            try:
                result = self._post(post)
                mark_posted(post_id)
                log.info("Retry succeeded for %s to %s: %s", post_id, platform, result)
                return True
            except Exception as e2:
                mark_failed(post_id, str(e2))
                msg = f"Post {post_id} ({platform}) failed after retry: {e2}\nHook: {post['hook']}"
                log.error(msg)
                _alert(msg)
                return False

    def run_once(self) -> int:
        """Post all currently due items once. Returns count of failures."""
        posts = get_due_posts()
        if not posts:
            log.info("No posts due.")
            return 0
        log.info("Processing %d due posts", len(posts))
        failures = sum(0 if self._handle_post(post) else 1 for post in posts)
        if failures:
            log.error("%d/%d posts failed.", failures, len(posts))
        return failures

    def run_loop(self, interval_seconds: int = 60):
        """Poll every interval_seconds and post due items."""
        log.info("Starting run loop (interval=%ds)", interval_seconds)
        while True:
            self.run_once()
            time.sleep(interval_seconds)
