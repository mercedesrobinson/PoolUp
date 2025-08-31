import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, Switch, ScrollView } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';

export default function RecurringPayments({ navigation, route }) {
  const [recurringEnabled, setRecurringEnabled] = useState(false);
  const [frequency, setFrequency] = useState('weekly'); // weekly, biweekly, monthly
  const [amount, setAmount] = useState('25.00');
  const [dayOfWeek, setDayOfWeek] = useState('monday');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [autoIncrease, setAutoIncrease] = useState(false);
  const [increaseAmount, setIncreaseAmount] = useState('5.00');
  const poolId = route.params?.poolId;
  const poolName = route.params?.poolName || 'Savings Pool';
  const userId = route.params?.userId || '1756612920173';

  useEffect(() => {
    loadRecurringSettings();
  }, []);

  const loadRecurringSettings = async () => {
    try {
      const settings = await api.getRecurringPaymentSettings(poolId, userId);
      setRecurringEnabled(settings.enabled);
      setFrequency(settings.frequency);
      setAmount(settings.amount.toString());
      setDayOfWeek(settings.dayOfWeek);
      setDayOfMonth(settings.dayOfMonth.toString());
      setPaymentMethod(settings.paymentMethod);
      setAutoIncrease(settings.autoIncrease);
      setIncreaseAmount(settings.increaseAmount.toString());
    } catch (error) {
      console.log('Using default recurring payment settings');
    }
  };

  const saveRecurringSettings = async () => {
    try {
      const settings = {
        enabled: recurringEnabled,
        frequency,
        amount: parseFloat(amount),
        dayOfWeek,
        dayOfMonth: parseInt(dayOfMonth),
        paymentMethod,
        autoIncrease,
        increaseAmount: parseFloat(increaseAmount)
      };

      await api.updateRecurringPaymentSettings(poolId, userId, settings);
      Alert.alert('Success', 'Recurring payment settings updated!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update recurring payment settings');
    }
  };

  const getNextPaymentDate = () => {
    const now = new Date();
    let nextDate = new Date();

    if (frequency === 'weekly') {
      const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const targetDay = daysOfWeek.indexOf(dayOfWeek);
      const currentDay = now.getDay();
      const daysUntilNext = (targetDay - currentDay + 7) % 7 || 7;
      nextDate.setDate(now.getDate() + daysUntilNext);
    } else if (frequency === 'biweekly') {
      const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const targetDay = daysOfWeek.indexOf(dayOfWeek);
      const currentDay = now.getDay();
      const daysUntilNext = (targetDay - currentDay + 7) % 7 || 7;
      nextDate.setDate(now.getDate() + daysUntilNext);
    } else if (frequency === 'monthly') {
      const targetDay = parseInt(dayOfMonth);
      nextDate.setDate(targetDay);
      if (nextDate <= now) {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
    }

    return nextDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getAnnualTotal = () => {
    const monthlyAmount = parseFloat(amount) || 0;
    let paymentsPerYear = 0;

    if (frequency === 'weekly') paymentsPerYear = 52;
    else if (frequency === 'biweekly') paymentsPerYear = 26;
    else if (frequency === 'monthly') paymentsPerYear = 12;

    return monthlyAmount * paymentsPerYear;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ 
        backgroundColor: 'white', 
        paddingHorizontal: 20, 
        paddingTop: 60, 
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
            Recurring Payments
          </Text>
        </View>
        <Text style={{ 
          fontSize: 16, 
          color: colors.textSecondary,
          marginBottom: 8
        }}>
          Set up automatic contributions to "{poolName}"
        </Text>
      </View>

      <ScrollView style={{ flex: 1, padding: 20 }}>
        {/* Enable/Disable Recurring */}
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
                🔄 Enable Recurring Payments
              </Text>
              <Text style={{
                fontSize: 14,
                color: colors.textSecondary,
                lineHeight: 20
              }}>
                Automatically contribute to your savings goal on a schedule
              </Text>
            </View>
            <Switch
              value={recurringEnabled}
              onValueChange={setRecurringEnabled}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={recurringEnabled ? colors.primary : colors.textSecondary}
            />
          </View>
        </View>

        {recurringEnabled && (
          <>
            {/* Amount */}
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
                💰 Contribution Amount
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 20, marginRight: 8 }}>$</Text>
                <TextInput
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: radius,
                    padding: 12,
                    fontSize: 18,
                    fontWeight: '600'
                  }}
                  placeholder="25.00"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                />
              </View>

              <View style={{
                backgroundColor: colors.primaryLight,
                padding: 12,
                borderRadius: radius
              }}>
                <Text style={{ fontSize: 14, color: colors.primary, fontWeight: '600' }}>
                  Annual Total: ${getAnnualTotal().toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Frequency */}
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
                📅 Payment Frequency
              </Text>

              <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                {[
                  { key: 'weekly', label: 'Weekly', icon: '📅' },
                  { key: 'biweekly', label: 'Bi-weekly', icon: '📆' },
                  { key: 'monthly', label: 'Monthly', icon: '🗓️' }
                ].map((freq) => (
                  <TouchableOpacity
                    key={freq.key}
                    onPress={() => setFrequency(freq.key)}
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: radius,
                      backgroundColor: frequency === freq.key ? colors.primaryLight : colors.background,
                      borderWidth: 2,
                      borderColor: frequency === freq.key ? colors.primary : colors.border,
                      marginHorizontal: 4,
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{ fontSize: 16, marginBottom: 4 }}>{freq.icon}</Text>
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: frequency === freq.key ? colors.primary : colors.textSecondary
                    }}>
                      {freq.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Day Selection */}
              {(frequency === 'weekly' || frequency === 'biweekly') && (
                <View>
                  <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 8 }}>
                    Day of the week:
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row' }}>
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                        <TouchableOpacity
                          key={day}
                          onPress={() => setDayOfWeek(day)}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            marginRight: 8,
                            borderRadius: 16,
                            backgroundColor: dayOfWeek === day ? colors.primary : colors.background,
                            borderWidth: 1,
                            borderColor: dayOfWeek === day ? colors.primary : colors.border
                          }}
                        >
                          <Text style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: dayOfWeek === day ? 'white' : colors.textSecondary,
                            textTransform: 'capitalize'
                          }}>
                            {day.substring(0, 3)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              {frequency === 'monthly' && (
                <View>
                  <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 8 }}>
                    Day of the month:
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: radius,
                      padding: 12,
                      fontSize: 16,
                      width: 80
                    }}
                    placeholder="1"
                    value={dayOfMonth}
                    onChangeText={setDayOfMonth}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                </View>
              )}

              <View style={{
                backgroundColor: colors.background,
                padding: 12,
                borderRadius: radius,
                marginTop: 12
              }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                  Next payment:
                </Text>
                <Text style={{ fontSize: 14, color: colors.text, fontWeight: '600' }}>
                  {getNextPaymentDate()}
                </Text>
              </View>
            </View>

            {/* Payment Method */}
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
                💳 Payment Method
              </Text>

              <TouchableOpacity
                onPress={() => setPaymentMethod('bank_transfer')}
                style={{
                  padding: 16,
                  borderRadius: radius,
                  backgroundColor: paymentMethod === 'bank_transfer' ? colors.primaryLight : colors.background,
                  borderWidth: 2,
                  borderColor: paymentMethod === 'bank_transfer' ? colors.primary : colors.border,
                  marginBottom: 12,
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontSize: 20, marginRight: 12 }}>🏦</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: paymentMethod === 'bank_transfer' ? colors.primary : colors.text
                  }}>
                    Bank Transfer (ACH)
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    color: colors.textSecondary
                  }}>
                    Lower fees, 1-2 business days
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setPaymentMethod('debit_card')}
                style={{
                  padding: 16,
                  borderRadius: radius,
                  backgroundColor: paymentMethod === 'debit_card' ? colors.primaryLight : colors.background,
                  borderWidth: 2,
                  borderColor: paymentMethod === 'debit_card' ? colors.primary : colors.border,
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontSize: 20, marginRight: 12 }}>💳</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: paymentMethod === 'debit_card' ? colors.primary : colors.text
                  }}>
                    Debit Card
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    color: colors.textSecondary
                  }}>
                    Instant transfer, small fee
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Auto-Increase */}
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
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: colors.text,
                    marginBottom: 4
                  }}>
                    📈 Auto-Increase
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    lineHeight: 20
                  }}>
                    Gradually increase contributions every 3 months
                  </Text>
                </View>
                <Switch
                  value={autoIncrease}
                  onValueChange={setAutoIncrease}
                  trackColor={{ false: colors.border, true: colors.primaryLight }}
                  thumbColor={autoIncrease ? colors.primary : colors.textSecondary}
                />
              </View>

              {autoIncrease && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, marginRight: 8 }}>Increase by $</Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: radius,
                      padding: 8,
                      fontSize: 16,
                      width: 80,
                      textAlign: 'center'
                    }}
                    placeholder="5.00"
                    value={increaseAmount}
                    onChangeText={setIncreaseAmount}
                    keyboardType="numeric"
                  />
                  <Text style={{ fontSize: 16, marginLeft: 8 }}>every 3 months</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Summary */}
        {recurringEnabled && (
          <View style={{
            backgroundColor: colors.primaryLight,
            padding: 20,
            borderRadius: radius,
            marginBottom: 20,
            borderLeftWidth: 4,
            borderLeftColor: colors.primary
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.primary,
              marginBottom: 8
            }}>
              🎯 Recurring Payment Summary
            </Text>
            <Text style={{ fontSize: 14, color: colors.text, lineHeight: 20 }}>
              ${amount} will be automatically transferred from your {paymentMethod.replace('_', ' ')} every{' '}
              {frequency === 'weekly' ? `${dayOfWeek}` : 
               frequency === 'biweekly' ? `other ${dayOfWeek}` :
               `${dayOfMonth}${getDayOrdinal(parseInt(dayOfMonth))} of the month`}.
              {autoIncrease && ` Your contribution will increase by $${increaseAmount} every 3 months.`}
            </Text>
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity
          onPress={saveRecurringSettings}
          style={{
            backgroundColor: colors.primary,
            padding: 16,
            borderRadius: radius,
            alignItems: 'center',
            marginBottom: 40
          }}
        >
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: 'white'
          }}>
            {recurringEnabled ? 'Save Recurring Payment' : 'Save Settings'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function getDayOrdinal(day) {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}
