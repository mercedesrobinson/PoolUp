import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Rect, Polygon } from 'react-native-svg';

const colors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  background: '#F2F2F7',
  card: '#FFFFFF'
};

const radius = { sm: 8, md: 12, lg: 16 };

const themeConfigs = {
  beach_vacation: {
    colors: ['#87CEEB', '#4682B4', '#1E90FF'],
    emoji: '🏖️',
    title: 'Beach Vacation Fund'
  },
  house_fund: {
    colors: ['#8FBC8F', '#228B22', '#006400'],
    emoji: '🏠',
    title: 'Dream Home Fund'
  },
  travel_adventure: {
    colors: ['#DDA0DD', '#9370DB', '#8A2BE2'],
    emoji: '✈️',
    title: 'Travel Adventure'
  },
  emergency_fund: {
    colors: ['#F0E68C', '#DAA520', '#B8860B'],
    emoji: '🛡️',
    title: 'Emergency Fund'
  },
  roadmap_journey: {
    colors: ['#FFB6C1', '#FF69B4', '#FF1493'],
    emoji: '🗺️',
    title: 'Journey Fund'
  },
  concert_tickets: {
    colors: ['#DEB887', '#CD853F', '#A0522D'],
    emoji: '🎵',
    title: 'Concert Fund'
  }
};

export default function ShareableMilestoneCard({ 
  milestoneData, 
  onClose, 
  onShare 
}) {
  const [isSharing, setIsSharing] = useState(false);
  
  const theme = themeConfigs[milestoneData.theme] || themeConfigs.beach_vacation;
  
  const handleShare = async () => {
    try {
      setIsSharing(true);
      
      const shareContent = {
        message: `🎉 ${milestoneData.title}\n\n${milestoneData.subtitle}\n\n${milestoneData.customMessage || ''}\n\nProgress: ${milestoneData.progress}% (${milestoneData.currentAmount}/${milestoneData.goalAmount})\n\nJoin me on PoolUp! 💪`,
        url: 'https://poolup.app', // Replace with actual app store link
        title: milestoneData.title
      };
      
      const result = await Share.share(shareContent);
      
      if (result.action === Share.sharedAction) {
        Alert.alert('Shared!', 'Your milestone has been shared successfully! 🎉');
        onShare?.(milestoneData);
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share milestone. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const renderThemeVisualization = () => {
    const size = 120;
    const progress = milestoneData.progress / 100;
    
    switch (milestoneData.theme) {
      case 'beach_vacation':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx="50" cy="50" r="45" fill="#87CEEB" opacity="0.3" />
            <Circle cx="50" cy="50" r="35" fill="#4682B4" opacity={0.5 + progress * 0.5} />
            <Path d="M20,70 Q50,50 80,70 L80,80 L20,80 Z" fill="#F4A460" />
            <Circle cx="30" cy="25" r="8" fill="#FFD700" />
          </Svg>
        );
      case 'house_fund':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Polygon points="50,20 20,50 80,50" fill="#8B4513" opacity={0.7 + progress * 0.3} />
            <Rect x="25" y="50" width="50" height="30" fill="#D2691E" opacity={0.6 + progress * 0.4} />
            <Rect x="40" y="60" width="8" height="20" fill="#654321" />
            <Rect x="30" y="55" width="8" height="8" fill="#87CEEB" />
            <Rect x="55" y="55" width="8" height="8" fill="#87CEEB" />
          </Svg>
        );
      default:
        return (
          <View style={[styles.defaultVisualization, { backgroundColor: theme.colors[1] }]}>
            <Text style={styles.themeEmoji}>{theme.emoji}</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.cardContainer}>
        <LinearGradient
          colors={theme.colors}
          style={styles.card}
        >
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          
          <View style={styles.header}>
            <Text style={styles.cardTitle}>{milestoneData.title}</Text>
            <Text style={styles.cardSubtitle}>{milestoneData.subtitle}</Text>
          </View>
          
          <View style={styles.visualContainer}>
            {renderThemeVisualization()}
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{milestoneData.progress}%</Text>
              <Text style={styles.statLabel}>Complete</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>${milestoneData.currentAmount}</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>${milestoneData.goalAmount}</Text>
              <Text style={styles.statLabel}>Goal</Text>
            </View>
          </View>
          
          {milestoneData.customMessage && (
            <View style={styles.messageContainer}>
              <Text style={styles.customMessage}>"{milestoneData.customMessage}"</Text>
            </View>
          )}
          
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${Math.min(milestoneData.progress, 100)}%` }
                ]} 
              />
            </View>
          </View>
          
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.shareButton, isSharing && styles.sharingButton]}
              onPress={handleShare}
              disabled={isSharing}
            >
              <Text style={styles.shareButtonText}>
                {isSharing ? '📤 Sharing...' : '📱 Share to Social'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>💪 Powered by PoolUp</Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  cardContainer: {
    width: '90%',
    maxWidth: 350,
  },
  card: {
    borderRadius: radius.lg,
    padding: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  visualContainer: {
    marginBottom: 20,
  },
  defaultVisualization: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeEmoji: {
    fontSize: 48,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  messageContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
    borderRadius: radius.md,
    marginBottom: 20,
    width: '100%',
  },
  customMessage: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 4,
  },
  actionContainer: {
    width: '100%',
    marginBottom: 16,
  },
  shareButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'white',
  },
  sharingButton: {
    opacity: 0.7,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
