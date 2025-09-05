import { NavigatorScreenParams } from '@react-navigation/native';
import { Pool, User } from './index';

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: { user: User };
  Profile: { user: User };
  CreatePool: { user: User };
  PoolDetail: { user: User; pool: Pool };
  Chat: { user: User; poolId: string };
  PremiumUpgrade: { user: User };
  DebitCard: { user: User; card: any };
  Settings: { user?: User };
  SavingsSummary: { userId?: string };
  TransactionHistory: { userId?: string };
  PaymentMethods: undefined;
  NotificationSettings: undefined;
  ProgressSharingSimple: undefined;
  SocialProofSimple: undefined;
  GroupManagement: undefined;
  PrivacySettings: undefined;
  PenaltySettings: undefined;
  RecurringPayments: undefined;
  AccountabilityPartners: undefined;
  ProfilePhotoUpload: undefined;
  LinkPaymentMethod: undefined;
  PeerTransfer: undefined;
  ContributionSettings: { userId?: string };
  SoloGoalPrivacy: undefined;
  GroupActivity: undefined;
  Pools: undefined;
  FeedbackForm: { type: string };
  HelpCenter: undefined;
  Legal: { type: string };
  About: undefined;
  Badges: { user: User };
  Leaderboard: { user: User };
  FriendsFeed: undefined;
  InviteFriends: { poolName?: string };
  SocialFeed: undefined;
  WithdrawFunds: { poolId: string; userId?: string };
  InteractiveOnboarding: undefined;
  AppInitializer: undefined;
};

export type MainTabParamList = {
  Goals: undefined;
  Feed: undefined;
  Profile: undefined;
  More: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
