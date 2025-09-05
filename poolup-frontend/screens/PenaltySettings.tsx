import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, SafeAreaView } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';

type PenaltySettingsNavigationProp = StackNavigationProp<RootStackParamList, 'PenaltySettings'>;
type PenaltySettingsRouteProp = RouteProp<RootStackParamList, 'PenaltySettings'>;

interface Props {
  navigation: PenaltySettingsNavigationProp;
  route: PenaltySettingsRouteProp;
}

interface PenaltySettings {
  penaltyAmount: number;
  penaltyType: 'forfeit' | 'pool' | 'charity';
  charityId?: string;
  charityName?: string;
  isEnabled: boolean;
}

export default function PenaltySettings({ navigation, route }: Props): React.JSX.Element {
  const [settings, setSettings] = useState<PenaltySettings>({
    penaltyAmount: 1000, // cents
    penaltyType: 'pool',
    isEnabled: true,
  });
  const [loading, setLoading] = useState<boolean>(false);

  const poolId = (route.params as any)?.poolId;
  const userId = (route.params as any)?.userId || '1756612920173';

  useEffect(() => {
    loadPenaltySettings();
  }, []);

  const loadPenaltySettings = async (): Promise<void> => {
    try {
      if (poolId) {
        const poolSettings = await api.getPoolPenaltySettings(poolId);
        setSettings(poolSettings);
      }
    } catch (error) {
      console.error('Failed to load penalty settings:', error);
    }
  };

  const savePenaltySettings = async (): Promise<void> => {
    setLoading(true);
    try {
      if (poolId) {
        await api.updatePoolPenaltySettings(poolId, settings);
        Alert.alert('Success', 'Penalty settings updated successfully!');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Failed to save penalty settings:', error);
      Alert.alert('Error', 'Failed to save penalty settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (cents: number): string => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const PenaltyOption = ({ 
    type, 
    title, 
    description, 
    icon, 
    recommended = false 
  }: { 
    type: 'forfeit' | 'pool' | 'charity'; 
    title: string; 
    description: string; 
    icon: string; 
    recommended?: boolean; 
  }) => (
    <TouchableOpacity
      onPress={() => setSettings(prev => ({ ...prev, penaltyType: type }))}
      style={{
        backgroundColor: 'white',
        padding: 16,
        marginBottom: 12,
        borderRadius: radius.medium,
        borderWidth: settings.penaltyType === type ? 2 : 1,
        borderColor: settings.penaltyType === type ? colors.primary : '#e9ecef',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 24, marginRight: 12 }}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>
              {title}
            </Text>
            {recommended && (
              <View style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 12,
                marginLeft: 8,
              }}>
                <Text style={{ color: 'white', fontSize: 10, fontWeight: '600' }}>
                  RECOMMENDED
                </Text>
              </View>
            )}
          </View>
        </View>
        <View style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: settings.penaltyType === type ? colors.primary : '#ccc',
          backgroundColor: settings.penaltyType === type ? colors.primary : 'transparent',
        }} />
      </View>
      <Text style={{ fontSize: 14, color: '#666', lineHeight: 20, marginLeft: 36 }}>
        {description}
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
          Penalty Settings
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
          <Text style={{ fontSize: 32, marginBottom: 12 }}>⚖️</Text>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#333',
            marginBottom: 8,
            textAlign: 'center',
          }}>
            Stay Accountable
          </Text>
          <Text style={{
            fontSize: 15,
            color: '#666',
            textAlign: 'center',
            lineHeight: 22,
          }}>
            Set up penalties to help you stick to your savings goals.
          </Text>
        </View>

        <View style={{
          backgroundColor: 'white',
          padding: 16,
          marginBottom: 24,
          borderRadius: radius.medium,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 }}>
            Penalty Amount
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
            value={formatAmount(settings.penaltyAmount)}
            onChangeText={(text) => {
              const amount = parseFloat(text.replace('$', '')) * 100;
              if (!isNaN(amount)) {
                setSettings(prev => ({ ...prev, penaltyAmount: Math.round(amount) }));
              }
            }}
            keyboardType="numeric"
            placeholder="$0.00"
          />
          <Text style={{ fontSize: 12, color: '#666', textAlign: 'center', marginTop: 8 }}>
            Amount charged when you miss a contribution
          </Text>
        </View>

        <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 16 }}>
          What happens to penalty money?
        </Text>

        <PenaltyOption
          type="pool"
          title="Add to Pool"
          description="Penalty money goes into your savings pool, maximizing your earnings with interest."
          icon="💰"
          recommended={true}
        />

        <PenaltyOption
          type="forfeit"
          title="Forfeit"
          description="You lose out on maximizing your savings - penalty money is forfeited."
          icon="❌"
        />

        <PenaltyOption
          type="charity"
          title="Donate to Charity"
          description="Penalty money is donated to a charity of your choice."
          icon="❤️"
        />

        {settings.penaltyType === 'charity' && (
          <View style={{
            backgroundColor: 'white',
            padding: 16,
            marginBottom: 24,
            borderRadius: radius.medium,
          }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 }}>
              Select Charity
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#f8f9fa',
                padding: 12,
                borderRadius: radius.medium,
                borderWidth: 1,
                borderColor: '#e9ecef',
              }}
            >
              <Text style={{ fontSize: 16, color: settings.charityName ? '#333' : '#666' }}>
                {settings.charityName || 'Choose a charity...'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{
          backgroundColor: '#d1ecf1',
          padding: 16,
          borderRadius: radius.medium,
          marginBottom: 24,
          borderLeftWidth: 4,
          borderLeftColor: '#17a2b8',
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#0c5460', marginBottom: 8 }}>
            💡 Pro Tip
          </Text>
          <Text style={{ fontSize: 14, color: '#0c5460', lineHeight: 20 }}>
            Adding penalty money to your pool is recommended because it earns interest and maximizes your savings growth!
          </Text>
        </View>

        <TouchableOpacity
          onPress={savePenaltySettings}
          disabled={loading}
          style={{
            backgroundColor: colors.primary,
            padding: 16,
            borderRadius: radius.medium,
            alignItems: 'center',
            opacity: loading ? 0.7 : 1,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
            {loading ? 'Saving...' : 'Save Penalty Settings'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
