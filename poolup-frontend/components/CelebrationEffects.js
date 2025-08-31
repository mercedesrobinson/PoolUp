import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions,
  Modal 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Polygon, Star } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const colors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  gold: '#FFD700',
  purple: '#AF52DE',
  pink: '#FF2D92',
  text: '#1C1C1E',
  white: '#FFFFFF'
};

export default function CelebrationEffects({ 
  visible, 
  onComplete, 
  achievementType = 'badge',
  achievementData = {} 
}) {
  const [showFireworks, setShowFireworks] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showBadgeAnimation, setShowBadgeAnimation] = useState(false);
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  
  const confettiAnimations = useRef(
    Array.from({ length: 20 }, () => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(-50),
      rotation: new Animated.Value(0),
      scale: new Animated.Value(1)
    }))
  ).current;

  const fireworkAnimations = useRef(
    Array.from({ length: 8 }, () => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(1),
      x: Math.random() * width,
      y: Math.random() * height * 0.6 + height * 0.2
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      startCelebration();
    } else {
      resetAnimations();
    }
  }, [visible]);

  const startCelebration = () => {
    // Start main achievement animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Start rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Start bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        })
      ])
    ).start();

    // Trigger effects based on achievement type
    setTimeout(() => {
      if (achievementType === 'badge' || achievementType === 'milestone') {
        setShowFireworks(true);
        startFireworks();
      }
      if (achievementType === 'streak' || achievementType === 'goal') {
        setShowConfetti(true);
        startConfetti();
      }
    }, 300);

    // Auto-close after celebration
    setTimeout(() => {
      onComplete && onComplete();
    }, 4000);
  };

  const startFireworks = () => {
    fireworkAnimations.forEach((anim, index) => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(anim.scale, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          })
        ]).start();
      }, index * 100);
    });
  };

  const startConfetti = () => {
    confettiAnimations.forEach((anim, index) => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(anim.y, {
            toValue: height + 50,
            duration: 3000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.loop(
            Animated.timing(anim.rotation, {
              toValue: 1,
              duration: 1000 + Math.random() * 500,
              useNativeDriver: true,
            })
          ),
          Animated.sequence([
            Animated.timing(anim.scale, {
              toValue: 1.2,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(anim.scale, {
              toValue: 0.8,
              duration: 2800,
              useNativeDriver: true,
            })
          ])
        ]).start();
      }, index * 50);
    });
  };

  const resetAnimations = () => {
    scaleAnim.setValue(0);
    rotateAnim.setValue(0);
    fadeAnim.setValue(0);
    bounceAnim.setValue(0);
    setShowFireworks(false);
    setShowConfetti(false);
    
    confettiAnimations.forEach(anim => {
      anim.x.setValue(Math.random() * width);
      anim.y.setValue(-50);
      anim.rotation.setValue(0);
      anim.scale.setValue(1);
    });
    
    fireworkAnimations.forEach(anim => {
      anim.scale.setValue(0);
      anim.opacity.setValue(1);
    });
  };

  const getAchievementIcon = () => {
    switch (achievementType) {
      case 'badge':
        return '🏆';
      case 'streak':
        return '🔥';
      case 'milestone':
        return '🎯';
      case 'goal':
        return '⭐';
      default:
        return '🎉';
    }
  };

  const getAchievementTitle = () => {
    switch (achievementType) {
      case 'badge':
        return achievementData.badgeName || 'New Badge Earned!';
      case 'streak':
        return `${achievementData.streakCount || 0} Day Streak!`;
      case 'milestone':
        return `${achievementData.milestonePercentage || 0}% Complete!`;
      case 'goal':
        return 'Goal Achieved!';
      default:
        return 'Achievement Unlocked!';
    }
  };

  const getAchievementSubtitle = () => {
    switch (achievementType) {
      case 'badge':
        return achievementData.badgeDescription || 'You earned a new badge!';
      case 'streak':
        return 'Keep up the amazing consistency!';
      case 'milestone':
        return 'You\'re making great progress!';
      case 'goal':
        return achievementData.goalName || 'Congratulations on reaching your goal!';
      default:
        return 'Great job!';
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const bounce = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        {/* Fireworks */}
        {showFireworks && (
          <View style={styles.fireworksContainer}>
            {fireworkAnimations.map((anim, index) => (
              <Animated.View
                key={`firework-${index}`}
                style={[
                  styles.firework,
                  {
                    left: anim.x,
                    top: anim.y,
                    transform: [
                      { scale: anim.scale },
                    ],
                    opacity: anim.opacity,
                  }
                ]}
              >
                <Svg width="60" height="60" viewBox="0 0 60 60">
                  <Star
                    cx="30"
                    cy="30"
                    r="25"
                    fill={index % 2 === 0 ? colors.gold : colors.purple}
                    stroke="white"
                    strokeWidth="2"
                  />
                </Svg>
              </Animated.View>
            ))}
          </View>
        )}

        {/* Confetti */}
        {showConfetti && (
          <View style={styles.confettiContainer}>
            {confettiAnimations.map((anim, index) => {
              const confettiColor = [colors.gold, colors.purple, colors.pink, colors.success][index % 4];
              const confettiRotation = anim.rotation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              });
              
              return (
                <Animated.View
                  key={`confetti-${index}`}
                  style={[
                    styles.confetti,
                    {
                      backgroundColor: confettiColor,
                      transform: [
                        { translateX: anim.x },
                        { translateY: anim.y },
                        { rotate: confettiRotation },
                        { scale: anim.scale }
                      ],
                    }
                  ]}
                />
              );
            })}
          </View>
        )}

        {/* Main Achievement Display */}
        <Animated.View
          style={[
            styles.achievementContainer,
            {
              transform: [
                { scale: scaleAnim },
                { translateY: bounce }
              ],
              opacity: fadeAnim,
            }
          ]}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary, colors.purple]}
            style={styles.achievementCard}
          >
            <Animated.Text
              style={[
                styles.achievementIcon,
                {
                  transform: [{ rotate: spin }]
                }
              ]}
            >
              {getAchievementIcon()}
            </Animated.Text>
            
            <Text style={styles.achievementTitle}>
              {getAchievementTitle()}
            </Text>
            
            <Text style={styles.achievementSubtitle}>
              {getAchievementSubtitle()}
            </Text>

            {achievementData.points && (
              <View style={styles.pointsContainer}>
                <Text style={styles.pointsText}>
                  +{achievementData.points} points
                </Text>
              </View>
            )}

            {achievementData.bonus && (
              <View style={styles.bonusContainer}>
                <Text style={styles.bonusText}>
                  🎁 {achievementData.bonus}
                </Text>
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Sparkle Effects */}
        <View style={styles.sparkleContainer}>
          {Array.from({ length: 12 }).map((_, index) => (
            <SparkleEffect key={index} delay={index * 100} />
          ))}
        </View>
      </View>
    </Modal>
  );
}

