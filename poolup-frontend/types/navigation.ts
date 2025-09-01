import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { User, Pool, DebitCard } from './api';

// Root Stack Navigation Types
export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  CreatePool: undefined;
  Leaderboard: undefined;
  Badges: undefined;
  DebitCard: { user: User; card: DebitCard };
  FriendsFeed: undefined;
  InviteFriends: undefined;
  GroupManagement: undefined;
  PrivacySettings: undefined;
  TransactionHistory: undefined;
  SavingsSummary: undefined;
  PenaltySettings: undefined;
  RecurringPayments: undefined;
  AccountabilityPartners: undefined;
  ProfilePhotoUpload: undefined;
  PaymentMethods: undefined;
  LinkPaymentMethod: undefined;
  PeerTransfer: undefined;
  ContributionSettings: undefined;
  SoloGoalPrivacy: undefined;
  NotificationSettings: undefined;
  GroupActivity: undefined;
  PremiumUpgrade: undefined;
  ProgressSharingSimple: undefined;
  SoloSavings: undefined;
  Settings: undefined;
  Pools: undefined;
  SocialProofSimple: undefined;
};

// Tab Navigation Types
export type TabParamList = {
  Goals: undefined;
  Feed: undefined;
  Profile: undefined;
  More: undefined;
};

// Navigation Props
export type RootStackNavigationProp<T extends keyof RootStackParamList> = 
  NativeStackNavigationProp<RootStackParamList, T>;

export type RootStackRouteProp<T extends keyof RootStackParamList> = 
  RouteProp<RootStackParamList, T>;

// Screen Props
export interface ScreenProps<T extends keyof RootStackParamList> {
  navigation: RootStackNavigationProp<T>;
  route: RootStackRouteProp<T>;
}
