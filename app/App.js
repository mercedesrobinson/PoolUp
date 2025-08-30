import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Onboarding from './screens/Onboarding';
import CreatePool from './screens/CreatePool';
import Pools from './screens/Pools';
import PoolDetail from './screens/PoolDetail';
import Chat from './screens/Chat';
import Profile from './screens/Profile';
import DebitCard from './screens/DebitCard';
import Badges from './screens/Badges';
import Leaderboard from './screens/Leaderboard';
import AvatarBuilder from './screens/AvatarBuilder';
import SoloSavings from './screens/SoloSavings';
import SocialFeed from './screens/SocialFeed';
import { colors } from './theme';

const Stack = createNativeStackNavigator();

export default function App(){
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShadowVisible:false, headerTintColor: colors.text }}>
        <Stack.Screen name="Onboarding" component={Onboarding} options={{ headerShown:false }} />
        <Stack.Screen name="Pools" component={Pools} options={{ title:'Your Pools' }} />
        <Stack.Screen name="CreatePool" component={CreatePool} options={{ title:'Create Pool' }} />
        <Stack.Screen name="PoolDetail" component={PoolDetail} options={{ title:'Pool' }} />
        <Stack.Screen name="Chat" component={Chat} />
        <Stack.Screen name="Profile" component={Profile} options={{ title:'Profile' }} />
        <Stack.Screen name="DebitCard" component={DebitCard} options={{ title:'PoolUp Card' }} />
        <Stack.Screen name="Badges" component={Badges} options={{ title:'Badges' }} />
        <Stack.Screen name="Leaderboard" component={Leaderboard} options={{ title:'Leaderboard' }} />
        <Stack.Screen name="AvatarBuilder" component={AvatarBuilder} options={{ title:'Avatar Builder', headerShown: false }} />
        <Stack.Screen name="SoloSavings" component={SoloSavings} options={{ title:'Solo Savings', headerShown: false }} />
        <Stack.Screen name="SocialFeed" component={SocialFeed} options={{ title:'Social', headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
