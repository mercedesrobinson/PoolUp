import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const colors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  background: '#F2F2F7',
  card: '#FFFFFF'
};

const radius = {
  sm: 8,
  md: 12,
  lg: 16
};

export default function Leaderboard({ poolId, onUserSelect }) {
  const [activeTab, setActiveTab] = useState('generous');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'generous', title: 'Most Generous', icon: '💰' },
    { id: 'consistent', title: 'Most Consistent', icon: '🔥' },
    { id: 'achievers', title: 'Top Achievers', icon: '🏆' }
  ];

  const fetchLeaderboard = async (type) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/social/leaderboard/${type}?limit=10`);
      const data = await response.json();
      setLeaderboardData(data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      setLeaderboardData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(activeTab);
  }, [activeTab]);

  const getRankEmoji = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return '#FFD700';
      case 2: return '#C0C0C0';
      case 3: return '#CD7F32';
      default: return colors.textSecondary;
    }
  };

  const formatValue = (item, type) => {
    switch (type) {
      case 'generous':
        return `$${(item.total_contributed / 100).toFixed(0)}`;
      case 'consistent':
        return `${item.current_streak} days`;
      case 'achievers':
        return `${item.badge_count} badges`;
      default:
        return '';
    }
  };

  const renderLeaderboardItem = (item, index) => {
    const rank = index + 1;
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.leaderboardItem,
          rank <= 3 && { borderColor: getRankColor(rank), borderWidth: 2 }
        ]}
        onPress={() => onUserSelect?.(item)}
      >
        <View style={styles.rankContainer}>
          <Text style={[styles.rankText, { color: getRankColor(rank) }]}>
            {getRankEmoji(rank)}
          </Text>
        </View>
        
        <View style={styles.avatarContainer}>
          {item.profile_image ? (
            <Image source={{ uri: item.profile_image }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Text style={styles.avatarText}>
                {item.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          {rank <= 3 && (
            <View style={[styles.crownContainer, { backgroundColor: getRankColor(rank) }]}>
              <Text style={styles.crown}>👑</Text>
            </View>
          )}
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.userStats}>
            {formatValue(item, activeTab)}
          </Text>
          {activeTab === 'achievers' && item.badge_names && (
            <Text style={styles.badgePreview} numberOfLines={1}>
              {item.badge_names.split(',').slice(0, 3).join(', ')}
            </Text>
          )}
        </View>
        
        <View style={styles.scoreContainer}>
          <LinearGradient
            colors={rank <= 3 ? ['#FFD700', '#FFA500'] : [colors.primary, colors.secondary]}
            style={styles.scoreGradient}
          >
            <Text style={styles.scoreText}>
              {formatValue(item, activeTab)}
            </Text>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏆 Leaderboard</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[
              styles.tabText,
              activeTab === tab.id && styles.activeTabText
            ]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <ScrollView style={styles.leaderboardContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading leaderboard...</Text>
          </View>
        ) : leaderboardData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>No data yet</Text>
            <Text style={styles.emptySubtext}>
              Start contributing to see the leaderboard!
            </Text>
          </View>
        ) : (
          leaderboardData.map((item, index) => renderLeaderboardItem(item, index))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  tabContainer: {
    marginBottom: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.md,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  activeTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  activeTabText: {
    color: 'white',
  },
  leaderboardContainer: {
    flex: 1,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: radius.lg,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  avatarContainer: {
    position: 'relative',
    marginHorizontal: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultAvatar: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  crownContainer: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crown: {
    fontSize: 12,
  },
  userInfo: {
    flex: 1,
    marginLeft: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  userStats: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  badgePreview: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scoreContainer: {
    marginLeft: 8,
  },
  scoreGradient: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  scoreText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
