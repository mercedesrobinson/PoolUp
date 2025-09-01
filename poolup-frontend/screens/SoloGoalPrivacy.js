import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  StyleSheet
} from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';

export default function SoloGoalPrivacy({ navigation, route }) {
  const { userId, poolId } = route.params;
  
  // Privacy Settings
  const [showGoalAmount, setShowGoalAmount] = useState(true);
  const [showCurrentAmount, setShowCurrentAmount] = useState(true);
  const [showGoalPurpose, setShowGoalPurpose] = useState(true);
  const [showProgressBar, setShowProgressBar] = useState(true);
  const [showInDiscover, setShowInDiscover] = useState(true);
  const [showInLeaderboard, setShowInLeaderboard] = useState(true);

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      const settings = await api.getSoloGoalPrivacySettings(userId, poolId);
      if (settings) {
        setShowGoalAmount(settings.show_goal_amount ?? true);
        setShowCurrentAmount(settings.show_current_amount ?? true);
        setShowGoalPurpose(settings.show_goal_purpose ?? true);
        setShowProgressBar(settings.show_progress_bar ?? true);
        setShowInDiscover(settings.show_in_discover ?? true);
        setShowInLeaderboard(settings.show_in_leaderboard ?? true);
      }
    } catch (error) {
      console.error('Load privacy settings error:', error);
    }
  };

  const savePrivacySettings = async () => {
    try {
      const settings = {
        show_goal_amount: showGoalAmount,
        show_current_amount: showCurrentAmount,
        show_goal_purpose: showGoalPurpose,
        show_progress_bar: showProgressBar,
        show_in_discover: showInDiscover,
        show_in_leaderboard: showInLeaderboard
      };

      await api.saveSoloGoalPrivacySettings(userId, poolId, settings);
      
      Alert.alert(
        'Settings Saved',
        'Your privacy preferences have been updated successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Save privacy settings error:', error);
      Alert.alert('Error', 'Failed to save privacy settings. Please try again.');
    }
  };

  const PrivacyToggle = ({ title, subtitle, value, onValueChange, icon }) => (
    <View style={styles.toggleContainer}>
      <View style={styles.toggleInfo}>
        <Text style={styles.toggleIcon}>{icon}</Text>
        <View style={styles.toggleText}>
          <Text style={styles.toggleTitle}>{title}</Text>
          <Text style={styles.toggleSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#767577', true: colors.primary }}
        thumbColor={value ? '#f5dd4b' : '#f4f3f4'}
      />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Settings</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.container}>
        {/* Visibility Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌍 Public Visibility</Text>
          <Text style={styles.sectionDescription}>
            Control whether your solo goal appears in public feeds
          </Text>
          
          <PrivacyToggle
            icon="🔍"
            title="Show in Discover Feed"
            subtitle="Let others find and encourage your goal"
            value={showInDiscover}
            onValueChange={setShowInDiscover}
          />
          
          <PrivacyToggle
            icon="🏆"
            title="Show in Streak Leaderboard"
            subtitle="Appear on the streak leaderboard rankings"
            value={showInLeaderboard}
            onValueChange={setShowInLeaderboard}
          />
        </View>

        {/* Goal Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Goal Information</Text>
          <Text style={styles.sectionDescription}>
            Choose what details others can see about your savings goal
          </Text>
          
          <PrivacyToggle
            icon="🎯"
            title="Show Goal Purpose"
            subtitle="Display what you're saving for (e.g., 'Vacation Fund')"
            value={showGoalPurpose}
            onValueChange={setShowGoalPurpose}
          />
          
          <PrivacyToggle
            icon="💵"
            title="Show Goal Amount"
            subtitle="Display your target savings amount"
            value={showGoalAmount}
            onValueChange={setShowGoalAmount}
          />
          
          <PrivacyToggle
            icon="📊"
            title="Show Current Amount"
            subtitle="Display how much you've saved so far"
            value={showCurrentAmount}
            onValueChange={setShowCurrentAmount}
          />
          
          <PrivacyToggle
            icon="📈"
            title="Show Progress Bar"
            subtitle="Display visual progress toward your goal"
            value={showProgressBar}
            onValueChange={setShowProgressBar}
          />
        </View>

        {/* Preview Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👁️ Preview</Text>
          <Text style={styles.sectionDescription}>
            How others will see your goal with current settings
          </Text>
          
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View style={styles.previewUserInfo}>
                <View style={styles.previewAvatar}>
                  <Text style={styles.previewAvatarText}>👤</Text>
                </View>
                <View>
                  <Text style={styles.previewUserName}>You</Text>
                  <Text style={styles.previewPoolName}>My Solo Goal</Text>
                </View>
              </View>
              <View style={styles.previewStreak}>
                <Text style={styles.previewStreakText}>🔥 12</Text>
              </View>
            </View>

            <View style={styles.previewGoalInfo}>
              <Text style={styles.previewDestination}>
                🎯 {showGoalPurpose ? 'Emergency Fund' : 'Private Goal'}
              </Text>
              {(showCurrentAmount || showGoalAmount) && (
                <Text style={styles.previewProgress}>
                  {showCurrentAmount ? '$350.00' : '•••••'} 
                  {showGoalAmount ? ' / $1,000.00' : ' / •••••'}
                </Text>
              )}
            </View>

            {showProgressBar && (
              <View style={styles.previewProgressBar}>
                <View style={[styles.previewProgressFill, { width: '35%' }]} />
              </View>
            )}

            <View style={styles.previewActions}>
              <TouchableOpacity style={styles.previewButton}>
                <Text style={styles.previewButtonText}>💪 Encourage</Text>
              </TouchableOpacity>
              <Text style={styles.previewContributions}>12 contributions</Text>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={savePrivacySettings}>
          <Text style={styles.saveButtonText}>Save Privacy Settings</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
  },
  backButton: {
    color: 'white',
    fontSize: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: radius,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  toggleText: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  toggleSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: radius,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  previewAvatarText: {
    fontSize: 20,
  },
  previewUserName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  previewPoolName: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  previewStreak: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  previewStreakText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 10,
  },
  previewGoalInfo: {
    marginBottom: 8,
  },
  previewDestination: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  previewProgress: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  previewProgressBar: {
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    marginBottom: 12,
  },
  previewProgressFill: {
    height: '100%',
    backgroundColor: '#34A853',
    borderRadius: 3,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  previewButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 10,
  },
  previewContributions: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
