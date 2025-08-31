import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, Alert } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';

export default function PrivacySettings({ navigation, route }) {
  const [isPublicProgress, setIsPublicProgress] = useState(true);
  const [allowEncouragement, setAllowEncouragement] = useState(true);
  const [showInFeed, setShowInFeed] = useState(true);
  const [shareAchievements, setShareAchievements] = useState(true);
  const [allowInvites, setAllowInvites] = useState(true);
  const userId = route.params?.userId || '1756612920173';

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      const settings = await api.getUserPrivacySettings(userId);
      setIsPublicProgress(settings.isPublicProgress);
      setAllowEncouragement(settings.allowEncouragement);
      setShowInFeed(settings.showInFeed);
      setShareAchievements(settings.shareAchievements);
      setAllowInvites(settings.allowInvites);
    } catch (error) {
      console.log('Using default privacy settings');
    }
  };

  const updateSetting = async (setting, value) => {
    try {
      await api.updatePrivacySetting(userId, setting, value);
    } catch (error) {
      console.error('Failed to update privacy setting:', error);
      Alert.alert('Error', 'Failed to update privacy setting');
    }
  };

  const SettingRow = ({ title, description, value, onValueChange, icon }) => (
    <View style={{
      backgroundColor: 'white',
      padding: 20,
      marginBottom: 12,
      borderRadius: radius,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 24, marginRight: 16 }}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 4
          }}>
            {title}
          </Text>
          <Text style={{
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 20
          }}>
            {description}
          </Text>
        </View>
        <Switch
          value={value}
          onValueChange={(newValue) => {
            onValueChange(newValue);
            updateSetting(title.toLowerCase().replace(/\s+/g, '_'), newValue);
          }}
          trackColor={{ false: colors.border, true: colors.primaryLight }}
          thumbColor={value ? colors.primary : colors.textSecondary}
        />
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ 
        backgroundColor: 'white', 
        paddingHorizontal: 20, 
        paddingTop: 60, 
        paddingBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={{ marginRight: 16, padding: 8 }}
          >
            <Text style={{ fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <Text style={{ 
            fontSize: 28, 
            fontWeight: '700', 
            color: colors.text,
            flex: 1
          }}>
            Privacy Settings
          </Text>
        </View>
        <Text style={{ 
          fontSize: 16, 
          color: colors.textSecondary,
          marginBottom: 8
        }}>
          Control who can see your savings progress
        </Text>
      </View>

      <View style={{ padding: 20 }}>
        <SettingRow
          icon="👁️"
          title="Public Progress"
          description="Allow friends to see your savings progress and contributions in their feed"
          value={isPublicProgress}
          onValueChange={setIsPublicProgress}
        />

        <SettingRow
          icon="💬"
          title="Allow Encouragement"
          description="Let friends send you encouragement messages and celebrate your milestones"
          value={allowEncouragement}
          onValueChange={setAllowEncouragement}
        />

        <SettingRow
          icon="📱"
          title="Show in Activity Feed"
          description="Display your contributions and achievements in the community activity feed"
          value={showInFeed}
          onValueChange={setShowInFeed}
        />

        <SettingRow
          icon="🏆"
          title="Share Achievements"
          description="Automatically share badges, streaks, and milestones with friends"
          value={shareAchievements}
          onValueChange={setShareAchievements}
        />

        <SettingRow
          icon="📧"
          title="Allow Pool Invites"
          description="Let friends invite you to join their savings pools"
          value={allowInvites}
          onValueChange={setAllowInvites}
        />

        {/* Privacy Level Summary */}
        <View style={{
          backgroundColor: isPublicProgress ? colors.primaryLight : '#fff3e0',
          padding: 20,
          borderRadius: radius,
          marginTop: 20,
          borderLeftWidth: 4,
          borderLeftColor: isPublicProgress ? colors.primary : '#ff9800'
        }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 8
          }}>
            {isPublicProgress ? '🌟 Social Saver' : '🔒 Private Saver'}
          </Text>
          <Text style={{
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 20
          }}>
            {isPublicProgress 
              ? 'Your progress is visible to friends, helping build accountability and motivation through social support.'
              : 'Your savings are private. You can still participate in groups, but your individual progress stays hidden.'
            }
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={{ marginTop: 20 }}>
          <TouchableOpacity
            onPress={() => {
              setIsPublicProgress(true);
              setAllowEncouragement(true);
              setShowInFeed(true);
              setShareAchievements(true);
              setAllowInvites(true);
              Alert.alert('Settings Updated', 'All social features enabled');
            }}
            style={{
              backgroundColor: colors.primary,
              padding: 16,
              borderRadius: radius,
              marginBottom: 12,
              alignItems: 'center'
            }}
          >
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: 'white'
            }}>
              🌟 Enable All Social Features
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setIsPublicProgress(false);
              setAllowEncouragement(false);
              setShowInFeed(false);
              setShareAchievements(false);
              Alert.alert('Settings Updated', 'Privacy mode enabled');
            }}
            style={{
              backgroundColor: colors.background,
              padding: 16,
              borderRadius: radius,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center'
            }}
          >
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.textSecondary
            }}>
              🔒 Go Private
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
