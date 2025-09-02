import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'hasCompletedOnboarding';

interface OnboardingService {
  hasCompletedOnboarding(): Promise<boolean>;
  completeOnboarding(): Promise<void>;
  resetOnboarding(): Promise<void>;
  isFirstTimeUser(): Promise<boolean>;
}

export const onboardingService: OnboardingService = {
  // Check if user has completed onboarding
  async hasCompletedOnboarding(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
      return completed === 'true';
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  },

  // Mark onboarding as completed
  async completeOnboarding(): Promise<void> {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      console.log('Onboarding marked as completed');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  },

  // Reset onboarding (for testing or user logout)
  async resetOnboarding(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ONBOARDING_KEY);
      console.log('Onboarding status reset');
    } catch (error) {
      console.error('Error resetting onboarding status:', error);
    }
  },

  // Check if this is a first-time user (no previous app data)
  async isFirstTimeUser(): Promise<boolean> {
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
