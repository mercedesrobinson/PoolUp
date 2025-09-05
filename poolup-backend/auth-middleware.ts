import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import db from './db';

interface AuthenticatedRequest extends Request {
  user?: any;
}

// Simple auth middleware for PoolUp
const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // For development, we'll use a simple user ID in headers
    // In production, this would verify JWT tokens
    const userId = req.headers['x-user-id'] || req.headers.authorization?.replace('Bearer ', '');
    
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    // Get user from database
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    
    if (!user) {
      res.status(401).json({ error: 'Invalid user' });
      return;
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export default authMiddleware;
export type { AuthenticatedRequest };
