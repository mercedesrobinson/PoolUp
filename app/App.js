import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Onboarding from './screens/Onboarding';
import CreatePool from './screens/CreatePool';
import Pools from './screens/Pools';
import PoolDetail from './screens/PoolDetail';
import Chat from './screens/Chat';
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
