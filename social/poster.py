"""
TwitterPoster: X/Twitter API v2, OAuth 1.0a
LinkedInPoster: LinkedIn API v2, OAuth 2.0 UGC Posts
"""
import os
import json
import time
import urllib.request
import urllib.parse
import urllib.error
import hmac
import hashlib
import base64
import uuid
from typing import Optional


# ─── Twitter ──────────────────────────────────────────────────────────────────

class TwitterPoster:
    API_URL = "https://api.twitter.com/2/tweets"

    def __init__(self):
        self.api_key = os.environ["TWITTER_API_KEY"]
        self.api_secret = os.environ["TWITTER_API_SECRET"]
        self.access_token = os.environ["TWITTER_ACCESS_TOKEN"]
        self.access_secret = os.environ["TWITTER_ACCESS_SECRET"]

    def _oauth_header(self, method: str, url: str, body_params: dict) -> str:
        oauth_params = {
            "oauth_consumer_key": self.api_key,
            "oauth_nonce": uuid.uuid4().hex,
            "oauth_signature_method": "HMAC-SHA1",
            "oauth_timestamp": str(int(time.time())),
            "oauth_token": self.access_token,
            "oauth_version": "1.0",
        }
        all_params = {**oauth_params, **body_params}
        sorted_params = "&".join(
            f"{urllib.parse.quote(k, safe='')}={urllib.parse.quote(str(v), safe='')}"
            for k, v in sorted(all_params.items())
        )
        base_string = "&".join([
            method.upper(),
            urllib.parse.quote(url, safe=""),
            urllib.parse.quote(sorted_params, safe=""),
        ])
        signing_key = f"{urllib.parse.quote(self.api_secret, safe='')}&{urllib.parse.quote(self.access_secret, safe='')}"
        sig = base64.b64encode(
            hmac.new(signing_key.encode(), base_string.encode(), hashlib.sha1).digest()
        ).decode()
        oauth_params["oauth_signature"] = sig
        header_parts = ", ".join(
            f'{urllib.parse.quote(k, safe="")}="{urllib.parse.quote(str(v), safe="")}"'
            for k, v in sorted(oauth_params.items())
        )
        return f"OAuth {header_parts}"

    def post(self, text: str) -> dict:
        payload = json.dumps({"text": text}).encode("utf-8")
        auth = self._oauth_header("POST", self.API_URL, {})
        req = urllib.request.Request(
            self.API_URL,
            data=payload,
            headers={
                "Authorization": auth,
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())


# ─── LinkedIn ─────────────────────────────────────────────────────────────────

class LinkedInPoster:
    UGC_URL = "https://api.linkedin.com/v2/ugcPosts"

    def __init__(self):
        self.access_token = os.environ["LINKEDIN_ACCESS_TOKEN"]
        self.person_urn = os.environ["LINKEDIN_PERSON_URN"]  # e.g. urn:li:person:XXXXX

    def post(self, text: str) -> dict:
        payload = json.dumps({
            "author": self.person_urn,
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {"text": text},
                    "shareMediaCategory": "NONE",
                }
            },
            "visibility": {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            },
        }).encode("utf-8")
        req = urllib.request.Request(
            self.UGC_URL,
            data=payload,
            headers={
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0",
            },
            method="POST",
        )
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
