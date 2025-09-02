import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, SafeAreaView } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';

type PrivacySettingsNavigationProp = StackNavigationProp<RootStackParamList, 'PrivacySettings'>;
type PrivacySettingsRouteProp = RouteProp<RootStackParamList, 'PrivacySettings'>;

interface Props {
  navigation: PrivacySettingsNavigationProp;
  route: PrivacySettingsRouteProp;
}

interface PrivacySettings {
  profileVisible: boolean;
  showSavingsGoals: boolean;
  showProgress: boolean;
  showStreaks: boolean;
  allowFriendRequests: boolean;
  showInLeaderboards: boolean;
  shareAchievements: boolean;
  allowGroupInvites: boolean;
}

export default function PrivacySettings({ navigation, route }: Props): React.JSX.Element {
  const [settings, setSettings] = useState<PrivacySettings>({
    profileVisible: true,
    showSavingsGoals: true,
    showProgress: false,
    showStreaks: true,
    allowFriendRequests: true,
    showInLeaderboards: true,
    shareAchievements: true,
    allowGroupInvites: true,
  });
  const [loading, setLoading] = useState<boolean>(false);

  const userId = (route.params as any)?.userId || '1756612920173';

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async (): Promise<void> => {
    try {
      const userSettings = await api.getUserPrivacySettings(userId);
      setSettings(userSettings);
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
    }
  };

  const updateSetting = async (key: keyof PrivacySettings, value: boolean): Promise<void> => {
    setLoading(true);
    try {
      const updatedSettings = { ...settings, [key]: value };
      await api.updatePrivacySetting(userId, key, value);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to update privacy setting:', error);
      Alert.alert('Error', 'Failed to update privacy setting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const SettingRow = ({ 
    title, 
    description, 
    value, 
    onToggle, 
    icon 
  }: { 
    title: string; 
    description: string; 
    value: boolean; 
    onToggle: (value: boolean) => void; 
    icon: string; 
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
          disabled={loading}
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
          Privacy Settings
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
          <Text style={{ fontSize: 32, marginBottom: 12 }}>🔒</Text>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#333',
            marginBottom: 8,
            textAlign: 'center',
          }}>
            Control Your Privacy
          </Text>
          <Text style={{
            fontSize: 15,
            color: '#666',
            textAlign: 'center',
            lineHeight: 22,
          }}>
            Choose what information you want to share with other PoolUp users.
          </Text>
        </View>

        <SettingRow
          title="Profile Visibility"
          description="Allow other users to find and view your profile"
          value={settings.profileVisible}
          onToggle={(value) => updateSetting('profileVisible', value)}
          icon="👤"
        />

        <SettingRow
          title="Show Savings Goals"
          description="Display your savings goals on your public profile"
          value={settings.showSavingsGoals}
          onToggle={(value) => updateSetting('showSavingsGoals', value)}
          icon="🎯"
        />

        <SettingRow
          title="Show Progress"
          description="Share your savings progress with friends and groups"
          value={settings.showProgress}
          onToggle={(value) => updateSetting('showProgress', value)}
          icon="📈"
        />

        <SettingRow
          title="Show Streaks"
          description="Display your savings streaks publicly"
          value={settings.showStreaks}
          onToggle={(value) => updateSetting('showStreaks', value)}
          icon="🔥"
        />

        <SettingRow
          title="Allow Friend Requests"
          description="Let other users send you friend requests"
          value={settings.allowFriendRequests}
          onToggle={(value) => updateSetting('allowFriendRequests', value)}
          icon="👥"
        />

        <SettingRow
          title="Show in Leaderboards"
          description="Include your achievements in public leaderboards"
          value={settings.showInLeaderboards}
          onToggle={(value) => updateSetting('showInLeaderboards', value)}
          icon="🏆"
        />

        <SettingRow
          title="Share Achievements"
          description="Automatically share badges and milestones with friends"
          value={settings.shareAchievements}
          onToggle={(value) => updateSetting('shareAchievements', value)}
          icon="🏅"
        />

        <SettingRow
          title="Allow Group Invites"
          description="Let friends invite you to join their savings groups"
          value={settings.allowGroupInvites}
          onToggle={(value) => updateSetting('allowGroupInvites', value)}
          icon="👫"
        />

        <View style={{
          backgroundColor: '#fff3cd',
          padding: 16,
          borderRadius: radius.medium,
          marginTop: 24,
          borderLeftWidth: 4,
          borderLeftColor: '#ffc107',
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#856404', marginBottom: 8 }}>
            💡 Privacy Tip
          </Text>
          <Text style={{ fontSize: 14, color: '#856404', lineHeight: 20 }}>
            You can always change these settings later. More privacy options help you stay motivated while keeping your information secure.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
