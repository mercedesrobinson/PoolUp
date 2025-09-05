import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Switch, Alert, SafeAreaView } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';

type ContributionSettingsNavigationProp = StackNavigationProp<RootStackParamList, 'ContributionSettings'>;
type ContributionSettingsRouteProp = RouteProp<RootStackParamList, 'ContributionSettings'>;

interface Props {
  navigation: ContributionSettingsNavigationProp;
  route: ContributionSettingsRouteProp;
}

interface ContributionSettings {
  amount: number;
  amount_cents: number;
  auto_contribute: boolean;
  frequency: string;
  isAutomatic: boolean;
  paymentMethodId: string;
  startDate: string;
  isEnabled: boolean;
}

export default function ContributionSettings({ navigation, route }: Props): React.JSX.Element {
  const [settings, setSettings] = useState<ContributionSettings>({
    amount: 2500, // cents
    amount_cents: 2500,
    auto_contribute: false,
    frequency: 'weekly',
    isAutomatic: false,
    paymentMethodId: '',
    startDate: new Date().toISOString(),
    isEnabled: true,
  });
  const [loading, setLoading] = useState<boolean>(false);

  const poolId = (route.params as any)?.poolId || '';
  const recurringPaymentId = (route.params as any)?.recurringPaymentId;
  const userId = (route.params as any)?.userId || '1756612920173';

  useEffect(() => {
    if (recurringPaymentId) {
      loadContributionSettings();
    }
  }, []);

  const loadContributionSettings = async (): Promise<void> => {
    try {
      const settings = await api.getContributionSettings(userId, poolId);
      setSettings(prev => ({
        ...prev,
        amount_cents: settings.amount_cents,
        auto_contribute: settings.auto_contribute,
        frequency: settings.frequency
      }));
    } catch (error) {
      console.error('Failed to load contribution settings:', error);
    }
  };

  const saveContributionSettings = async (): Promise<void> => {
    if (!poolId) {
      Alert.alert('Error', 'Pool ID is required.');
      return;
    }

    if (settings.amount_cents <= 0) {
      Alert.alert('Error', 'Please enter a valid contribution amount.');
      return;
    }

    setLoading(true);
    try {
      if (recurringPaymentId) {
        await api.updateContributionSettings(userId, poolId, {
          amount_cents: settings.amount_cents,
          auto_contribute: settings.auto_contribute,
          frequency: settings.frequency
        });
      } else {
        await api.createRecurringContribution(userId, poolId, {
          amount_cents: settings.amount_cents,
          frequency: settings.frequency
        });
      }
      
      Alert.alert('Success', 'Contribution settings saved successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save contribution settings:', error);
      Alert.alert('Error', 'Failed to save contribution settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (cents: number): string => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const FrequencyButton = ({ 
    frequency, 
    title, 
    isActive 
  }: { 
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly'; 
    title: string; 
    isActive: boolean; 
  }) => (
    <TouchableOpacity
      onPress={() => setSettings(prev => ({ ...prev, frequency }))}
      style={{
        flex: 1,
        padding: 12,
        borderRadius: radius.medium,
        backgroundColor: isActive ? colors.primary : '#f8f9fa',
        borderWidth: isActive ? 2 : 1,
        borderColor: isActive ? colors.primary : '#e9ecef',
        marginHorizontal: 4,
        alignItems: 'center',
      }}
    >
      <Text style={{
        fontSize: 14,
        fontWeight: '600',
        color: isActive ? 'white' : '#333',
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
          {recurringPaymentId ? 'Edit Contribution' : 'Set Up Recurring Contribution'}
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
          <Text style={{ fontSize: 32, marginBottom: 12 }}>🔄</Text>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#333',
            marginBottom: 8,
            textAlign: 'center',
          }}>
            Automate Your Savings
          </Text>
          <Text style={{
            fontSize: 15,
            color: '#666',
            textAlign: 'center',
            lineHeight: 22,
          }}>
            Set up automatic contributions to stay consistent with your savings goals.
          </Text>
        </View>

        <View style={{
          backgroundColor: 'white',
          padding: 16,
          borderRadius: radius.medium,
          marginBottom: 24,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 16 }}>
            Contribution Amount
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
            }}
            value={formatAmount(settings.amount)}
            onChangeText={(text) => {
              const amount = parseFloat(text.replace('$', '')) * 100;
              if (!isNaN(amount)) {
                setSettings(prev => ({ ...prev, amount: Math.round(amount) }));
              }
            }}
            keyboardType="numeric"
            placeholder="$0.00"
          />
        </View>

        <View style={{
          backgroundColor: 'white',
          padding: 16,
          borderRadius: radius.medium,
          marginBottom: 24,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 16 }}>
            Frequency
          </Text>
          <View style={{ flexDirection: 'row', marginBottom: 16 }}>
            <FrequencyButton 
              frequency="daily" 
              title="Daily" 
              isActive={settings.frequency === 'daily'} 
            />
            <FrequencyButton 
              frequency="weekly" 
              title="Weekly" 
              isActive={settings.frequency === 'weekly'} 
            />
          </View>
          <View style={{ flexDirection: 'row' }}>
            <FrequencyButton 
              frequency="biweekly" 
              title="Bi-weekly" 
              isActive={settings.frequency === 'biweekly'} 
            />
            <FrequencyButton 
              frequency="monthly" 
              title="Monthly" 
              isActive={settings.frequency === 'monthly'} 
            />
          </View>
        </View>

        <View style={{
          backgroundColor: 'white',
          padding: 16,
          borderRadius: radius.medium,
          marginBottom: 24,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>
                Automatic Contributions
              </Text>
              <Text style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
                Automatically contribute on schedule
              </Text>
            </View>
            <Switch
              value={settings.isAutomatic}
              onValueChange={(value) => setSettings(prev => ({ ...prev, isAutomatic: value }))}
              trackColor={{ false: '#e9ecef', true: colors.primary }}
              thumbColor={settings.isAutomatic ? 'white' : '#f4f3f4'}
            />
          </View>

          {settings.isAutomatic && (
            <View style={{
              backgroundColor: '#d1ecf1',
              padding: 12,
              borderRadius: radius.medium,
              borderLeftWidth: 4,
              borderLeftColor: '#17a2b8',
            }}>
              <Text style={{ fontSize: 14, color: '#0c5460', lineHeight: 20 }}>
                💡 Automatic contributions will be processed using your default payment method. You can cancel anytime.
              </Text>
            </View>
          )}
        </View>

        <View style={{
          backgroundColor: 'white',
          padding: 16,
          borderRadius: radius.medium,
          marginBottom: 24,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 16 }}>
            Start Date
          </Text>
          <TextInput
            style={{
              backgroundColor: '#f8f9fa',
              padding: 12,
              borderRadius: radius.medium,
              fontSize: 16,
              borderWidth: 1,
              borderColor: '#e9ecef',
            }}
            value={settings.startDate}
            onChangeText={(text) => setSettings(prev => ({ ...prev, startDate: text }))}
            placeholder="YYYY-MM-DD"
          />
        </View>

        <TouchableOpacity
          onPress={saveContributionSettings}
          disabled={loading}
          style={{
            backgroundColor: colors.primary,
            padding: 16,
            borderRadius: radius.medium,
            alignItems: 'center',
            opacity: loading ? 0.7 : 1,
            marginBottom: 24,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
            {loading ? 'Saving...' : (recurringPaymentId ? 'Update Settings' : 'Set Up Recurring Contribution')}
          </Text>
        </TouchableOpacity>

        <View style={{
          backgroundColor: '#d4edda',
          padding: 16,
          borderRadius: radius.medium,
          borderLeftWidth: 4,
          borderLeftColor: '#28a745',
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#155724', marginBottom: 8 }}>
            💡 Stay Consistent
          </Text>
          <Text style={{ fontSize: 14, color: '#155724', lineHeight: 20 }}>
            Regular contributions, even small ones, help you build lasting savings habits and reach your goals faster!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
