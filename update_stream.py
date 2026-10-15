"""
Zero-touch Makkah live stream updater.
Runs on GitHub Actions every 6 hours (see .github/workflows/update-stream.yml).

Checks YouTube Data API v3 for currently-live streams on known Makkah
channels. If a live video ID is found that isn't already in streams.json,
the file is updated (the commit is done by the workflow).

Env vars (from GitHub Secrets):
  YOUTUBE_API_KEY  — YouTube Data API v3 key (free tier: 10,000 units/day;
                     each check costs ~100-200 units, so 4 checks/day is fine)

No Firebase, no native modules, no app rebuild needed — the app fetches
streams.json from the raw GitHub URL on every Makkah screen open.
"""

import json
import os
import sys
import urllib.request
import urllib.parse

API_KEY = os.environ.get("YOUTUBE_API_KEY", "")
if not API_KEY:
    print("YOUTUBE_API_KEY not set — skipping.")
    sys.exit(0)

# Known Makkah / Quran TV YouTube channels (add more as discovered).
CHANNEL_IDS = [
    "UCx4dki-lXvuo",   # Saudi Quran TV (example — verify)
]

STREAMS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "streams.json")


def youtube_search_live(channel_id):
    """Return list of live video IDs currently streaming on a channel."""
    params = urllib.parse.urlencode({
        "part": "snippet",
        "channelId": channel_id,
        "eventType": "live",
        "type": "video",
        "maxResults": 5,
        "key": API_KEY,
    })
    url = f"https://www.googleapis.com/youtube/v3/search?{params}"
    try:
        with urllib.request.urlopen(url, timeout=20) as resp:
            data = json.loads(resp.read().decode())
    except Exception as e:
        print(f"API error for channel {channel_id}: {e}")
        return []
    ids = []
    for item in data.get("items", []):
        vid = item.get("id", {}).get("videoId")
        if vid:
            ids.append(vid)
    if "error" in data:
        print(f"YouTube API error: {data['error'].get('message')}")
    return ids


def load_current():
    try:
        with open(STREAMS_FILE) as f:
            data = json.load(f)
            return [s["id"] for s in data if isinstance(s, dict) and s.get("id")]
    except Exception:
        return []


def main():
    found = []
    for ch in CHANNEL_IDS:
        found.extend(youtube_search_live(ch))
    # Dedupe, preserve order
    seen = set()
    live_ids = [v for v in found if not (v in seen or seen.add(v))]

    if not live_ids:
        print("No live Makkah stream found right now — keeping existing list.")
        return

    current = load_current()
    # Put newly-found live streams first, keep old ones as fallback.
    merged = live_ids + [c for c in current if c not in live_ids]
    merged = merged[:8]  # cap list length

    if merged == current:
        print("Stream list unchanged.")
        return

    new_list = [{"id": vid, "label": f"Stream {i+1}"} for i, vid in enumerate(merged)]
    with open(STREAMS_FILE, "w") as f:
        json.dump(new_list, f)
    print(f"Updated streams.json: {merged}")
    # Signal to the workflow that the file changed.
    with open(os.environ.get("GITHUB_OUTPUT", "/dev/null"), "a") as out:
        out.write("changed=true\n")


if __name__ == "__main__":
    main()
