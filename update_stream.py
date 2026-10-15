"""
Zero-touch Makkah live stream updater.
Runs on GitHub Actions every 6 hours (see .github/workflows/update-stream.yml).

Fully automatic channel discovery — no hardcoded channel IDs needed:
  1. Searches YouTube for currently-live "Makkah" streams.
  2. Scores results: prefers official-looking channels (Quran TV, Haram,
     Saudi) and higher viewer counts.
  3. Updates streams.json with the best live video IDs found.

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

STREAMS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "streams.json")

# Official/authorized Makkah channels — checked FIRST (highest priority).
AUTHORIZED_CHANNEL_IDS = [
    "UCos52azQNBgW63_9uDJoPDA",  # Official KSA Quran TV (Saudi Broadcasting Authority)
]

# Search queries tried in order until live streams are found.
SEARCH_QUERIES = [
    "makkah live haram",
    "quran tv makkah live",
    "kaaba live",
]

# Channel-name keywords that signal an official/trusted Makkah stream.
TRUSTED_KEYWORDS = [
    "quran", "haram", "makkah", "mecca", "kaaba", "saudi",
    "alharam", "masjid", "الكريم", "مكة", "الحرم",
]


def api_get(params):
    """Call YouTube Data API v3 search.list, return parsed JSON or {}."""
    params["key"] = API_KEY
    url = "https://www.googleapis.com/youtube/v3/search?" + urllib.parse.urlencode(params)
    try:
        with urllib.request.urlopen(url, timeout=20) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f"API error: {e}")
        return {}


def search_live_streams(query):
    """Return live videos for a query: [(video_id, channel_title, video_title)]."""
    data = api_get({
        "part": "snippet",
        "q": query,
        "eventType": "live",
        "type": "video",
        "maxResults": 10,
        "order": "viewCount",
    })
    if "error" in data:
        print(f"YouTube API error: {data['error'].get('message')}")
        return []
    out = []
    for item in data.get("items", []):
        vid = item.get("id", {}).get("videoId")
        snip = item.get("snippet", {})
        if vid:
            out.append((vid, snip.get("channelTitle", ""), snip.get("title", "")))
    return out


def check_authorized_channels():
    """Check official channels for live streams — highest priority."""
    out = []
    for ch_id in AUTHORIZED_CHANNEL_IDS:
        data = api_get({
            "part": "snippet",
            "channelId": ch_id,
            "eventType": "live",
            "type": "video",
            "maxResults": 5,
        })
        if "error" in data:
            print(f"API error for channel {ch_id}: {data['error'].get('message')}")
            continue
        for item in data.get("items", []):
            vid = item.get("id", {}).get("videoId")
            snip = item.get("snippet", {})
            if vid:
                print(f"  authorized live: {vid} | {snip.get('channelTitle', '')}")
                out.append((vid, snip.get("channelTitle", ""), 100))  # max trust score
    return out


def trust_score(channel_title, video_title):
    """Higher = more likely an official Makkah stream."""
    text = (channel_title + " " + video_title).lower()
    return sum(1 for kw in TRUSTED_KEYWORDS if kw in text)


def discover_live_streams():
    """Find live Makkah streams: authorized channels first, then auto-search."""
    candidates = []  # (score, video_id, channel_title)

    # Step 1: check official/authorized channels (highest priority).
    print("Checking authorized channels...")
    for vid, ch_title, score in check_authorized_channels():
        candidates.append((score, vid, ch_title))

    # Step 2: auto-discover via search as backup.
    if not candidates:
        print("No authorized live stream — searching YouTube...")
        for q in SEARCH_QUERIES:
            results = search_live_streams(q)
            print(f'Query "{q}": {len(results)} live result(s)')
            for vid, ch_title, v_title in results:
                score = trust_score(ch_title, v_title)
                candidates.append((score, vid, ch_title))
            if results:
                break  # found live streams — no need for more queries
    else:
        print("Authorized stream found — skipping search.")
    # Sort by trust score (desc), dedupe by video id
    candidates.sort(key=lambda x: -x[0])
    seen = set()
    ordered = []
    for score, vid, ch in candidates:
        if vid not in seen:
            seen.add(vid)
            ordered.append((vid, ch, score))
    return ordered


def load_current():
    try:
        with open(STREAMS_FILE) as f:
            data = json.load(f)
            return [s["id"] for s in data if isinstance(s, dict) and s.get("id")]
    except Exception:
        return []


def main():
    found = discover_live_streams()
    if not found:
        print("No live Makkah stream found right now — keeping existing list.")
        return

    for vid, ch, score in found[:5]:
        print(f"  candidate: {vid} | channel: {ch} | trust: {score}")

    live_ids = [vid for vid, _, _ in found]
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


if __name__ == "__main__":
    main()
