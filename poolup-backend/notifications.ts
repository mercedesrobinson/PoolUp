import { Expo, ExpoPushMessage, ExpoPushToken } from 'expo-server-sdk';
import db from './db';
import { getNextPayday, getUserPaydaySettings } from './payday';

interface NotificationData {
  type?: string;
  poolId?: string;
  userId?: string;
  [key: string]: any;
}

interface PushNotificationPayload {
  pushToken: string;
  title: string;
  body: string;
  data?: NotificationData;
}

interface ScheduledNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data?: string;
  scheduled_for: string;
  sent: boolean;
  created_at: string;
}

interface User {
  id: string;
  name: string;
  push_token?: string;
  current_streak: number;
  [key: string]: any;
}

// Create a new Expo SDK client
const expo = new Expo();

class NotificationManager {
  private expo: Expo;

  constructor() {
    this.expo = expo;
  }

  // Send immediate push notification
  async sendPushNotification(
    pushToken: string, 
    title: string, 
    body: string, 
    data: NotificationData = {}
  ): Promise<boolean> {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      return false;
    }

    const message: ExpoPushMessage = {
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
  async sendPaydayReminders(): Promise<void> {
    try {
      const users = db.prepare(`
        SELECT id, name, push_token, payday_settings 
        FROM users 
        WHERE push_token IS NOT NULL
      `).all() as User[];

      for (const user of users) {
        const paydaySettings = getUserPaydaySettings(user.id);
        if (!paydaySettings) continue;

        const nextPayday = getNextPayday(paydaySettings);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Send reminder if payday is tomorrow
        if (nextPayday.toDateString() === tomorrow.toDateString()) {
          await this.sendPushNotification(
            user.push_token!,
            'Payday Tomorrow! 💰',
            `Don't forget to contribute to your savings pools when you get paid!`,
            { type: 'payday_reminder', userId: user.id }
          );
        }
      }
    } catch (error) {
      console.error('Error sending payday reminders:', error);
    }
  }

  // Send streak warnings
  async sendStreakWarnings(): Promise<void> {
    try {
      const usersAtRisk = db.prepare(`
        SELECT u.id, u.name, u.push_token, u.current_streak,
               MAX(c.created_at) as last_contribution
        FROM users u
        LEFT JOIN contributions c ON u.id = c.user_id
        WHERE u.push_token IS NOT NULL 
          AND u.current_streak > 0
        GROUP BY u.id
        HAVING julianday('now') - julianday(last_contribution) >= 6
      `).all() as (User & { last_contribution: string })[];

      for (const user of usersAtRisk) {
        await this.sendPushNotification(
          user.push_token!,
          'Streak Alert! 🔥',
          `Your ${user.current_streak}-day streak is at risk! Contribute today to keep it alive.`,
          { type: 'streak_warning', userId: user.id, streak: user.current_streak }
        );
      }
    } catch (error) {
      console.error('Error sending streak warnings:', error);
    }
  }

  // Send goal milestone notifications
  async sendMilestoneNotifications(): Promise<void> {
    try {
      const pools = db.prepare(`
        SELECT p.id, p.name, p.goal_cents, p.owner_id,
               SUM(c.amount_cents) as total_contributed
        FROM pools p
        LEFT JOIN contributions c ON p.id = c.pool_id
        GROUP BY p.id
      `).all() as any[];

      for (const pool of pools) {
        const progressPercentage = (pool.total_contributed / pool.goal_cents) * 100;
        
        // Check for milestone achievements (25%, 50%, 75%, 100%)
        const milestones = [25, 50, 75, 100];
        for (const milestone of milestones) {
          if (progressPercentage >= milestone) {
            // Check if we've already sent this milestone notification
            const existingNotification = db.prepare(`
              SELECT id FROM notifications 
              WHERE type = 'milestone' 
                AND data LIKE '%"poolId":"${pool.id}"%' 
                AND data LIKE '%"milestone":${milestone}%'
            `).get();

            if (!existingNotification) {
              // Send to all pool members
              const members = db.prepare(`
                SELECT u.id, u.name, u.push_token
                FROM users u
                JOIN memberships m ON u.id = m.user_id
                WHERE m.pool_id = ? AND u.push_token IS NOT NULL
              `).all(pool.id) as User[];

              for (const member of members) {
                await this.sendPushNotification(
                  member.push_token!,
                  `${milestone}% Goal Reached! 🎉`,
                  `${pool.name} has reached ${milestone}% of its savings goal!`,
                  { 
                    type: 'milestone', 
                    poolId: pool.id, 
                    milestone, 
                    userId: member.id 
                  }
                );
              }

              // Record that we sent this milestone notification
              this.scheduleNotification(
                pool.owner_id,
                'milestone',
                `${milestone}% Goal Reached!`,
                `${pool.name} has reached ${milestone}% of its savings goal!`,
                { poolId: pool.id, milestone },
                new Date().toISOString()
              );
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending milestone notifications:', error);
    }
  }

  // Send peer boost notifications
  async sendPeerBoosts(): Promise<void> {
    try {
      const recentContributions = db.prepare(`
        SELECT c.*, u.name as contributor_name, p.name as pool_name
        FROM contributions c
        JOIN users u ON c.user_id = u.id
        JOIN pools p ON c.pool_id = p.id
        WHERE c.created_at >= datetime('now', '-1 hour')
      `).all() as any[];

      for (const contribution of recentContributions) {
        // Send boost notifications to other pool members
        const otherMembers = db.prepare(`
          SELECT u.id, u.name, u.push_token
          FROM users u
          JOIN memberships m ON u.id = m.user_id
          WHERE m.pool_id = ? 
            AND u.id != ? 
            AND u.push_token IS NOT NULL
        `).all(contribution.pool_id, contribution.user_id) as User[];

        for (const member of otherMembers) {
          await this.sendPushNotification(
            member.push_token!,
            'Friend Just Contributed! 💪',
            `${contribution.contributor_name} just added $${(contribution.amount_cents / 100).toFixed(2)} to ${contribution.pool_name}!`,
            { 
              type: 'peer_boost', 
              poolId: contribution.pool_id, 
              contributorId: contribution.user_id,
              userId: member.id 
            }
          );
        }
      }
    } catch (error) {
      console.error('Error sending peer boost notifications:', error);
    }
  }

  // Send daily motivational messages
  async sendDailyMotivation(): Promise<void> {
    const motivationalMessages = [
      "Every small step counts towards your big dreams! 🌟",
      "Your future self will thank you for saving today! 💫",
      "Consistency beats perfection. Keep going! 🚀",
      "You're building something amazing, one contribution at a time! 🏗️",
      "Small amounts, big dreams. You've got this! 💪",
      "Your savings journey is a marathon, not a sprint! 🏃‍♀️",
      "Every dollar saved is a step closer to your goals! 💰",
      "Believe in your dreams and fund them too! ✨"
    ];

    try {
      const activeUsers = db.prepare(`
        SELECT id, name, push_token 
        FROM users 
        WHERE push_token IS NOT NULL 
          AND last_active >= datetime('now', '-7 days')
      `).all() as User[];

      const todayMessage = motivationalMessages[new Date().getDay()];

      for (const user of activeUsers) {
        await this.sendPushNotification(
          user.push_token!,
          'Daily Motivation 💫',
          todayMessage,
          { type: 'daily_motivation', userId: user.id }
        );
      }
    } catch (error) {
      console.error('Error sending daily motivation:', error);
    }
  }

  // Schedule a notification for later
  scheduleNotification(
    userId: string,
    type: string,
    title: string,
    body: string,
    data: NotificationData = {},
    scheduledFor: string
  ): string {
    const notificationId = require('uuid').v4();
    
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, body, data, scheduled_for, sent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      notificationId,
      userId,
      type,
      title,
      body,
      JSON.stringify(data),
      scheduledFor,
      0
    );

    return notificationId;
  }

  // Process scheduled notifications
  async processScheduledNotifications(): Promise<void> {
    try {
      const now = new Date().toISOString();
      const pendingNotifications = db.prepare(`
        SELECT n.*, u.push_token
        FROM notifications n
        JOIN users u ON n.user_id = u.id
        WHERE n.sent = 0 
          AND n.scheduled_for <= ?
          AND u.push_token IS NOT NULL
      `).all(now) as (ScheduledNotification & { push_token: string })[];

      for (const notification of pendingNotifications) {
        const data = notification.data ? JSON.parse(notification.data) : {};
        
        const success = await this.sendPushNotification(
          notification.push_token,
          notification.title,
          notification.body,
          data
        );

        if (success) {
          db.prepare('UPDATE notifications SET sent = 1 WHERE id = ?')
            .run(notification.id);
        }
      }
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
    }
  }

  // Cancel scheduled notification
  cancelNotification(notificationId: string): void {
    db.prepare('DELETE FROM notifications WHERE id = ?').run(notificationId);
  }

  // Get user's notification preferences
  getUserNotificationPreferences(userId: string): any {
    const user = db.prepare('SELECT notification_preferences FROM users WHERE id = ?').get(userId) as any;
    
    if (user?.notification_preferences) {
      try {
        return JSON.parse(user.notification_preferences);
      } catch (e) {
        return {};
      }
    }
    
    return {
      payday_reminders: true,
      streak_warnings: true,
      milestone_notifications: true,
      peer_boosts: true,
      daily_motivation: true
    };
  }

  // Update user's notification preferences
  updateNotificationPreferences(userId: string, preferences: any): void {
    db.prepare('UPDATE users SET notification_preferences = ? WHERE id = ?')
      .run(JSON.stringify(preferences), userId);
  }
}

// Create singleton instance
const notificationManager = new NotificationManager();

// Export functions
export const sendPushNotification = notificationManager.sendPushNotification.bind(notificationManager);
export const sendPaydayReminders = notificationManager.sendPaydayReminders.bind(notificationManager);
export const sendStreakWarnings = notificationManager.sendStreakWarnings.bind(notificationManager);
export const sendMilestoneNotifications = notificationManager.sendMilestoneNotifications.bind(notificationManager);
export const sendPeerBoosts = notificationManager.sendPeerBoosts.bind(notificationManager);
export const sendDailyMotivation = notificationManager.sendDailyMotivation.bind(notificationManager);
export const scheduleNotification = notificationManager.scheduleNotification.bind(notificationManager);
export const processScheduledNotifications = notificationManager.processScheduledNotifications.bind(notificationManager);
export const cancelNotification = notificationManager.cancelNotification.bind(notificationManager);
export const getUserNotificationPreferences = notificationManager.getUserNotificationPreferences.bind(notificationManager);
export const updateNotificationPreferences = notificationManager.updateNotificationPreferences.bind(notificationManager);

export default notificationManager;
