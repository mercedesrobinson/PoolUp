import { v4 as uuid } from 'uuid';
import Database from 'better-sqlite3';

// Get database instance from global
declare global {
  var db: Database.Database;
}

interface SoloPool {
  id: string;
  name: string;
  goal_cents: number;
  owner_id: string;
  destination?: string;
  trip_date?: string;
  pool_type: 'solo';
  is_public: boolean;
  allow_encouragement: boolean;
}

interface PublicSoloPool {
  id: string;
  name: string;
  goal_cents: number;
  owner_name: string;
  avatar_type?: string;
  avatar_data?: string;
  contribution_streak: number;
  total_contributed_cents: number;
  contribution_count: number;
}

interface Encouragement {
  id: string;
  from_user_id: string;
  to_user_id: string;
  pool_id?: string;
  message: string;
  type: string;
  created_at: string;
  from_user_name: string;
  avatar_type?: string;
  avatar_data?: string;
  pool_name?: string;
}

interface UserFollow {
  id: string;
  name: string;
  avatar_type?: string;
  avatar_data?: string;
  current_streak: number;
  level: number;
}

interface PublicActivity {
  id: string;
  user_id: string;
  activity_type: string;
  activity_data: string;
  pool_id?: string;
  created_at: string;
  user_name: string;
  avatar_type?: string;
  avatar_data?: string;
  pool_name?: string;
}

interface StreakLeaderboard {
  id: string;
  name: string;
  avatar_type?: string;
  avatar_data?: string;
  current_streak: number;
  level: number;
  solo_pools_count: number;
}

// Solo savings and accountability system
export function createSoloPool(
  userId: string, 
  name: string, 
  goalCents: number, 
  destination?: string, 
  tripDate?: string
): string {
  const poolId = uuid();
  
  const insertPool = global.db.prepare(`
    INSERT INTO pools (
      id, name, goal_cents, owner_id, destination, trip_date, 
      pool_type, is_public, allow_encouragement
    ) VALUES (?, ?, ?, ?, ?, ?, 'solo', 1, 1)
  `);
  
  insertPool.run(poolId, name, goalCents, userId, destination, tripDate);
  
  // Add user as member
  const insertMembership = global.db.prepare(`
    INSERT INTO memberships (user_id, pool_id, role) 
    VALUES (?, ?, 'owner')
  `);
  insertMembership.run(userId, poolId);
  
  // Create solo-specific challenge
  createSoloChallenge(poolId, userId);
  
  return poolId;
}

export function createSoloChallenge(poolId: string, userId: string): string {
  const challengeId = uuid();
  
  const insertChallenge = global.db.prepare(`
    INSERT INTO challenges (
      id, pool_id, title, description, target_amount_cents, 
      reward_points, deadline, challenge_type
    ) VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+7 days'), 'solo_consistency')
  `);
  
  insertChallenge.run(
    challengeId,
    poolId,
    'Stay Consistent',
    'Make contributions for 7 days straight to build your savings habit!',
    0, // No amount target, just consistency
    100,
  );
  
  return challengeId;
}

// Get public solo pools for encouragement
export function getPublicSoloPools(limit: number = 20): PublicSoloPool[] {
  return global.db.prepare(`
    SELECT p.*, u.name as owner_name, u.avatar_type, u.avatar_data,
           m.contribution_streak, m.total_contributed_cents,
           (SELECT COUNT(*) FROM contributions c WHERE c.pool_id = p.id) as contribution_count
    FROM pools p
    JOIN users u ON p.owner_id = u.id
    JOIN memberships m ON p.id = m.pool_id AND u.id = m.user_id
    WHERE p.pool_type = 'solo' AND p.is_public = 1 AND u.is_public = 1
    ORDER BY m.contribution_streak DESC, p.created_at DESC
    LIMIT ?
  `).all(limit) as PublicSoloPool[];
}

