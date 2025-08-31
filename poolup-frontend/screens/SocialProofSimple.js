import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, FlatList } from 'react-native';
import { colors, radius, shadow } from '../theme';

const SocialProofSimple = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('stats');

  // Mock community data
  const communityStats = {
    totalUsers: 12847,
    totalSaved: 2847293,
    activeGroups: 1247,
    successRate: 78,
    avgSavings: 1250
  };

  const successStories = [
    {
      id: 1,
      name: 'Sarah M.',
      achievement: 'Saved $5,000 for emergency fund',
      timeframe: '6 months',
      tip: 'Started with just $25/week and stayed consistent!'
    },
    {
      id: 2,
      name: 'Mike R.',
      achievement: 'Bought first home down payment',
      timeframe: '18 months',
      tip: 'Group accountability made all the difference.'
    },
    {
      id: 3,
      name: 'Lisa K.',
      achievement: 'Paid off $8,000 credit card debt',
      timeframe: '12 months',
      tip: 'Used penalty system to stay motivated!'
    }
  ];

  const recentAchievements = [
    { id: 1, user: 'Alex J.', action: 'completed Emergency Fund goal', amount: '$3,000', time: '2h ago' },
    { id: 2, user: 'Maria S.', action: 'reached 30-day streak', amount: null, time: '4h ago' },
    { id: 3, user: 'David L.', action: 'saved for Vacation Fund', amount: '$1,200', time: '6h ago' },
    { id: 4, user: 'Emma W.', action: 'joined Beach House group', amount: null, time: '8h ago' },
    { id: 5, user: 'Ryan P.', action: 'completed Car Fund goal', amount: '$5,500', time: '1d ago' }
  ];

  const leaderboard = [
    { rank: 1, name: 'Jessica T.', streak: 127, saved: 8450 },
    { rank: 2, name: 'Marcus H.', streak: 98, saved: 7200 },
    { rank: 3, name: 'Amy L.', streak: 89, saved: 6800 },
    { rank: 4, name: 'You', streak: 12, saved: 2450 },
    { rank: 5, name: 'Chris M.', streak: 67, saved: 5900 }
  ];

  const renderSuccessStory = ({ item }) => (
    <View style={styles.storyCard}>
      <View style={styles.storyHeader}>
        <Text style={styles.storyName}>{item.name}</Text>
        <Text style={styles.storyTime}>{item.timeframe}</Text>
      </View>
      <Text style={styles.storyAchievement}>{item.achievement}</Text>
      <Text style={styles.storyTip}>💡 "{item.tip}"</Text>
    </View>
  );

  const renderAchievement = ({ item }) => (
    <View style={styles.achievementItem}>
      <View style={styles.achievementContent}>
        <Text style={styles.achievementUser}>{item.user}</Text>
        <Text style={styles.achievementAction}>{item.action}</Text>
        {item.amount && <Text style={styles.achievementAmount}>{item.amount}</Text>}
      </View>
      <Text style={styles.achievementTime}>{item.time}</Text>
    </View>
  );

  const renderLeaderboardItem = ({ item }) => (
    <View style={[styles.leaderboardItem, item.name === 'You' && styles.currentUser]}>
      <View style={styles.rankContainer}>
        <Text style={[styles.rank, item.name === 'You' && styles.currentUserText]}>#{item.rank}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, item.name === 'You' && styles.currentUserText]}>{item.name}</Text>
        <Text style={styles.userStats}>{item.streak} day streak • ${item.saved} saved</Text>
      </View>
      {item.rank <= 3 && (
        <Text style={styles.medal}>{item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : '🥉'}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Community</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
          onPress={() => setActiveTab('stats')}
        >
          <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>Stats</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stories' && styles.activeTab]}
          onPress={() => setActiveTab('stories')}
        >
          <Text style={[styles.tabText, activeTab === 'stories' && styles.activeTabText]}>Stories</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'activity' && styles.activeTab]}
          onPress={() => setActiveTab('activity')}
        >
          <Text style={[styles.tabText, activeTab === 'activity' && styles.activeTabText]}>Activity</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'leaderboard' && styles.activeTab]}
          onPress={() => setActiveTab('leaderboard')}
        >
          <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.activeTabText]}>Top Savers</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'stats' && (
          <View>
            {/* Community Stats */}
            <View style={styles.statsContainer}>
              <Text style={styles.sectionTitle}>🌟 Community Impact</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{communityStats.totalUsers.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Active Savers</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>${(communityStats.totalSaved / 1000000).toFixed(1)}M</Text>
                  <Text style={styles.statLabel}>Total Saved</Text>
                </View>
              </View>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{communityStats.successRate}%</Text>
                  <Text style={styles.statLabel}>Success Rate</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>${communityStats.avgSavings}</Text>
                  <Text style={styles.statLabel}>Avg Monthly</Text>
                </View>
              </View>
            </View>

            {/* Motivation */}
            <View style={styles.motivationContainer}>
              <Text style={styles.motivationTitle}>💪 You're Not Alone!</Text>
              <Text style={styles.motivationText}>
                Join thousands of people building better financial habits together. 
                Our community saves 3x more than people saving alone.
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'stories' && (
          <View>
            <Text style={styles.sectionTitle}>🎉 Success Stories</Text>
            <FlatList
              data={successStories}
              renderItem={renderSuccessStory}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </View>
        )}

        {activeTab === 'activity' && (
          <View>
            <Text style={styles.sectionTitle}>⚡ Recent Activity</Text>
            <FlatList
              data={recentAchievements}
              renderItem={renderAchievement}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </View>
        )}

        {activeTab === 'leaderboard' && (
          <View>
            <Text style={styles.sectionTitle}>🏆 Top Savers This Month</Text>
            <FlatList
              data={leaderboard}
              renderItem={renderLeaderboardItem}
              keyExtractor={(item) => item.rank.toString()}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Call to Action */}
        <View style={styles.ctaContainer}>
          <Text style={styles.ctaTitle}>Ready to Join the Community?</Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => navigation.navigate('CreatePool')}
          >
            <Text style={styles.ctaButtonText}>Start Your Savings Journey</Text>
          </TouchableOpacity>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  statsContainer: {
    backgroundColor: 'white',
    borderRadius: radius,
    padding: 20,
    marginBottom: 24,
    ...shadow,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
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
    textAlign: 'center',
  },
  motivationContainer: {
    backgroundColor: colors.green,
    borderRadius: radius,
    padding: 20,
    marginBottom: 24,
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 14,
    color: 'white',
    lineHeight: 20,
  },
  storyCard: {
    backgroundColor: 'white',
    borderRadius: radius,
    padding: 16,
    marginBottom: 12,
    ...shadow,
  },
  storyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  storyName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  storyTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  storyAchievement: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  storyTip: {
    fontSize: 12,
    color: colors.green,
    fontStyle: 'italic',
  },
  achievementItem: {
    backgroundColor: 'white',
    borderRadius: radius,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadow,
  },
  achievementContent: {
    flex: 1,
  },
  achievementUser: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  achievementAction: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  achievementAmount: {
    fontSize: 12,
    color: colors.green,
    fontWeight: '600',
    marginTop: 2,
  },
  achievementTime: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  leaderboardItem: {
    backgroundColor: 'white',
    borderRadius: radius,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadow,
  },
  currentUser: {
    backgroundColor: colors.primary + '10',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rank: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  currentUserText: {
    color: colors.primary,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  userStats: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  medal: {
    fontSize: 20,
  },
  ctaContainer: {
    backgroundColor: 'white',
    borderRadius: radius,
    padding: 24,
    alignItems: 'center',
    marginTop: 24,
    ...shadow,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  ctaButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default SocialProofSimple;
