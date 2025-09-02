import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, SafeAreaView } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';

type WithdrawFundsNavigationProp = StackNavigationProp<RootStackParamList, any>;
type WithdrawFundsRouteProp = RouteProp<RootStackParamList, any>;

interface Props {
  navigation: WithdrawFundsNavigationProp;
  route: WithdrawFundsRouteProp;
}

interface WithdrawalInfo {
  availableBalance: number;
  minimumWithdrawal: number;
  processingFee: number;
  processingTime: string;
}

export default function WithdrawFunds({ navigation, route }: Props): React.JSX.Element {
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>('');
  const [withdrawalInfo, setWithdrawalInfo] = useState<WithdrawalInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const poolId = (route.params as any)?.poolId;
  const userId = (route.params as any)?.userId || '1756612920173';

  useEffect(() => {
    loadWithdrawalInfo();
  }, []);

  const loadWithdrawalInfo = async (): Promise<void> => {
    try {
      if (poolId) {
        const info = await api.getWithdrawalInfo(poolId, userId);
        setWithdrawalInfo(info);
      }
    } catch (error) {
      console.error('Failed to load withdrawal info:', error);
      // Mock data for development
      setWithdrawalInfo({
        availableBalance: 275000, // cents
        minimumWithdrawal: 1000, // cents
        processingFee: 250, // cents
        processingTime: '1-3 business days'
      });
    }
  };

  const processWithdrawal = async (): Promise<void> => {
    if (!withdrawalInfo || !poolId) return;

    const amountCents = Math.round(parseFloat(withdrawalAmount) * 100);

    if (amountCents < withdrawalInfo.minimumWithdrawal) {
      Alert.alert('Error', `Minimum withdrawal amount is ${formatAmount(withdrawalInfo.minimumWithdrawal)}`);
      return;
    }

    if (amountCents > withdrawalInfo.availableBalance) {
      Alert.alert('Error', 'Withdrawal amount exceeds available balance');
      return;
    }

    Alert.alert(
      'Confirm Withdrawal',
      `Withdraw ${formatAmount(amountCents)}?\n\nProcessing fee: ${formatAmount(withdrawalInfo.processingFee)}\nNet amount: ${formatAmount(amountCents - withdrawalInfo.processingFee)}\nProcessing time: ${withdrawalInfo.processingTime}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setLoading(true);
            try {
              await api.processWithdrawal(poolId, userId, amountCents);
              Alert.alert('Withdrawal Requested', 'Your withdrawal has been submitted and will be processed within 1-3 business days.');
              navigation.goBack();
            } catch (error) {
              console.error('Failed to process withdrawal:', error);
              Alert.alert('Error', 'Failed to process withdrawal. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const formatAmount = (cents: number): string => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (!withdrawalInfo) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, color: '#666' }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  const withdrawalAmountCents = parseFloat(withdrawalAmount) * 100 || 0;
  const netAmount = withdrawalAmountCents - withdrawalInfo.processingFee;

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
          Withdraw Funds
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
          <Text style={{ fontSize: 32, marginBottom: 12 }}>💰</Text>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#333',
            marginBottom: 8,
            textAlign: 'center',
          }}>
            Available Balance
          </Text>
          <Text style={{
            fontSize: 24,
            fontWeight: '700',
            color: colors.primary,
            marginBottom: 8,
          }}>
            {formatAmount(withdrawalInfo.availableBalance)}
          </Text>
          <Text style={{
            fontSize: 14,
            color: '#666',
            textAlign: 'center',
          }}>
            Minimum withdrawal: {formatAmount(withdrawalInfo.minimumWithdrawal)}
          </Text>
        </View>

        <View style={{
          backgroundColor: 'white',
          padding: 16,
          borderRadius: radius.medium,
          marginBottom: 24,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 16 }}>
            Withdrawal Amount
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
            value={withdrawalAmount}
            onChangeText={setWithdrawalAmount}
            keyboardType="numeric"
          />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: '#666' }}>Withdrawal amount:</Text>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#333' }}>
              {formatAmount(withdrawalAmountCents)}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: '#666' }}>Processing fee:</Text>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#dc3545' }}>
              -{formatAmount(withdrawalInfo.processingFee)}
            </Text>
          </View>

          <View style={{
            borderTopWidth: 1,
            borderTopColor: '#e9ecef',
            paddingTop: 8,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>Net amount:</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.primary }}>
              {formatAmount(Math.max(0, netAmount))}
            </Text>
          </View>
        </View>

        <View style={{
          backgroundColor: 'white',
          padding: 16,
          borderRadius: radius.medium,
          marginBottom: 24,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 }}>
            Processing Information
          </Text>
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: '#666', flex: 1 }}>Processing time:</Text>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#333' }}>
              {withdrawalInfo.processingTime}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: '#666', flex: 1 }}>Destination:</Text>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#333' }}>
              Primary bank account
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={processWithdrawal}
          disabled={loading || !withdrawalAmount || withdrawalAmountCents < withdrawalInfo.minimumWithdrawal}
          style={{
            backgroundColor: colors.primary,
            padding: 16,
            borderRadius: radius.medium,
            alignItems: 'center',
            opacity: (loading || !withdrawalAmount || withdrawalAmountCents < withdrawalInfo.minimumWithdrawal) ? 0.7 : 1,
            marginBottom: 24,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
            {loading ? 'Processing...' : 'Request Withdrawal'}
          </Text>
        </TouchableOpacity>

        <View style={{
          backgroundColor: '#fff3cd',
          padding: 16,
          borderRadius: radius.medium,
          borderLeftWidth: 4,
          borderLeftColor: '#ffc107',
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#856404', marginBottom: 8 }}>
            ⚠️ Important Notice
          </Text>
          <Text style={{ fontSize: 14, color: '#856404', lineHeight: 20 }}>
            Withdrawals are processed during business hours and may take 1-3 business days to appear in your account. Processing fees help cover banking costs.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
