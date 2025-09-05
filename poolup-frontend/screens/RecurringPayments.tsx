import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, SafeAreaView } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';

type RecurringPaymentsNavigationProp = StackNavigationProp<RootStackParamList, 'RecurringPayments'>;
type RecurringPaymentsRouteProp = RouteProp<RootStackParamList, 'RecurringPayments'>;

interface Props {
  navigation: RecurringPaymentsNavigationProp;
  route: RecurringPaymentsRouteProp;
}

interface RecurringPayment {
  id: string;
  poolId: string;
  poolName: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  nextPayment: string;
  isActive: boolean;
  paymentMethod: string;
}

export default function RecurringPayments({ navigation, route }: Props): React.JSX.Element {
  const [payments, setPayments] = useState<RecurringPayment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const userId = (route.params as any)?.userId || '1756612920173';

  useEffect(() => {
    loadRecurringPayments();
  }, []);

  const loadRecurringPayments = async (): Promise<void> => {
    try {
      const userPayments = await api.getRecurringPayments(userId);
      setPayments(userPayments);
    } catch (error) {
      console.error('Failed to load recurring payments:', error);
      // Mock data for development
      setPayments([
        {
          id: '1',
          poolId: 'pool1',
          poolName: 'Bali Adventure',
          amount: 5000, // cents
          frequency: 'weekly',
          nextPayment: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
          paymentMethod: 'Venmo'
        },
        {
          id: '2',
          poolId: 'pool2',
          poolName: 'Emergency Fund',
          amount: 10000, // cents
          frequency: 'monthly',
          nextPayment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: false,
          paymentMethod: 'Bank Account'
        },
        {
          id: '3',
          poolId: 'pool3',
          poolName: 'New Car',
          amount: 7500, // cents
          frequency: 'biweekly',
          nextPayment: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
          paymentMethod: 'Cash App'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const togglePayment = async (paymentId: string, isActive: boolean): Promise<void> => {
    try {
      await api.toggleRecurringPayment(paymentId, isActive);
      setPayments(prev => prev.map(payment => 
        payment.id === paymentId ? { ...payment, isActive } : payment
      ));
    } catch (error) {
      console.error('Failed to toggle recurring payment:', error);
      Alert.alert('Error', 'Failed to update recurring payment. Please try again.');
    }
  };

  const deletePayment = async (paymentId: string): Promise<void> => {
    Alert.alert(
      'Delete Recurring Payment',
      'Are you sure you want to delete this recurring payment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteRecurringPayment(paymentId);
              setPayments(prev => prev.filter(payment => payment.id !== paymentId));
            } catch (error) {
              console.error('Failed to delete recurring payment:', error);
              Alert.alert('Error', 'Failed to delete recurring payment. Please try again.');
            }
          }
        }
      ]
    );
  };

  const formatAmount = (cents: number): string => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatFrequency = (frequency: string): string => {
    switch (frequency) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'biweekly': return 'Bi-weekly';
      case 'monthly': return 'Monthly';
      default: return frequency;
    }
  };

  const formatNextPayment = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderPayment = (payment: RecurringPayment) => (
    <View key={payment.id} style={{
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
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 }}>
            {payment.poolName}
          </Text>
          <Text style={{ fontSize: 14, color: '#666' }}>
            {formatAmount(payment.amount)} • {formatFrequency(payment.frequency)}
          </Text>
        </View>
        <Switch
          value={payment.isActive}
          onValueChange={(value) => togglePayment(payment.id, value)}
          trackColor={{ false: '#e9ecef', true: colors.primary }}
          thumbColor={payment.isActive ? 'white' : '#f4f3f4'}
        />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 14, color: '#666', flex: 1 }}>
          Next payment: {formatNextPayment(payment.nextPayment)}
        </Text>
        <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '500' }}>
          via {payment.paymentMethod}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <TouchableOpacity
          onPress={() => navigation.navigate("ContributionSettings" as any, { 
            poolId: payment.poolId,
            recurringPaymentId: payment.id 
          })}
          style={{
            flex: 1,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: radius.medium,
            backgroundColor: '#f8f9fa',
            marginRight: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#666', fontWeight: '500', fontSize: 14 }}>
            Edit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => deletePayment(payment.id)}
          style={{
            flex: 1,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: radius.medium,
            backgroundColor: '#f8d7da',
            marginLeft: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#721c24', fontWeight: '500', fontSize: 14 }}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>
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
          Recurring Payments
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
      >
        {payments.length === 0 ? (
          <View style={{
            backgroundColor: 'white',
            padding: 32,
            borderRadius: radius.medium,
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🔄</Text>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#333',
              marginBottom: 8,
              textAlign: 'center',
            }}>
              No Recurring Payments
            </Text>
            <Text style={{
              fontSize: 15,
              color: '#666',
              textAlign: 'center',
              lineHeight: 22,
              marginBottom: 24,
            }}>
              Set up automatic contributions to stay consistent with your savings goals.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('ContributionSettings')}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: radius.medium,
              }}
            >
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
                Set Up Recurring Payment
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {payments.map(renderPayment)}
            
            <TouchableOpacity
              onPress={() => navigation.navigate('ContributionSettings')}
              style={{
                backgroundColor: colors.primary,
                padding: 16,
                borderRadius: radius.medium,
                alignItems: 'center',
                marginTop: 16,
              }}
            >
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
                Add New Recurring Payment
              </Text>
            </TouchableOpacity>
          </>
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
            💡 Stay Consistent
          </Text>
          <Text style={{ fontSize: 14, color: '#155724', lineHeight: 20 }}>
            Recurring payments help you build consistent savings habits and reach your goals faster!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
