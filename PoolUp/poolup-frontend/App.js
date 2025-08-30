import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

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

// Import theme
import { colors } from './theme';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName="SoloSavings"
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
