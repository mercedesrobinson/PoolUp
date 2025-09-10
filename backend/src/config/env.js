const path = require('path');
require('dotenv').config();

const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data');

module.exports = {
  HOST,
  PORT,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  DATA_DIR,
};

