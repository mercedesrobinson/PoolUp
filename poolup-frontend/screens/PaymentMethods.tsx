import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';

type PaymentMethodsNavigationProp = StackNavigationProp<RootStackParamList, 'PaymentMethods'>;
type PaymentMethodsRouteProp = RouteProp<RootStackParamList, 'PaymentMethods'>;

interface Props {
  navigation: PaymentMethodsNavigationProp;
  route: PaymentMethodsRouteProp;
}

interface PaymentMethod {
  id: string;
  type: 'venmo' | 'cashapp' | 'paypal' | 'bank';
  displayName: string;
  isVerified: boolean;
  isDefault: boolean;
  fee: string;
  icon: string;
}

export default function PaymentMethods({ navigation, route }: Props): React.JSX.Element {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const userId = (route.params as any)?.userId || '1756612920173';

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async (): Promise<void> => {
    try {
      const methods = await api.getUserPaymentMethods(userId);
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Failed to load payment methods:', error);
      // Mock data for development
      setPaymentMethods([
        {
          id: '1',
          type: 'venmo',
          displayName: '@username',
          isVerified: false,
          isDefault: false,
          fee: '2.5%',
          icon: '💙'
        },
        {
          id: '2',
          type: 'cashapp',
          displayName: '$cashtag',
          isVerified: false,
          isDefault: false,
          fee: '3.0%',
          icon: '💚'
        },
        {
          id: '3',
          type: 'paypal',
          displayName: 'email@example.com',
          isVerified: true,
          isDefault: true,
          fee: '2.9% + $0.30',
          icon: '💛'
        },
        {
          id: '4',
          type: 'bank',
          displayName: 'Bank Account',
          isVerified: true,
          isDefault: false,
          fee: 'Free',
          icon: '🏦'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const setDefaultPaymentMethod = async (methodId: string): Promise<void> => {
    try {
      await api.setDefaultPaymentMethod(userId, methodId);
      setPaymentMethods(prev => prev.map(method => ({
        ...method,
        isDefault: method.id === methodId
      })));
    } catch (error) {
      console.error('Failed to set default payment method:', error);
      Alert.alert('Error', 'Failed to update default payment method. Please try again.');
    }
  };

  const removePaymentMethod = async (methodId: string): Promise<void> => {
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
              setPaymentMethods(prev => prev.filter(method => method.id !== methodId));
            } catch (error) {
              console.error('Failed to remove payment method:', error);
              Alert.alert('Error', 'Failed to remove payment method. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderPaymentMethod = (method: PaymentMethod) => (
    <View key={method.id} style={{
      backgroundColor: 'white',
      padding: 16,
      marginBottom: 12,
      borderRadius: radius.medium,
      borderWidth: method.isDefault ? 2 : 1,
      borderColor: method.isDefault ? colors.primary : '#e9ecef',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 24, marginRight: 12 }}>{method.icon}</Text>
        
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', textTransform: 'capitalize' }}>
              {method.type}
            </Text>
            {method.isDefault && (
              <View style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 12,
                marginLeft: 8,
              }}>
                <Text style={{ color: 'white', fontSize: 10, fontWeight: '600' }}>
                  DEFAULT
                </Text>
              </View>
            )}
            {!method.isVerified && (
              <View style={{
                backgroundColor: '#ffc107',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 12,
                marginLeft: 8,
              }}>
                <Text style={{ color: 'white', fontSize: 10, fontWeight: '600' }}>
                  UNVERIFIED
                </Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 14, color: '#666' }}>
            {method.displayName}
          </Text>
          <Text style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
            Fee: {method.fee}
          </Text>
        </View>

        {!method.isVerified ? (
          <TouchableOpacity
            onPress={() => navigation.navigate("LinkPaymentMethod" as any, { 
              paymentType: method.type,
              methodId: method.id 
            })}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: radius.medium,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '500', fontSize: 12 }}>
              Link
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: 'row' }}>
            {!method.isDefault && (
              <TouchableOpacity
                onPress={() => setDefaultPaymentMethod(method.id)}
                style={{
                  backgroundColor: '#f8f9fa',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: radius.medium,
                  marginRight: 8,
                }}
              >
                <Text style={{ color: '#666', fontWeight: '500', fontSize: 12 }}>
                  Set Default
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              onPress={() => removePaymentMethod(method.id)}
              style={{
                backgroundColor: '#f8d7da',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: radius.medium,
              }}
            >
              <Text style={{ color: '#721c24', fontWeight: '500', fontSize: 12 }}>
                Remove
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
          Payment Methods
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('LinkPaymentMethod')}
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
        {paymentMethods.length === 0 ? (
          <View style={{
            backgroundColor: 'white',
            padding: 32,
            borderRadius: radius.medium,
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>💳</Text>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#333',
              marginBottom: 8,
              textAlign: 'center',
            }}>
              No Payment Methods
            </Text>
            <Text style={{
              fontSize: 15,
              color: '#666',
              textAlign: 'center',
              lineHeight: 22,
              marginBottom: 24,
            }}>
              Add a payment method to start contributing to your savings pools.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('LinkPaymentMethod')}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: radius.medium,
              }}
            >
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
                Add Payment Method
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          paymentMethods.map(renderPaymentMethod)
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
            🔒 Secure & Safe
          </Text>
          <Text style={{ fontSize: 14, color: '#155724', lineHeight: 20 }}>
            All payment methods are encrypted and secured. We never store your full payment credentials.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
