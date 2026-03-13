# Local Development

## Method 1: Simple static server (fast, offline-friendly)

Uses the `serve.py` fallback path — no Worker running, no R2 connection needed.
`window.__EVENTS__` is absent, so `loadData()` falls back to fetching `./live_music_events.json`.

One-time setup (creates a symlink so you always have current data):
    ln -s ../Claude\ -\ Live\ Music\ Calendar\ Update/live_music_events.json ./live_music_events.json

Start the server:
    python3 serve.py
    # → http://localhost:8080

Notes:
- The symlink means any update to the data repo JSON is reflected immediately on reload — no copy step.
- `live_music_events.json` is gitignored in this repo; the symlink only lives on your machine.
- Does NOT test the Worker injection logic. If you change worker.js, use Method 2 to verify.

## Method 2: wrangler dev --remote (full fidelity)

Runs your Worker code locally but connects to the real R2 bucket over the network.
Behaves exactly like production — Worker inlines data, `window.__EVENTS__` is set.

Requires: internet connection + being logged into wrangler (`wrangler whoami`).

    wrangler dev --remote
    # → http://localhost:8787

Notes:
- Data served is whatever is currently in R2 (last `python3 live_music_cli.py upload` run from data repo).
- Use this when testing Worker changes (injection logic, error handling, routing).
- The local symlink (Method 1) is NOT used here — data comes from R2.
