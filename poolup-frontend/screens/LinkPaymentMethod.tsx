import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView, ScrollView } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';

type LinkPaymentMethodNavigationProp = StackNavigationProp<RootStackParamList, 'LinkPaymentMethod'>;
type LinkPaymentMethodRouteProp = RouteProp<RootStackParamList, 'LinkPaymentMethod'>;

interface Props {
  navigation: LinkPaymentMethodNavigationProp;
  route: LinkPaymentMethodRouteProp;
}

export default function LinkPaymentMethod({ navigation, route }: Props): React.JSX.Element {
  const [paymentType, setPaymentType] = useState<'venmo' | 'cashapp' | 'paypal' | 'bank'>(
    (route.params as any)?.paymentType || 'venmo'
  );
  const [credential, setCredential] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const userId = (route.params as any)?.userId || '1756612920173';
  const methodId = (route.params as any)?.methodId;

  const linkPaymentMethod = async (): Promise<void> => {
    if (!credential.trim()) {
      Alert.alert('Error', 'Please enter your payment method details.');
      return;
    }

    setLoading(true);
    try {
      await api.linkPaymentMethod(userId, paymentType, credential);
      Alert.alert('Success', 'Payment method linked successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to link payment method:', error);
      Alert.alert('Error', 'Failed to link payment method. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPlaceholder = (): string => {
    switch (paymentType) {
      case 'venmo': return '@username';
      case 'cashapp': return '$cashtag';
      case 'paypal': return 'email@example.com';
      case 'bank': return 'Account details';
      default: return '';
    }
  };

  const getInstructions = (): string => {
    switch (paymentType) {
      case 'venmo': return 'Enter your Venmo username (without the @)';
      case 'cashapp': return 'Enter your Cash App cashtag (without the $)';
      case 'paypal': return 'Enter your PayPal email address';
      case 'bank': return 'Connect your bank account for ACH transfers';
      default: return '';
    }
  };

  const getFee = (): string => {
    switch (paymentType) {
      case 'venmo': return '2.5%';
      case 'cashapp': return '3.0%';
      case 'paypal': return '2.9% + $0.30';
      case 'bank': return 'Free';
      default: return '';
    }
  };

  const getIcon = (): string => {
    switch (paymentType) {
      case 'venmo': return '💙';
      case 'cashapp': return '💚';
      case 'paypal': return '💛';
      case 'bank': return '🏦';
      default: return '💳';
    }
  };

  const PaymentTypeButton = ({ 
    type, 
    title, 
    icon 
  }: { 
    type: 'venmo' | 'cashapp' | 'paypal' | 'bank'; 
    title: string; 
    icon: string; 
  }) => (
    <TouchableOpacity
      onPress={() => setPaymentType(type)}
      style={{
        flex: 1,
        padding: 16,
        borderRadius: radius.medium,
        backgroundColor: paymentType === type ? colors.primary : '#f8f9fa',
        borderWidth: paymentType === type ? 2 : 1,
        borderColor: paymentType === type ? colors.primary : '#e9ecef',
        marginHorizontal: 4,
        alignItems: 'center',
      }}
    >
      <Text style={{ fontSize: 24, marginBottom: 8 }}>{icon}</Text>
      <Text style={{
        fontSize: 14,
        fontWeight: '600',
        color: paymentType === type ? 'white' : '#333',
        textAlign: 'center',
      }}>
        {title}
      </Text>
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
          Link Payment Method
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
          <Text style={{ fontSize: 32, marginBottom: 12 }}>{getIcon()}</Text>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#333',
            marginBottom: 8,
            textAlign: 'center',
          }}>
            Link Your Payment Method
          </Text>
          <Text style={{
            fontSize: 15,
            color: '#666',
            textAlign: 'center',
            lineHeight: 22,
          }}>
            Choose a payment method to contribute to your savings pools.
          </Text>
        </View>

        <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 16 }}>
          Select Payment Type
        </Text>

        <View style={{ flexDirection: 'row', marginBottom: 24 }}>
          <PaymentTypeButton type="venmo" title="Venmo" icon="💙" />
          <PaymentTypeButton type="cashapp" title="Cash App" icon="💚" />
          <PaymentTypeButton type="paypal" title="PayPal" icon="💛" />
          <PaymentTypeButton type="bank" title="Bank" icon="🏦" />
        </View>

        <View style={{
          backgroundColor: 'white',
          padding: 16,
          borderRadius: radius.medium,
          marginBottom: 24,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 }}>
            {paymentType.charAt(0).toUpperCase() + paymentType.slice(1)} Details
          </Text>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
            {getInstructions()}
          </Text>

          {paymentType === 'bank' ? (
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                padding: 16,
                borderRadius: radius.medium,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
                🏦 Connect Bank Account
              </Text>
            </TouchableOpacity>
          ) : (
            <TextInput
              style={{
                backgroundColor: '#f8f9fa',
                padding: 12,
                borderRadius: radius.medium,
                fontSize: 16,
                borderWidth: 1,
                borderColor: '#e9ecef',
              }}
              placeholder={getPlaceholder()}
              value={credential}
              onChangeText={setCredential}
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}

          <View style={{
            backgroundColor: '#fff3cd',
            padding: 12,
            borderRadius: radius.medium,
            marginTop: 16,
            borderLeftWidth: 4,
            borderLeftColor: '#ffc107',
          }}>
            <Text style={{ fontSize: 14, color: '#856404', fontWeight: '600', marginBottom: 4 }}>
              Transaction Fee: {getFee()}
            </Text>
            <Text style={{ fontSize: 12, color: '#856404' }}>
              This fee is charged by the payment provider for instant transfers.
            </Text>
          </View>
        </View>

        {paymentType !== 'bank' && (
          <TouchableOpacity
            onPress={linkPaymentMethod}
            disabled={loading || !credential.trim()}
            style={{
              backgroundColor: colors.primary,
              padding: 16,
              borderRadius: radius.medium,
              alignItems: 'center',
              opacity: (loading || !credential.trim()) ? 0.7 : 1,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
              {loading ? 'Linking...' : 'Link Payment Method'}
            </Text>
          </TouchableOpacity>
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
            🔒 Security Note
          </Text>
          <Text style={{ fontSize: 14, color: '#0c5460', lineHeight: 20 }}>
            We only store your username/email for payment processing. Your actual payment credentials are never stored on our servers.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
