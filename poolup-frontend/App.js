import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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

// Import theme
import { colors } from './theme';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName="Onboarding" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={Onboarding} />
        <Stack.Screen name="Pools" component={Pools} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="CreatePool" component={CreatePool} />
        <Stack.Screen name="SoloSavings" component={SoloSavings} />
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
        <Stack.Screen name="Settings" component={Settings} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
