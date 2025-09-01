import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, Switch, ScrollView } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { CHARITIES } from '../data/charities';

export default function PenaltySettings({ navigation, route }) {
  const [penaltyEnabled, setPenaltyEnabled] = useState(true);
  const [penaltyType, setPenaltyType] = useState('percentage'); // 'percentage' or 'fixed'
  const [penaltyAmount, setPenaltyAmount] = useState('10');
  const [penaltyDestination, setPenaltyDestination] = useState('pool'); // 'pool', 'charity', 'forfeit' - default to pool
  const [selectedCharity, setSelectedCharity] = useState('');
  const poolId = route.params?.poolId;
  const poolName = route.params?.poolName || 'Savings Pool';

  useEffect(() => {
    loadPenaltySettings();
  }, []);

  const loadPenaltySettings = async () => {
    try {
      const settings = await api.getPoolPenaltySettings(poolId);
      setPenaltyEnabled(settings.enabled);
      setPenaltyType(settings.type);
      setPenaltyAmount(settings.amount.toString());
      setPenaltyDestination(settings.destination);
      setSelectedCharity(settings.charity || '');
    } catch (error) {
      console.log('Using default penalty settings');
    }
  };

  const savePenaltySettings = async () => {
    try {
      const settings = {
        enabled: penaltyEnabled,
        type: penaltyType,
        amount: parseFloat(penaltyAmount),
        destination: penaltyDestination,
        charity: selectedCharity
      };

      await api.updatePoolPenaltySettings(poolId, settings);
      Alert.alert('Success', 'Penalty settings updated!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update penalty settings');
    }
  };

  // Use imported charities from data file
  const charities = CHARITIES;

  const getPenaltyPreview = () => {
    const amount = parseFloat(penaltyAmount) || 0;
    const contributionAmount = 50; // Example contribution amount
    
    if (penaltyType === 'percentage') {
      const penaltyValue = (contributionAmount * amount) / 100;
      return `$${penaltyValue.toFixed(2)} (${amount}% of $${contributionAmount} contribution)`;
    } else {
      return `$${amount.toFixed(2)} fixed amount`;
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ 
        backgroundColor: 'white', 
        paddingHorizontal: 20, 
        paddingTop: 80, 
        paddingBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={{ marginRight: 16, padding: 8 }}
          >
            <Text style={{ fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <Text style={{ 
            fontSize: 28, 
            fontWeight: '700', 
            color: colors.text,
            flex: 1
          }}>
            Penalty Settings
          </Text>
        </View>
        <Text style={{ 
          fontSize: 16, 
          color: colors.textSecondary,
          marginBottom: 8
        }}>
          Configure penalties for "{poolName}"
        </Text>
      </View>

      <View style={{ padding: 20 }}>
        {/* Enable/Disable Penalties */}
        <View style={{
          backgroundColor: 'white',
          padding: 20,
          borderRadius: radius,
          marginBottom: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: colors.text,
                marginBottom: 4
              }}>
                ⚠️ Enable Penalties
              </Text>
              <Text style={{
                fontSize: 14,
                color: colors.textSecondary,
                lineHeight: 20
              }}>
                Charge penalties for missed contributions to keep everyone accountable
              </Text>
            </View>
            <Switch
              value={penaltyEnabled}
              onValueChange={setPenaltyEnabled}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={penaltyEnabled ? colors.primary : colors.textSecondary}
            />
          </View>
        </View>

        {penaltyEnabled && (
          <>
            {/* Penalty Type */}
            <View style={{
              backgroundColor: 'white',
              padding: 20,
              borderRadius: radius,
              marginBottom: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: colors.text,
                marginBottom: 16
              }}>
                💰 Penalty Type
              </Text>

              <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                <TouchableOpacity
                  onPress={() => setPenaltyType('percentage')}
                  style={{
                    flex: 1,
                    padding: 16,
                    borderRadius: radius,
                    backgroundColor: penaltyType === 'percentage' ? colors.primaryLight : colors.background,
                    borderWidth: 2,
                    borderColor: penaltyType === 'percentage' ? colors.primary : colors.border,
                    marginRight: 8,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ fontSize: 20, marginBottom: 4 }}>📊</Text>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: penaltyType === 'percentage' ? colors.primary : colors.textSecondary
                  }}>
                    Percentage
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setPenaltyType('fixed')}
                  style={{
                    flex: 1,
                    padding: 16,
                    borderRadius: radius,
                    backgroundColor: penaltyType === 'fixed' ? colors.primaryLight : colors.background,
                    borderWidth: 2,
                    borderColor: penaltyType === 'fixed' ? colors.primary : colors.border,
                    marginLeft: 8,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ fontSize: 20, marginBottom: 4 }}>💵</Text>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: penaltyType === 'fixed' ? colors.primary : colors.textSecondary
                  }}>
                    Fixed Amount
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: radius,
                    padding: 12,
                    fontSize: 16,
                    marginRight: 12
                  }}
                  placeholder={penaltyType === 'percentage' ? '10' : '5.00'}
                  value={penaltyAmount}
                  onChangeText={setPenaltyAmount}
                  keyboardType="numeric"
                />
                <Text style={{ fontSize: 16, color: colors.textSecondary }}>
                  {penaltyType === 'percentage' ? '%' : '$'}
                </Text>
              </View>

              <View style={{
                backgroundColor: colors.background,
                padding: 12,
                borderRadius: radius,
                marginTop: 12
              }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                  Preview:
                </Text>
                <Text style={{ fontSize: 14, color: colors.text, marginBottom: 8 }}>
                  {getPenaltyPreview()}
                </Text>
                {parseFloat(penaltyAmount) >= 15 && (
                  <View style={{
                    backgroundColor: colors.successLight,
                    padding: 8,
                    borderRadius: 6,
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}>
                    <Text style={{ fontSize: 12, marginRight: 4 }}>🔥</Text>
                    <Text style={{ fontSize: 12, color: colors.success, fontWeight: '600' }}>
                      High accountability = better results!
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Penalty Destination */}
            <View style={{
              backgroundColor: 'white',
              padding: 20,
              borderRadius: radius,
              marginBottom: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: colors.text,
                marginBottom: 8
              }}>
                🎯 Where do penalties go?
              </Text>
              <Text style={{
                fontSize: 14,
                color: colors.textSecondary,
                marginBottom: 16,
                lineHeight: 20
              }}>
                Higher penalties = stronger accountability! We recommend adding penalties to your pool to maximize your group's savings power.
              </Text>

              <TouchableOpacity
                onPress={() => setPenaltyDestination('pool')}
                style={{
                  padding: 16,
                  borderRadius: radius,
                  backgroundColor: penaltyDestination === 'pool' ? colors.primaryLight : colors.background,
                  borderWidth: 2,
                  borderColor: penaltyDestination === 'pool' ? colors.primary : colors.border,
                  marginBottom: 12,
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontSize: 20, marginRight: 12 }}>🏦</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: penaltyDestination === 'pool' ? colors.primary : colors.text,
                      marginRight: 8
                    }}>
                      Add to Pool
                    </Text>
                    <View style={{
                      backgroundColor: colors.success,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 10
                    }}>
                      <Text style={{ fontSize: 10, color: 'white', fontWeight: '600' }}>
                        RECOMMENDED
                      </Text>
                    </View>
                  </View>
                  <Text style={{
                    fontSize: 14,
                    color: colors.textSecondary
                  }}>
                    Penalties boost your group's savings goal + earn interest
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setPenaltyDestination('charity')}
                style={{
                  padding: 16,
                  borderRadius: radius,
                  backgroundColor: penaltyDestination === 'charity' ? colors.primaryLight : colors.background,
                  borderWidth: 2,
                  borderColor: penaltyDestination === 'charity' ? colors.primary : colors.border,
                  marginBottom: 12,
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontSize: 20, marginRight: 12 }}>❤️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: penaltyDestination === 'charity' ? colors.primary : colors.text
                  }}>
                    Donate to Charity
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    color: colors.textSecondary
                  }}>
                    Turn penalties into positive impact
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setPenaltyDestination('forfeit')}
                style={{
                  padding: 16,
                  borderRadius: radius,
                  backgroundColor: penaltyDestination === 'forfeit' ? colors.primaryLight : colors.background,
                  borderWidth: 2,
                  borderColor: penaltyDestination === 'forfeit' ? colors.primary : colors.border,
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontSize: 20, marginRight: 12 }}>💸</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: penaltyDestination === 'forfeit' ? colors.primary : colors.text
                  }}>
                    Forfeit (Lost Forever)
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    color: colors.textSecondary
                  }}>
                    You lose out on maximizing your savings - penalty money is forfeited
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Charity Selection */}
            {penaltyDestination === 'charity' && (
              <View style={{
                backgroundColor: 'white',
                padding: 20,
                borderRadius: radius,
                marginBottom: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3
              }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: colors.text,
                  marginBottom: 16
                }}>
                  ❤️ Select Charity
                </Text>

                {charities.map((charity) => (
                  <TouchableOpacity
                    key={charity.id}
                    onPress={() => setSelectedCharity(charity.id)}
                    style={{
                      padding: 12,
                      borderRadius: radius,
                      backgroundColor: selectedCharity === charity.id ? colors.primaryLight : colors.background,
                      borderWidth: 1,
                      borderColor: selectedCharity === charity.id ? colors.primary : colors.border,
                      marginBottom: 8
                    }}
                  >
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: selectedCharity === charity.id ? colors.primary : colors.text,
                      marginBottom: 2
                    }}>
                      {charity.name}
                    </Text>
                    <Text style={{
                      fontSize: 12,
                      color: colors.textSecondary
                    }}>
                      {charity.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {/* Save Button */}
        <TouchableOpacity
          onPress={savePenaltySettings}
          style={{
            backgroundColor: colors.primary,
            padding: 16,
            borderRadius: radius,
            alignItems: 'center',
            marginTop: 20
          }}
        >
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: 'white'
          }}>
            Save Penalty Settings
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
