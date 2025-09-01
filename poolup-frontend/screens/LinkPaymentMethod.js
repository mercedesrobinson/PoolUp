import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert
} from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';

export default function LinkPaymentMethod({ navigation, route }) {
  const [credentials, setCredentials] = useState({});
  const [loading, setLoading] = useState(false);
  
  const { method, userId } = route.params;

  const methodConfig = {
    venmo: {
      title: 'Link Venmo',
      description: 'Connect your Venmo account for easy deposits',
      fields: [
        { key: 'username', label: 'Venmo Username', placeholder: '@username' },
        { key: 'phone', label: 'Phone Number', placeholder: '(555) 123-4567' }
      ],
      fees: '2.5% per transaction',
      color: '#3D95CE'
    },
    cashapp: {
      title: 'Link Cash App',
      description: 'Connect your Cash App for instant deposits',
      fields: [
        { key: 'cashtag', label: 'Cash App $Cashtag', placeholder: '$username' },
        { key: 'phone', label: 'Phone Number', placeholder: '(555) 123-4567' }
      ],
      fees: '3.0% per transaction',
      color: '#00D632'
    },
    paypal: {
      title: 'Link PayPal',
      description: 'Connect your PayPal account for secure deposits',
      fields: [
        { key: 'email', label: 'PayPal Email', placeholder: 'your@email.com' },
        { key: 'phone', label: 'Phone Number (Optional)', placeholder: '(555) 123-4567' }
      ],
      fees: '2.9% + $0.30 per transaction',
      color: '#0070BA'
    }
  };

  const config = methodConfig[method];

  const handleLinkAccount = async () => {
    const requiredFields = config.fields.filter(field => !field.label.includes('Optional'));
    const missingFields = requiredFields.filter(field => !credentials[field.key]);
    
    if (missingFields.length > 0) {
      Alert.alert('Error', `Please fill in all required fields: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      const result = await api.linkPaymentMethod(userId, method, credentials);
      
      if (result.success) {
        Alert.alert(
          'Success!',
          `Your ${config.title.split(' ')[1]} account has been linked successfully.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to link account');
      }
    } catch (error) {
      console.error('Link account error:', error);
      Alert.alert('Error', 'Failed to link account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateCredential = (key, value) => {
    setCredentials(prev => ({ ...prev, [key]: value }));
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header with Back Button */}
      <View style={{ 
        paddingTop: 60, 
        paddingHorizontal: 20, 
        paddingBottom: 20, 
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16
            }}
          >
            <Text style={{ fontSize: 18, color: colors.text }}>←</Text>
          </TouchableOpacity>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: colors.text,
            flex: 1
          }}>
            {config.title}
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: 20 }}>
          {/* Icon and Description */}
          <View style={{ marginBottom: 30, alignItems: 'center' }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: config.color,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16
            }}>
              <Text style={{
                fontSize: 32,
                fontWeight: 'bold',
                color: 'white'
              }}>
                {method === 'venmo' ? 'V' : method === 'cashapp' ? '$' : 'P'}
              </Text>
            </View>
            <Text style={{
              fontSize: 18,
              color: colors.textSecondary,
              textAlign: 'center'
            }}>
              {config.description}
            </Text>
          </View>

          {/* Form Fields */}
          <View style={{ marginBottom: 30 }}>
            {config.fields.map((field) => (
              <View key={field.key} style={{ marginBottom: 20 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.text,
                  marginBottom: 8
                }}>
                  {field.label}
                </Text>
                <TextInput
                  value={credentials[field.key] || ''}
                  onChangeText={(value) => updateCredential(field.key, value)}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.textSecondary}
                  keyboardType={field.key === 'phone' ? 'phone-pad' : 'default'}
                  autoCapitalize="none"
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: radius,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: credentials[field.key] ? colors.primary : colors.border,
                    fontSize: 16,
                    color: colors.text
                  }}
                />
              </View>
            ))}
          </View>

          {/* Fees Info */}
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: radius,
            padding: 16,
            marginBottom: 30,
            borderLeftWidth: 4,
            borderLeftColor: config.color
          }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: colors.text,
              marginBottom: 4
            }}>
              Transaction Fees
            </Text>
            <Text style={{
              fontSize: 14,
              color: colors.textSecondary
            }}>
              {config.fees}
            </Text>
          </View>

          {/* Security Notice */}
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: radius,
            padding: 16,
            marginBottom: 30
          }}>
            <Text style={{
              fontSize: 14,
              color: colors.text,
              lineHeight: 20
            }}>
              🔒 <Text style={{ fontWeight: '600' }}>Your information is secure:</Text> We use bank-level encryption to protect your data. Your login credentials are never stored on our servers.
            </Text>
          </View>

          {/* Link Button */}
          <TouchableOpacity
            onPress={handleLinkAccount}
            disabled={loading}
            style={{
              backgroundColor: loading ? colors.border : config.color,
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
              {loading ? 'Linking Account...' : `Link ${config.title.split(' ')[1]} Account`}
            </Text>
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              backgroundColor: colors.surface,
              padding: 16,
              borderRadius: radius,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.border
            }}
          >
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.text
            }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
