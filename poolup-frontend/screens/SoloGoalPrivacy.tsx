import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, SafeAreaView } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';

type SoloGoalPrivacyNavigationProp = StackNavigationProp<RootStackParamList, 'SoloGoalPrivacy'>;
type SoloGoalPrivacyRouteProp = RouteProp<RootStackParamList, 'SoloGoalPrivacy'>;

interface Props {
  navigation: SoloGoalPrivacyNavigationProp;
  route: SoloGoalPrivacyRouteProp;
}

interface SoloGoalPrivacySettings {
  isPublic: boolean;
  showProgress: boolean;
  allowEncouragement: boolean;
  showInLeaderboard: boolean;
  shareAchievements: boolean;
  showStreaks: boolean;
  shareProgress?: boolean;
  shareMilestones?: boolean;
  shareGoalCompletion?: boolean;
}

export default function SoloGoalPrivacy({ navigation, route }: Props): React.JSX.Element {
  const [settings, setSettings] = useState<SoloGoalPrivacySettings>({
    isPublic: true,
    showProgress: true,
    allowEncouragement: true,
    showInLeaderboard: true,
    shareAchievements: true,
    showStreaks: true,
  });
  const [loading, setLoading] = useState<boolean>(false);

  const goalId = (route.params as any)?.goalId;
  const userId = (route.params as any)?.userId || '1756612920173';

  useEffect(() => {
    if (goalId) {
      loadPrivacySettings();
    }
  }, []);

  const loadPrivacySettings = async (): Promise<void> => {
    try {
      const goalSettings = await api.getSoloGoalPrivacySettings(goalId!);
      setSettings({
        isPublic: true,
        showProgress: true,
        allowEncouragement: true,
        showInLeaderboard: true,
        shareAchievements: true,
        showStreaks: true,
        ...goalSettings
      });
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
    }
  };

  const updateSetting = async (key: keyof SoloGoalPrivacySettings, value: boolean): Promise<void> => {
    setLoading(true);
    try {
      const updatedSettings = { ...settings, [key]: value };
      if (goalId) {
        await api.updateSoloGoalPrivacySettings(goalId, updatedSettings);
      }
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
          Solo Goal Privacy
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
          <Text style={{ fontSize: 32, marginBottom: 12 }}>🎯</Text>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#333',
            marginBottom: 8,
            textAlign: 'center',
          }}>
            Control Your Solo Goal Visibility
          </Text>
          <Text style={{
            fontSize: 15,
            color: '#666',
            textAlign: 'center',
            lineHeight: 22,
          }}>
            Choose how much of your solo savings journey you want to share with the PoolUp community.
          </Text>
        </View>

        <SettingRow
          title="Make Goal Public"
          description="Allow other users to discover and view your solo savings goal"
          value={settings.isPublic}
          onToggle={(value) => updateSetting('isPublic', value)}
          icon="🌍"
        />

        <SettingRow
          title="Show Progress"
          description="Display your savings progress and milestones publicly"
          value={settings.showProgress}
          onToggle={(value) => updateSetting('showProgress', value)}
          icon="📈"
          disabled={!settings.isPublic}
        />

        <SettingRow
          title="Allow Encouragement"
          description="Let other users send you motivational messages and support"
          value={settings.allowEncouragement}
          onToggle={(value) => updateSetting('allowEncouragement', value)}
          icon="💪"
          disabled={!settings.isPublic}
        />

        <SettingRow
          title="Show in Leaderboard"
          description="Include your solo goal achievements in public leaderboards"
          value={settings.showInLeaderboard}
          onToggle={(value) => updateSetting('showInLeaderboard', value)}
          icon="🏆"
          disabled={!settings.isPublic}
        />

        <SettingRow
          title="Share Achievements"
          description="Automatically share badges and milestones when you reach them"
          value={settings.shareAchievements}
          onToggle={(value) => updateSetting('shareAchievements', value)}
          icon="🏅"
          disabled={!settings.isPublic}
        />

        <SettingRow
          title="Show Streaks"
          description="Display your savings streaks and consistency publicly"
          value={settings.showStreaks}
          onToggle={(value) => updateSetting('showStreaks', value)}
          icon="🔥"
          disabled={!settings.isPublic}
        />

        <View style={{
          backgroundColor: settings.isPublic ? '#d4edda' : '#fff3cd',
          padding: 16,
          borderRadius: radius.medium,
          marginTop: 24,
          borderLeftWidth: 4,
          borderLeftColor: settings.isPublic ? '#28a745' : '#ffc107',
        }}>
          <Text style={{ 
            fontSize: 16, 
            fontWeight: '600', 
            color: settings.isPublic ? '#155724' : '#856404', 
            marginBottom: 8 
          }}>
            {settings.isPublic ? '🌟 Public Goal Benefits' : '🔒 Private Goal'}
          </Text>
          <Text style={{ 
            fontSize: 14, 
            color: settings.isPublic ? '#155724' : '#856404', 
            lineHeight: 20 
          }}>
            {settings.isPublic 
              ? 'Public goals receive more encouragement and accountability, helping you stay motivated and reach your targets faster!'
              : 'Your goal is private. Only you can see your progress and achievements. You can make it public anytime to get community support.'
            }
          </Text>
        </View>

        {!settings.isPublic && (
          <TouchableOpacity
            onPress={() => updateSetting('isPublic', true)}
            style={{
              backgroundColor: colors.primary,
              padding: 16,
              borderRadius: radius.medium,
              alignItems: 'center',
              marginTop: 16,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
              Make Goal Public
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
