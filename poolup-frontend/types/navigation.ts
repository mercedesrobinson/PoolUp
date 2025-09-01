import { NavigatorScreenParams } from '@react-navigation/native';
import { Pool, User } from './index';

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  CreatePool: undefined;
  PoolDetail: { poolId: string; pool?: Pool };
  Chat: { poolId: string; poolName: string };
  AvatarBuilder: undefined;
  SoloSavings: undefined;
  SocialFeed: undefined;
  PremiumUpgrade: undefined;
  Leaderboard: undefined;
  Badges: undefined;
  DebitCard: undefined;
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
  ProgressSharingSimple: undefined;
  Settings: undefined;
  Pools: undefined;
  SocialProofSimple: undefined;
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
