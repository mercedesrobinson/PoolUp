import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import onboardingService from '../services/onboarding';

const AppInitializer = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      // Check if user has completed onboarding
      const hasCompletedOnboarding = await onboardingService.hasCompletedOnboarding();
      
      // Check if user has any existing data (returning user)
      const hasUserData = await checkForExistingUserData();
      
      if (hasCompletedOnboarding || hasUserData) {
        // Returning user - go straight to main app
        navigation.replace('Pools');
      } else {
        // New user - show interactive onboarding
        navigation.replace('InteractiveOnboarding');
      }
    } catch (error) {
      console.error('Error checking app state:', error);
      // Default to onboarding if there's an error
      navigation.replace('InteractiveOnboarding');
    } finally {
      setIsLoading(false);
    }
  };

  const checkForExistingUserData = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      // Check for any user-related data that indicates they've used the app before
      return keys.some(key => 
        key.includes('user') || 
        key.includes('pool') || 
        key.includes('settings') ||
        key.includes('notification') ||
        key.includes('payday')
      );
    } catch (error) {
      console.error('Error checking user data:', error);
      return false;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>PoolUp</Text>
        <Text style={styles.subtitle}>Loading...</Text>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
  },
  loadingText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default AppInitializer;
