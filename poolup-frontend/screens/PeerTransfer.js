import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet
} from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';

export default function PeerTransfer({ navigation, route }) {
  const [poolMembers, setPoolMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { poolId, poolName, userId } = route.params;

  useEffect(() => {
    loadPoolMembers();
  }, []);

  const loadPoolMembers = async () => {
    try {
      const members = await api.getPoolMembers(poolId);
      // Filter out current user
      const otherMembers = members.filter(member => member.id !== userId);
      setPoolMembers(otherMembers);
    } catch (error) {
      console.error('Load members error:', error);
      // Mock data for demo
      setPoolMembers([
        { id: '2', name: 'Sarah Chen', joined_at: '2024-01-15' },
        { id: '3', name: 'Mike Johnson', joined_at: '2024-01-20' },
        { id: '4', name: 'Emma Davis', joined_at: '2024-02-01' }
      ]);
    }
  };

  const handleSendMoney = async () => {
    if (!selectedMember) {
      Alert.alert('Error', 'Please select a group member to send money to');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const amountCents = Math.round(parseFloat(amount) * 100);

    Alert.alert(
      'Confirm Transfer',
      `Send $${amount} to ${selectedMember.name}?\n\n${message ? `Message: "${message}"` : 'No message'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setLoading(true);
            try {
              await api.processPeerTransfer(poolId, userId, selectedMember.id, amountCents, message);
              
              Alert.alert(
                'Transfer Sent!',
                `$${amount} has been sent to ${selectedMember.name}`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              console.error('Transfer error:', error);
              Alert.alert('Error', 'Failed to send money. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const formatAmount = (text) => {
    // Remove non-numeric characters except decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    return cleaned;
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 20 }}>
        {/* Header */}
        <View style={{ marginBottom: 30 }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: 8
          }}>
            Send Money
          </Text>
          <Text style={{
            fontSize: 16,
            color: colors.textSecondary
          }}>
            Send money to a member of "{poolName}"
          </Text>
        </View>

        {/* Amount Input */}
        <View style={{ marginBottom: 30 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 12
          }}>
            Amount
          </Text>
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: radius,
            padding: 16,
            borderWidth: 2,
            borderColor: amount ? colors.primary : colors.border
          }}>
            <TextInput
              value={amount}
              onChangeText={(text) => setAmount(formatAmount(text))}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: colors.text,
                textAlign: 'center'
              }}
            />
          </View>
          <Text style={{
            fontSize: 14,
            color: colors.textSecondary,
            textAlign: 'center',
            marginTop: 8
          }}>
            No fees for transfers within your group
          </Text>
        </View>

        {/* Select Member */}
        <View style={{ marginBottom: 30 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 12
          }}>
            Send to
          </Text>
          {poolMembers.map((member) => (
            <TouchableOpacity
              key={member.id}
              onPress={() => setSelectedMember(member)}
              style={{
                backgroundColor: selectedMember?.id === member.id ? colors.primary + '20' : colors.surface,
                borderRadius: radius,
                padding: 16,
                marginBottom: 12,
                borderWidth: 2,
                borderColor: selectedMember?.id === member.id ? colors.primary : colors.border,
                flexDirection: 'row',
                alignItems: 'center'
              }}
            >
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12
              }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: 'white'
                }}>
                  {member.name.charAt(0)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.text
                }}>
                  {member.name}
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: colors.textSecondary
                }}>
                  Member since {new Date(member.joined_at).toLocaleDateString()}
                </Text>
              </View>
              {selectedMember?.id === member.id && (
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Text style={{ color: 'white', fontSize: 12 }}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Message Input */}
        <View style={{ marginBottom: 30 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 12
          }}>
            Message (Optional)
          </Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="For the Airbnb deposit..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
              fontSize: 16,
              color: colors.text,
              textAlignVertical: 'top'
            }}
          />
        </View>

        {/* Send Button */}
        <TouchableOpacity
          onPress={handleSendMoney}
          disabled={loading || !selectedMember || !amount}
          style={{
            backgroundColor: (!selectedMember || !amount) ? colors.border : colors.primary,
            padding: 16,
            borderRadius: radius,
            alignItems: 'center',
            marginBottom: 20
          }}
        >
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: 'white'
          }}>
            {loading ? 'Sending...' : `Send $${amount || '0.00'}`}
          </Text>
        </TouchableOpacity>

        {/* Info */}
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: radius,
          padding: 16,
          borderLeftWidth: 4,
          borderLeftColor: colors.primary
        }}>
          <Text style={{
            fontSize: 14,
            color: colors.text,
            lineHeight: 20
          }}>
            💡 <Text style={{ fontWeight: '600' }}>Tip:</Text> This money will be sent directly to your group member's PoolUp account. They can withdraw it or use it for future contributions.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
