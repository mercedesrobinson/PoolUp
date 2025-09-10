const { Server } = require('socket.io');
const { setIO } = require('./io');

function attachSockets(httpServer) {
  const io = new Server(httpServer, { cors: { origin: '*' } });

  io.on('connection', (socket) => {
    socket.on('room:join', (room) => {
      socket.join(String(room));
    });
  });

  setIO(io);
  return io;
}

module.exports = { attachSockets };