// Send encouragement to solo saver
export function sendEncouragement(
  fromUserId: string, 
  toUserId: string, 
  poolId: string, 
  message: string, 
  type: string = 'general'
): string {
  const encouragementId = uuid();
  
  const insertEncouragement = global.db.prepare(`
    INSERT INTO encouragements (id, from_user_id, to_user_id, pool_id, message, type)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  insertEncouragement.run(encouragementId, fromUserId, toUserId, poolId, message, type);
  
  // Award points to encourager
  const updatePoints = global.db.prepare(`
    UPDATE users SET total_points = total_points + 5, xp = xp + 5 
    WHERE id = ?
  `);
  updatePoints.run(fromUserId);
  
  // Log public activity
  logPublicActivity(fromUserId, 'encouragement_sent', {
    toUser: toUserId,
    poolId,
    message: message.substring(0, 50) + (message.length > 50 ? '...' : '')
  });
  
  return encouragementId;
}

// Get encouragements for a user
export function getUserEncouragements(userId: string, limit: number = 50): Encouragement[] {
  return global.db.prepare(`
    SELECT e.*, 
           u.name as from_user_name, u.avatar_type, u.avatar_data,
           p.name as pool_name
    FROM encouragements e
    JOIN users u ON e.from_user_id = u.id
    LEFT JOIN pools p ON e.pool_id = p.id
    WHERE e.to_user_id = ?
    ORDER BY e.created_at DESC
    LIMIT ?
  `).all(userId, limit) as Encouragement[];
}

// Follow/unfollow system for accountability
export function followUser(followerId: string, followingId: string): void {
  const insertFollow = global.db.prepare(`
    INSERT OR IGNORE INTO follows (follower_id, following_id)
    VALUES (?, ?)
  `);
  insertFollow.run(followerId, followingId);
  
  // Log activity
  logPublicActivity(followerId, 'user_followed', { followingId });
}

export function unfollowUser(followerId: string, followingId: string): void {
  const deleteFollow = global.db.prepare(`
    DELETE FROM follows WHERE follower_id = ? AND following_id = ?
  `);
  deleteFollow.run(followerId, followingId);
}

// Get user's followers/following
export function getUserFollows(userId: string): { followers: UserFollow[]; following: UserFollow[] } {
  const followers = global.db.prepare(`
    SELECT u.id, u.name, u.avatar_type, u.avatar_data, u.current_streak, u.level
    FROM follows f
    JOIN users u ON f.follower_id = u.id
    WHERE f.following_id = ? AND u.is_public = 1
  `).all(userId) as UserFollow[];
  
  const following = global.db.prepare(`
    SELECT u.id, u.name, u.avatar_type, u.avatar_data, u.current_streak, u.level
    FROM follows f
    JOIN users u ON f.following_id = u.id
    WHERE f.follower_id = ? AND u.is_public = 1
  `).all(userId) as UserFollow[];
  
  return { followers, following };
}

// Log public activity for feed
export function logPublicActivity(
  userId: string, 
  activityType: string, 
  activityData: any, 
  poolId: string | null = null
): void {
  const activityId = uuid();
  
  const insertActivity = global.db.prepare(`
    INSERT INTO public_activities (id, user_id, activity_type, activity_data, pool_id)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  insertActivity.run(activityId, userId, activityType, JSON.stringify(activityData), poolId);
}

// Get public activity feed
export function getPublicActivityFeed(userId: string, limit: number = 50): PublicActivity[] {
  // Get activities from users they follow + their own activities
  return global.db.prepare(`
    SELECT pa.*, u.name as user_name, u.avatar_type, u.avatar_data,
           p.name as pool_name
    FROM public_activities pa
    JOIN users u ON pa.user_id = u.id
    LEFT JOIN pools p ON pa.pool_id = p.id
    WHERE (pa.user_id = ? OR pa.user_id IN (
      SELECT following_id FROM follows WHERE follower_id = ?
    )) AND u.is_public = 1
    ORDER BY pa.created_at DESC
    LIMIT ?
  `).all(userId, userId, limit) as PublicActivity[];
}

// Get streak leaderboard for motivation
export function getStreakLeaderboard(limit: number = 20): StreakLeaderboard[] {
  return global.db.prepare(`
    SELECT u.id, u.name, u.avatar_type, u.avatar_data, u.current_streak, u.level,
           COUNT(p.id) as solo_pools_count
    FROM users u
    LEFT JOIN pools p ON u.id = p.owner_id AND p.pool_type = 'solo'
    WHERE u.is_public = 1 AND u.current_streak > 0
    GROUP BY u.id
    ORDER BY u.current_streak DESC, u.level DESC
    LIMIT ?
  `).all(limit) as StreakLeaderboard[];
}
