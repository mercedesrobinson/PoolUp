import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'hasCompletedOnboarding';

export const onboardingService = {
  // Check if user has completed onboarding
  async hasCompletedOnboarding() {
    try {
      const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
      return completed === 'true';
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  },

  // Mark onboarding as completed
  async completeOnboarding() {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      console.log('Onboarding marked as completed');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  },

  // Reset onboarding (for testing or user logout)
  async resetOnboarding() {
    try {
      await AsyncStorage.removeItem(ONBOARDING_KEY);
      console.log('Onboarding status reset');
    } catch (error) {
      console.error('Error resetting onboarding status:', error);
    }
  },

  // Check if this is a first-time user (no previous app data)
  async isFirstTimeUser() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      // If user has no stored data, they're likely a first-time user
      return keys.length === 0 || !keys.some(key => 
        key.includes('user') || key.includes('pool') || key.includes('settings')
      );
    } catch (error) {
      console.error('Error checking first-time user status:', error);
      return true; // Default to showing onboarding if unsure
    }
  }
};

export default onboardingService;
