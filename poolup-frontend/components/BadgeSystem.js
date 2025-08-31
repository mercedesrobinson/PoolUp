import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const BADGE_TYPES = {
  milestone: { color: '#FFD700', name: 'Milestone' },
  consistency: { color: '#4ECDC4', name: 'Consistency' },
  streak: { color: '#E74C3C', name: 'Streak' },
  leadership: { color: '#9B59B6', name: 'Leadership' },
  social: { color: '#3498DB', name: 'Social' },
  achievement: { color: '#E67E22', name: 'Achievement' },
  legend: { color: '#2ECC71', name: 'Legend' }
};

export default function BadgeSystem({ userId, onBadgeEarned }) {
  const [badges, setBadges] = useState([]);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newBadgeAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    fetchUserBadges();
  }, [userId]);

  const fetchUserBadges = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/gamification/badges/${userId}`);
      const data = await response.json();
      setBadges(data);
    } catch (error) {
      console.error('Failed to fetch badges:', error);
    }
  };

  const showBadgeDetails = (badge) => {
    setSelectedBadge(badge);
    setShowModal(true);
  };

  const animateNewBadge = () => {
    Animated.sequence([
      Animated.timing(newBadgeAnimation, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(newBadgeAnimation, { toValue: 0, duration: 500, useNativeDriver: true })
    ]).start();
  };

  const renderBadge = ({ item }) => {
    const badgeType = BADGE_TYPES[item.badge_type] || BADGE_TYPES.milestone;
    
    return (
      <TouchableOpacity 
        style={styles.badgeContainer}
        onPress={() => showBadgeDetails(item)}
      >
        <LinearGradient
          colors={[badgeType.color, `${badgeType.color}80`]}
          style={styles.badgeGradient}
        >
          <Text style={styles.badgeIcon}>{getBadgeIcon(item.badge_name)}</Text>
          <Text style={styles.badgeName}>{item.badge_name}</Text>
          <Text style={styles.badgeType}>{badgeType.name}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const getBadgeIcon = (badgeName) => {
    const icons = {
      'First Contribution': '🎯',
      'On-time All-Star': '⭐',
      'Early Bird Saver': '🐦',
      'Trip Captain': '🧭',
      'Streak Master': '🔥',
      'Team Player': '🤝',
      'Goal Crusher': '💪',
      'Savings Legend': '👑',
      'Week Warrior': '⚡',
      'Milestone Maker': '🏆'
    };
    return icons[badgeName] || '🏅';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Badges ({badges.length})</Text>
      
      {badges.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏅</Text>
          <Text style={styles.emptyText}>Start contributing to earn your first badge!</Text>
        </View>
      ) : (
        <FlatList
          data={badges}
          renderItem={renderBadge}
          keyExtractor={(item) => item.id.toString()}
          numColumns={3}
          contentContainerStyle={styles.badgeGrid}
        />
      )}

      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedBadge && (
              <>
                <Text style={styles.modalIcon}>{getBadgeIcon(selectedBadge.badge_name)}</Text>
                <Text style={styles.modalTitle}>{selectedBadge.badge_name}</Text>
                <Text style={styles.modalType}>{BADGE_TYPES[selectedBadge.badge_type]?.name}</Text>
                <Text style={styles.modalDate}>
                  Earned on {new Date(selectedBadge.earned_at).toLocaleDateString()}
                </Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2D3436',
  },
  badgeGrid: {
    alignItems: 'center',
  },
  badgeContainer: {
    width: 100,
    height: 100,
    margin: 8,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  badgeGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  badgeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  badgeName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 2,
  },
  badgeType: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#636E72',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    minWidth: 250,
  },
  modalIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalType: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 8,
  },
  modalDate: {
    fontSize: 12,
    color: '#636E72',
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
