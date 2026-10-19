import http.server, socketserver, sys, os, base64, time, re
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Accept-Ranges', 'bytes')
        super().end_headers()
    def do_GET(self):
        path = self.translate_path(self.path)
        m = re.match(r'bytes=(\d*)-(\d*)$', self.headers.get('Range', ''))
        if not m or not os.path.isfile(path): return super().do_GET()
        size = os.path.getsize(path)
        a = int(m.group(1)) if m.group(1) else max(0, size - int(m.group(2) or 0))
        b = min(int(m.group(2)) if m.group(1) and m.group(2) else size - 1, size - 1)
        if a > b:
            self.send_response(416); self.send_header('Content-Range', f'bytes */{size}'); self.end_headers(); return
        self.send_response(206)
        self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Content-Range', f'bytes {a}-{b}/{size}')
        self.send_header('Content-Length', str(b - a + 1))
        self.end_headers()
        with open(path, 'rb') as f:
            f.seek(a)
            self.wfile.write(f.read(b - a + 1))
    def do_POST(self):
        if self.path.startswith('/snap'):
            n = int(self.headers.get('Content-Length', 0))
            data = self.rfile.read(n).decode()
            name = self.path.split('?name=')[-1] if '?name=' in self.path else str(int(time.time()))
            os.makedirs('Niepotrzebne/snaps', exist_ok=True)
            with open(f'Niepotrzebne/snaps/{name}.jpg', 'wb') as f: f.write(base64.b64decode(data.split(',', 1)[1]))
            self.send_response(200); self.end_headers(); self.wfile.write(b'ok')
        else:
            self.send_response(404); self.end_headers()
    def log_message(self, *a): pass
socketserver.TCPServer.allow_reuse_address = True
with socketserver.ThreadingTCPServer(('', int(sys.argv[1]) if len(sys.argv) > 1 else 8473), H) as s: s.serve_forever()
