const jwt = require('jsonwebtoken');

// Simple auth middleware for PoolUp
const authMiddleware = async (req, res, next) => {
  try {
    // For development, we'll use a simple user ID in headers
    // In production, this would verify JWT tokens
    const userId = req.headers['x-user-id'] || req.headers.authorization?.replace('Bearer ', '');
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get user from database
    const user = await global.db.get('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid user' });
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

module.exports = authMiddleware;
