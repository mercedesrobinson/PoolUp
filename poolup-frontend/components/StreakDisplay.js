import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function StreakDisplay({ userId, poolId, onStreakUpdate }) {
  const [streak, setStreak] = useState({ streak_count: 0, longest_streak: 0 });
  const [fireAnimation] = useState(new Animated.Value(1));

  useEffect(() => {
    fetchStreak();
  }, [userId, poolId]);

  useEffect(() => {
    if (streak.streak_count > 0) {
      animateFire();
    }
  }, [streak.streak_count]);

  const fetchStreak = async () => {
    try {
      const url = poolId 
        ? `http://localhost:3000/api/gamification/streak/${userId}/${poolId}`
        : `http://localhost:3000/api/gamification/streak/${userId}`;
      const response = await fetch(url);
      const data = await response.json();
      setStreak(data);
    } catch (error) {
      console.error('Failed to fetch streak:', error);
    }
  };

  const animateFire = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fireAnimation, { toValue: 1.2, duration: 800, useNativeDriver: true }),
        Animated.timing(fireAnimation, { toValue: 1, duration: 800, useNativeDriver: true })
      ])
    ).start();
  };

  const getStreakColor = () => {
    if (streak.streak_count >= 30) return ['#E74C3C', '#C0392B'];
    if (streak.streak_count >= 14) return ['#F39C12', '#E67E22'];
    if (streak.streak_count >= 7) return ['#3498DB', '#2980B9'];
    return ['#95A5A6', '#7F8C8D'];
  };

  const getStreakMessage = () => {
    if (streak.streak_count === 0) return 'Start your streak!';
    if (streak.streak_count === 1) return 'Great start!';
    if (streak.streak_count < 7) return 'Building momentum!';
    if (streak.streak_count < 14) return 'On fire! 🔥';
    if (streak.streak_count < 30) return 'Unstoppable! 🚀';
    return 'Legend status! 👑';
  };

  return (
    <LinearGradient
      colors={getStreakColor()}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.streakContent}>
        <Animated.Text 
          style={[
            styles.fireEmoji, 
            { transform: [{ scale: fireAnimation }] }
          ]}
        >
          {streak.streak_count > 0 ? '🔥' : '💤'}
        </Animated.Text>
        
        <View style={styles.streakInfo}>
          <Text style={styles.streakCount}>{streak.streak_count}</Text>
          <Text style={styles.streakLabel}>Day Streak</Text>
          <Text style={styles.streakMessage}>{getStreakMessage()}</Text>
        </View>
        
        <View style={styles.recordInfo}>
          <Text style={styles.recordLabel}>Best</Text>
          <Text style={styles.recordCount}>{streak.longest_streak}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 15,
    padding: 15,
    marginVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fireEmoji: {
    fontSize: 32,
  },
  streakInfo: {
    flex: 1,
    alignItems: 'center',
  },
  streakCount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  streakLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  streakMessage: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  recordInfo: {
    alignItems: 'center',
  },
  recordLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
  },
  recordCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});
