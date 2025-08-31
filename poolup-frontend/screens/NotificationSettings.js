import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notificationService from '../services/notifications';
import api from '../services/api';

const NotificationSettings = ({ navigation, route }) => {
  const { user } = route.params || {};
  
  const [settings, setSettings] = useState({
    paydayReminders: true,
    streakWarnings: true,
    goalMilestones: true,
    peerBoosts: true,
    dailyMotivation: false,
    socialUpdates: true,
    marketingMessages: false,
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('notificationSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
      
      // Update backend preferences
      await api.updateNotificationPreferences(user?.id || 'guest', {
        payday_reminders: newSettings.paydayReminders,
        streak_warnings: newSettings.streakWarnings,
        goal_milestones: newSettings.goalMilestones,
        peer_boosts: newSettings.peerBoosts,
        daily_motivation: newSettings.dailyMotivation,
        social_updates: newSettings.socialUpdates,
        marketing_messages: newSettings.marketingMessages,
      });
      
      // Update notification schedules based on new settings
      if (newSettings.dailyMotivation) {
        await notificationService.scheduleDailyMotivation(user?.id || 'guest', true);
      } else {
        await notificationService.cancelNotificationsByType('daily_motivation');
      }
      
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      Alert.alert('Error', 'Failed to save notification settings');
    }
  };

  const toggleSetting = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  const requestPermissions = async () => {
    try {
      const token = await notificationService.initialize();
      if (token) {
        Alert.alert(
          'Notifications Enabled!',
          'You\'ll now receive helpful reminders and updates from PoolUp.',
          [{ text: 'Great!', style: 'default' }]
        );
      } else {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive reminders.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {/* Open device settings */} }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to enable notifications');
    }
  };

  const testNotification = async () => {
    try {
      const pushToken = await notificationService.initialize();
      if (pushToken) {
        await api.sendTestNotification(user?.id || 'guest', pushToken);
        Alert.alert('Test Sent!', 'Check your notifications to see how PoolUp reminders look.');
      } else {
        Alert.alert('Permission Required', 'Please enable notifications first to send a test.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notification Settings</Text>
        <Text style={styles.subtitle}>
          Customize when and how PoolUp sends you reminders
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Savings Reminders</Text>
        
        <SettingRow
          icon="📅"
          title="Payday Reminders"
          subtitle="Get notified before your payday to contribute"
          value={settings.paydayReminders}
          onToggle={() => toggleSetting('paydayReminders')}
        />
        
        <SettingRow
          icon="🔥"
          title="Streak Warnings"
          subtitle="Don't break your contribution streak"
          value={settings.streakWarnings}
          onToggle={() => toggleSetting('streakWarnings')}
        />
        
        <SettingRow
          icon="🎯"
          title="Goal Milestones"
          subtitle="Celebrate when you hit savings milestones"
          value={settings.goalMilestones}
          onToggle={() => toggleSetting('goalMilestones')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👥 Social Updates</Text>
        
        <SettingRow
          icon="💪"
          title="Peer Boosts"
          subtitle="When friends boost your savings"
          value={settings.peerBoosts}
          onToggle={() => toggleSetting('peerBoosts')}
        />
        
        <SettingRow
          icon="📈"
          title="Group Activity"
          subtitle="Updates from your savings groups"
          value={settings.socialUpdates}
          onToggle={() => toggleSetting('socialUpdates')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✨ Motivation & Tips</Text>
        
        <SettingRow
          icon="🌟"
          title="Daily Motivation"
          subtitle="Inspiring messages to keep you saving"
          value={settings.dailyMotivation}
          onToggle={() => toggleSetting('dailyMotivation')}
        />
        
        <SettingRow
          icon="📢"
          title="PoolUp Updates"
          subtitle="New features and promotional offers"
          value={settings.marketingMessages}
          onToggle={() => toggleSetting('marketingMessages')}
        />
      </View>

      <View style={styles.actionSection}>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermissions}>
          <Text style={styles.primaryButtonText}>Enable All Notifications</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={testNotification}>
          <Text style={styles.secondaryButtonText}>Send Test Notification</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.dangerButton} 
          onPress={() => notificationService.cancelAllNotifications()}
        >
          <Text style={styles.dangerButtonText}>Turn Off All Notifications</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>💡 Smart Timing</Text>
        <Text style={styles.infoText}>
          PoolUp sends notifications at optimal times based on your payday schedule and activity patterns. 
          We respect your time and only send helpful, actionable reminders.
        </Text>
      </View>
    </ScrollView>
  );
};

const SettingRow = ({ icon, title, subtitle, value, onToggle }) => (
  <View style={styles.settingRow}>
    <View style={styles.settingInfo}>
      <Text style={styles.settingIcon}>{icon}</Text>
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: '#E5E5E5', true: '#4CAF50' }}
      thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 22,
  },
  section: {
    backgroundColor: 'white',
    marginTop: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 18,
  },
  actionSection: {
    backgroundColor: 'white',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 25,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#FF5252',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: 'white',
    marginTop: 20,
    marginBottom: 40,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 100,
  },
});

export default NotificationSettings;
