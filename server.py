#!/usr/bin/env python3
"""
BIOTCP - Adaptive Semantic Optical Morse Communication System
Python 3 Lightweight Static Server & Bridge
"""

import http.server
import socketserver
import socket
import os
import sys

PORT = int(os.environ.get("PORT", 3000))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS for mobile browsers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

def get_local_ips():
    ips = []
    try:
        hostname = socket.gethostname()
        for ip in socket.gethostbyname_ex(hostname)[2]:
            if not ip.startswith("127."):
                ips.append(ip)
    except Exception:
        pass
    return ips

if __name__ == "__main__":
    with socketserver.ThreadingTCPServer(("0.0.0.0", PORT), Handler) as httpd:
        print("\n" + "=" * 60)
        print("📡 BIOTCP Python Server Running!")
        print("=" * 60)
        print(f"💻 Local:          http://localhost:{PORT}")
        for ip in get_local_ips():
            print(f"📱 Mobile Network: http://{ip}:{PORT}")
        print("=" * 60 + "\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
            httpd.server_close()
