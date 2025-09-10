const express = require('express');
const cors = require('cors');
const { registerRoutes } = require('./routes');

function createApp() {
  const app = express();

  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
    credentials: false,
  }));
  app.use(express.json());

  registerRoutes(app);

  return app;
}

module.exports = { createApp };

