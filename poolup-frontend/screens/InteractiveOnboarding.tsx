import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import onboardingService from '../services/onboarding';

const { width, height } = Dimensions.get('window');

const InteractiveOnboarding = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const onboardingSteps = [
    {
      id: 'welcome',
      title: 'Welcome to PoolUp! 🎉',
      subtitle: 'Where saving money becomes social and fun',
      description: 'Join thousands of savers who are achieving their financial goals together through the power of community.',
      gradient: ['#4CAF50', '#45A049'],
      icon: '💰',
      interactive: false,
      tips: [
        '78% success rate vs 23% saving alone',
        'Average $2,847 saved per user',
        'Social accountability increases motivation'
      ]
    },
    {
      id: 'goals',
      title: 'Set Your Savings Goals 🎯',
      subtitle: 'Dream big, save smart',
      description: 'Create specific, time-bound goals that matter to you. Whether it\'s an emergency fund, vacation, or new car - we\'ll help you get there.',
      gradient: ['#2196F3', '#1976D2'],
      icon: '🎯',
      interactive: true,
      demoGoal: {
        name: 'Emergency Fund',
        amount: 5000,
        timeframe: '12 months',
        monthly: 417
      }
    },
    {
      id: 'groups',
      title: 'Join or Create Groups 👥',
      subtitle: 'Saving is better together',
      description: 'Pool your savings with friends, family, or like-minded savers. Group members motivate each other and celebrate wins together.',
      gradient: ['#9C27B0', '#7B1FA2'],
      icon: '👥',
      interactive: true,
      groupBenefits: [
        'Shared accountability',
        'Group challenges & rewards',
        'Peer encouragement',
        'Higher success rates'
      ]
    },
    {
      id: 'streaks',
      title: 'Build Saving Streaks 🔥',
      subtitle: 'Consistency is key',
      description: 'Set up your payday schedule and build streaks by contributing regularly. Our smart reminders align with your actual pay dates.',
      gradient: ['#FF6B6B', '#FF5252'],
      icon: '🔥',
      interactive: true,
      streakDemo: {
        current: 7,
        longest: 23,
        nextPayday: 'Friday'
      }
    },
    {
      id: 'features',
      title: 'Powerful Features 🚀',
      subtitle: 'Everything you need to succeed',
      description: 'Smart calculators, progress sharing, notifications, and gamification elements designed to keep you motivated.',
      gradient: ['#FF9800', '#F57C00'],
      icon: '🚀',
      interactive: false,
      features: [
        { icon: '📊', name: 'Smart Calculator', desc: 'Auto-adjusts based on group size' },
        { icon: '🔔', name: 'Smart Reminders', desc: 'Aligned with your payday' },
        { icon: '📱', name: 'Progress Sharing', desc: 'Celebrate and inspire others' },
        { icon: '🏆', name: 'Badges & Rewards', desc: 'Gamified saving experience' }
      ]
    },
    {
      id: 'ready',
      title: 'Ready to Start Saving? 💪',
      subtitle: 'Your financial future awaits',
      description: 'You\'re all set! Let\'s create your first savings goal and start building wealth together.',
      gradient: ['#4CAF50', '#45A049'],
      icon: '💪',
      interactive: false,
      cta: true
    }
  ];

  const nextStep = async () => {
    if (currentStep < onboardingSteps.length - 1) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      setCurrentStep(currentStep + 1);
      scrollViewRef.current?.scrollTo({ x: (currentStep + 1) * width, animated: true });
    } else {
      // Complete onboarding and mark as completed
      await onboardingService.completeOnboarding();
      navigation.replace('Pools');
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      scrollViewRef.current?.scrollTo({ x: (currentStep - 1) * width, animated: true });
    }
  };

  const skipOnboarding = async () => {
    // Mark onboarding as completed even if skipped
    await onboardingService.completeOnboarding();
    navigation.replace('Pools');
  };

  const renderStep = (step, index) => {
    const isActive = index === currentStep;
    
    return (
      <View key={step.id} style={styles.stepContainer}>
        <LinearGradient
          colors={step.gradient}
          style={styles.stepBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.stepContent}>
            {/* Header */}
            <View style={styles.stepHeader}>
              <Text style={styles.stepIcon}>{step.icon}</Text>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
            </View>

            {/* Interactive Content */}
            <Animated.View style={[styles.interactiveArea, { opacity: fadeAnim }]}>
              {step.id === 'welcome' && (
                <View style={styles.welcomeContent}>
                  {step.tips.map((tip, idx) => (
                    <View key={idx} style={styles.tipItem}>
                      <Text style={styles.tipBullet}>✓</Text>
                      <Text style={styles.tipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              )}

              {step.id === 'goals' && (
                <View style={styles.goalDemo}>
                  <View style={styles.demoCard}>
                    <Text style={styles.demoTitle}>{step.demoGoal.name}</Text>
                    <Text style={styles.demoAmount}>${step.demoGoal.amount.toLocaleString()}</Text>
                    <Text style={styles.demoDetails}>
                      ${step.demoGoal.monthly}/month for {step.demoGoal.timeframe}
                    </Text>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: '30%' }]} />
                    </View>
                    <Text style={styles.progressText}>30% Complete</Text>
                  </View>
                </View>
              )}

              {step.id === 'groups' && (
                <View style={styles.groupDemo}>
                  {step.groupBenefits.map((benefit, idx) => (
                    <View key={idx} style={styles.benefitItem}>
                      <Text style={styles.benefitIcon}>👥</Text>
                      <Text style={styles.benefitText}>{benefit}</Text>
                    </View>
                  ))}
                </View>
              )}

              {step.id === 'streaks' && (
                <View style={styles.streakDemo}>
                  <View style={styles.streakCard}>
                    <Text style={styles.streakNumber}>{step.streakDemo.current}</Text>
                    <Text style={styles.streakLabel}>Day Streak</Text>
                  </View>
                  <View style={styles.streakInfo}>
                    <Text style={styles.streakText}>
                      🏆 Best: {step.streakDemo.longest} days
                    </Text>
                    <Text style={styles.streakText}>
                      📅 Next: {step.streakDemo.nextPayday}
                    </Text>
                  </View>
                </View>
              )}

              {step.id === 'features' && (
                <View style={styles.featuresGrid}>
                  {step.features.map((feature, idx) => (
                    <View key={idx} style={styles.featureCard}>
                      <Text style={styles.featureIcon}>{feature.icon}</Text>
                      <Text style={styles.featureName}>{feature.name}</Text>
                      <Text style={styles.featureDesc}>{feature.desc}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Animated.View>

            {/* Description */}
            <Text style={styles.stepDescription}>{step.description}</Text>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const currentStepData = onboardingSteps[currentStep];

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={skipOnboarding}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Steps Indicator */}
      <View style={styles.stepsIndicator}>
        {onboardingSteps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.stepDot,
              index === currentStep && styles.stepDotActive,
              index < currentStep && styles.stepDotCompleted
            ]}
          />
        ))}
      </View>

      {/* Content */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={styles.scrollView}
      >
        {onboardingSteps.map((step, index) => renderStep(step, index))}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        {currentStep > 0 && (
          <TouchableOpacity style={styles.navButton} onPress={prevStep}>
            <Text style={styles.navButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.navSpacer} />
        
        <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
          <Text style={styles.nextButtonText}>
            {currentStepData.cta ? 'Get Started!' : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  skipText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  stepsIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingBottom: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  stepDotActive: {
    backgroundColor: 'white',
    width: 24,
  },
  stepDotCompleted: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  scrollView: {
    flex: 1,
  },
  stepContainer: {
    width,
    height,
  },
  stepBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 140,
    paddingBottom: 120,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  stepIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  interactiveArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 30,
  },
  stepDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  welcomeContent: {
    alignItems: 'flex-start',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  tipBullet: {
    fontSize: 18,
    color: 'white',
    marginRight: 15,
    fontWeight: 'bold',
  },
  tipText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    flex: 1,
  },
  goalDemo: {
    alignItems: 'center',
  },
  demoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
    minWidth: 250,
  },
  demoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  demoAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  demoDetails: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
  },
  progressBar: {
    width: 200,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  groupDemo: {
    alignItems: 'flex-start',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  benefitIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  benefitText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    flex: 1,
  },
  streakDemo: {
    alignItems: 'center',
  },
  streakCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
  streakLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  streakInfo: {
    alignItems: 'center',
  },
  streakText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 15,
    margin: 8,
    alignItems: 'center',
    width: 140,
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  featureName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 50,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
  },
  navButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  navSpacer: {
    flex: 1,
  },
  nextButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderRadius: 25,
  },
  nextButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default InteractiveOnboarding;
