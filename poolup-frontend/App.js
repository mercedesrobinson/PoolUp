import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, TouchableOpacity } from 'react-native';

// Import screens
import Onboarding from './screens/Onboarding';
import Pools from './screens/Pools';
import CreatePool from './screens/CreatePool';
import PoolDetail from './screens/PoolDetail';
import Chat from './screens/Chat';
import Profile from './screens/Profile';
import DebitCard from './screens/DebitCard';
import Badges from './screens/Badges';
import Leaderboard from './screens/Leaderboard';
import AvatarBuilder from './screens/AvatarBuilder';
import SoloSavings from './screens/SoloSavings';
import SocialFeed from './screens/SocialFeed';

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

// Import theme
import { colors } from './theme';

const Stack = createNativeStackNavigator();

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Something went wrong:</Text>
      <Text style={{ fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' }}>
        {error.message}
      </Text>
      <TouchableOpacity 
        onPress={resetErrorBoundary}
        style={{ backgroundColor: colors.blue, padding: 12, borderRadius: 8 }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Try again</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator 
        initialRouteName="Onboarding"
        screenOptions={{
          headerStyle: { backgroundColor: colors.blue },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      >
        <Stack.Screen name="Onboarding" component={Onboarding} options={{ headerShown: false }} />
        <Stack.Screen name="Pools" component={Pools} />
        <Stack.Screen name="CreatePool" component={CreatePool} />
        <Stack.Screen name="PoolDetail" component={PoolDetail} />
        <Stack.Screen name="Chat" component={Chat} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="DebitCard" component={DebitCard} />
        <Stack.Screen name="Badges" component={Badges} />
        <Stack.Screen name="Leaderboard" component={Leaderboard} />
        <Stack.Screen name="AvatarBuilder" component={AvatarBuilder} />
        <Stack.Screen name="SoloSavings" component={SoloSavings} />
        <Stack.Screen name="SocialFeed" component={SocialFeed} />
        
        {/* Social Features */}
        <Stack.Screen name="FriendsFeed" component={FriendsFeed} options={{ headerShown: false }} />
        <Stack.Screen name="InviteFriends" component={InviteFriends} options={{ headerShown: false }} />
        <Stack.Screen name="GroupManagement" component={GroupManagement} options={{ headerShown: false }} />
        <Stack.Screen name="PrivacySettings" component={PrivacySettings} options={{ headerShown: false }} />
        <Stack.Screen name="TransactionHistory" component={TransactionHistory} options={{ headerShown: false }} />
        <Stack.Screen name="SavingsSummary" component={SavingsSummary} options={{ headerShown: false }} />
        <Stack.Screen name="PenaltySettings" component={PenaltySettings} options={{ headerShown: false }} />
        <Stack.Screen name="RecurringPayments" component={RecurringPayments} options={{ headerShown: false }} />
        <Stack.Screen name="AccountabilityPartners" component={AccountabilityPartners} options={{ headerShown: false }} />
        <Stack.Screen name="ProfilePhotoUpload" component={ProfilePhotoUpload} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