function SparkleEffect({ delay }) {
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const positionX = Math.random() * width;
  const positionY = Math.random() * height;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        })
      ]).start(() => {
        // Restart animation
        setTimeout(animate, Math.random() * 2000 + 1000);
      });
    };
    
    animate();
  }, []);

  const sparkleScale = sparkleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1.5, 0],
  });

  const sparkleRotation = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <Animated.View
      style={[
        styles.sparkle,
        {
          left: positionX,
          top: positionY,
          transform: [
            { scale: sparkleScale },
            { rotate: sparkleRotation }
          ],
          opacity: sparkleAnim,
        }
      ]}
    >
      <Text style={styles.sparkleText}>✨</Text>
    </Animated.View>
  );
}

// Celebration trigger component for easy integration
export function CelebrationTrigger({ 
  children, 
  achievementType, 
  achievementData, 
  onCelebrationComplete 
}) {
  const [showCelebration, setShowCelebration] = useState(false);

  const triggerCelebration = () => {
    setShowCelebration(true);
  };

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
    onCelebrationComplete && onCelebrationComplete();
  };

  return (
    <View>
      {React.cloneElement(children, { onPress: triggerCelebration })}
      <CelebrationEffects
        visible={showCelebration}
        achievementType={achievementType}
        achievementData={achievementData}
        onComplete={handleCelebrationComplete}
      />
    </View>
  );
}

// Pre-built celebration types
export const celebrationTypes = {
  BADGE_EARNED: 'badge',
  STREAK_MILESTONE: 'streak',
  GOAL_REACHED: 'goal',
  MILESTONE_HIT: 'milestone',
  LEVEL_UP: 'level',
  FIRST_CONTRIBUTION: 'first_contribution',
  PERFECT_WEEK: 'perfect_week',
  SAVINGS_CHAMPION: 'champion'
};

// Quick celebration functions
export const quickCelebrations = {
  badgeEarned: (badgeName, badgeDescription, points = 100) => ({
    type: celebrationTypes.BADGE_EARNED,
    data: { badgeName, badgeDescription, points }
  }),
  
  streakMilestone: (streakCount, bonus) => ({
    type: celebrationTypes.STREAK_MILESTONE,
    data: { streakCount, bonus }
  }),
  
  goalReached: (goalName, amount, bonus) => ({
    type: celebrationTypes.GOAL_REACHED,
    data: { goalName, amount, bonus }
  }),
  
  milestoneHit: (percentage, poolName) => ({
    type: celebrationTypes.MILESTONE_HIT,
    data: { milestonePercentage: percentage, poolName }
  })
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementCard: {
    paddingHorizontal: 40,
    paddingVertical: 30,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  achievementIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  achievementTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  achievementSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
  },
  pointsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  bonusContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  bonusText: {
    fontSize: 14,
    color: colors.white,
  },
  fireworksContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  firework: {
    position: 'absolute',
    width: 60,
    height: 60,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  confetti: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  sparkleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  sparkle: {
    position: 'absolute',
  },
  sparkleText: {
    fontSize: 16,
  },
});
