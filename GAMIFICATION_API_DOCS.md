# PoolUp Gamification API Documentation

## Overview

This document outlines all the gamification features and API endpoints implemented in the PoolUp app, including streaks, badges, social features, accountability mechanics, pool templates, mini-games, and unlockable rewards.

## Table of Contents

1. [Gamification Core](#gamification-core)
2. [Social & Competitive Features](#social--competitive-features)
3. [Accountability & Forfeits](#accountability--forfeits)
4. [Pool Templates](#pool-templates)
5. [Mini-Games & Rewards](#mini-games--rewards)
6. [Frontend Components](#frontend-components)
7. [Database Schema](#database-schema)

---

## Gamification Core

### API Endpoints

#### `GET /api/gamification/badges/:userId`
Retrieves all badges for a user.

**Response:**
```json
{
  "badges": [
    {
      "id": "first_contribution",
      "name": "First Step",
      "description": "Made your first contribution",
      "emoji": "🎯",
      "earned": true,
      "earned_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### `POST /api/gamification/badges/award`
Awards a badge to a user.

**Request Body:**
```json
{
  "userId": 123,
  "badgeId": "streak_master",
  "context": "7 day streak achieved"
}
```

#### `GET /api/gamification/streaks/:userId`
Gets user's current streak information.

**Response:**
```json
{
  "currentStreak": 7,
  "longestStreak": 15,
  "lastContribution": "2024-01-15T10:30:00Z",
  "streakMultiplier": 1.5
}
```

#### `POST /api/gamification/streaks/update`
Updates user's streak based on contribution.

**Request Body:**
```json
{
  "userId": 123,
  "contributionDate": "2024-01-15T10:30:00Z"
}
```

#### `GET /api/gamification/milestones/:poolId`
Gets milestone information for a pool.

**Response:**
```json
{
  "milestones": [
    {
      "percentage": 25,
      "achieved": true,
      "achieved_at": "2024-01-10T15:20:00Z",
      "reward_points": 100
    }
  ]
}
```

---

## Social & Competitive Features

### API Endpoints

#### `GET /api/social/leaderboards/:type`
Gets leaderboard data by type.

**Types:** `most_generous`, `most_consistent`, `top_achievers`

**Response:**
```json
{
  "leaderboard": [
    {
      "userId": 123,
      "name": "John Doe",
      "avatar": "avatar_url",
      "score": 2500,
      "rank": 1,
      "badge": "🏆"
    }
  ]
}
```

#### `POST /api/social/chat/send`
Sends a message to pool chat.

**Request Body:**
```json
{
  "poolId": 456,
  "userId": 123,
  "message": "Great progress everyone!",
  "messageType": "text"
}
```

#### `GET /api/social/chat/:poolId/messages`
Gets chat messages for a pool.

**Response:**
```json
{
  "messages": [
    {
      "id": 789,
      "userId": 123,
      "userName": "John Doe",
      "message": "Great progress everyone!",
      "timestamp": "2024-01-15T10:30:00Z",
      "messageType": "text"
    }
  ]
}
```

#### `POST /api/social/milestone-cards/generate`
Generates a shareable milestone card.

**Request Body:**
```json
{
  "userId": 123,
  "poolId": 456,
  "milestone": {
    "percentage": 50,
    "amount": 2500,
    "goal": 5000,
    "theme": "beach_vacation"
  }
}
```

#### `GET /api/social/activity-feed/:poolId`
Gets activity feed for a pool.

**Response:**
```json
{
  "activities": [
    {
      "id": 101,
      "type": "contribution",
      "userId": 123,
      "userName": "John Doe",
      "amount": 100,
      "timestamp": "2024-01-15T10:30:00Z",
      "message": "John contributed $100 to the pool!"
    }
  ]
}
```

#### `POST /api/social/challenges/create`
Creates a pool challenge.

**Request Body:**
```json
{
  "poolId": 456,
  "creatorId": 123,
  "title": "Double Contribution Week",
  "description": "Let's all contribute twice this week!",
  "startDate": "2024-01-20T00:00:00Z",
  "endDate": "2024-01-27T23:59:59Z",
  "reward": 200
}
```

---

## Accountability & Forfeits

### API Endpoints

#### `POST /api/accountability/forfeits/process`
Processes a forfeit for missed contribution.

**Request Body:**
```json
{
  "userId": 123,
  "poolId": 456,
  "missedAmount": 50,
  "charityId": "red_cross",
  "reason": "missed_weekly_contribution"
}
```

#### `POST /api/accountability/peer-boosts/send`
Sends a peer boost to help another user.

**Request Body:**
```json
{
  "fromUserId": 123,
  "toUserId": 456,
  "poolId": 789,
  "amount": 25,
  "message": "You've got this! Here's a little help."
}
```

#### `GET /api/accountability/stats/:poolId`
Gets accountability statistics for a pool.

**Response:**
```json
{
  "totalForfeits": 3,
  "totalForfeitAmount": 150,
  "totalPeerBoosts": 8,
  "totalBoostAmount": 200,
  "charityDonations": 150,
  "memberStats": [
    {
      "userId": 123,
      "name": "John Doe",
      "status": "on_track",
      "consecutiveDays": 7,
      "totalForfeits": 0,
      "totalBoosts": 2
    }
  ]
}
```

#### `GET /api/accountability/charities`
Gets list of supported charities for donations.

**Response:**
```json
{
  "charities": [
    {
      "id": "red_cross",
      "name": "American Red Cross",
      "description": "Disaster relief and emergency assistance",
      "logo_url": "https://example.com/logo.png",
      "website_url": "https://redcross.org"
    }
  ]
}
```

---

## Pool Templates

### API Endpoints

#### `GET /api/templates`
Gets all available pool templates.

**Response:**
```json
{
  "templates": [
    {
      "id": 1,
      "name": "Dream Vacation",
      "description": "Save for your perfect getaway",
      "goal_amount_cents": 300000,
      "category": "travel",
      "suggested_duration_days": 365,
      "visual_theme": "beach_vacation",
      "votes": 45,
      "is_featured": true
    }
  ]
}
```

#### `GET /api/templates/categories`
Gets template categories.

**Response:**
```json
{
  "categories": [
    {
      "id": "travel",
      "name": "Travel & Vacation",
      "emoji": "✈️",
      "count": 12
    }
  ]
}
```

#### `POST /api/templates/create-pool`
Creates a pool from a template.

**Request Body:**
```json
{
  "userId": 123,
  "templateId": 1,
  "customizations": {
    "name": "My Dream Vacation",
    "goal_amount_cents": 500000,
    "target_date": "2024-12-31"
  }
}
```

#### `POST /api/templates/vote`
Votes on a template.

**Request Body:**
```json
{
  "userId": 123,
  "templateId": 1,
  "voteType": "up"
}
```

#### `POST /api/templates/suggest`
Suggests a new template.

**Request Body:**
```json
{
  "userId": 123,
  "name": "Emergency Fund",
  "description": "Build a 6-month emergency fund",
  "goal_amount_cents": 1000000,
  "category": "emergency",
  "visual_theme": "house_fund"
}
```

---

## Mini-Games & Rewards

### API Endpoints

#### `GET /api/mini-games/games`
Gets available mini-games for user.

**Response:**
```json
{
  "games": [
    {
      "id": "streak_spinner",
      "name": "Streak Spinner",
      "emoji": "🎰",
      "description": "Spin the wheel for bonus points!",
      "isUnlocked": true,
      "rewards": {
        "min": 10,
        "max": 100
      }
    }
  ],
  "userStats": {
    "current_streak": 7,
    "total_contributions": 15,
    "total_points": 850
  }
}
```

#### `POST /api/mini-games/games/:gameId/play`
Plays a mini-game and processes results.

**Request Body:**
```json
{
  "gameResult": {
    "success": true,
    "multiplier": 2,
    "bonus": 25,
    "special": false
  }
}
```

**Response:**
```json
{
  "reward": {
    "points": 75,
    "gameId": "streak_spinner",
    "success": true
  },
  "achievements": [
    {
      "type": "badge",
      "name": "Lucky Spinner",
      "points": 50
    }
  ]
}
```

#### `GET /api/mini-games/rewards/unlockable`
Gets unlockable rewards for user.

**Response:**
```json
{
  "progress": {
    "currentStreak": 7,
    "totalContributions": 15,
    "totalSaved": 3500,
    "goalsCompleted": 2,
    "totalPoints": 1250
  },
  "unlockedRewards": [
    {
      "id": "neon_city_theme",
      "reward_type": "visual_theme",
      "unlocked_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### `POST /api/mini-games/rewards/unlock`
Unlocks a reward for user.

**Request Body:**
```json
{
  "rewardId": "space_odyssey_theme",
  "rewardType": "visual_theme"
}
```

#### `GET /api/mini-games/stats/gaming`
Gets gaming statistics for user.

**Response:**
```json
{
  "gamesPlayed": 23,
  "gamesWon": 12,
  "winRate": 52,
  "totalPointsFromGames": 850,
  "bestScore": 500,
  "recentGames": [
    {
      "game_id": "streak_spinner",
      "points_earned": 75,
      "played_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## Frontend Components

### Core Gamification Components

1. **VisualThemeSelector** - Customizable visual themes for pools
2. **ProgressVisualization** - Animated SVG progress displays
3. **BadgeSystem** - Badge display with modal details
4. **StreakDisplay** - Streak counter with fire animations
5. **CelebrationEffects** - Achievement celebration animations

### Social Components

6. **Leaderboard** - Competitive rankings display
7. **GroupChat** - Real-time pool chat with Socket.IO
8. **ShareableMilestoneCard** - Social media milestone cards

### Accountability Components

9. **ForfeitSystem** - Missed contribution penalty processing
10. **PeerBoostSystem** - Peer assistance mechanism
11. **AccountabilityDashboard** - Pool accountability overview

### Template & Gaming Components

12. **PoolTemplateSelector** - Pre-built pool templates
13. **MiniGameCenter** - Interactive mini-games hub
14. **UnlockableRewards** - Tier-based reward progression

### Integration Components

15. **GamificationHub** - Comprehensive feature showcase screen

---

## Database Schema

### New Tables Added

#### `user_streaks`
```sql
CREATE TABLE user_streaks (
  user_id INTEGER PRIMARY KEY,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_contribution_date TEXT,
  total_contributions INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  streak_multiplier REAL DEFAULT 1.0,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

#### `badges`
```sql
CREATE TABLE badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT,
  category TEXT,
  points_required INTEGER DEFAULT 0,
  is_secret BOOLEAN DEFAULT FALSE
);
```

#### `user_badges`
```sql
CREATE TABLE user_badges (
  user_id INTEGER,
  badge_id TEXT,
  earned_at TEXT DEFAULT CURRENT_TIMESTAMP,
  context TEXT,
  PRIMARY KEY (user_id, badge_id),
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (badge_id) REFERENCES badges (id)
);
```

#### `pool_milestones`
```sql
CREATE TABLE pool_milestones (
  pool_id INTEGER,
  percentage INTEGER,
  achieved BOOLEAN DEFAULT FALSE,
  achieved_at TEXT,
  reward_points INTEGER DEFAULT 0,
  PRIMARY KEY (pool_id, percentage),
  FOREIGN KEY (pool_id) REFERENCES pools (id)
);
```

#### `forfeits`
```sql
CREATE TABLE forfeits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  pool_id INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL,
  charity_id TEXT,
  reason TEXT,
  processed_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (pool_id) REFERENCES pools (id)
);
```

#### `peer_boosts`
```sql
CREATE TABLE peer_boosts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_user_id INTEGER NOT NULL,
  to_user_id INTEGER NOT NULL,
  pool_id INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL,
  message TEXT,
  sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_user_id) REFERENCES users (id),
  FOREIGN KEY (to_user_id) REFERENCES users (id),
  FOREIGN KEY (pool_id) REFERENCES pools (id)
);
```

#### `charities`
```sql
CREATE TABLE charities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  stripe_account_id TEXT,
  active BOOLEAN DEFAULT TRUE
);
```

#### `pool_templates`
```sql
CREATE TABLE pool_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  goal_amount_cents INTEGER NOT NULL,
  category TEXT NOT NULL,
  suggested_duration_days INTEGER,
  visual_theme TEXT DEFAULT 'beach_vacation',
  created_by INTEGER,
  votes INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (created_by) REFERENCES users (id)
);
```

#### `template_votes`
```sql
CREATE TABLE template_votes (
  user_id INTEGER,
  template_id INTEGER,
  vote_type TEXT CHECK(vote_type IN ('up', 'down')),
  voted_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, template_id),
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (template_id) REFERENCES pool_templates (id)
);
```

#### `game_plays`
```sql
CREATE TABLE game_plays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  game_id TEXT NOT NULL,
  points_earned INTEGER NOT NULL,
  result_data TEXT,
  played_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

#### `unlocked_rewards`
```sql
CREATE TABLE unlocked_rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  reward_id TEXT NOT NULL,
  reward_type TEXT NOT NULL,
  unlocked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id),
  UNIQUE(user_id, reward_id)
);
```

---

## Visual Themes Available

1. **beach_vacation** - Beach and travel themed
2. **house_fund** - Home building themed  
3. **travel_adventure** - Adventure and exploration
4. **emergency_fund** - Safety and security themed
5. **roadmap_journey** - Progress roadmap style
6. **concert_tickets** - Entertainment themed
7. **neon_city** - Futuristic cyberpunk (unlockable)
8. **space_odyssey** - Cosmic journey (unlockable)
9. **enchanted_forest** - Magical woodland (unlockable)
10. **pirate_treasure** - Treasure hunt themed (unlockable)

---

## Badge Categories

- **Contribution Badges**: First Step, Consistent Saver, Big Spender
- **Streak Badges**: Streak Starter, Week Warrior, Month Master
- **Social Badges**: Team Player, Motivator, Helper
- **Achievement Badges**: Goal Crusher, Milestone Master, Champion
- **Gaming Badges**: Game Rookie, High Roller, Gaming Addict
- **Special Badges**: Early Adopter, Community Hero, Legend

---

## Mini-Games Available

1. **Streak Spinner** (🎰) - Wheel spinning game for bonus points
2. **Savings Slots** (🎲) - Slot machine with savings symbols
3. **Goal Crusher** (🎯) - Target hitting game with multipliers
4. **Fortune Wheel** (🎡) - Premium wheel with exclusive rewards

---

## Real-time Features

All social features use Socket.IO for real-time updates:

- **Group Chat**: Real-time messaging within pools
- **Live Leaderboards**: Dynamic ranking updates
- **Activity Feeds**: Instant activity notifications
- **Challenge Updates**: Real-time challenge progress
- **Celebration Sharing**: Live achievement broadcasts

---

## Authentication & Security

- All endpoints require user authentication via middleware
- Input validation on all POST requests
- Rate limiting on gaming endpoints to prevent abuse
- Idempotency checks for badge awarding and voting
- Secure charity donation processing via Stripe

---

## Error Handling

Standard HTTP status codes:
- `200` - Success
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (authentication required)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate action)
- `500` - Internal Server Error

All errors return JSON format:
```json
{
  "error": "Description of the error",
  "code": "ERROR_CODE",
  "details": {}
}
```

---

This comprehensive gamification system transforms PoolUp from a simple savings app into an engaging, social, and competitive platform that motivates users through game mechanics, social features, and accountability systems.
