import http.server, socketserver, sys, os, base64, time
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
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
