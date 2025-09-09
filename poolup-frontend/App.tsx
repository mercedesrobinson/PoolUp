import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity } from 'react-native';

// Import screens
import Onboarding from './screens/Onboarding';
import AuthGate from './screens/AuthGate';
import Pools from './screens/Pools';
import CreatePool from './screens/CreatePool';
import Profile from './screens/Profile';
import DebitCard from './screens/DebitCard';
import Badges from './screens/Badges';
import Leaderboard from './screens/Leaderboard';
import SoloSavings from './screens/SoloSavings';

// Social Features
import FriendsFeed from './screens/FriendsFeed';
import InviteFriends from './screens/InviteFriends';
import GroupManagement from './screens/GroupManagement';
import PrivacySettings from './screens/PrivacySettings';
import TransactionHistory from './screens/TransactionHistory';
import SavingsSummary from './screens/SavingsSummary';
import PenaltySettings from './screens/PenaltySettings';
import RecurringPayments from './screens/RecurringPayments';
import AccountabilityPartners from './screens/AccountabilityPartners';
import ProfilePhotoUpload from './screens/ProfilePhotoUpload';
import Settings from './screens/Settings';
import PaymentMethods from './screens/PaymentMethods';
import LinkPaymentMethod from './screens/LinkPaymentMethod';
import PeerTransfer from './screens/PeerTransfer';
import ContributionSettings from './screens/ContributionSettings';
import SoloGoalPrivacy from './screens/SoloGoalPrivacy';
import NotificationSettings from './screens/NotificationSettings';
import GroupActivity from './screens/GroupActivity';
import PremiumUpgrade from './screens/PremiumUpgrade';
import ProgressSharingSimple from './screens/ProgressSharingSimple';
import SocialProofSimple from './screens/SocialProofSimple';
// Additional screens wired for navigation targets
import Chat from './screens/Chat';
import PoolDetail from './screens/PoolDetail';
import Legal from './screens/Legal';

// Import theme
import { colors } from './theme';

// Type definitions
export type RootStackParamList = {
  AuthGate: undefined;
  Onboarding: undefined;
  MainTabs: { user?: any } | undefined;
  CreatePool: undefined;
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
  PremiumUpgrade: undefined;
  ProgressSharingSimple: undefined;
  SoloSavings: undefined;
  Settings: undefined;
  Pools: undefined;
  SocialProofSimple: undefined;
  // Newly added targets referenced elsewhere
  Chat: undefined;
  PoolDetail: undefined;
  Legal: undefined;
};

export type TabParamList = {
  Goals: undefined;
  Feed: undefined;
  Profile: undefined;
  More: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Main Tab Navigator
function MainTabs({ route }: any): React.JSX.Element {
  const user = route?.params?.user;
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor: '#e9ecef',
          paddingBottom: 20,
          paddingTop: 2,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 0,
          paddingBottom: 4,
        },
      }}
    >
      <Tab.Screen
        name='Goals'
        component={Pools}
        initialParams={{ user }}
        options={{
          tabBarIcon: ({ color }: { color: string }) => <Text style={{ fontSize: 25, color }}>🎯</Text>,
        }}
      />
      <Tab.Screen
        name='Feed'
        component={SoloSavings}
        initialParams={{ user }}
        options={{
          tabBarIcon: ({ color }: { color: string }) => <Text style={{ fontSize: 25, color }}>👥</Text>,
        }}
      />
      <Tab.Screen
        name='Profile'
        component={Profile}
        initialParams={{ user }}
        options={{
          tabBarIcon: ({ color }: { color: string }) => <Text style={{ fontSize: 25, color }}>👤</Text>,
        }}
      />
      <Tab.Screen
        name='More'
        component={Settings}
        initialParams={{ user }}
        options={{
          tabBarIcon: ({ color }: { color: string }) => <Text style={{ fontSize: 25, color }}>⚙️</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <StatusBar style='auto' />
      <Stack.Navigator initialRouteName='AuthGate' screenOptions={{ headerShown: false }}>
        <Stack.Screen name='AuthGate' component={AuthGate} />
        <Stack.Screen name='Onboarding' component={Onboarding} />
        <Stack.Screen name='MainTabs' component={MainTabs} />
        <Stack.Screen name='CreatePool' component={CreatePool} />
        <Stack.Screen name='Leaderboard' component={Leaderboard} />
        <Stack.Screen name='Badges' component={Badges} />
        <Stack.Screen name='DebitCard' component={DebitCard} />
        <Stack.Screen name='FriendsFeed' component={FriendsFeed} />
        <Stack.Screen name='InviteFriends' component={InviteFriends} />
        <Stack.Screen name='GroupManagement' component={GroupManagement} />
        <Stack.Screen name='PrivacySettings' component={PrivacySettings} />
        <Stack.Screen name='TransactionHistory' component={TransactionHistory} />
        <Stack.Screen name='SavingsSummary' component={SavingsSummary} />
        <Stack.Screen name='PenaltySettings' component={PenaltySettings} />
        <Stack.Screen name='RecurringPayments' component={RecurringPayments} />
        <Stack.Screen name='AccountabilityPartners' component={AccountabilityPartners} />
        <Stack.Screen name='ProfilePhotoUpload' component={ProfilePhotoUpload} />
        <Stack.Screen name='PaymentMethods' component={PaymentMethods} />
        <Stack.Screen name='LinkPaymentMethod' component={LinkPaymentMethod} options={{ headerShown: false }} />
        <Stack.Screen name='PeerTransfer' component={PeerTransfer} options={{ headerShown: false }} />
        <Stack.Screen name='ContributionSettings' component={ContributionSettings} options={{ headerShown: false }} />
        <Stack.Screen name='SoloGoalPrivacy' component={SoloGoalPrivacy} options={{ headerShown: false }} />
        <Stack.Screen name='NotificationSettings' component={NotificationSettings} />
        <Stack.Screen name='GroupActivity' component={GroupActivity} />
        <Stack.Screen name='PremiumUpgrade' component={PremiumUpgrade} />
        <Stack.Screen name='ProgressSharingSimple' component={ProgressSharingSimple} />
        <Stack.Screen name='SoloSavings' component={SoloSavings} />
        <Stack.Screen name='Settings' component={Settings} />
        <Stack.Screen name='Pools' component={Pools} />
        <Stack.Screen name='SocialProofSimple' component={SocialProofSimple} />
        <Stack.Screen name='Chat' component={Chat} />
        <Stack.Screen name='PoolDetail' component={PoolDetail} />
        <Stack.Screen name='Legal' component={Legal} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
