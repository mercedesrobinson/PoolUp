const express = require('express');

const health = require('./health');
const auth = require('./auth');
const users = require('./users');
const pools = require('./pools');
const messages = require('./messages');
const contributions = require('./contributions');
const banking = require('./banking');
const cards = require('./cards');
const payments = require('./payments');
const notifications = require('./notifications');

function registerRoutes(app) {
  app.use('/health', health);
  app.use('/auth', auth);
  app.use('/api/users', users);
  app.use('/api/pools', pools);
  app.use('/api/messages', messages);
  app.use('/api/contributions', contributions);
  app.use('/api', banking); // mounts plaid/stripe paths under /api
  app.use('/api', cards); // debit card paths
  app.use('/api/payments', payments);
  app.use('/api', notifications);
}

module.exports = { registerRoutes };
