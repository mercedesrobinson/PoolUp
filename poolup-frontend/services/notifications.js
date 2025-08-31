import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  async initialize() {
    try {
      // Register for push notifications
      this.expoPushToken = await this.registerForPushNotificationsAsync();
      
      // Set up notification listeners
      this.setupNotificationListeners();
      
      // Schedule default reminders if enabled
      await this.scheduleDefaultReminders();
      
      return this.expoPushToken;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return null;
    }
  }

  async registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }
      
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Push token:', token);
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }

  setupNotificationListeners() {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      this.handleNotificationResponse(response);
    });
  }

  handleNotificationResponse(response) {
    const { data } = response.notification.request.content;
    
    // Handle different notification types
    switch (data?.type) {
      case 'payday_reminder':
        // Navigate to contribution screen
        break;
      case 'streak_warning':
        // Navigate to payday settings
        break;
      case 'goal_milestone':
        // Navigate to pool detail
        break;
      case 'peer_boost':
        // Navigate to social feed
        break;
      default:
        // Navigate to main screen
        break;
    }
  }

  // Schedule payday reminders based on user settings
  async schedulePaydayReminders(userId, paydaySettings) {
    try {
      // Cancel existing payday reminders
      await this.cancelNotificationsByType('payday_reminder');
      
      if (!paydaySettings.reminders_enabled) {
        return;
      }

      const { frequency, reminder_days_before } = paydaySettings;
      const now = new Date();
      
      // Calculate next 4 paydays and schedule reminders
      for (let i = 0; i < 4; i++) {
        const nextPayday = this.calculateNextPayday(paydaySettings, i);
        const reminderDate = new Date(nextPayday);
        reminderDate.setDate(reminderDate.getDate() - reminder_days_before);
        
        if (reminderDate > now) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "💰 Payday Reminder",
              body: `Your payday is in ${reminder_days_before} day${reminder_days_before > 1 ? 's' : ''}! Time to contribute to your savings goals.`,
              data: { 
                type: 'payday_reminder',
                userId,
                payday: nextPayday.toISOString()
              },
            },
            trigger: { date: reminderDate },
          });
        }
      }
      
      console.log('Payday reminders scheduled successfully');
    } catch (error) {
      console.error('Failed to schedule payday reminders:', error);
    }
  }

  // Schedule streak warning notifications
  async scheduleStreakWarning(userId, streakData) {
    try {
      if (streakData.current_streak === 0) return;
      
      const warningDate = new Date();
      warningDate.setDate(warningDate.getDate() + 1); // Tomorrow
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🔥 Streak Alert!",
          body: `Don't break your ${streakData.current_streak}-contribution streak! Your contribution window closes soon.`,
          data: { 
            type: 'streak_warning',
            userId,
            streak: streakData.current_streak
          },
        },
        trigger: { date: warningDate },
      });
    } catch (error) {
      console.error('Failed to schedule streak warning:', error);
    }
  }

  // Schedule goal milestone notifications
  async scheduleGoalMilestone(poolId, milestone) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🎉 Milestone Reached!",
          body: `Congratulations! You've reached ${milestone}% of your savings goal!`,
          data: { 
            type: 'goal_milestone',
            poolId,
            milestone
          },
        },
        trigger: null, // Immediate notification
      });
    } catch (error) {
      console.error('Failed to schedule milestone notification:', error);
    }
  }

  // Schedule peer boost notifications
  async schedulePeerBoost(fromUser, toUser, amount) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "💪 Peer Boost Received!",
          body: `${fromUser.name} boosted your savings with $${(amount / 100).toFixed(2)}!`,
          data: { 
            type: 'peer_boost',
            fromUserId: fromUser.id,
            toUserId: toUser.id,
            amount
          },
        },
        trigger: null, // Immediate notification
      });
    } catch (error) {
      console.error('Failed to schedule peer boost notification:', error);
    }
  }

  // Schedule daily motivation notifications
  async scheduleDailyMotivation(userId, enabled = true) {
    try {
      await this.cancelNotificationsByType('daily_motivation');
      
      if (!enabled) return;
      
      const motivationalMessages = [
        "💪 Every dollar saved is a step closer to your dreams!",
        "🎯 Small contributions today, big rewards tomorrow!",
        "🌟 Your future self will thank you for saving today!",
        "💰 Consistency beats perfection in savings!",
        "🚀 You're building something amazing, one contribution at a time!",
      ];
      
      // Schedule for next 7 days at 9 AM
      for (let i = 1; i <= 7; i++) {
        const notificationDate = new Date();
        notificationDate.setDate(notificationDate.getDate() + i);
        notificationDate.setHours(9, 0, 0, 0);
        
        const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "PoolUp Motivation",
            body: randomMessage,
            data: { 
              type: 'daily_motivation',
              userId
            },
          },
          trigger: { date: notificationDate },
        });
      }
    } catch (error) {
      console.error('Failed to schedule daily motivation:', error);
    }
  }

  // Utility functions
  calculateNextPayday(paydaySettings, offset = 0) {
    const { frequency, weekly_day, monthly_dates } = paydaySettings;
    const now = new Date();
    
    switch (frequency) {
      case 'weekly':
        const daysUntilPayday = (weekly_day - now.getDay() + 7) % 7;
        const nextWeeklyPayday = new Date(now);
        nextWeeklyPayday.setDate(now.getDate() + daysUntilPayday + (offset * 7));
        return nextWeeklyPayday;
        
      case 'biweekly':
        // Simplified biweekly calculation
        const daysUntilBiweekly = (weekly_day - now.getDay() + 7) % 7;
        const nextBiweeklyPayday = new Date(now);
        nextBiweeklyPayday.setDate(now.getDate() + daysUntilBiweekly + (offset * 14));
        return nextBiweeklyPayday;
        
      case 'monthly':
        const targetDate = monthly_dates[0] || 1;
        const nextMonthlyPayday = new Date(now.getFullYear(), now.getMonth() + offset, targetDate);
        if (nextMonthlyPayday <= now && offset === 0) {
          nextMonthlyPayday.setMonth(nextMonthlyPayday.getMonth() + 1);
        }
        return nextMonthlyPayday;
        
      default:
        return new Date();
    }
  }

  async cancelNotificationsByType(type) {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const notificationsToCancel = scheduledNotifications.filter(
        notification => notification.content.data?.type === type
      );
      
      for (const notification of notificationsToCancel) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    } catch (error) {
      console.error(`Failed to cancel ${type} notifications:`, error);
    }
  }

  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  async scheduleDefaultReminders() {
    try {
      const settings = await AsyncStorage.getItem('notificationSettings');
      if (settings) {
        const { dailyMotivation } = JSON.parse(settings);
        if (dailyMotivation) {
          await this.scheduleDailyMotivation('guest', true);
        }
      }
    } catch (error) {
      console.error('Failed to schedule default reminders:', error);
    }
  }

  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

export default new NotificationService();
