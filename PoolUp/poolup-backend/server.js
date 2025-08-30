const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'PoolUp Backend is running!' });
});

// Guest user creation
app.post('/api/guest', (req, res) => {
  const { name } = req.body;
  const user = {
    id: Date.now(),
    name: name || 'Guest User',
    type: 'guest'
  };
  res.json(user);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`PoolUp Backend running on port ${PORT}`);
});
