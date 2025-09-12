const http = require('http');
const { createApp } = require('./app');
const { initDb } = require('./db/init');
const { attachSockets } = require('./sockets');
const { HOST, PORT } = require('./config/env');

const app = createApp();
// Initialize database schema on startup (idempotent)
initDb().catch((e) => {
  console.error('Database init failed:', e.message);
});
const server = http.createServer(app);
attachSockets(server);

let currentPort = PORT;
let attemptsLeft = 10;

function startListening() {
  server.listen(currentPort, HOST, () => {
    console.log(`PoolUp backend listening on http://localhost:${currentPort}`);
  });
}

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE' && attemptsLeft > 0) {
    const used = currentPort;
    currentPort += 1;
    attemptsLeft -= 1;
    console.warn(`Port ${used} in use. Retrying on ${currentPort}...`);
    setTimeout(startListening, 200);
  } else {
    console.error('Server listen error:', err);
    process.exit(1);
  }
});

startListening();
