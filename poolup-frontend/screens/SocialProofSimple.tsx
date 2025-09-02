import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';

type SocialProofSimpleNavigationProp = StackNavigationProp<RootStackParamList, 'SocialProofSimple'>;
type SocialProofSimpleRouteProp = RouteProp<RootStackParamList, 'SocialProofSimple'>;

interface Props {
  navigation: SocialProofSimpleNavigationProp;
  route: SocialProofSimpleRouteProp;
}

interface SocialProofData {
  totalUsers: number;
  totalSaved: number;
  goalsCompleted: number;
  averageSuccess: number;
  averageStreak: number;
  successStories: SuccessStory[];
}

interface SuccessStory {
  id: string;
  userName: string;
  avatar: string;
  goalName: string;
  amountSaved: number;
  timeToComplete: number;
  quote: string;
}

export default function SocialProofSimple({ navigation, route }: Props): React.JSX.Element {
  const [socialData, setSocialData] = useState<SocialProofData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadSocialProofData();
  }, []);

  const loadSocialProofData = async (): Promise<void> => {
    try {
      const data = await api.getSocialProofData();
      setSocialData({
        ...data,
        averageStreak: data.averageStreak || 0,
        successStories: data.successStories || []
      });
    } catch (error) {
      console.error('Failed to load social proof data:', error);
      // Mock data for development
      setSocialData({
        totalUsers: 12847,
        totalSaved: 2847392, // cents
        goalsCompleted: 3421,
        averageSuccess: 85,
        averageStreak: 18,
        successStories: [
          {
            id: '1',
            userName: 'Sarah M.',
            avatar: '👩‍💼',
            goalName: 'Emergency Fund',
            amountSaved: 500000, // cents
            timeToComplete: 8,
            quote: 'PoolUp made saving automatic. I reached my $5,000 emergency fund in just 8 months!'
          },
          {
            id: '2',
            userName: 'Mike C.',
            avatar: '👨‍💻',
            goalName: 'Dream Vacation',
            amountSaved: 350000, // cents
            timeToComplete: 6,
            quote: 'Saving with friends kept me motivated. We all went to Japan together!'
          },
          {
            id: '3',
            userName: 'Emma W.',
            avatar: '👩‍🎨',
            goalName: 'New Car',
            amountSaved: 1200000, // cents
            timeToComplete: 14,
            quote: 'The group accountability was amazing. I saved $12,000 for my car!'
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (cents: number): string => {
    if (cents >= 100000000) { // $1M+
      return `$${(cents / 100000000).toFixed(1)}M`;
    } else if (cents >= 100000) { // $1K+
      return `$${(cents / 100000).toFixed(0)}K`;
    } else {
      return `$${(cents / 100).toLocaleString()}`;
    }
  };

  const formatLargeNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    } else {
      return num.toString();
    }
  };

  const renderSuccessStory = (story: SuccessStory) => (
    <View key={story.id} style={{
      backgroundColor: 'white',
      padding: 20,
      marginBottom: 16,
      borderRadius: radius.medium,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 32, marginRight: 16 }}>{story.avatar}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>
            {story.userName}
          </Text>
          <Text style={{ fontSize: 14, color: colors.primary, fontWeight: '500' }}>
            {story.goalName} • {formatAmount(story.amountSaved)} in {story.timeToComplete} months
          </Text>
        </View>
      </View>
      
      <Text style={{ fontSize: 15, color: '#444', lineHeight: 22, fontStyle: 'italic' }}>
        "{story.quote}"
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, color: '#666' }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!socialData) {
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
            Success Stories
          </Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Text style={{ fontSize: 18, color: '#666', textAlign: 'center' }}>
            No success stories available
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
          Success Stories
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
          <Text style={{ fontSize: 32, marginBottom: 16 }}>🌟</Text>
          <Text style={{
            fontSize: 24,
            fontWeight: '700',
            color: '#333',
            textAlign: 'center',
            marginBottom: 8,
          }}>
            Join Thousands of Successful Savers
          </Text>
          <Text style={{
            fontSize: 16,
            color: '#666',
            textAlign: 'center',
            lineHeight: 22,
          }}>
            Real people achieving real financial goals with PoolUp
          </Text>
        </View>

        <View style={{
          backgroundColor: 'white',
          padding: 20,
          borderRadius: radius.medium,
          marginBottom: 24,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: '700', color: colors.primary }}>
                {formatLargeNumber(socialData.totalUsers)}
              </Text>
              <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
                Active Users
              </Text>
            </View>
            
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: '700', color: colors.primary }}>
                {formatAmount(socialData.totalSaved)}
              </Text>
              <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
                Total Saved
              </Text>
            </View>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: '700', color: colors.primary }}>
                {formatLargeNumber(socialData.goalsCompleted)}
              </Text>
              <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
                Goals Completed
              </Text>
            </View>
            
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: '700', color: colors.primary }}>
                {socialData.averageStreak}
              </Text>
              <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
                Avg Streak (Days)
              </Text>
            </View>
          </View>
        </View>

        <Text style={{ fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 16 }}>
          Success Stories
        </Text>

        {socialData.successStories.map(renderSuccessStory)}

        <View style={{
          backgroundColor: colors.primary,
          padding: 20,
          borderRadius: radius.medium,
          alignItems: 'center',
          marginTop: 16,
        }}>
          <Text style={{ fontSize: 24, marginBottom: 12 }}>🚀</Text>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: 'white',
            textAlign: 'center',
            marginBottom: 8,
          }}>
            Ready to Start Your Success Story?
          </Text>
          <Text style={{
            fontSize: 15,
            color: 'white',
            textAlign: 'center',
            lineHeight: 22,
            marginBottom: 16,
          }}>
            Join thousands of people who are achieving their financial goals with PoolUp.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('CreatePool')}
            style={{
              backgroundColor: 'white',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: radius.medium,
            }}
          >
            <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 16 }}>
              Create Your First Goal
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
