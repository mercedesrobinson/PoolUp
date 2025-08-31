import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated,
  Modal,
  Alert 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

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

export default function MiniGameCenter({ 
  poolId, 
  userId, 
  currentStreak,
  totalContributions,
  visible,
  onClose,
  onRewardEarned 
}) {
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameProgress, setGameProgress] = useState({});
  const [availableGames, setAvailableGames] = useState([]);

  const miniGames = [
    {
      id: 'streak_spinner',
      name: 'Streak Spinner',
      description: 'Spin to multiply your streak bonus!',
      emoji: '🎰',
      unlockRequirement: { type: 'streak', value: 3 },
      maxPlaysPerDay: 1,
      rewards: ['bonus_points', 'streak_protection', 'double_contribution']
    },
    {
      id: 'savings_slots',
      name: 'Savings Slots',
      description: 'Match symbols to win bonus contributions!',
      emoji: '🎰',
      unlockRequirement: { type: 'contributions', value: 5 },
      maxPlaysPerDay: 2,
      rewards: ['bonus_contribution', 'lucky_multiplier', 'jackpot_badge']
    },
    {
      id: 'goal_crusher',
      name: 'Goal Crusher',
      description: 'Smash blocks to reveal hidden rewards!',
      emoji: '🧱',
      unlockRequirement: { type: 'total_saved', value: 10000 },
      maxPlaysPerDay: 3,
      rewards: ['instant_boost', 'mystery_reward', 'crusher_badge']
    },
    {
      id: 'fortune_wheel',
      name: 'Fortune Wheel',
      description: 'Spin the wheel of savings fortune!',
      emoji: '🎡',
      unlockRequirement: { type: 'days_active', value: 7 },
      maxPlaysPerDay: 1,
      rewards: ['mega_bonus', 'streak_freeze', 'golden_contribution']
    }
  ];

  useEffect(() => {
    checkUnlockedGames();
    loadGameProgress();
  }, [currentStreak, totalContributions]);

  const checkUnlockedGames = () => {
    const unlocked = miniGames.filter(game => {
      const req = game.unlockRequirement;
      switch (req.type) {
        case 'streak':
          return currentStreak >= req.value;
        case 'contributions':
          return totalContributions >= req.value;
        case 'total_saved':
          return true; // Would check actual saved amount
        case 'days_active':
          return true; // Would check user activity
        default:
          return false;
      }
    });
    setAvailableGames(unlocked);
  };

  const loadGameProgress = () => {
    // Load daily play counts from storage/API
    const progress = {};
    miniGames.forEach(game => {
      progress[game.id] = {
        playsToday: 0,
        lastPlayDate: null,
        totalPlays: 0
      };
    });
    setGameProgress(progress);
  };

  const playGame = (game) => {
    const progress = gameProgress[game.id];
    if (progress.playsToday >= game.maxPlaysPerDay) {
      Alert.alert('Daily Limit Reached', `You can only play ${game.name} ${game.maxPlaysPerDay} time(s) per day. Come back tomorrow!`);
      return;
    }
    
    setSelectedGame(game);
  };

  const renderGameCard = (game) => {
    const isUnlocked = availableGames.some(g => g.id === game.id);
    const progress = gameProgress[game.id] || { playsToday: 0 };
    const playsLeft = game.maxPlaysPerDay - progress.playsToday;
    
    return (
      <TouchableOpacity
        key={game.id}
        style={[
          styles.gameCard,
          !isUnlocked && styles.lockedGameCard
        ]}
        onPress={() => isUnlocked ? playGame(game) : null}
        disabled={!isUnlocked}
      >
        <LinearGradient
          colors={isUnlocked ? [colors.primary, colors.secondary] : ['#CCCCCC', '#999999']}
          style={styles.gameGradient}
        >
          <Text style={styles.gameEmoji}>{game.emoji}</Text>
          <Text style={styles.gameName}>{game.name}</Text>
          <Text style={styles.gameDescription}>{game.description}</Text>
          
          {isUnlocked ? (
            <View style={styles.gameStatus}>
              <Text style={styles.playsLeft}>
                {playsLeft > 0 ? `${playsLeft} plays left today` : 'Come back tomorrow!'}
              </Text>
            </View>
          ) : (
            <View style={styles.lockStatus}>
              <Text style={styles.lockText}>🔒 Unlock Requirements:</Text>
              <Text style={styles.lockRequirement}>
                {getRequirementText(game.unlockRequirement)}
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const getRequirementText = (req) => {
    switch (req.type) {
      case 'streak':
        return `${req.value} day streak`;
      case 'contributions':
        return `${req.value} contributions`;
      case 'total_saved':
        return `$${req.value} saved`;
      case 'days_active':
        return `${req.value} days active`;
      default:
        return 'Unknown requirement';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🎮 Mini Game Center</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Your Gaming Stats</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{currentStreak}</Text>
                <Text style={styles.statLabel}>Streak</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalContributions}</Text>
                <Text style={styles.statLabel}>Contributions</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{availableGames.length}</Text>
                <Text style={styles.statLabel}>Games Unlocked</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>🎯 Available Games</Text>
          {miniGames.map(renderGameCard)}
        </View>

        {selectedGame && (
          <GamePlayModal
            game={selectedGame}
            visible={!!selectedGame}
            onClose={() => setSelectedGame(null)}
            onRewardEarned={(reward) => {
              onRewardEarned?.(reward);
              setSelectedGame(null);
              // Update play count
              setGameProgress(prev => ({
                ...prev,
                [selectedGame.id]: {
                  ...prev[selectedGame.id],
                  playsToday: prev[selectedGame.id].playsToday + 1,
                  totalPlays: prev[selectedGame.id].totalPlays + 1
                }
              }));
            }}
          />
        )}
      </View>
    </Modal>
  );
}

function GamePlayModal({ game, visible, onClose, onRewardEarned }) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const spinValue = new Animated.Value(0);

  const playStreakSpinner = () => {
    setIsSpinning(true);
    setResult(null);
    
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start(() => {
      const rewards = ['🔥 2x Streak Bonus!', '🛡️ Streak Protection!', '💰 Double Next Contribution!'];
      const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
      setResult(randomReward);
      setIsSpinning(false);
      
      setTimeout(() => {
        onRewardEarned(randomReward);
      }, 2000);
    });
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1440deg'],
  });

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.gameModalOverlay}>
        <View style={styles.gameModal}>
          <Text style={styles.gameModalTitle}>{game.emoji} {game.name}</Text>
          
          {game.id === 'streak_spinner' && (
            <View style={styles.spinnerContainer}>
              <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]}>
                <Svg width={200} height={200} viewBox="0 0 200 200">
                  <Circle cx="100" cy="100" r="90" fill="#FFD700" stroke="#FFA500" strokeWidth="4" />
                  <Path d="M100,10 L110,30 L90,30 Z" fill="#FF4500" />
                  <Circle cx="100" cy="100" r="15" fill="#8B4513" />
                </Svg>
              </Animated.View>
              
              {!isSpinning && !result && (
                <TouchableOpacity style={styles.spinButton} onPress={playStreakSpinner}>
                  <Text style={styles.spinButtonText}>🎰 SPIN!</Text>
                </TouchableOpacity>
              )}
              
              {isSpinning && (
                <Text style={styles.spinningText}>Spinning... 🌟</Text>
              )}
              
              {result && (
                <View style={styles.resultContainer}>
                  <Text style={styles.resultText}>You won:</Text>
                  <Text style={styles.resultReward}>{result}</Text>
                </View>
              )}
            </View>
          )}
          
          <TouchableOpacity style={styles.closeGameButton} onPress={onClose}>
            <Text style={styles.closeGameButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    fontSize: 24,
    color: colors.textSecondary,
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: radius.lg,
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
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
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  gameCard: {
    marginBottom: 16,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  lockedGameCard: {
    opacity: 0.7,
  },
  gameGradient: {
    padding: 20,
    alignItems: 'center',
  },
  gameEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  gameName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  gameDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 12,
  },
  gameStatus: {
    alignItems: 'center',
  },
  playsLeft: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  lockStatus: {
    alignItems: 'center',
  },
  lockText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  lockRequirement: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  gameModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameModal: {
    backgroundColor: colors.card,
    padding: 30,
    borderRadius: radius.lg,
    alignItems: 'center',
    width: '90%',
    maxWidth: 350,
  },
  gameModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  spinnerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  spinner: {
    marginBottom: 20,
  },
  spinButton: {
    backgroundColor: colors.warning,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: radius.lg,
  },
  spinButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  spinningText: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '600',
  },
  resultContainer: {
    alignItems: 'center',
  },
  resultText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  resultReward: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.success,
    textAlign: 'center',
  },
  closeGameButton: {
    backgroundColor: colors.textSecondary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  closeGameButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
