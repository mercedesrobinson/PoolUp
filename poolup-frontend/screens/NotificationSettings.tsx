import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, SafeAreaView } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';

type NotificationSettingsNavigationProp = StackNavigationProp<RootStackParamList, 'NotificationSettings'>;
type NotificationSettingsRouteProp = RouteProp<RootStackParamList, 'NotificationSettings'>;

interface Props {
  navigation: NotificationSettingsNavigationProp;
  route: NotificationSettingsRouteProp;
}

interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  contributionReminders: boolean;
  milestoneAlerts: boolean;
  encouragementMessages: boolean;
  weeklyProgress: boolean;
  goalDeadlines: boolean;
  groupActivity: boolean;
  streakReminders: boolean;
  marketingEmails: boolean;
}

export default function NotificationSettings({ navigation, route }: Props): React.JSX.Element {
  const [settings, setSettings] = useState<NotificationSettings>({
    pushNotifications: true,
    emailNotifications: true,
    contributionReminders: true,
    milestoneAlerts: true,
    encouragementMessages: true,
    weeklyProgress: true,
    goalDeadlines: true,
    groupActivity: true,
    streakReminders: true,
    marketingEmails: false,
  });
  const [loading, setLoading] = useState<boolean>(false);

  const userId = (route.params as any)?.userId || '1756612920173';

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async (): Promise<void> => {
    try {
      const userSettings = await api.getNotificationSettings(userId);
      setSettings(userSettings);
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  const updateSetting = async (key: keyof NotificationSettings, value: boolean): Promise<void> => {
    setLoading(true);
    try {
      const updatedSettings = { ...settings, [key]: value };
      await api.updateNotificationSettings(updatedSettings);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to update notification setting:', error);
      Alert.alert('Error', 'Failed to update notification setting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const SettingRow = ({ 
    title, 
    description, 
    value, 
    onToggle, 
    icon,
    disabled = false
  }: { 
    title: string; 
    description: string; 
    value: boolean; 
    onToggle: (value: boolean) => void; 
    icon: string;
    disabled?: boolean;
  }) => (
    <View style={{
      backgroundColor: 'white',
      padding: 16,
      marginBottom: 12,
      borderRadius: radius.medium,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      opacity: disabled ? 0.6 : 1,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 24, marginRight: 12 }}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>
            {title}
          </Text>
        </View>
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: '#e9ecef', true: colors.primary }}
          thumbColor={value ? 'white' : '#f4f3f4'}
          disabled={loading || disabled}
        />
      </View>
      <Text style={{ fontSize: 14, color: '#666', lineHeight: 20, marginLeft: 36 }}>
        {description}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 8, marginRight: 12 }}
        >
          <Text style={{ fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={{
          fontSize: 20,
          fontWeight: '700',
          color: '#333',
          flex: 1,
        }}>
          Notification Settings
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
      >
        <View style={{
          backgroundColor: 'white',
          padding: 16,
          marginBottom: 24,
          borderRadius: radius.medium,
          alignItems: 'center',
        }}>
          <Text style={{ fontSize: 32, marginBottom: 12 }}>🔔</Text>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#333',
            marginBottom: 8,
            textAlign: 'center',
          }}>
            Stay Informed
          </Text>
          <Text style={{
            fontSize: 15,
            color: '#666',
            textAlign: 'center',
            lineHeight: 22,
          }}>
            Choose which notifications help you stay on track with your savings goals.
          </Text>
        </View>

        <Text style={{ fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 16 }}>
          General Notifications
        </Text>

        <SettingRow
          title="Push Notifications"
          description="Receive notifications on your device"
          value={settings.pushNotifications}
          onToggle={(value) => updateSetting('pushNotifications', value)}
          icon="📱"
        />

        <SettingRow
          title="Email Notifications"
          description="Receive important updates via email"
          value={settings.emailNotifications}
          onToggle={(value) => updateSetting('emailNotifications', value)}
          icon="📧"
        />

        <Text style={{ fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 16, marginTop: 24 }}>
          Savings & Goals
        </Text>

        <SettingRow
          title="Contribution Reminders"
          description="Get reminded when it's time to contribute to your goals"
          value={settings.contributionReminders}
          onToggle={(value) => updateSetting('contributionReminders', value)}
          icon="💰"
          disabled={!settings.pushNotifications}
        />

        <SettingRow
          title="Milestone Alerts"
          description="Celebrate when you reach savings milestones"
          value={settings.milestoneAlerts}
          onToggle={(value) => updateSetting('milestoneAlerts', value)}
          icon="🎯"
          disabled={!settings.pushNotifications}
        />

        <SettingRow
          title="Goal Deadlines"
          description="Get notified as your goal deadlines approach"
          value={settings.goalDeadlines}
          onToggle={(value) => updateSetting('goalDeadlines', value)}
          icon="⏰"
          disabled={!settings.pushNotifications}
        />

        <SettingRow
          title="Streak Reminders"
          description="Stay motivated with savings streak notifications"
          value={settings.streakReminders}
          onToggle={(value) => updateSetting('streakReminders', value)}
          icon="🔥"
          disabled={!settings.pushNotifications}
        />

        <Text style={{ fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 16, marginTop: 24 }}>
          Social & Community
        </Text>

        <SettingRow
          title="Encouragement Messages"
          description="Receive motivational messages from friends and community"
          value={settings.encouragementMessages}
          onToggle={(value) => updateSetting('encouragementMessages', value)}
          icon="💪"
          disabled={!settings.pushNotifications}
        />

        <SettingRow
          title="Group Activity"
          description="Get updates about your savings group activities"
          value={settings.groupActivity}
          onToggle={(value) => updateSetting('groupActivity', value)}
          icon="👥"
          disabled={!settings.pushNotifications}
        />

        <Text style={{ fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 16, marginTop: 24 }}>
          Reports & Updates
        </Text>

        <SettingRow
          title="Weekly Progress"
          description="Receive weekly summaries of your savings progress"
          value={settings.weeklyProgress}
          onToggle={(value) => updateSetting('weeklyProgress', value)}
          icon="📊"
          disabled={!settings.emailNotifications}
        />

        <SettingRow
          title="Marketing Emails"
          description="Receive tips, features, and promotional content"
          value={settings.marketingEmails}
          onToggle={(value) => updateSetting('marketingEmails', value)}
          icon="📬"
          disabled={!settings.emailNotifications}
        />

        <View style={{
          backgroundColor: '#d1ecf1',
          padding: 16,
          borderRadius: radius.medium,
          marginTop: 24,
          borderLeftWidth: 4,
          borderLeftColor: '#17a2b8',
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#0c5460', marginBottom: 8 }}>
            💡 Stay Motivated
          </Text>
          <Text style={{ fontSize: 14, color: '#0c5460', lineHeight: 20 }}>
            Notifications help you stay consistent with your savings goals. You can always adjust these settings later!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
