import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;


const server = http.createServer((req, res) => {
  const filePath = path.join(__dirname, 'public', 'index.html');
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
});


const wss = new WebSocketServer({ server });


function broadcast(data) {
  const payload = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}


wss.on('connection', (socket, req) => {
  // 4. Parse username from query string and broadcast join message
  const username = new URL(req.url, 'http://localhost').searchParams.get('username');
  broadcast({ type: 'system', text: `${username} joined` });

 
  socket.on('message', (message) => {
    try {
      const parsed = JSON.parse(message);
      broadcast({
        type: 'chat',
        username: parsed.username,
        text: parsed.text
      });
    } catch (err) {
      console.error('Failed to parse message:', err);
    }
  });


  socket.on('close', () => {
    broadcast({ type: 'system', text: `${username} left` });
  });
});


server.listen(PORT, () => {
  console.log(`Chat server running at http://localhost:${PORT}`);
});
