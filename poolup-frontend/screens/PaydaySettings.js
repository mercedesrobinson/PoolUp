import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import api from '../services/api';
import notificationService from '../services/notifications';
import { colors, radius } from '../theme';

export default function PaydaySettings({ navigation, route }) {
  const { user } = route?.params || {};
  const [paydayType, setPaydayType] = useState('weekly'); // 'weekly', 'biweekly', 'monthly', 'custom'
  const [weeklyDay, setWeeklyDay] = useState('friday'); // day of week for weekly
  const [biweeklyStart, setBiweeklyStart] = useState('2024-01-01'); // start date for biweekly
  const [monthlyDates, setMonthlyDates] = useState(['1', '15']); // dates for monthly (1st and 15th)
  const [enableStreaks, setEnableStreaks] = useState(true);
  const [reminderDays, setReminderDays] = useState(1); // days before payday to remind

  useEffect(() => {
    loadPaydaySettings();
  }, []);

  const loadPaydaySettings = async () => {
    try {
      const settings = await api.getPaydaySettings(user.id);
      if (settings) {
        setPaydayType(settings.type);
        setWeeklyDay(settings.weekly_day || 'friday');
        setBiweeklyStart(settings.biweekly_start || '2024-01-01');
        setMonthlyDates(settings.monthly_dates || ['1', '15']);
        setEnableStreaks(settings.enable_streaks !== false);
        setReminderDays(settings.reminder_days || 1);
      }
    } catch (error) {
      console.log('Using default payday settings');
    }
  };

  const saveSettings = async () => {
    try {
      const settings = {
        frequency: paydayType,
        weekly_day: weeklyDay,
        biweekly_start: biweeklyStart,
        monthly_dates: monthlyDates,
        reminders_enabled: enableStreaks,
        reminder_days_before: reminderDays,
      };

      await api.updatePaydaySettings(user?.id || 'guest', settings);
      
      // Schedule payday reminders based on new settings
      if (enableStreaks) {
        await notificationService.schedulePaydayReminders(user?.id || 'guest', settings);
      } else {
        await notificationService.cancelNotificationsByType('payday_reminder');
      }
      
      Alert.alert('Success', 'Payday settings saved successfully!');
    } catch (error) {
      console.error('Failed to save payday settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  const getNextPaydays = () => {
    const today = new Date();
    const paydays = [];
    
    for (let i = 0; i < 4; i++) { // Show next 4 paydays
      let nextPayday;
      
      if (paydayType === 'weekly') {
        const dayMap = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0 };
        const targetDay = dayMap[weeklyDay];
        nextPayday = new Date(today);
        nextPayday.setDate(today.getDate() + (7 * i) + (targetDay - today.getDay() + 7) % 7);
        if (i === 0 && nextPayday <= today) {
          nextPayday.setDate(nextPayday.getDate() + 7);
        }
      } else if (paydayType === 'biweekly') {
        const startDate = new Date(biweeklyStart);
        const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
        const weeksSinceStart = Math.floor(daysSinceStart / 14);
        nextPayday = new Date(startDate);
        nextPayday.setDate(startDate.getDate() + ((weeksSinceStart + i + 1) * 14));
      } else if (paydayType === 'monthly') {
        nextPayday = new Date(today.getFullYear(), today.getMonth() + Math.floor(i / monthlyDates.length), parseInt(monthlyDates[i % monthlyDates.length]));
        if (nextPayday <= today) {
          nextPayday = new Date(today.getFullYear(), today.getMonth() + Math.floor((i + monthlyDates.length) / monthlyDates.length), parseInt(monthlyDates[(i + monthlyDates.length) % monthlyDates.length]));
        }
      }
      
      if (nextPayday) paydays.push(nextPayday);
    }
    
    return paydays;
  };

  const PaydayOption = ({ type, title, description, isSelected, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: isSelected ? colors.primaryLight : 'white',
        borderWidth: 2,
        borderColor: isSelected ? colors.primary : colors.border,
        borderRadius: radius,
        padding: 16,
        marginBottom: 12
      }}
    >
      <Text style={{
        fontSize: 16,
        fontWeight: '600',
        color: isSelected ? colors.primary : colors.text,
        marginBottom: 4
      }}>
        {title}
      </Text>
      <Text style={{
        fontSize: 14,
        color: colors.textSecondary
      }}>
        {description}
      </Text>
    </TouchableOpacity>
  );

  const DayButton = ({ day, isSelected, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: isSelected ? colors.primary : colors.background,
        borderWidth: 1,
        borderColor: isSelected ? colors.primary : colors.border,
        borderRadius: radius,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginRight: 8,
        marginBottom: 8
      }}
    >
      <Text style={{
        fontSize: 14,
        fontWeight: '600',
        color: isSelected ? 'white' : colors.text,
        textTransform: 'capitalize'
      }}>
        {day}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ backgroundColor: colors.primary, paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
          <Text style={{ color: 'white', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: 'white', fontSize: 24, fontWeight: '700' }}>Payday Settings</Text>
        <Text style={{ color: 'white', fontSize: 16, opacity: 0.9, marginTop: 4 }}>
          Align your streaks with your actual pay schedule
        </Text>
      </View>

      <View style={{ padding: 20 }}>
        {/* Enable Streaks Toggle */}
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
                🔥 Enable Smart Streaks
              </Text>
              <Text style={{
                fontSize: 14,
                color: colors.textSecondary,
                lineHeight: 20
              }}>
                Track contribution streaks based on your actual payday schedule
              </Text>
            </View>
            <Switch
              value={enableStreaks}
              onValueChange={setEnableStreaks}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={enableStreaks ? colors.primary : colors.textSecondary}
            />
          </View>
        </View>

        {enableStreaks && (
          <>
            {/* Payday Type Selection */}
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
                💰 How often do you get paid?
              </Text>

              <PaydayOption
                type="weekly"
                title="Weekly"
                description="Every week on the same day"
                isSelected={paydayType === 'weekly'}
                onPress={() => setPaydayType('weekly')}
              />

              <PaydayOption
                type="biweekly"
                title="Bi-weekly (Every 2 weeks)"
                description="Every other week on the same day"
                isSelected={paydayType === 'biweekly'}
                onPress={() => setPaydayType('biweekly')}
              />

              <PaydayOption
                type="monthly"
                title="Monthly"
                description="Once or twice per month on specific dates"
                isSelected={paydayType === 'monthly'}
                onPress={() => setPaydayType('monthly')}
              />
            </View>

            {/* Weekly Day Selection */}
            {paydayType === 'weekly' && (
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
                  📅 Which day do you get paid?
                </Text>
                
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                    <DayButton
                      key={day}
                      day={day}
                      isSelected={weeklyDay === day}
                      onPress={() => setWeeklyDay(day)}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Monthly Dates Selection */}
            {paydayType === 'monthly' && (
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
                  📅 Which dates do you get paid?
                </Text>
                
                <Text style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  marginBottom: 16
                }}>
                  Select common payday patterns:
                </Text>

                <TouchableOpacity
                  onPress={() => setMonthlyDates(['1', '15'])}
                  style={{
                    backgroundColor: JSON.stringify(monthlyDates) === JSON.stringify(['1', '15']) ? colors.primaryLight : colors.background,
                    borderWidth: 1,
                    borderColor: JSON.stringify(monthlyDates) === JSON.stringify(['1', '15']) ? colors.primary : colors.border,
                    borderRadius: radius,
                    padding: 12,
                    marginBottom: 8
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600' }}>1st and 15th of each month</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setMonthlyDates(['1'])}
                  style={{
                    backgroundColor: JSON.stringify(monthlyDates) === JSON.stringify(['1']) ? colors.primaryLight : colors.background,
                    borderWidth: 1,
                    borderColor: JSON.stringify(monthlyDates) === JSON.stringify(['1']) ? colors.primary : colors.border,
                    borderRadius: radius,
                    padding: 12,
                    marginBottom: 8
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600' }}>1st of each month</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setMonthlyDates(['15'])}
                  style={{
                    backgroundColor: JSON.stringify(monthlyDates) === JSON.stringify(['15']) ? colors.primaryLight : colors.background,
                    borderWidth: 1,
                    borderColor: JSON.stringify(monthlyDates) === JSON.stringify(['15']) ? colors.primary : colors.border,
                    borderRadius: radius,
                    padding: 12
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600' }}>15th of each month</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Preview Next Paydays */}
            <View style={{
              backgroundColor: colors.green + '15',
              padding: 20,
              borderRadius: radius,
              marginBottom: 20,
              borderLeftWidth: 4,
              borderLeftColor: colors.green
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: colors.text,
                marginBottom: 12
              }}>
                📊 Your Streak Schedule
              </Text>
              
              <Text style={{
                fontSize: 14,
                color: colors.textSecondary,
                marginBottom: 12
              }}>
                Your next few contribution windows:
              </Text>

              {getNextPaydays().slice(0, 3).map((payday, index) => (
                <View key={index} style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: 8
                }}>
                  <Text style={{ fontSize: 14, color: colors.text }}>
                    {index === 0 ? '🎯 Next: ' : `${index + 1}. `}{payday.toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </Text>
                  {index === 0 && (
                    <Text style={{ fontSize: 12, color: colors.green, fontWeight: '600' }}>
                      UPCOMING
                    </Text>
                  )}
                </View>
              ))}

              <Text style={{
                fontSize: 12,
                color: colors.text,
                marginTop: 12,
                fontStyle: 'italic'
              }}>
                💡 Contribute within 3 days of each payday to maintain your streak!
              </Text>
            </View>

            {/* Reminder Settings */}
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
                🔔 Reminder Settings
              </Text>

              <Text style={{
                fontSize: 14,
                color: colors.textSecondary,
                marginBottom: 12
              }}>
                When should we remind you to contribute?
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {[1, 2, 3].map(days => (
                  <TouchableOpacity
                    key={days}
                    onPress={() => setReminderDays(days)}
                    style={{
                      backgroundColor: reminderDays === days ? colors.primary : colors.background,
                      borderWidth: 1,
                      borderColor: reminderDays === days ? colors.primary : colors.border,
                      borderRadius: radius,
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      marginRight: 8,
                      marginBottom: 8
                    }}
                  >
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: reminderDays === days ? 'white' : colors.text
                    }}>
                      {days} day{days > 1 ? 's' : ''} before
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Save Button */}
        <TouchableOpacity
          onPress={savePaydaySettings}
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
            Save Payday Settings
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
