import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';

function LeaderboardItem({ item, rank, currentUserId }) {
  const isCurrentUser = item.id === currentUserId;
  const medalEmojis = { 1: '🥇', 2: '🥈', 3: '🥉' };
  
  return (
    <View style={{ 
      backgroundColor: isCurrentUser ? colors.blue + '20' : 'white',
      padding: 16, 
      borderRadius: radius, 
      marginBottom: 8,
      borderWidth: isCurrentUser ? 2 : 0,
      borderColor: isCurrentUser ? colors.blue : 'transparent'
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ 
          width: 40, 
          height: 40, 
          borderRadius: 20, 
          backgroundColor: rank <= 3 ? colors.purple : colors.blue,
          justifyContent: 'center', 
          alignItems: 'center',
          marginRight: 16
        }}>
          <Text style={{ fontSize: 18, color: 'white', fontWeight: '700' }}>
            {medalEmojis[rank] || `#${rank}`}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
            {item.name} {isCurrentUser && '(You)'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Text style={{ fontSize: 14, color: colors.purple, fontWeight: '600', marginRight: 16 }}>
              {item.points} points
            </Text>
            <Text style={{ fontSize: 14, color: colors.green, marginRight: 16 }}>
              ${(item.total_contributed_cents / 100).toFixed(2)} saved
            </Text>
            {item.contribution_streak > 0 && (
              <Text style={{ fontSize: 14, color: colors.coral }}>
                🔥 {item.contribution_streak} day streak
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

function ChallengeCard({ challenge }) {
  const isCompleted = challenge.is_completed;
  const progress = Math.min(100, (challenge.current_value / challenge.target_value) * 100);
  const daysLeft = Math.ceil((new Date(challenge.end_date) - new Date()) / (1000 * 60 * 60 * 24));
  
  return (
    <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 }}>
          {challenge.name}
        </Text>
        {isCompleted ? (
          <Text style={{ fontSize: 12, color: colors.green, fontWeight: '600' }}>✓ COMPLETED</Text>
        ) : (
          <Text style={{ fontSize: 12, color: colors.coral, fontWeight: '600' }}>
            {daysLeft > 0 ? `${daysLeft} days left` : 'EXPIRED'}
          </Text>
        )}
      </View>
      <Text style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>
        {challenge.description}
      </Text>
      <View style={{ height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
        <View style={{ 
          width: `${progress}%`, 
          backgroundColor: isCompleted ? colors.green : colors.blue, 
          height: '100%' 
        }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 12, color: '#666' }}>
          {challenge.current_value} / {challenge.target_value} {challenge.type === 'group_participation' ? '%' : ''}
        </Text>
        <Text style={{ fontSize: 12, color: colors.purple, fontWeight: '600' }}>
          🎁 {challenge.reward_points} points + ${(challenge.reward_bonus_cents / 100).toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

function UnlockableCard({ unlockable, progress }) {
  const isUnlocked = unlockable.is_unlocked || progress >= unlockable.unlock_percentage;
  
  return (
    <View style={{ 
      backgroundColor: isUnlocked ? 'white' : '#f8f9fa',
      padding: 16, 
      borderRadius: radius, 
      marginBottom: 12,
      borderWidth: isUnlocked ? 2 : 1,
      borderColor: isUnlocked ? colors.green : '#e9ecef'
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ 
          width: 50, 
          height: 50, 
          borderRadius: 25, 
          backgroundColor: isUnlocked ? colors.green : '#dee2e6',
          justifyContent: 'center', 
          alignItems: 'center',
          marginRight: 16
        }}>
          <Text style={{ fontSize: 20 }}>
            {unlockable.type === 'playlist' ? '🎵' : 
             unlockable.type === 'facts' ? '📚' : 
             unlockable.type === 'tips' ? '💡' : '🗺️'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 }}>
              {unlockable.name}
            </Text>
            {isUnlocked && (
              <Text style={{ fontSize: 12, color: colors.green, fontWeight: '600' }}>
                ✓ UNLOCKED
              </Text>
            )}
          </View>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
            {unlockable.description}
          </Text>
          <Text style={{ fontSize: 12, color: colors.blue, fontWeight: '600' }}>
            Unlock at {unlockable.unlock_percentage}% progress
          </Text>
          {isUnlocked && unlockable.unlocked_at && (
            <Text style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              Unlocked on {new Date(unlockable.unlocked_at).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

export default function Leaderboard({ navigation, route }) {
  const { user, poolId, poolName } = route.params;
  const [leaderboard, setLeaderboard] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [unlockables, setUnlockables] = useState([]);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('leaderboard');

  const loadData = async () => {
    try {
      const [leaderboardData, challengesData, unlockablesData] = await Promise.all([
        api.getLeaderboard(poolId),
        api.getChallenges(poolId),
        api.getUnlockables(poolId)
      ]);
      setLeaderboard(leaderboardData);
      setChallenges(challengesData);
      setUnlockables(unlockablesData.unlockables);
      setProgress(unlockablesData.progress);
    } catch (error) {
      console.error('Failed to load leaderboard data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const tabs = [
    { key: 'leaderboard', title: '🏆 Rankings', count: leaderboard.length },
    { key: 'challenges', title: '🎯 Challenges', count: challenges.filter(c => !c.is_completed).length },
    { key: 'unlockables', title: '🎁 Rewards', count: unlockables.filter(u => u.is_unlocked).length }
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FAFCFF' }}>
      {/* Header */}
      <View style={{ backgroundColor: colors.primary, paddingTop: 80, paddingBottom: 20, paddingHorizontal: 24 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
          <Text style={{ color: 'white', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: 'white', fontSize: 24, fontWeight: '700' }}>Leaderboard</Text>
        <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 4 }}>
          {poolName}
        </Text>
        <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 4 }}>
          {progress}% Complete
        </Text>
        <View style={{ 
          height: 8, 
          backgroundColor: 'rgba(255,255,255,0.3)', 
          borderRadius: 4, 
          marginTop: 12,
          overflow: 'hidden'
        }}>
          <View style={{ 
            width: `${progress}%`, 
            backgroundColor: 'white', 
            height: '100%' 
          }} />
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={{ flexDirection: 'row', padding: 16, paddingBottom: 0 }}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              backgroundColor: activeTab === tab.key ? colors.blue : 'white',
              padding: 12,
              borderRadius: radius,
              marginHorizontal: 4,
              alignItems: 'center'
            }}
          >
            <Text style={{
              color: activeTab === tab.key ? 'white' : colors.text,
              fontWeight: '600',
              fontSize: 14
            }}>
              {tab.title}
            </Text>
            {tab.count > 0 && (
              <Text style={{
                color: activeTab === tab.key ? 'white' : colors.blue,
                fontSize: 12,
                marginTop: 2
              }}>
                {tab.count}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={{ padding: 24, paddingTop: 16 }}>
        {activeTab === 'leaderboard' && (
          <>
            {leaderboard.length > 0 ? (
              <FlatList
                data={leaderboard}
                keyExtractor={item => item.id}
                renderItem={({ item, index }) => (
                  <LeaderboardItem item={item} rank={index + 1} currentUserId={user.id} />
                )}
                scrollEnabled={false}
              />
            ) : (
              <View style={{ backgroundColor: 'white', padding: 24, borderRadius: radius, alignItems: 'center' }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>🏆</Text>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 8 }}>
                  No Rankings Yet
                </Text>
                <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
                  Start contributing to see yourself on the leaderboard!
                </Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'challenges' && (
          <>
            {challenges.length > 0 ? (
              challenges.map(challenge => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))
            ) : (
              <View style={{ backgroundColor: 'white', padding: 24, borderRadius: radius, alignItems: 'center' }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>🎯</Text>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 8 }}>
                  No Active Challenges
                </Text>
                <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
                  New challenges will appear as your pool grows!
                </Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'unlockables' && (
          <>
            {unlockables.length > 0 ? (
              unlockables.map(unlockable => (
                <UnlockableCard key={unlockable.id} unlockable={unlockable} progress={progress} />
              ))
            ) : (
              <View style={{ backgroundColor: 'white', padding: 24, borderRadius: radius, alignItems: 'center' }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>🎁</Text>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 8 }}>
                  No Rewards Available
                </Text>
                <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
                  Add a destination to your pool to unlock travel rewards!
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}
