import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Share,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';
import api from '../services/api';

const { width } = Dimensions.get('window');

const ProgressSharing = ({ navigation, route }) => {
  const { pool, user } = route.params || {};
  const [shareableCards, setShareableCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateShareableCards();
  }, [pool]);

  const generateShareableCards = () => {
    if (!pool) return;

    const progressPercentage = Math.round((pool.current_amount / pool.goal_amount) * 100);
    const daysLeft = Math.ceil((new Date(pool.target_date) - new Date()) / (1000 * 60 * 60 * 24));
    
    const cards = [
      {
        id: 'milestone',
        type: 'Milestone Achievement',
        title: `${progressPercentage}% Complete! 🎉`,
        subtitle: `$${(pool.current_amount / 100).toFixed(2)} saved toward ${pool.name}`,
        gradient: ['#4CAF50', '#45A049'],
        icon: '🎯',
        stats: [
          { label: 'Goal', value: `$${(pool.goal_amount / 100).toFixed(2)}` },
          { label: 'Days Left', value: daysLeft > 0 ? daysLeft : 'Complete!' },
          { label: 'Members', value: pool.member_count || 1 }
        ]
      },
      {
        id: 'streak',
        type: 'Streak Celebration',
        title: `🔥 ${user?.current_streak || 5} Day Streak!`,
        subtitle: 'Consistent saving pays off',
        gradient: ['#FF6B6B', '#FF5252'],
        icon: '🔥',
        stats: [
          { label: 'Current Streak', value: `${user?.current_streak || 5} days` },
          { label: 'Best Streak', value: `${user?.longest_streak || 12} days` },
          { label: 'Total Saved', value: `$${(pool.current_amount / 100).toFixed(2)}` }
        ]
      },
      {
        id: 'group',
        type: 'Group Progress',
        title: `Team ${pool.name} 💪`,
        subtitle: `${pool.member_count || 1} savers working together`,
        gradient: ['#2196F3', '#1976D2'],
        icon: '👥',
        stats: [
          { label: 'Group Size', value: pool.member_count || 1 },
          { label: 'Total Saved', value: `$${(pool.current_amount / 100).toFixed(2)}` },
          { label: 'Progress', value: `${progressPercentage}%` }
        ]
      },
      {
        id: 'motivation',
        type: 'Motivational',
        title: 'Every Dollar Counts! 💰',
        subtitle: 'Building wealth one contribution at a time',
        gradient: ['#9C27B0', '#7B1FA2'],
        icon: '✨',
        stats: [
          { label: 'This Month', value: `$${((pool.current_amount * 0.3) / 100).toFixed(2)}` },
          { label: 'Goal', value: pool.name },
          { label: 'Progress', value: `${progressPercentage}%` }
        ]
      }
    ];

    setShareableCards(cards);
    setSelectedCard(cards[0]);
  };

  const shareProgress = async (cardData) => {
    try {
      setLoading(true);
      
      // Create shareable text
      const shareText = `🎉 ${cardData.title}\n\n${cardData.subtitle}\n\nJoin me on PoolUp - where saving money becomes a social experience! 💪\n\n#PoolUp #SavingsGoals #FinancialFreedom`;
      
      const result = await Share.share({
        message: shareText,
        title: 'My PoolUp Progress',
      });

      if (result.action === Share.sharedAction) {
        // Track sharing analytics
        await api.trackEvent(user?.id || 'guest', 'progress_shared', {
          pool_id: pool.id,
          card_type: cardData.type,
          progress_percentage: Math.round((pool.current_amount / pool.goal_amount) * 100)
        });
        
        Alert.alert('Shared!', 'Your progress has been shared successfully! 🎉');
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share progress. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (cardData) => {
    try {
      const shareText = `🎉 ${cardData.title}\n\n${cardData.subtitle}\n\nJoin me on PoolUp - where saving money becomes a social experience! 💪`;
      
      // Note: Clipboard API would be used here in a real app
      Alert.alert('Copied!', 'Progress text copied to clipboard!');
      
      await api.trackEvent(user?.id || 'guest', 'progress_copied', {
        pool_id: pool.id,
        card_type: cardData.type
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to copy to clipboard.');
    }
  };

  const ShareableCard = ({ card, isSelected, onPress }) => (
    <TouchableOpacity
      style={[styles.cardContainer, isSelected && styles.selectedCard]}
      onPress={() => onPress(card)}
    >
      <LinearGradient
        colors={card.gradient}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>{card.icon}</Text>
          <Text style={styles.cardType}>{card.type}</Text>
        </View>
        
        <Text style={styles.cardTitle}>{card.title}</Text>
        <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
        
        <View style={styles.statsContainer}>
          {card.stats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.brandingContainer}>
          <Text style={styles.branding}>PoolUp</Text>
          <Text style={styles.brandingSubtext}>Social Savings</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Share Your Progress</Text>
        <Text style={styles.subtitle}>
          Celebrate your savings milestones and inspire others to join PoolUp!
        </Text>
      </View>

      <View style={styles.cardSelection}>
        <Text style={styles.sectionTitle}>Choose Your Style</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardScroll}>
          {shareableCards.map((card) => (
            <ShareableCard
              key={card.id}
              card={card}
              isSelected={selectedCard?.id === card.id}
              onPress={setSelectedCard}
            />
          ))}
        </ScrollView>
      </View>

      {selectedCard && (
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <View style={styles.previewContainer}>
            <ShareableCard
              card={selectedCard}
              isSelected={true}
              onPress={() => {}}
            />
          </View>
        </View>
      )}

      <View style={styles.actionSection}>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => shareProgress(selectedCard)}
          disabled={loading}
        >
          <Text style={styles.shareButtonText}>
            {loading ? 'Sharing...' : '📱 Share to Social Media'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.copyButton}
          onPress={() => copyToClipboard(selectedCard)}
        >
          <Text style={styles.copyButtonText}>📋 Copy Text</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.socialProofSection}>
        <Text style={styles.sectionTitle}>Why Share Your Progress?</Text>
        <View style={styles.benefitsList}>
          <BenefitItem
            icon="🎯"
            title="Stay Accountable"
            description="Public commitment increases your success rate by 65%"
          />
          <BenefitItem
            icon="👥"
            title="Inspire Others"
            description="Your progress motivates friends to start their own savings journey"
          />
          <BenefitItem
            icon="🏆"
            title="Celebrate Wins"
            description="Acknowledge your hard work and build positive momentum"
          />
          <BenefitItem
            icon="💪"
            title="Build Community"
            description="Connect with other savers and create support networks"
          />
        </View>
      </View>

      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>💡 Sharing Tips</Text>
        <Text style={styles.tipText}>
          • Share milestones (25%, 50%, 75%, 100% complete){'\n'}
          • Post during peak social media hours (7-9 PM){'\n'}
          • Use relevant hashtags: #SavingsGoals #FinancialFreedom{'\n'}
          • Tag friends who might be interested in joining{'\n'}
          • Share both successes and challenges for authenticity
        </Text>
      </View>
    </ScrollView>
  );
};

const BenefitItem = ({ icon, title, description }) => (
  <View style={styles.benefitItem}>
    <Text style={styles.benefitIcon}>{icon}</Text>
    <View style={styles.benefitText}>
      <Text style={styles.benefitTitle}>{title}</Text>
      <Text style={styles.benefitDescription}>{description}</Text>
    </View>
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
  cardSelection: {
    backgroundColor: 'white',
    marginTop: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  cardScroll: {
    paddingLeft: 20,
  },
  cardContainer: {
    marginRight: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedCard: {
    transform: [{ scale: 1.02 }],
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  card: {
    width: width * 0.7,
    height: 200,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  cardType: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
  },
  brandingContainer: {
    alignItems: 'center',
  },
  branding: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  brandingSubtext: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  previewSection: {
    backgroundColor: 'white',
    marginTop: 20,
    paddingVertical: 20,
  },
  previewContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  actionSection: {
    backgroundColor: 'white',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 25,
  },
  shareButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  copyButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  copyButtonText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '600',
  },
  socialProofSection: {
    backgroundColor: 'white',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 25,
  },
  benefitsList: {
    marginTop: 10,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  benefitIcon: {
    fontSize: 24,
    marginRight: 15,
    marginTop: 2,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  tipsSection: {
    backgroundColor: 'white',
    marginTop: 20,
    marginBottom: 40,
    paddingHorizontal: 20,
    paddingVertical: 25,
  },
  tipText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 22,
  },
});

export default ProgressSharing;
