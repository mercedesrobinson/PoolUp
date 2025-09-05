import { v4 as uuid } from 'uuid';
import db from './db';
import { generateRandomAvatar } from './avatar-builder';
import { User } from './types';

interface GoogleProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface Avatar {
  [key: string]: any;
}

// Google OAuth configuration
export const GOOGLE_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4000/auth/google/callback'
};

// Create or update user from Google OAuth
export function createOrUpdateGoogleUser(googleProfile: GoogleProfile): string {
  const { id: googleId, email, name, picture } = googleProfile;
  
  // Check if user exists
  const existingUser = db.prepare('SELECT * FROM users WHERE google_id = ? OR email = ?').get(googleId, email) as User | undefined;
  
  if (existingUser) {
    // Update existing user
    const updateUser = db.prepare(`
      UPDATE users 
      SET name = ?, email = ?, google_id = ?, profile_image_url = ?
      WHERE id = ?
    `);
    updateUser.run(name, email, googleId, picture, existingUser.id);
    return existingUser.id;
  } else {
    // Create new user
    const userId = uuid();
    const avatar = generateRandomAvatar();
    
    const insertUser = db.prepare(`
      INSERT INTO users (
        id, name, email, google_id, avatar_type, avatar_data, profile_image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertUser.run(
      userId, 
      name, 
      email, 
      googleId, 
      'generated', 
      JSON.stringify(avatar), 
      picture
    );
    
    return userId;
  }
}

// Guest login (existing functionality)
export function createGuestUser(name: string): string {
  const userId = uuid();
  const avatar = generateRandomAvatar();
  
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, avatar_type, avatar_data) 
    VALUES (?, ?, ?, ?)
  `);
  
  insertUser.run(userId, name, 'generated', JSON.stringify(avatar));
  return userId;
}

// Update user avatar
export function updateUserAvatar(userId: string, avatarType: string, avatarData: string, profileImageUrl: string | null = null): void {
  const updateAvatar = db.prepare(`
    UPDATE users 
    SET avatar_type = ?, avatar_data = ?, profile_image_url = ?
    WHERE id = ?
  `);
  
  updateAvatar.run(avatarType, avatarData, profileImageUrl, userId);
}

// Get user profile with avatar
export function getUserProfile(userId: string): (User & { avatar?: Avatar }) | null {
  const user = db.prepare(`
    SELECT id, name, email, avatar_type, avatar_data, profile_image_url,
           total_points, current_streak, longest_streak, level, xp, 
           balance_cents, is_public, allow_encouragement
    FROM users WHERE id = ?
  `).get(userId) as (User & { avatar_data?: string }) | undefined;
  
  if (!user) return null;
  
  // Parse avatar data
  if (user.avatar_data) {
    try {
      (user as any).avatar = JSON.parse(user.avatar_data);
    } catch (e) {
      (user as any).avatar = null;
    }
  }
  
  return user as User & { avatar?: Avatar };
}

// Update user privacy settings
export function updateUserPrivacy(userId: string, isPublic: boolean, allowEncouragement: boolean): void {
  const updatePrivacy = db.prepare(`
    UPDATE users 
    SET is_public = ?, allow_encouragement = ?
    WHERE id = ?
  `);
  
  updatePrivacy.run(isPublic ? 1 : 0, allowEncouragement ? 1 : 0, userId);
}
