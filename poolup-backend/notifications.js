const { Expo } = require('expo-server-sdk');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3').verbose();
const payday = require('./payday');

// Initialize database connection
let db;
(async () => {
  db = await open({
    filename: './poolup.db',
    driver: sqlite3.Database
  });
})();

// Create a new Expo SDK client
const expo = new Expo();

class NotificationManager {
  constructor() {
    this.expo = expo;
  }

  // Send immediate push notification
  async sendPushNotification(pushToken, title, body, data = {}) {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      return false;
    }

    const message = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
    };

    try {
      const ticket = await this.expo.sendPushNotificationsAsync([message]);
      console.log('Push notification sent:', ticket);
      return true;
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return false;
    }
  }

  // Send payday reminders to users
  async sendPaydayReminders() {
    try {
      const usersNeedingReminders = await payday.getUsersNeedingReminders();
      
      for (const user of usersNeedingReminders) {
        if (user.push_token) {
          const daysUntil = Math.ceil((new Date(user.next_payday) - new Date()) / (1000 * 60 * 60 * 24));
          
          await this.sendPushNotification(
            user.push_token,
            "💰 Payday Reminder",
            `Your payday is in ${daysUntil} day${daysUntil > 1 ? 's' : ''}! Time to contribute to your savings goals.`,
            {
              type: 'payday_reminder',
              userId: user.id,
              payday: user.next_payday
            }
          );
        }
      }
      
      console.log(`Sent payday reminders to ${usersNeedingReminders.length} users`);
    } catch (error) {
      console.error('Failed to send payday reminders:', error);
    }
  }

  // Send streak warning notifications
  async sendStreakWarnings() {
    try {
      const query = `
        SELECT u.id, u.push_token, u.name, ps.frequency, ps.reminder_days_before
        FROM users u
        JOIN payday_settings ps ON u.id = ps.user_id
        WHERE ps.reminders_enabled = 1 
        AND u.current_streak > 0
        AND u.push_token IS NOT NULL
      `;
      
      const users = await db.all(query);
      
      for (const user of users) {
        const streakData = await payday.calculateStreak(user.id);
        const nextPayday = await payday.getNextPayday(user.id);
        const contributionWindow = new Date(nextPayday);
        contributionWindow.setDate(contributionWindow.getDate() + 3); // 3 days after payday
        
        const now = new Date();
        const hoursUntilDeadline = (contributionWindow - now) / (1000 * 60 * 60);
        
        // Send warning if less than 24 hours remaining and no contribution this period
        if (hoursUntilDeadline <= 24 && hoursUntilDeadline > 0) {
          await this.sendPushNotification(
            user.push_token,
            "🔥 Streak Alert!",
            `Don't break your ${streakData.current_streak}-contribution streak! Your window closes in ${Math.ceil(hoursUntilDeadline)} hours.`,
            {
              type: 'streak_warning',
              userId: user.id,
              streak: streakData.current_streak
            }
          );
        }
      }
    } catch (error) {
      console.error('Failed to send streak warnings:', error);
    }
  }

  // Send goal milestone notifications
  async sendGoalMilestone(poolId, milestone) {
    try {
      const pool = await db.get('SELECT * FROM pools WHERE id = ?', [poolId]);
      const members = await db.all('SELECT u.* FROM users u JOIN pool_members pm ON u.id = pm.user_id WHERE pm.pool_id = ?', [poolId]);
      
      for (const member of members) {
        if (member.push_token) {
          await this.sendPushNotification(
            member.push_token,
            "🎉 Milestone Reached!",
            `Your "${pool.name}" pool just hit ${milestone}% of the goal! Keep it up!`,
            {
              type: 'goal_milestone',
              poolId,
              milestone,
              poolName: pool.name
            }
          );
        }
      }
    } catch (error) {
      console.error('Failed to send milestone notifications:', error);
    }
  }

  // Send peer boost notifications
  async sendPeerBoost(fromUserId, toUserId, amount, poolId) {
    try {
      const fromUser = await db.get('SELECT * FROM users WHERE id = ?', [fromUserId]);
      const toUser = await db.get('SELECT * FROM users WHERE id = ?', [toUserId]);
      
      if (toUser.push_token) {
        await this.sendPushNotification(
          toUser.push_token,
          "💪 Peer Boost Received!",
          `${fromUser.name} boosted your savings with $${(amount / 100).toFixed(2)}!`,
          {
            type: 'peer_boost',
            fromUserId,
            toUserId,
            amount,
            poolId
          }
        );
      }
    } catch (error) {
      console.error('Failed to send peer boost notification:', error);
    }
  }

  // Send daily motivation to opted-in users
  async sendDailyMotivation() {
    try {
      const motivationalMessages = [
        "💪 Every dollar saved is a step closer to your dreams!",
        "🎯 Small contributions today, big rewards tomorrow!",
        "🌟 Your future self will thank you for saving today!",
        "💰 Consistency beats perfection in savings!",
        "🚀 You're building something amazing, one contribution at a time!",
        "✨ Great savers aren't born, they're made through daily habits!",
        "🏆 Champions save consistently, not perfectly!",
        "💎 Your savings are growing into something beautiful!",
      ];
      
      const users = await db.all(`
        SELECT u.* FROM users u 
        WHERE u.push_token IS NOT NULL 
        AND u.daily_motivation_enabled = 1
      `);
      
      const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
      
      for (const user of users) {
        await this.sendPushNotification(
          user.push_token,
          "PoolUp Motivation",
          randomMessage,
          {
            type: 'daily_motivation',
            userId: user.id
          }
        );
      }
      
      console.log(`Sent daily motivation to ${users.length} users`);
    } catch (error) {
      console.error('Failed to send daily motivation:', error);
    }
  }

  // Send group activity notifications
  async sendGroupActivity(poolId, activityType, actorUserId, details = {}) {
    try {
      const pool = await db.get('SELECT * FROM pools WHERE id = ?', [poolId]);
      const actor = await db.get('SELECT * FROM users WHERE id = ?', [actorUserId]);
      const members = await db.all(`
        SELECT u.* FROM users u 
        JOIN pool_members pm ON u.id = pm.user_id 
        WHERE pm.pool_id = ? AND u.id != ? AND u.push_token IS NOT NULL
      `, [poolId, actorUserId]);
      
      let title, body;
      
      switch (activityType) {
        case 'contribution':
          title = "💰 Group Activity";
          body = `${actor.name} just contributed $${(details.amount / 100).toFixed(2)} to "${pool.name}"!`;
          break;
        case 'joined':
          title = "👥 New Member";
          body = `${actor.name} joined your "${pool.name}" savings group!`;
          break;
        case 'goal_reached':
          title = "🎉 Goal Achieved!";
          body = `"${pool.name}" has reached its savings goal! Congratulations!`;
          break;
        default:
          return;
      }
      
      for (const member of members) {
        await this.sendPushNotification(
          member.push_token,
          title,
          body,
          {
            type: 'group_activity',
            poolId,
            activityType,
            actorUserId,
            ...details
          }
        );
      }
    } catch (error) {
      console.error('Failed to send group activity notification:', error);
    }
  }

  // Store user's push token
  async storePushToken(userId, pushToken) {
    try {
      await db.run('UPDATE users SET push_token = ? WHERE id = ?', [pushToken, userId]);
      console.log(`Stored push token for user ${userId}`);
    } catch (error) {
      console.error('Failed to store push token:', error);
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(userId, preferences) {
    try {
      const {
        payday_reminders = true,
        streak_warnings = true,
        goal_milestones = true,
        peer_boosts = true,
        daily_motivation = false,
        social_updates = true,
        marketing_messages = false
      } = preferences;
      
      await db.run(`
        UPDATE users SET 
          payday_reminders_enabled = ?,
          streak_warnings_enabled = ?,
          goal_milestones_enabled = ?,
          peer_boosts_enabled = ?,
          daily_motivation_enabled = ?,
          social_updates_enabled = ?,
          marketing_messages_enabled = ?
        WHERE id = ?
      `, [
        payday_reminders ? 1 : 0,
        streak_warnings ? 1 : 0,
        goal_milestones ? 1 : 0,
        peer_boosts ? 1 : 0,
        daily_motivation ? 1 : 0,
        social_updates ? 1 : 0,
        marketing_messages ? 1 : 0,
        userId
      ]);
      
      console.log(`Updated notification preferences for user ${userId}`);
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
    }
  }

  // Schedule recurring notifications (called by cron job)
  async processScheduledNotifications() {
    const now = new Date();
    const hour = now.getHours();
    
    // Send payday reminders at 9 AM
    if (hour === 9) {
      await this.sendPaydayReminders();
    }
    
    // Send streak warnings at 6 PM
    if (hour === 18) {
      await this.sendStreakWarnings();
    }
    
    // Send daily motivation at 8 AM
    if (hour === 8) {
      await this.sendDailyMotivation();
    }
  }
}

module.exports = new NotificationManager();
