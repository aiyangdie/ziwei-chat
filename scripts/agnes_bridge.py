#!/usr/bin/env python3
"""Local Agnes AI bridge — Node on this machine hits a hijacked HTTPS path;
Python urllib reaches Agnes correctly. Next.js should call http://127.0.0.1:18787
"""

from __future__ import annotations

import json
import os
import ssl
import sys
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HOST = "127.0.0.1"
PORT = int(os.environ.get("AGNES_BRIDGE_PORT", "18787"))
UPSTREAM = os.environ.get("AGNES_UPSTREAM", "https://apihub.agnes-ai.com").rstrip("/")


def load_env_local() -> None:
    env_path = Path(__file__).resolve().parents[1] / ".env.local"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip())


load_env_local()


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt: str, *args) -> None:  # quieter
        sys.stderr.write("[agnes-bridge] " + (fmt % args) + "\n")

    def do_GET(self) -> None:
        if self.path in ("/", "/health"):
            body = b'{"ok":true,"service":"agnes-bridge"}'
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        self.send_error(404)

    def do_POST(self) -> None:
        if not self.path.startswith("/v1/chat/completions"):
            self.send_error(404)
            return

        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length else b"{}"
        api_key = (
            os.environ.get("AGNES_API_KEY")
            or os.environ.get("AI_API_KEY")
            or ""
        )
        auth = self.headers.get("Authorization") or (f"Bearer {api_key}" if api_key else "")
        if not auth:
            self._json_error(401, "缺少 AGNES_API_KEY")
            return

        # detect stream
        try:
            want_stream = bool(json.loads(raw.decode("utf-8")).get("stream"))
        except Exception:
            want_stream = False

        req = urllib.request.Request(
            f"{UPSTREAM}/v1/chat/completions",
            data=raw,
            method="POST",
            headers={
                "Authorization": auth,
                "Content-Type": "application/json",
                "Accept": "text/event-stream" if want_stream else "application/json",
                "User-Agent": "ziwei-agnes-bridge/1.0",
            },
        )

        ctx = ssl.create_default_context()
        try:
            upstream = urllib.request.urlopen(req, timeout=120, context=ctx)
        except urllib.error.HTTPError as e:
            err_body = e.read()
            self.send_response(e.code)
            self.send_header("Content-Type", e.headers.get("Content-Type", "application/json"))
            self.send_header("Content-Length", str(len(err_body)))
            self.end_headers()
            self.wfile.write(err_body)
            return
        except Exception as e:
            self._json_error(502, f"upstream failed: {e}")
            return

        ctype = upstream.headers.get("Content-Type", "application/json")
        self.send_response(upstream.status)
        self.send_header("Content-Type", ctype)
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "close")
        self.end_headers()

        try:
            while True:
                chunk = upstream.read(4096)
                if not chunk:
                    break
                self.wfile.write(chunk)
                self.wfile.flush()
        finally:
            upstream.close()

    def _json_error(self, code: int, message: str) -> None:
        body = json.dumps({"error": message}, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main() -> None:
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"agnes-bridge listening on http://{HOST}:{PORT}", flush=True)
    httpd.serve_forever()


if __name__ == "__main__":
    main()
