import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  StyleSheet
} from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';

export default function ContributionSettings({ navigation, route }) {
  const { userId } = route.params;
  
  // Payday Settings
  const [paydayFrequency, setPaydayFrequency] = useState('semi-monthly');
  const [paydayDays, setPaydayDays] = useState(['friday']); // For weekly/biweekly
  const [paydayDates, setPaydayDates] = useState([1, 15]); // For semi-monthly
  
  // Recurring Payment Settings
  const [autoContribute, setAutoContribute] = useState(false);
  const [contributionAmount, setContributionAmount] = useState('');
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState('bank');
  
  // Streak Settings
  const [streaksEnabled, setStreaksEnabled] = useState(true);
  const [reminderDays, setReminderDays] = useState(2);
  const [streakGoal, setStreakGoal] = useState('weekly');
  
  // Notification Settings
  const [paydayReminders, setPaydayReminders] = useState(true);
  const [streakReminders, setStreakReminders] = useState(true);
  const [contributionReminders, setContributionReminders] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load payday settings
      const paydayData = await api.getPaydaySettings(userId);
      if (paydayData) {
        setPaydayFrequency(paydayData.frequency || 'semi-monthly');
        setPaydayDays(paydayData.days || ['friday']);
        setPaydayDates(paydayData.dates || [1, 15]);
      }

      // Load recurring payment settings
      const recurringData = await api.getRecurringPaymentSettings ? await api.getRecurringPaymentSettings(null, userId) : null;
      if (recurringData && recurringData.length > 0) {
        const recurring = recurringData[0];
        setAutoContribute(recurring.enabled || false);
        setContributionAmount(recurring.amount ? (recurring.amount / 100).toString() : '');
        setDefaultPaymentMethod(recurring.payment_method || 'bank');
      }

      // Load streak settings
      const streakData = await api.getStreakSettings(userId);
      if (streakData) {
        setStreaksEnabled(streakData.enabled !== false);
        setReminderDays(streakData.reminder_days || 2);
        setStreakGoal(streakData.goal || 'weekly');
      }
    } catch (error) {
      console.error('Load settings error:', error);
    }
  };

  const saveSettings = async () => {
    try {
      // Save payday settings
      await api.savePaydaySettings(userId, {
        frequency: paydayFrequency,
        days: paydayDays,
        dates: paydayDates
      });

      // Save recurring payment settings
      if (autoContribute && contributionAmount) {
        await api.saveRecurringPayment(userId, {
          enabled: autoContribute,
          amount: Math.round(parseFloat(contributionAmount) * 100),
          payment_method: defaultPaymentMethod,
          frequency: paydayFrequency
        });
      }

      // Save streak settings
      await api.saveStreakSettings(userId, {
        enabled: streaksEnabled,
        reminder_days: reminderDays,
        goal: streakGoal
      });

      Alert.alert(
        'Settings Saved!',
        'Your contribution preferences have been updated.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Save settings error:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  const formatAmount = (text) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].substring(0, 2);
    }
    return cleaned;
  };

  const togglePaydayDay = (day) => {
    setPaydayDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const togglePaydayDate = (date) => {
    setPaydayDates(prev => 
      prev.includes(date) 
        ? prev.filter(d => d !== date)
        : [...prev, date].sort((a, b) => a - b)
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ 
        paddingTop: 60, 
        paddingHorizontal: 20, 
        paddingBottom: 20, 
        backgroundColor: colors.primary,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16
            }}
          >
            <Text style={{ fontSize: 18, color: 'white' }}>←</Text>
          </TouchableOpacity>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: 'white',
            flex: 1
          }}>
            Contribution Settings
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: 20 }}>
          
          {/* Payday Schedule */}
          <View style={{
            backgroundColor: 'white',
            borderRadius: radius,
            padding: 20,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: colors.text,
              marginBottom: 16
            }}>
              💰 Payday Schedule
            </Text>
            
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
              How often do you get paid?
            </Text>
            
            <View style={{ flexDirection: 'row', marginBottom: 20 }}>
              {['weekly', 'bi-weekly', 'semi-monthly', 'monthly'].map((freq) => (
                <TouchableOpacity
                  key={freq}
                  onPress={() => {
                    setPaydayFrequency(freq);
                    if (freq === 'semi-monthly') {
                      setPaydayDates([1, 15]); // Auto-set both dates for semi-monthly
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: 12,
                    marginHorizontal: 4,
                    borderRadius: radius,
                    backgroundColor: paydayFrequency === freq ? colors.primary : colors.surface,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{
                    color: paydayFrequency === freq ? 'white' : colors.text,
                    fontWeight: '600',
                    textTransform: 'capitalize',
                    fontSize: 11
                  }}>
                    {freq === 'semi-monthly' ? 'Semi-Monthly' : freq}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {paydayFrequency === 'weekly' || paydayFrequency === 'bi-weekly' ? (
              <>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
                  Which days do you get paid? (Select multiple)
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                    <TouchableOpacity
                      key={day}
                      onPress={() => togglePaydayDay(day)}
                      style={{
                        padding: 8,
                        margin: 4,
                        borderRadius: radius,
                        backgroundColor: paydayDays.includes(day) ? colors.primary : colors.surface,
                        minWidth: 70,
                        alignItems: 'center',
                        borderWidth: paydayDays.includes(day) ? 0 : 1,
                        borderColor: colors.border
                      }}
                    >
                      <Text style={{
                        color: paydayDays.includes(day) ? 'white' : colors.text,
                        fontWeight: '600',
                        fontSize: 12
                      }}>
                        {day.substring(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : paydayFrequency === 'semi-monthly' ? (
              <>
                <View style={{
                  backgroundColor: colors.surface,
                  borderRadius: radius,
                  padding: 16,
                  marginBottom: 16,
                  alignItems: 'center'
                }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
                    Semi-monthly schedule
                  </Text>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.primary, marginBottom: 4 }}>
                    1st & 15th of each month
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center' }}>
                    💡 Standard semi-monthly pay schedule
                  </Text>
                </View>
              </>
            ) : paydayFrequency === 'monthly' ? (
              <>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
                  Which date do you get paid each month?
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
                  {[1, 2, 3, 5, 10, 15, 20, 25, 28, 30, 31].map((date) => (
                    <TouchableOpacity
                      key={date}
                      onPress={() => setPaydayDates([date])}
                      style={{
                        padding: 12,
                        margin: 4,
                        borderRadius: radius,
                        backgroundColor: paydayDates.includes(date) ? colors.primary : colors.surface,
                        minWidth: 50,
                        alignItems: 'center',
                        borderWidth: paydayDates.includes(date) ? 0 : 1,
                        borderColor: colors.border
                      }}
                    >
                      <Text style={{
                        color: paydayDates.includes(date) ? 'white' : colors.text,
                        fontWeight: '600',
                        fontSize: 14
                      }}>
                        {date === 31 ? 'Last' : date}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 16 }}>
                  💡 Common: 1st, 15th, or last day of month
                </Text>
              </>
            ) : null}

            {(paydayDays.length > 0 || paydayDates.length > 0) && (
              <View style={{
                backgroundColor: colors.surface,
                borderRadius: radius,
                padding: 12,
                marginBottom: 16
              }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 4 }}>
                  Your payday schedule:
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                  {paydayFrequency === 'semi-monthly' 
                    ? '1st & 15th of each month'
                    : paydayFrequency === 'monthly'
                    ? `${paydayDates.map(d => d === 31 ? 'Last day' : d === 1 ? '1st' : d === 2 ? '2nd' : d === 3 ? '3rd' : `${d}th`).join(', ')} of each month`
                    : paydayFrequency === 'bi-weekly'
                    ? `Every other ${paydayDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}`
                    : `Every ${paydayDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}`
                  }
                </Text>
              </View>
            )}
          </View>

          {/* Auto-Contribute */}
          <View style={{
            backgroundColor: 'white',
            borderRadius: radius,
            padding: 20,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: colors.text,
              marginBottom: 16
            }}>
              🔄 Auto-Contribute
            </Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                Enable automatic contributions
              </Text>
              <Switch
                value={autoContribute}
                onValueChange={setAutoContribute}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={autoContribute ? 'white' : colors.textSecondary}
              />
            </View>

            {autoContribute && (
              <>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
                  Amount per contribution
                </Text>
                <TextInput
                  value={contributionAmount}
                  onChangeText={(text) => setContributionAmount(formatAmount(text))}
                  placeholder="25.00"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="decimal-pad"
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: radius,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: contributionAmount ? colors.primary : colors.border,
                    fontSize: 16,
                    color: colors.text,
                    marginBottom: 16
                  }}
                />

                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
                  Payment method
                </Text>
                <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                  {[
                    { key: 'bank', label: '🏦 Bank', color: colors.blue },
                    { key: 'venmo', label: '💙 Venmo', color: '#3D95CE' },
                    { key: 'cashapp', label: '💚 Cash App', color: '#00D632' }
                  ].map((method) => (
                    <TouchableOpacity
                      key={method.key}
                      onPress={() => setDefaultPaymentMethod(method.key)}
                      style={{
                        flex: 1,
                        padding: 12,
                        marginHorizontal: 4,
                        borderRadius: radius,
                        backgroundColor: defaultPaymentMethod === method.key ? method.color : colors.surface,
                        alignItems: 'center'
                      }}
                    >
                      <Text style={{
                        color: defaultPaymentMethod === method.key ? 'white' : colors.text,
                        fontWeight: '600',
                        fontSize: 12
                      }}>
                        {method.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>

          {/* Streak Tracking */}
          <View style={{
            backgroundColor: 'white',
            borderRadius: radius,
            padding: 20,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: colors.text,
              marginBottom: 8
            }}>
              🔥 Streak Tracking
            </Text>
            
            <Text style={{
              fontSize: 14,
              color: colors.textSecondary,
              marginBottom: 16,
              lineHeight: 20
            }}>
              Track your contribution consistency and build healthy saving habits
            </Text>
            
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16
            }}>
              <Text style={{ fontSize: 16, color: colors.text }}>Enable streak tracking</Text>
              <Switch
                value={streaksEnabled}
                onValueChange={setStreaksEnabled}
                trackColor={{ false: '#767577', true: colors.primary }}
                thumbColor={streaksEnabled ? '#f5dd4b' : '#f4f3f4'}
              />
            </View>

            {streaksEnabled && (
              <>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
                  How often should you contribute to maintain your streak?
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 12 }}>
                  This determines how frequently you need to contribute to keep your streak alive
                </Text>
                <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                  {[
                    { key: 'weekly', label: 'Weekly', desc: 'Once per week' },
                    { key: 'bi-weekly', label: 'Bi-weekly', desc: 'Every 2 weeks' },
                    { key: 'monthly', label: 'Monthly', desc: 'Once per month' }
                  ].map((goal) => (
                    <TouchableOpacity
                      key={goal.key}
                      onPress={() => setStreakGoal(goal.key)}
                      style={{
                        flex: 1,
                        padding: 12,
                        marginHorizontal: 4,
                        borderRadius: radius,
                        backgroundColor: streakGoal === goal.key ? colors.primary : colors.surface,
                        alignItems: 'center',
                        borderWidth: streakGoal === goal.key ? 0 : 1,
                        borderColor: colors.border
                      }}
                    >
                      <Text style={{
                        color: streakGoal === goal.key ? 'white' : colors.text,
                        fontWeight: '600',
                        fontSize: 12,
                        textAlign: 'center'
                      }}>
                        {goal.label}
                      </Text>
                      <Text style={{
                        color: streakGoal === goal.key ? 'rgba(255,255,255,0.8)' : colors.textSecondary,
                        fontSize: 10,
                        textAlign: 'center',
                        marginTop: 2
                      }}>
                        {goal.desc}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
                  Streak reminder timing
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 12 }}>
                  Get notified before your streak deadline to stay on track
                </Text>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.surface,
                  borderRadius: radius,
                  padding: 16
                }}>
                  <TouchableOpacity
                    onPress={() => setReminderDays(Math.max(0, reminderDays - 1))}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: colors.primary,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>-</Text>
                  </TouchableOpacity>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{
                      fontSize: 18,
                      fontWeight: 'bold',
                      color: colors.text
                    }}>
                      {reminderDays} {reminderDays === 1 ? 'day' : 'days'}
                    </Text>
                    <Text style={{
                      fontSize: 12,
                      color: colors.textSecondary,
                      textAlign: 'center'
                    }}>
                      before deadline
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setReminderDays(Math.min(7, reminderDays + 1))}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: colors.primary,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>+</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={{
                  backgroundColor: '#f8f9ff',
                  borderRadius: radius,
                  padding: 12,
                  marginTop: 16,
                  borderLeftWidth: 4,
                  borderLeftColor: colors.primary
                }}>
                  <Text style={{ fontSize: 12, color: colors.text, lineHeight: 16 }}>
                    💡 <Text style={{ fontWeight: '600' }}>Example:</Text> With {streakGoal} streaks and {reminderDays}-day reminders, you'll get notified {reminderDays} {reminderDays === 1 ? 'day' : 'days'} before your {streakGoal === 'weekly' ? 'weekly' : streakGoal === 'bi-weekly' ? 'bi-weekly' : 'monthly'} contribution deadline.
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Notification Preferences */}
          <View style={{
            backgroundColor: 'white',
            borderRadius: radius,
            padding: 20,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: colors.text,
              marginBottom: 16
            }}>
              🔔 Notifications
            </Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 16, color: colors.text }}>Payday reminders</Text>
              <Switch
                value={paydayReminders}
                onValueChange={setPaydayReminders}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={paydayReminders ? 'white' : colors.textSecondary}
              />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 16, color: colors.text }}>Streak reminders</Text>
              <Switch
                value={streakReminders}
                onValueChange={setStreakReminders}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={streakReminders ? 'white' : colors.textSecondary}
              />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, color: colors.text }}>Contribution reminders</Text>
              <Switch
                value={contributionReminders}
                onValueChange={setContributionReminders}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={contributionReminders ? 'white' : colors.textSecondary}
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={saveSettings}
            style={{
              backgroundColor: colors.primary,
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
              Save Settings
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
