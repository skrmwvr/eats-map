import http.server
import socketserver
import json
import urllib.parse
from agent import agent

PORT = 8081

class GeneratorHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Serve the API endpoints
        if self.path.startswith('/api/status'):
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {
                "status": agent.status,
                "current_pass": agent.current_pass,
                "paused": agent.paused,
                "logs": agent.logs
            }
            self.wfile.write(json.dumps(response).encode('utf-8'))
            return
            
        # Serve static files
        if self.path == '/':
            self.path = '/index.html'
        return super().do_GET()

    def do_POST(self):
        if self.path == '/api/generate':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length).decode('utf-8')
            seed_data = json.loads(post_data)
            
            agent.start_generation(seed_data)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True}).encode('utf-8'))
            
        elif self.path == '/api/approve':
            agent.approve_pass()
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True}).encode('utf-8'))
            
        elif self.path == '/api/hint':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length).decode('utf-8')
            hint_data = json.loads(post_data)
            agent.inject_hint(hint_data.get('hint', ''))
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), GeneratorHandler) as httpd:
        print(f"Generator server running at http://localhost:{PORT}")
        httpd.serve_forever()
