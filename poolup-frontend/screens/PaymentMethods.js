import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';

export default function PaymentMethods({ navigation, route }) {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [defaultMethod, setDefaultMethod] = useState('bank_transfer');
  const userId = route.params?.userId || '1756612920173';

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      // Set mock data immediately
      const mockMethods = [
        {
          id: 'bank_1',
          type: 'bank_transfer',
          name: 'Chase Checking',
          last_four: '4567',
          is_verified: true,
          is_default: true
        },
        {
          id: 'card_1',
          type: 'debit_card',
          name: 'PoolUp Debit Card',
          last_four: '4242',
          is_verified: true,
          is_default: false
        },
        {
          id: 'paypal_1',
          type: 'paypal',
          name: 'PayPal Account',
          email: 'user@example.com',
          is_verified: true,
          is_default: false
        }
      ];
      setPaymentMethods(mockMethods);
      console.log('PaymentMethods loaded with mock data');
    } catch (error) {
      console.error('Failed to load payment methods:', error);
      setPaymentMethods([]);
    }
  };

  const getMethodIcon = (type) => {
    switch (type) {
      case 'bank_transfer': return '🏦';
      case 'debit_card': return '💳';
      case 'credit_card': return '💳';
      case 'paypal': return '💙';
      case 'apple_pay': return '📱';
      case 'google_pay': return '📱';
      default: return '💳';
    }
  };

  const setAsDefault = async (methodId) => {
    try {
      await api.setDefaultPaymentMethod(userId, methodId);
      setPaymentMethods(methods => 
        methods.map(method => ({
          ...method,
          is_default: method.id === methodId
        }))
      );
      Alert.alert('Success', 'Default payment method updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update default payment method');
    }
  };

  const removeMethod = async (methodId) => {
    Alert.alert(
      'Remove Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.removePaymentMethod(userId, methodId);
              setPaymentMethods(methods => methods.filter(m => m.id !== methodId));
              Alert.alert('Success', 'Payment method removed');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove payment method');
            }
          }
        }
      ]
    );
  };

  const addNewMethod = () => {
    Alert.alert(
      'Add Payment Method',
      'Choose a payment method to add',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Bank Account', onPress: () => console.log('Add bank account') },
        { text: 'Debit/Credit Card', onPress: () => console.log('Add card') },
        { text: 'PayPal', onPress: () => console.log('Add PayPal') }
      ]
    );
  };

  const renderPaymentMethod = (method) => (
    <View key={method.id} style={{
      backgroundColor: 'white',
      padding: 20,
      marginBottom: 12,
      borderRadius: radius,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderLeftWidth: method.is_default ? 4 : 0,
      borderLeftColor: method.is_default ? colors.primary : 'transparent'
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Text style={{ fontSize: 24, marginRight: 12 }}>
            {getMethodIcon(method.type)}
          </Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
              {method.name}
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 2 }}>
              {method.type === 'paypal' ? method.email : `•••• ${method.last_four}`}
            </Text>
            {method.is_default && (
              <Text style={{ fontSize: 12, color: colors.primary, marginTop: 4, fontWeight: '600' }}>
                DEFAULT
              </Text>
            )}
          </View>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {method.is_verified ? (
            <Text style={{ fontSize: 12, color: colors.success, marginRight: 8 }}>✓ Verified</Text>
          ) : (
            <Text style={{ fontSize: 12, color: colors.warning, marginRight: 8 }}>⚠ Unverified</Text>
          )}
          
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Payment Method Options',
                `Options for ${method.name}`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  !method.is_default && { text: 'Set as Default', onPress: () => setAsDefault(method.id) },
                  { text: 'Remove', style: 'destructive', onPress: () => removeMethod(method.id) }
                ].filter(Boolean)
              );
            }}
            style={{
              padding: 8,
              borderRadius: 16,
              backgroundColor: colors.background
            }}
          >
            <Text style={{ fontSize: 16 }}>⋯</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        backgroundColor: colors.primary,
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginRight: 16 }}
          >
            <Text style={{ fontSize: 18, color: 'white' }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{
            fontSize: 20,
            fontWeight: '700',
            color: 'white',
            flex: 1
          }}>
            Payment Methods
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        {/* Add New Method Button */}
        <TouchableOpacity
          onPress={addNewMethod}
          style={{
            backgroundColor: colors.primary,
            padding: 16,
            borderRadius: radius,
            marginBottom: 20,
            alignItems: 'center'
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>
            + Add New Payment Method
          </Text>
        </TouchableOpacity>

        {/* Payment Methods List */}
        <Text style={{
          fontSize: 18,
          fontWeight: '700',
          color: colors.text,
          marginBottom: 16
        }}>
          Your Payment Methods
        </Text>

        {paymentMethods.map(renderPaymentMethod)}

        {/* Security Info */}
        <View style={{
          backgroundColor: colors.primaryLight,
          padding: 16,
          borderRadius: radius,
          marginTop: 20
        }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 8
          }}>
            🔒 Secure & Protected
          </Text>
          <Text style={{
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 20
          }}>
            All payment methods are encrypted and secured with bank-level security. 
            We never store your full card numbers or banking credentials.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
