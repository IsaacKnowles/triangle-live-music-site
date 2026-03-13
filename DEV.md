# Local Development

Runs the Worker locally but connects to the real R2 bucket over the network.
Behaves exactly like production — Worker inlines data, `window.__EVENTS__` is set.

Requires: internet connection + being logged into wrangler (`wrangler whoami`).

    wrangler dev --remote
    # → http://localhost:8787

Data served is whatever is currently in R2 (last `python3 live_music_cli.py upload` run from the data repo).
