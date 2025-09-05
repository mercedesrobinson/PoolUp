import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, SafeAreaView } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';

type PeerTransferNavigationProp = StackNavigationProp<RootStackParamList, 'PeerTransfer'>;
type PeerTransferRouteProp = RouteProp<RootStackParamList, 'PeerTransfer'>;

interface Props {
  navigation: PeerTransferNavigationProp;
  route: PeerTransferRouteProp;
}

interface PoolMember {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
}

export default function PeerTransfer({ navigation, route }: Props): React.JSX.Element {
  const [members, setMembers] = useState<PoolMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<PoolMember | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const poolId = (route.params as any)?.poolId || 'pool1';
  const userId = (route.params as any)?.userId || '1756612920173';

  useEffect(() => {
    loadPoolMembers();
  }, []);

  const loadPoolMembers = async (): Promise<void> => {
    try {
      const poolMembers = await api.getPoolMembers(poolId);
      // Filter out current user
      const otherMembers = poolMembers.filter((member: PoolMember) => member.id !== userId);
      setMembers(otherMembers);
    } catch (error) {
      console.error('Failed to load pool members:', error);
      // Mock data for development
      setMembers([
        { id: '2', name: 'Sarah Johnson', avatar: '👩‍💼', isOnline: true },
        { id: '3', name: 'Mike Chen', avatar: '👨‍💻', isOnline: false },
        { id: '4', name: 'Emma Wilson', avatar: '👩‍🎨', isOnline: true },
        { id: '5', name: 'Alex Rodriguez', avatar: '👨‍🚀', isOnline: false },
      ]);
    }
  };

  const sendTransfer = async (): Promise<void> => {
    if (!selectedMember) {
      Alert.alert('Error', 'Please select a recipient.');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    const amountCents = Math.round(parseFloat(amount) * 100);

    setLoading(true);
    try {
      await api.processPeerTransfer(poolId, userId, selectedMember.id, amountCents, message);
      Alert.alert('Transfer Sent!', `$${amount} sent to ${selectedMember.name}`);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to send transfer:', error);
      Alert.alert('Error', 'Failed to send transfer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderMember = (member: PoolMember) => (
    <TouchableOpacity
      key={member.id}
      onPress={() => setSelectedMember(member)}
      style={{
        backgroundColor: 'white',
        padding: 16,
        marginBottom: 12,
        borderRadius: radius.medium,
        borderWidth: selectedMember?.id === member.id ? 2 : 1,
        borderColor: selectedMember?.id === member.id ? colors.primary : '#e9ecef',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 32, marginRight: 16 }}>{member.avatar}</Text>
        
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 }}>
            {member.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: member.isOnline ? '#28a745' : '#6c757d',
              marginRight: 8,
            }} />
            <Text style={{ fontSize: 14, color: '#666' }}>
              {member.isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        {selectedMember?.id === member.id && (
          <View style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>✓</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

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
          Send Money
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
      >
        <View style={{
          backgroundColor: 'white',
          padding: 16,
          marginBottom: 24,
          borderRadius: radius.medium,
          alignItems: 'center',
        }}>
          <Text style={{ fontSize: 32, marginBottom: 12 }}>💸</Text>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#333',
            marginBottom: 8,
            textAlign: 'center',
          }}>
            Send Money to Group Member
          </Text>
          <Text style={{
            fontSize: 15,
            color: '#666',
            textAlign: 'center',
            lineHeight: 22,
          }}>
            Transfer money to other members in your savings group with no fees.
          </Text>
        </View>

        <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 16 }}>
          Select Recipient
        </Text>

        {members.map(renderMember)}

        {selectedMember && (
          <View style={{
            backgroundColor: 'white',
            padding: 16,
            borderRadius: radius.medium,
            marginTop: 24,
          }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 16 }}>
              Transfer Details
            </Text>

            <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
              Amount
            </Text>
            <TextInput
              style={{
                backgroundColor: '#f8f9fa',
                padding: 12,
                borderRadius: radius.medium,
                fontSize: 18,
                fontWeight: '600',
                textAlign: 'center',
                borderWidth: 1,
                borderColor: '#e9ecef',
                marginBottom: 16,
              }}
              placeholder="$0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
              Message (Optional)
            </Text>
            <TextInput
              style={{
                backgroundColor: '#f8f9fa',
                padding: 12,
                borderRadius: radius.medium,
                fontSize: 16,
                borderWidth: 1,
                borderColor: '#e9ecef',
                marginBottom: 24,
                minHeight: 80,
              }}
              placeholder="Add a note..."
              value={message}
              onChangeText={setMessage}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              onPress={sendTransfer}
              disabled={loading || !amount || !selectedMember}
              style={{
                backgroundColor: colors.primary,
                padding: 16,
                borderRadius: radius.medium,
                alignItems: 'center',
                opacity: (loading || !amount || !selectedMember) ? 0.7 : 1,
              }}
            >
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
                {loading ? 'Sending...' : `Send $${amount || '0.00'} to ${selectedMember.name}`}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{
          backgroundColor: '#d4edda',
          padding: 16,
          borderRadius: radius.medium,
          marginTop: 24,
          borderLeftWidth: 4,
          borderLeftColor: '#28a745',
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#155724', marginBottom: 8 }}>
            💡 No Fees
          </Text>
          <Text style={{ fontSize: 14, color: '#155724', lineHeight: 20 }}>
            Peer-to-peer transfers within your savings group are completely free!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
