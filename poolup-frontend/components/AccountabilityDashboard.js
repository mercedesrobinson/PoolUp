import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ForfeitSystem from './ForfeitSystem';
import PeerBoostSystem from './PeerBoostSystem';

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

const radius = { sm: 8, md: 12, lg: 16 };

export default function AccountabilityDashboard({ poolId, currentUser, poolMembers }) {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [showForfeit, setShowForfeit] = useState(false);
  const [showPeerBoost, setShowPeerBoost] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccountabilityData();
  }, [poolId]);

  const fetchAccountabilityData = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/accountability/accountability/${poolId}`);
      const data = await response.json();
      setStats(data.stats);
      setRecentActivity(data.recentActivity);
    } catch (error) {
      console.error('Failed to fetch accountability data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePeerBoost = (user) => {
    setSelectedUser(user);
    setShowPeerBoost(true);
  };

  const getMissedDays = (user) => {
    // Calculate missed days based on last contribution
    const lastContribution = new Date(user.last_contribution_date || user.created_at);
    const daysSince = Math.floor((Date.now() - lastContribution.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysSince - 1); // Allow 1 day grace period
  };

  const renderActivityItem = (activity) => {
    const isBoost = activity.type === 'peer_boost';
    
    return (
      <View key={`${activity.type}_${activity.id}`} style={styles.activityItem}>
        <Text style={styles.activityEmoji}>
          {isBoost ? '🤝' : '💔'}
        </Text>
        <View style={styles.activityContent}>
          <Text style={styles.activityText}>
            {isBoost 
              ? `${activity.user_name} received a peer boost`
              : `${activity.user_name} had a forfeit`
            }
          </Text>
          <Text style={styles.activityAmount}>
            ${(activity.amount_cents / 100).toFixed(2)}
          </Text>
          <Text style={styles.activityTime}>
            {new Date(activity.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
    );
  };

  const renderMemberCard = (member) => {
    const missedDays = getMissedDays(member);
    const needsHelp = missedDays > 0;
    
    return (
      <View key={member.id} style={[
        styles.memberCard,
        needsHelp && styles.memberNeedsHelp
      ]}>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member.name}</Text>
          <Text style={styles.memberStatus}>
            {needsHelp 
              ? `⚠️ ${missedDays} day${missedDays > 1 ? 's' : ''} behind`
              : '✅ On track'
            }
          </Text>
        </View>
        
        {needsHelp && member.id !== currentUser.id && (
          <TouchableOpacity
            style={styles.boostButton}
            onPress={() => handlePeerBoost(member)}
          >
            <Text style={styles.boostButtonText}>🤝 Boost</Text>
          </TouchableOpacity>
        )}
        
        {needsHelp && member.id === currentUser.id && (
          <TouchableOpacity
            style={styles.forfeitButton}
            onPress={() => setShowForfeit(true)}
          >
            <Text style={styles.forfeitButtonText}>💔 Forfeit</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading accountability data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎯 Accountability Center</Text>
      
      {stats && (
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.statsCard}
        >
          <Text style={styles.statsTitle}>Pool Accountability</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.active_streaks}</Text>
              <Text style={styles.statLabel}>Active Streaks</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total_peer_boosts}</Text>
              <Text style={styles.statLabel}>Peer Boosts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total_forfeits}</Text>
              <Text style={styles.statLabel}>Forfeits</Text>
            </View>
          </View>
        </LinearGradient>
      )}

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Member Status</Text>
          {poolMembers.map(renderMemberCard)}
        </View>

        {recentActivity.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Recent Activity</Text>
            {recentActivity.map(renderActivityItem)}
          </View>
        )}
      </ScrollView>

      <ForfeitSystem
        poolId={poolId}
        userId={currentUser.id}
        missedDays={getMissedDays(currentUser)}
        visible={showForfeit}
        onClose={() => setShowForfeit(false)}
        onForfeitComplete={() => {
          fetchAccountabilityData();
          Alert.alert('Fresh Start! 🌱', 'Your streak has been reset. Tomorrow is a new beginning!');
        }}
      />

      <PeerBoostSystem
        poolId={poolId}
        boosterId={currentUser.id}
        targetUser={selectedUser}
        visible={showPeerBoost}
        onClose={() => {
          setShowPeerBoost(false);
          setSelectedUser(null);
        }}
        onBoostComplete={() => {
          fetchAccountabilityData();
          Alert.alert('Team Spirit! 🤝', 'You helped a friend stay on track!');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  statsCard: {
    margin: 16,
    padding: 20,
    borderRadius: radius.lg,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  memberCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: radius.md,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberNeedsHelp: {
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  memberStatus: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  boostButton: {
    backgroundColor: colors.success,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  boostButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  forfeitButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  forfeitButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  activityItem: {
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  activityAmount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  activityTime: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
