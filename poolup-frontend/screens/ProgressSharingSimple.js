import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Share } from 'react-native';
import { colors, radius, shadow } from '../theme';

const ProgressSharingSimple = ({ navigation }) => {
  const [selectedCard, setSelectedCard] = useState(0);

  // Mock user data
  const userData = {
    name: 'Alex',
    totalSaved: 2450,
    currentStreak: 12,
    goalsCompleted: 3,
    groupName: 'Beach Vacation Squad',
    groupProgress: 78,
    nextMilestone: 3000
  };

  const shareCards = [
    {
      id: 1,
      type: 'milestone',
      title: '🎉 Milestone Reached!',
      message: `Just hit $${userData.totalSaved} saved! ${userData.nextMilestone - userData.totalSaved} more to go!`,
      color: colors.green,
      emoji: '💰'
    },
    {
      id: 2,
      type: 'streak',
      title: '🔥 Streak Power!',
      message: `${userData.currentStreak} days strong! Consistency is key to building wealth.`,
      color: '#F97316',
      emoji: '🔥'
    },
    {
      id: 3,
      type: 'group',
      title: '👥 Team Progress',
      message: `${userData.groupName} is ${userData.groupProgress}% to our goal! We're crushing it together!`,
      color: colors.blue,
      emoji: '🚀'
    },
    {
      id: 4,
      type: 'solo',
      title: '🎯 Solo Journey',
      message: `Flying solo and crushing goals! $${userData.totalSaved} saved through pure determination and discipline.`,
      color: colors.purple,
      emoji: '⭐'
    },
    {
      id: 5,
      type: 'motivation',
      title: '💪 Stay Strong',
      message: `Every dollar saved is a step closer to financial freedom. You've got this!`,
      color: '#6B46C1',
      emoji: '💎'
    },
    {
      id: 6,
      type: 'custom',
      title: '💡 Create Your Own',
      message: 'Design a custom progress card with your personal savings story',
      color: colors.primary,
      emoji: '✨',
      isCustomizable: true
    }
  ];

  const handleShare = async (card) => {
    const shareMessage = `${card.title}\n\n${card.message}\n\nJoin me on PoolUp - Save money together! 💰`;
    
    try {
      await Share.share({
        message: shareMessage,
        title: 'PoolUp Progress Update'
      });
    } catch (error) {
      Alert.alert('Share failed', 'Unable to share at this time');
    }
  };

  const copyToClipboard = (card) => {
    const message = `${card.title}\n\n${card.message}\n\nJoin me on PoolUp - Save money together! 💰`;
    Alert.alert('Copied!', 'Progress update copied to clipboard');
  };

  const renderShareCard = (card, index) => {
    const isSelected = selectedCard === index;
    
    return (
      <TouchableOpacity
        key={card.id}
        style={[
          styles.shareCard,
          { backgroundColor: card.color },
          isSelected && styles.selectedCard
        ]}
        onPress={() => setSelectedCard(index)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardEmoji}>{card.emoji}</Text>
          <Text style={styles.cardTitle}>{card.title}</Text>
        </View>
        
        {card.isCustomizable ? (
          <View style={styles.customCardContent}>
            <Text style={styles.customCardText}>
              Tap to customize your message, add photos, and create a unique progress story to share with friends and family.
            </Text>
            <View style={styles.customOptions}>
              <View style={styles.customOption}>
                <Text style={styles.optionEmoji}>📸</Text>
                <Text style={styles.customOptionText}>Add Photo</Text>
              </View>
              <View style={styles.customOption}>
                <Text style={styles.optionEmoji}>✏️</Text>
                <Text style={styles.customOptionText}>Custom Text</Text>
              </View>
              <View style={styles.customOption}>
                <Text style={styles.optionEmoji}>🎨</Text>
                <Text style={styles.customOptionText}>Choose Theme</Text>
              </View>
            </View>
          </View>
        ) : (
          <Text style={styles.cardMessage}>{card.message}</Text>
        )}
        
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleShare(card)}
          >
            <Text style={styles.actionText}>📱 Share</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => copyToClipboard(card)}
          >
            <Text style={styles.actionText}>📋 Copy</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Progress</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Summary */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Your Progress Summary</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>${userData.totalSaved}</Text>
              <Text style={styles.statLabel}>Total Saved</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userData.currentStreak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userData.goalsCompleted}</Text>
              <Text style={styles.statLabel}>Goals Hit</Text>
            </View>
          </View>
        </View>

        {/* Share Cards */}
        <View style={styles.cardsContainer}>
          <Text style={styles.sectionTitle}>Choose Your Story</Text>
          <Text style={styles.sectionSubtitle}>
            Select a card to share your progress and inspire others
          </Text>
          
          {shareCards.map((card, index) => renderShareCard(card, index))}
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Sharing Tips</Text>
          <Text style={styles.tipText}>• Share your wins to stay motivated</Text>
          <Text style={styles.tipText}>• Inspire friends to join your savings journey</Text>
          <Text style={styles.tipText}>• Build accountability through social proof</Text>
          <Text style={styles.tipText}>• Celebrate milestones with your community</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFCFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: colors.primary,
  },
  backButton: {
    color: 'white',
    fontSize: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  statsContainer: {
    backgroundColor: 'white',
    borderRadius: radius,
    padding: 20,
    marginBottom: 24,
    ...shadow,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  shareCard: {
    borderRadius: radius,
    padding: 20,
    marginBottom: 16,
    ...shadow,
  },
  selectedCard: {
    borderWidth: 3,
    borderColor: colors.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    flex: 1,
  },
  cardMessage: {
    fontSize: 16,
    color: 'white',
    lineHeight: 22,
    marginBottom: 16,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  customCardContent: {
    flex: 1,
    marginVertical: 8,
  },
  customCardText: {
    fontSize: 14,
    color: 'white',
    lineHeight: 20,
    marginBottom: 16,
  },
  customOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  customOption: {
    alignItems: 'center',
    flex: 1,
  },
  optionEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  customOptionText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  tipsContainer: {
    backgroundColor: 'white',
    borderRadius: radius,
    padding: 20,
    ...shadow,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default ProgressSharingSimple;
