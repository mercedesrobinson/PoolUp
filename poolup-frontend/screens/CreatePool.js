import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';

export default function CreatePool({ navigation, route }){
  const { user } = route.params;
  const [name, setName] = useState('');
  const [goalCents, setGoalCents] = useState('');
  const [destination, setDestination] = useState('');
  const [tripDate, setTripDate] = useState('');
  const [poolType, setPoolType] = useState(route.params?.poolType || 'group');

  const create = async ()=>{
    try {
      if(!name.trim()) return Alert.alert('Error','Pool name required');
      const goal = Math.round(parseFloat(goalCents) * 100);
      if(goal <= 0) return Alert.alert('Error','Valid goal amount required');
      
      await api.createPool(user.id, name.trim(), goal, destination.trim(), tripDate, poolType);
      const successMessage = poolType === 'solo' 
        ? 'Solo goal created! 🎯\n\n• Personal challenges activated\n• Public encouragement enabled\n• Streak tracking started'
        : 'Pool created with gamification features! 🎉\n\n• Challenges activated\n• Unlockables ready\n• Leaderboard initialized';
      Alert.alert('Success!', successMessage);
      navigation.goBack();
    } catch (error) {
      console.log('Create pool error:', error);
      Alert.alert('Error', 'Failed to create pool. Please try again.');
    }
  };

  return (
    <ScrollView style={{ flex:1, backgroundColor:'#FAFCFF' }}>
      <View style={{ backgroundColor: colors.primary, paddingTop: 80, paddingBottom: 20, paddingHorizontal: 24 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
          <Text style={{ color: 'white', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: 'white', fontSize: 24, fontWeight: '700' }}>Create Pool</Text>
        <Text style={{ color: 'white', fontSize: 16, opacity: 0.9, marginTop: 4 }}>
          Start your savings journey
        </Text>
      </View>
      <View style={{ padding: 24 }}>
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize:18, fontWeight:'700', color: colors.text, marginBottom:12 }}>Pool Type</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity 
              style={[
                { flex: 1, padding: 15, borderRadius: radius.md, borderWidth: 2, alignItems: 'center' },
                poolType === 'group' ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: '#fff', borderColor: '#ddd' }
              ]}
              onPress={() => setPoolType('group')}
            >
              <Text style={{ fontSize: 20, marginBottom: 5 }}>👥</Text>
              <Text style={[{ fontWeight: '600' }, poolType === 'group' ? { color: '#fff' } : { color: colors.text }]}>
                Group Pool
              </Text>
              <Text style={[{ fontSize: 12, textAlign: 'center' }, poolType === 'group' ? { color: '#fff' } : { color: colors.textSecondary }]}>
                Save with friends
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                { flex: 1, padding: 15, borderRadius: radius.md, borderWidth: 2, alignItems: 'center' },
                poolType === 'solo' ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: '#fff', borderColor: '#ddd' }
              ]}
              onPress={() => setPoolType('solo')}
            >
              <Text style={{ fontSize: 20, marginBottom: 5 }}>🎯</Text>
              <Text style={[{ fontWeight: '600' }, poolType === 'solo' ? { color: '#fff' } : { color: colors.text }]}>
                Solo Goal
              </Text>
              <Text style={[{ fontSize: 12, textAlign: 'center' }, poolType === 'solo' ? { color: '#fff' } : { color: colors.textSecondary }]}>
                Personal accountability
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={{ fontSize:18, fontWeight:'700', color: colors.text, marginBottom:8 }}>
          {poolType === 'solo' ? 'Goal Name' : 'Pool Name'}
        </Text>
        <TextInput 
          value={name} 
          onChangeText={setName} 
          style={{ backgroundColor:'white', padding:16, borderRadius:radius, marginBottom:18, fontSize:16 }} 
          placeholder="e.g. Tokyo Trip 2024" 
        />
        
        <Text style={{ fontSize:18, fontWeight:'700', color: colors.text, marginBottom:8 }}>Goal Amount</Text>
        <TextInput 
          value={goalCents} 
          onChangeText={setGoalCents} 
          keyboardType="numeric" 
          style={{ backgroundColor:'white', padding:16, borderRadius:radius, marginBottom:18, fontSize:16 }} 
          placeholder="1000" 
        />

        <Text style={{ fontSize:18, fontWeight:'700', color: colors.text, marginBottom:8 }}>
          🌍 Destination (Optional)
        </Text>
        <TextInput 
          value={destination} 
          onChangeText={setDestination} 
          style={{ backgroundColor:'white', padding:16, borderRadius:radius, marginBottom:18, fontSize:16 }} 
          placeholder="e.g. Tokyo, Japan" 
        />
        <Text style={{ fontSize:12, color:'#666', marginBottom:18, marginTop:-12 }}>
          Adding a destination unlocks travel-themed rewards and content!
        </Text>

        <Text style={{ fontSize:18, fontWeight:'700', color: colors.text, marginBottom:8 }}>
          📅 Trip Date (Optional)
        </Text>
        <TextInput 
          value={tripDate} 
          onChangeText={setTripDate} 
          style={{ backgroundColor:'white', padding:16, borderRadius:radius, marginBottom:24, fontSize:16 }} 
          placeholder="e.g. 2024-12-25" 
        />
        <Text style={{ fontSize:12, color:'#666', marginBottom:24, marginTop:-18 }}>
          Format: YYYY-MM-DD
        </Text>

        {/* Gamification Preview */}
        <View style={{ backgroundColor: colors.blue + '20', padding: 16, borderRadius: radius, marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
            🎮 Gamification Features Included:
          </Text>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>• Team challenges with bonus rewards</Text>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>• Streak tracking and badges</Text>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>• Leaderboards and social competition</Text>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>• Progress unlockables and milestones</Text>
          {destination && <Text style={{ fontSize: 14, color: colors.green, marginTop: 8 }}>✨ Travel rewards enabled for {destination}!</Text>}
        </View>
        
        {poolType === 'group' && (
          <ScrollView style={{ backgroundColor: '#E8F5E8', padding: 16, borderRadius: radius, marginBottom: 16, maxHeight: 200 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
              👥 Group Pool Features:
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>• Invite friends after creation</Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>• Shared progress tracking</Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>• Team challenges and rewards</Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>• Group chat and encouragement</Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>• Leaderboards and social competition</Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>• Progress unlockables and milestones</Text>
            <Text style={{ fontSize: 14, color: '#666' }}>• Streak tracking and badges</Text>
          </ScrollView>
        )}
        
        {poolType === 'group' && (
          <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius, marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
              👥 Add Members (Optional)
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>
              You can invite friends now or add them later
            </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('InviteFriends', { poolName: name || 'New Pool' })}
              style={{ backgroundColor: colors.blue, padding: 12, borderRadius: radius, alignItems: 'center' }}
            >
              <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                📧 Send Invites Now
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity onPress={create} style={{ backgroundColor: colors.purple, padding:16, borderRadius:radius, alignItems:'center' }}>
          <Text style={{ color:'white', fontSize:18, fontWeight:'700' }}>
            {poolType === 'group' ? 'Create Pool' : 'Create Solo Goal'}
          </Text>
        </TouchableOpacity>
        
        {poolType === 'group' && (
          <View style={{ backgroundColor: colors.green + '20', padding: 16, borderRadius: radius, marginTop: 12 }}>
            <Text style={{ fontSize: 14, color: colors.green, textAlign: 'center', fontWeight: '500' }}>
              💡 After creating your pool, you can invite more friends anytime from the pool details page
            </Text>
          </View>
        )}

        {poolType === 'solo' && (
          <TouchableOpacity 
            onPress={() => navigation.navigate('AccountabilityPartners')}
            style={{ backgroundColor: colors.blue, padding:16, borderRadius:radius, alignItems:'center', marginTop: 12 }}
          >
            <Text style={{ color:'white', fontSize:16, fontWeight:'600' }}>
              🤝 Add Accountability Partners
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}
