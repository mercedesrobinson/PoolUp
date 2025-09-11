import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import { colors, radius } from '../theme';

interface CustomCalendarProps {
  onDateSelect: (date: Date) => void;
  onClose: () => void;
  initialDate?: Date;
}

const CustomCalendar: React.FC<CustomCalendarProps> = ({ onDateSelect, onClose, initialDate }) => {
  const now = new Date();
  const [currentDate, setCurrentDate] = useState(initialDate || now);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleConfirm = () => {
    if (selectedDate) {
      onDateSelect(selectedDate);
      onClose();
    }
  };

  const getDaysInMonth = (date: Date): (Date | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const calendarDays = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(new Date(year, month, day));
    }
    
    return calendarDays;
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateYear = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(currentDate.getFullYear() + direction);
    setCurrentDate(newDate);
  };

  const handleDateSelect = (date: Date | null) => {
    if (date && !isPastDate(date)) {
      setSelectedDate(date);
      onDateSelect(date);
    }
  };

  const isToday = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  const isPastDate = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return dateOnly < todayOnly;
  };

  const isSelected = (date: Date | null): boolean => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const days = getDaysInMonth(currentDate);

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
      }}>
        <View style={{
          backgroundColor: 'white',
          borderRadius: radius.medium,
          padding: 20,
          width: '100%',
          maxWidth: 350,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '700',
              color: colors.text
            }}>
              Select Target Date
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 18, color: '#999' }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Month/Year Navigation */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20
          }}>
            <TouchableOpacity
              onPress={() => navigateYear(-1)}
              style={{ padding: 8 }}
            >
              <Text style={{ fontSize: 16, color: colors.primary }}>‹‹</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => navigateMonth(-1)}
              style={{ padding: 8 }}
            >
              <Text style={{ fontSize: 16, color: colors.primary }}>‹</Text>
            </TouchableOpacity>

            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.text,
              minWidth: 140,
              textAlign: 'center'
            }}>
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>

            <TouchableOpacity
              onPress={() => navigateMonth(1)}
              style={{ padding: 8 }}
            >
              <Text style={{ fontSize: 16, color: colors.primary }}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigateYear(1)}
              style={{ padding: 8 }}
            >
              <Text style={{ fontSize: 16, color: colors.primary }}>››</Text>
            </TouchableOpacity>
          </View>

          {/* Days of Week Header */}
          <View style={{
            flexDirection: 'row',
            marginBottom: 10
          }}>
            {daysOfWeek.map((day) => (
              <View key={day} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: '#666'
                }}>
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View>
            {/* Create rows of 7 days each */}
            {Array.from({ length: Math.ceil(days.length / 7) }, (_, weekIndex) => (
              <View key={weekIndex} style={{ flexDirection: 'row' }}>
                {days.slice(weekIndex * 7, (weekIndex + 1) * 7).map((date, dayIndex) => {
                  const index = weekIndex * 7 + dayIndex;
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleDateSelect(date)}
                      disabled={!date || isPastDate(date)}
                      style={{
                        width: '14.28%',
                        height: 40,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 2,
                        borderRadius: 6,
                        backgroundColor: isSelected(date) 
                          ? colors.primary 
                          : isToday(date) 
                            ? colors.blue 
                            : 'transparent'
                      }}
                    >
                      {date && (
                        <Text style={{
                          fontSize: 14,
                          fontWeight: isSelected(date) || isToday(date) ? '600' : '400',
                          color: isSelected(date) 
                            ? 'white'
                            : isPastDate(date)
                              ? '#ccc'
                              : isToday(date)
                                ? colors.primary
                                : colors.text
                        }}>
                          {date.getDate()}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Footer */}
          <View style={{
            marginTop: 20,
            paddingTop: 15,
            borderTopWidth: 1,
            borderTopColor: '#f0f0f0'
          }}>
            <Text style={{
              fontSize: 12,
              color: '#666',
              textAlign: 'center'
            }}>
              Tap a date to select your savings target
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CustomCalendar;
