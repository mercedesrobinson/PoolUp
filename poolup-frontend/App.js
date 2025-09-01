import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity } from 'react-native';

// Import screens
import Onboarding from './screens/Onboarding';
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

// Import theme
import { colors } from './theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e9ecef',
          paddingBottom: 8,
          paddingTop: 8,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen 
        name="Goals" 
        component={Pools}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>🎯</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Feed" 
        component={SoloSavings}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>👥</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={Profile}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>👤</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="More" 
        component={Settings}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName="Onboarding" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={Onboarding} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="CreatePool" component={CreatePool} />
        <Stack.Screen name="Leaderboard" component={Leaderboard} />
        <Stack.Screen name="Badges" component={Badges} />
        <Stack.Screen name="DebitCard" component={DebitCard} />
        <Stack.Screen name="FriendsFeed" component={FriendsFeed} />
        <Stack.Screen name="InviteFriends" component={InviteFriends} />
        <Stack.Screen name="GroupManagement" component={GroupManagement} />
        <Stack.Screen name="PrivacySettings" component={PrivacySettings} />
        <Stack.Screen name="TransactionHistory" component={TransactionHistory} />
        <Stack.Screen name="SavingsSummary" component={SavingsSummary} />
        <Stack.Screen name="PenaltySettings" component={PenaltySettings} />
        <Stack.Screen name="RecurringPayments" component={RecurringPayments} />
        <Stack.Screen name="AccountabilityPartners" component={AccountabilityPartners} />
        <Stack.Screen name="ProfilePhotoUpload" component={ProfilePhotoUpload} />
        <Stack.Screen name="PaymentMethods" component={PaymentMethods} />
        <Stack.Screen name="LinkPaymentMethod" component={LinkPaymentMethod} options={{ headerShown: false }} />
        <Stack.Screen name="PeerTransfer" component={PeerTransfer} options={{ headerShown: false }} />
        <Stack.Screen name="ContributionSettings" component={ContributionSettings} options={{ headerShown: false }} />
        <Stack.Screen name="SoloGoalPrivacy" component={SoloGoalPrivacy} options={{ headerShown: false }} />
        <Stack.Screen name="NotificationSettings" component={NotificationSettings} />
        <Stack.Screen name="GroupActivity" component={GroupActivity} />
        <Stack.Screen name="PremiumUpgrade" component={PremiumUpgrade} />
        <Stack.Screen name="ProgressSharingSimple" component={ProgressSharingSimple} />
        <Stack.Screen name="SoloSavings" component={SoloSavings} />
        <Stack.Screen name="Settings" component={Settings} />
        <Stack.Screen name="SocialProofSimple" component={SocialProofSimple} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
