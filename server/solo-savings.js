import { v4 as uuid } from 'uuid';
import db from './db.js';

// Solo savings and accountability system
export function createSoloPool(userId, name, goalCents, destination, tripDate) {
  const poolId = uuid();
  
  const insertPool = db.prepare(`
    INSERT INTO pools (
      id, name, goal_cents, owner_id, destination, trip_date, 
      pool_type, is_public, allow_encouragement
    ) VALUES (?, ?, ?, ?, ?, ?, 'solo', 1, 1)
  `);
  
  insertPool.run(poolId, name, goalCents, userId, destination, tripDate);
  
  // Add user as member
  const insertMembership = db.prepare(`
    INSERT INTO memberships (user_id, pool_id, role) 
    VALUES (?, ?, 'owner')
  `);
  insertMembership.run(userId, poolId);
  
  // Create solo-specific challenge
  createSoloChallenge(poolId, userId);
  
  return poolId;
}

export function createSoloChallenge(poolId, userId) {
  const challengeId = uuid();
  
  const insertChallenge = db.prepare(`
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
export function getPublicSoloPools(limit = 20) {
  return db.prepare(`
    SELECT p.*, u.name as owner_name, u.avatar_type, u.avatar_data,
           m.contribution_streak, m.total_contributed_cents,
           (SELECT COUNT(*) FROM contributions c WHERE c.pool_id = p.id) as contribution_count
    FROM pools p
    JOIN users u ON p.owner_id = u.id
    JOIN memberships m ON p.id = m.pool_id AND u.id = m.user_id
    WHERE p.pool_type = 'solo' AND p.is_public = 1 AND u.is_public = 1
    ORDER BY m.contribution_streak DESC, p.created_at DESC
    LIMIT ?
  `).all(limit);
}

// Send encouragement to solo saver
export function sendEncouragement(fromUserId, toUserId, poolId, message, type = 'general') {
  const encouragementId = uuid();
  
  const insertEncouragement = db.prepare(`
    INSERT INTO encouragements (id, from_user_id, to_user_id, pool_id, message, type)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  insertEncouragement.run(encouragementId, fromUserId, toUserId, poolId, message, type);
  
  // Award points to encourager
  const updatePoints = db.prepare(`
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
export function getUserEncouragements(userId, limit = 50) {
  return db.prepare(`
    SELECT e.*, 
           u.name as from_user_name, u.avatar_type, u.avatar_data,
           p.name as pool_name
    FROM encouragements e
    JOIN users u ON e.from_user_id = u.id
    LEFT JOIN pools p ON e.pool_id = p.id
    WHERE e.to_user_id = ?
    ORDER BY e.created_at DESC
    LIMIT ?
  `).all(userId, limit);
}

// Follow/unfollow system for accountability
export function followUser(followerId, followingId) {
  const insertFollow = db.prepare(`
    INSERT OR IGNORE INTO follows (follower_id, following_id)
    VALUES (?, ?)
  `);
  insertFollow.run(followerId, followingId);
  
  // Log activity
  logPublicActivity(followerId, 'user_followed', { followingId });
}

export function unfollowUser(followerId, followingId) {
  const deleteFollow = db.prepare(`
    DELETE FROM follows WHERE follower_id = ? AND following_id = ?
  `);
  deleteFollow.run(followerId, followingId);
}

// Get user's followers/following
export function getUserFollows(userId) {
  const followers = db.prepare(`
    SELECT u.id, u.name, u.avatar_type, u.avatar_data, u.current_streak, u.level
    FROM follows f
    JOIN users u ON f.follower_id = u.id
    WHERE f.following_id = ? AND u.is_public = 1
  `).all(userId);
  
  const following = db.prepare(`
    SELECT u.id, u.name, u.avatar_type, u.avatar_data, u.current_streak, u.level
    FROM follows f
    JOIN users u ON f.following_id = u.id
    WHERE f.follower_id = ? AND u.is_public = 1
  `).all(userId);
  
  return { followers, following };
}

// Log public activity for feed
export function logPublicActivity(userId, activityType, activityData, poolId = null) {
  const activityId = uuid();
  
  const insertActivity = db.prepare(`
    INSERT INTO public_activities (id, user_id, activity_type, activity_data, pool_id)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  insertActivity.run(activityId, userId, activityType, JSON.stringify(activityData), poolId);
}

// Get public activity feed
export function getPublicActivityFeed(userId, limit = 50) {
  // Get activities from users they follow + their own activities
  return db.prepare(`
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
  `).all(userId, userId, limit);
}

// Get streak leaderboard for motivation
export function getStreakLeaderboard(limit = 20) {
  return db.prepare(`
    SELECT u.id, u.name, u.avatar_type, u.avatar_data, u.current_streak, u.level,
           COUNT(p.id) as solo_pools_count
    FROM users u
    LEFT JOIN pools p ON u.id = p.owner_id AND p.pool_type = 'solo'
    WHERE u.is_public = 1 AND u.current_streak > 0
    GROUP BY u.id
    ORDER BY u.current_streak DESC, u.level DESC
    LIMIT ?
  `).all(limit);
}
