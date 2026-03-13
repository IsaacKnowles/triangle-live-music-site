#!/usr/bin/env python3
"""Simple static file server for the live music viewer.

Copies index.html and live_music_events.json to /tmp/live_music_viewer/ so the
server process can read them regardless of macOS TCC sandbox restrictions.
"""
import os
import functools
from http.server import HTTPServer, SimpleHTTPRequestHandler

DIR  = "/tmp/live_music_viewer"
PORT = int(os.environ.get("PORT", 8080))

handler = functools.partial(SimpleHTTPRequestHandler, directory=DIR)
httpd = HTTPServer(("", PORT), handler)
print(f"Serving {DIR} on http://localhost:{PORT}", flush=True)
httpd.serve_forever()
