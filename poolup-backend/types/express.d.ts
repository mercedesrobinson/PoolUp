import { Database } from 'sqlite';
import { User } from './index';

declare global {
  namespace Express {
    interface Request {
      db: Database;
      user?: User;
    }
  }
}
