import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Share, Alert, SafeAreaView } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';

type ProgressSharingSimpleNavigationProp = StackNavigationProp<RootStackParamList, 'ProgressSharingSimple'>;
type ProgressSharingSimpleRouteProp = RouteProp<RootStackParamList, 'ProgressSharingSimple'>;

interface Props {
  navigation: ProgressSharingSimpleNavigationProp;
  route: ProgressSharingSimpleRouteProp;
}

interface ProgressData {
  goalName: string;
  currentAmount: number;
  targetAmount: number;
  progressPercentage: number;
  daysRemaining: number;
  streakDays: number;
  milestoneReached?: string;
}

export default function ProgressSharingSimple({ navigation, route }: Props): React.JSX.Element {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const poolId = (route.params as any)?.poolId;
  const userId = (route.params as any)?.userId || '1756612920173';

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async (): Promise<void> => {
    try {
      if (poolId) {
        const data = await api.getPoolProgress(poolId);
        setProgressData(data);
      } else {
        // Always provide mock data when no poolId
        setProgressData({
          goalName: 'Bali Adventure',
          currentAmount: 275000, // cents
          targetAmount: 500000, // cents
          progressPercentage: 55,
          daysRemaining: 45,
          streakDays: 12,
          milestoneReached: '50% Complete!'
        });
      }
    } catch (error) {
      console.error('Failed to load progress data:', error);
      // Mock data for development
      setProgressData({
        goalName: 'Bali Adventure',
        currentAmount: 275000, // cents
        targetAmount: 500000, // cents
        progressPercentage: 55,
        daysRemaining: 45,
        streakDays: 7,
        milestoneReached: '50% Complete! 🎯'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (cents: number): string => {
    return `$${(cents / 100).toLocaleString()}`;
  };

  const shareProgress = async (platform: 'general' | 'instagram' | 'twitter'): Promise<void> => {
    if (!progressData) return;

    let message = '';
    
    switch (platform) {
      case 'instagram':
        message = `🎯 ${progressData.progressPercentage}% of the way to my ${progressData.goalName} goal!\n\n💰 ${formatAmount(progressData.currentAmount)} saved so far\n🔥 ${progressData.streakDays}-day savings streak\n\nSaving with friends on @PoolUpApp makes it so much easier! #SavingsGoals #PoolUp`;
        break;
      case 'twitter':
        message = `🎯 ${progressData.progressPercentage}% of the way to my ${progressData.goalName} goal! 💰 ${formatAmount(progressData.currentAmount)} saved with a ${progressData.streakDays}-day streak 🔥 Saving with friends @PoolUpApp #SavingsGoals`;
        break;
      default:
        message = `I'm ${progressData.progressPercentage}% of the way to my ${progressData.goalName} goal! I've saved ${formatAmount(progressData.currentAmount)} so far and I'm on a ${progressData.streakDays}-day savings streak. Check out PoolUp - saving with friends makes it so much easier!`;
    }

    try {
      await Share.share({
        message,
        title: 'My Savings Progress',
      });
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share progress. Please try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, color: '#666' }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!progressData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          backgroundColor: 'white',
          borderBottomWidth: 1,
          borderBottomColor: '#e9ecef',
        }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ padding: 8, marginRight: 12 }}
          >
            <Text style={{ fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <Text style={{
            fontSize: 20,
            fontWeight: '700',
            color: '#333',
            flex: 1,
          }}>
            Share Progress
          </Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Text style={{ fontSize: 18, color: '#666', textAlign: 'center' }}>
            No progress data available
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 8, marginRight: 12 }}
        >
          <Text style={{ fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={{
          fontSize: 20,
          fontWeight: '700',
          color: '#333',
          flex: 1,
        }}>
          Share Progress
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
      >
        <View style={{
          backgroundColor: 'white',
          padding: 24,
          borderRadius: radius.medium,
          alignItems: 'center',
          marginBottom: 24,
        }}>
          <Text style={{ fontSize: 32, marginBottom: 16 }}>🎯</Text>
          <Text style={{
            fontSize: 24,
            fontWeight: '700',
            color: '#333',
            textAlign: 'center',
            marginBottom: 8,
          }}>
            {progressData.goalName}
          </Text>
          <Text style={{
            fontSize: 18,
            color: colors.primary,
            fontWeight: '600',
            marginBottom: 16,
          }}>
            {progressData.progressPercentage}% Complete
          </Text>

          <View style={{
            width: '100%',
            height: 12,
            backgroundColor: '#e9ecef',
            borderRadius: 6,
            marginBottom: 24,
          }}>
            <View style={{
              width: `${progressData.progressPercentage}%`,
              height: '100%',
              backgroundColor: colors.primary,
              borderRadius: 6,
            }} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.primary }}>
                {formatAmount(progressData.currentAmount)}
              </Text>
              <Text style={{ fontSize: 14, color: '#666' }}>Saved</Text>
            </View>
            
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#333' }}>
                {progressData.streakDays}
              </Text>
              <Text style={{ fontSize: 14, color: '#666' }}>Day Streak</Text>
            </View>
            
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#666' }}>
                {progressData.daysRemaining}
              </Text>
              <Text style={{ fontSize: 14, color: '#666' }}>Days Left</Text>
            </View>
          </View>

          {progressData.milestoneReached && (
            <View style={{
              backgroundColor: '#d4edda',
              padding: 12,
              borderRadius: radius.medium,
              marginTop: 16,
              width: '100%',
            }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#155724',
                textAlign: 'center',
              }}>
                {progressData.milestoneReached}
              </Text>
            </View>
          )}
        </View>

        <Text style={{ fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 16 }}>
          Share Your Success
        </Text>

        <TouchableOpacity
          onPress={() => shareProgress('general')}
          style={{
            backgroundColor: colors.primary,
            padding: 16,
            borderRadius: radius.medium,
            alignItems: 'center',
            marginBottom: 12,
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 20, marginRight: 8 }}>📤</Text>
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
            Share Progress
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => shareProgress('instagram')}
          style={{
            backgroundColor: '#E4405F',
            padding: 16,
            borderRadius: radius.medium,
            alignItems: 'center',
            marginBottom: 12,
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 20, marginRight: 8 }}>📷</Text>
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
            Share to Instagram
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => shareProgress('twitter')}
          style={{
            backgroundColor: '#1DA1F2',
            padding: 16,
            borderRadius: radius.medium,
            alignItems: 'center',
            marginBottom: 24,
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 20, marginRight: 8 }}>🐦</Text>
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
            Share to Twitter
          </Text>
        </TouchableOpacity>

        <View style={{
          backgroundColor: '#d1ecf1',
          padding: 16,
          borderRadius: radius.medium,
          borderLeftWidth: 4,
          borderLeftColor: '#17a2b8',
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#0c5460', marginBottom: 8 }}>
            💡 Why Share?
          </Text>
          <Text style={{ fontSize: 14, color: '#0c5460', lineHeight: 20 }}>
            Sharing your progress helps keep you accountable and might inspire others to start their own savings journey!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
