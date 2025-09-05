import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';

type AccountabilityPartnersNavigationProp = StackNavigationProp<RootStackParamList, 'AccountabilityPartners'>;
type AccountabilityPartnersRouteProp = RouteProp<RootStackParamList, 'AccountabilityPartners'>;

interface Props {
  navigation: AccountabilityPartnersNavigationProp;
  route: AccountabilityPartnersRouteProp;
}

interface AccountabilityPartner {
  id: string;
  name: string;
  avatar: string;
  status: 'active' | 'pending' | 'inactive';
  streakDays: number;
  lastActivity: string;
  mutualGoals: number;
}

export default function AccountabilityPartners({ navigation, route }: Props): React.JSX.Element {
  const [partners, setPartners] = useState<AccountabilityPartner[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const userId = (route.params as any)?.userId || '1756612920173';

  useEffect(() => {
    loadAccountabilityPartners();
  }, []);

  const loadAccountabilityPartners = async (): Promise<void> => {
    try {
      const userPartners = await api.getAccountabilityPartners();
      setPartners(userPartners);
    } catch (error) {
      console.error('Failed to load accountability partners:', error);
      // Mock data for development
      setPartners([
        {
          id: '1',
          name: 'Sarah Johnson',
          avatar: '👩‍💼',
          status: 'active',
          streakDays: 12,
          lastActivity: '2024-01-10T10:30:00Z',
          mutualGoals: 2
        },
        {
          id: '2',
          name: 'Mike Chen',
          avatar: '👨‍💻',
          status: 'active',
          streakDays: 8,
          lastActivity: '2024-01-09T15:45:00Z',
          mutualGoals: 1
        },
        {
          id: '3',
          name: 'Emma Wilson',
          avatar: '👩‍🎨',
          status: 'pending',
          streakDays: 0,
          lastActivity: '2024-01-08T12:00:00Z',
          mutualGoals: 0
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sendEncouragement = async (partnerId: string): Promise<void> => {
    try {
      await api.sendEncouragement(userId, partnerId, '', 'You got this!', 'general');
      Alert.alert('Encouragement Sent!', 'Your partner will receive a motivational message.');
    } catch (error) {
      console.error('Failed to send encouragement:', error);
      Alert.alert('Error', 'Failed to send encouragement. Please try again.');
    }
  };

  const removePartner = async (partnerId: string): Promise<void> => {
    Alert.alert(
      'Remove Partner',
      'Are you sure you want to remove this accountability partner?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.removeAccountabilityPartner(partnerId);
              setPartners(prev => prev.filter(partner => partner.id !== partnerId));
            } catch (error) {
              console.error('Failed to remove partner:', error);
              Alert.alert('Error', 'Failed to remove partner. Please try again.');
            }
          }
        }
      ]
    );
  };

  const formatLastActivity = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Active now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return time.toLocaleDateString();
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return '#28a745';
      case 'pending': return '#ffc107';
      case 'inactive': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const renderPartner = (partner: AccountabilityPartner) => (
    <View key={partner.id} style={{
      backgroundColor: 'white',
      padding: 16,
      marginBottom: 12,
      borderRadius: radius.medium,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 32, marginRight: 16 }}>{partner.avatar}</Text>
        
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>
              {partner.name}
            </Text>
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: getStatusColor(partner.status),
              marginLeft: 8,
            }} />
          </View>
          <Text style={{ fontSize: 14, color: '#666' }}>
            {formatLastActivity(partner.lastActivity)}
          </Text>
        </View>

        {partner.status === 'active' && (
          <TouchableOpacity
            onPress={() => sendEncouragement(partner.id)}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: radius.medium,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '500', fontSize: 12 }}>
              💪 Encourage
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.primary }}>
            {partner.streakDays}
          </Text>
          <Text style={{ fontSize: 12, color: '#666' }}>
            Day Streak
          </Text>
        </View>
        
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.primary }}>
            {partner.mutualGoals}
          </Text>
          <Text style={{ fontSize: 12, color: '#666' }}>
            Shared Goals
          </Text>
        </View>
        
        <TouchableOpacity
          onPress={() => removePartner(partner.id)}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: radius.medium,
            backgroundColor: '#f8d7da',
          }}
        >
          <Text style={{ color: '#721c24', fontWeight: '500', fontSize: 12 }}>
            Remove
          </Text>
        </TouchableOpacity>
      </View>

      {partner.status === 'pending' && (
        <View style={{
          backgroundColor: '#fff3cd',
          padding: 12,
          borderRadius: radius.medium,
          borderLeftWidth: 4,
          borderLeftColor: '#ffc107',
        }}>
          <Text style={{ fontSize: 14, color: '#856404' }}>
            Waiting for {partner.name} to accept your partnership request.
          </Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, color: '#666' }}>Loading...</Text>
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
          Accountability Partners
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('InviteFriends')}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: radius.medium,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '500', fontSize: 14 }}>
            + Add
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
      >
        {partners.length === 0 ? (
          <View style={{
            backgroundColor: 'white',
            padding: 32,
            borderRadius: radius.medium,
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🤝</Text>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#333',
              marginBottom: 8,
              textAlign: 'center',
            }}>
              No Accountability Partners
            </Text>
            <Text style={{
              fontSize: 15,
              color: '#666',
              textAlign: 'center',
              lineHeight: 22,
              marginBottom: 24,
            }}>
              Add friends as accountability partners to stay motivated and reach your goals together.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('InviteFriends')}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: radius.medium,
              }}
            >
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
                Find Partners
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          partners.map(renderPartner)
        )}

        <View style={{
          backgroundColor: '#d1ecf1',
          padding: 16,
          borderRadius: radius.medium,
          marginTop: 24,
          borderLeftWidth: 4,
          borderLeftColor: '#17a2b8',
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#0c5460', marginBottom: 8 }}>
            💡 How It Works
          </Text>
          <Text style={{ fontSize: 14, color: '#0c5460', lineHeight: 20 }}>
            Accountability partners can see your progress, send encouragement, and help keep you motivated to reach your savings goals!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
