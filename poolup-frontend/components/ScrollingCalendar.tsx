import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import { colors, radius } from '../theme';

interface ScrollingCalendarProps {
  onDateSelect: (date: Date) => void;
  onClose: () => void;
  initialDate?: Date;
}

const ScrollingCalendar: React.FC<ScrollingCalendarProps> = ({ onDateSelect, onClose, initialDate }) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedDay, setSelectedDay] = useState(currentDay);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const screenHeight = Dimensions.get('window').height;
  const pickerHeight = Math.min(200, screenHeight * 0.3);

  // Generate years (current year + 10 years)
  const years = Array.from({ length: 11 }, (_, i) => currentYear + i);
  
  // Generate days based on selected month/year
  const getDaysInMonth = (month: number, year: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  const days = getDaysInMonth(selectedMonth, selectedYear);

  // Adjust selected day if it's invalid for the new month
  useEffect(() => {
    const maxDays = getDaysInMonth(selectedMonth, selectedYear);
    if (selectedDay > maxDays.length) {
      setSelectedDay(maxDays.length);
    }
  }, [selectedMonth, selectedYear]);

  const handleConfirm = () => {
    const selectedDate = new Date(selectedYear, selectedMonth, selectedDay);
    onDateSelect(selectedDate);
    onClose();
  };

  const renderScrollPicker = (
    items: (string | number)[],
    selectedValue: string | number,
    onValueChange: (value: any) => void,
    itemHeight: number = 50
  ) => {
    return (
      <View style={{ height: pickerHeight, overflow: 'hidden' }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          snapToInterval={itemHeight}
          decelerationRate="fast"
          contentContainerStyle={{ paddingVertical: (pickerHeight - itemHeight) / 2 }}
        >
          {items.map((item, index) => {
            const isSelected = item === selectedValue;
            return (
              <TouchableOpacity
                key={index}
                onPress={() => onValueChange(typeof item === 'string' ? index : item)}
                style={{
                  height: itemHeight,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: isSelected ? colors.primary + '20' : 'transparent',
                  borderRadius: isSelected ? 8 : 0,
                  marginHorizontal: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: isSelected ? 18 : 16,
                    fontWeight: isSelected ? '600' : '400',
                    color: isSelected ? colors.primary : colors.text,
                  }}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

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

          {/* Date Pickers */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 20
          }}>
            {/* Month Picker */}
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: colors.text,
                textAlign: 'center',
                marginBottom: 8
              }}>
                Month
              </Text>
              {renderScrollPicker(
                months,
                months[selectedMonth],
                setSelectedMonth
              )}
            </View>

            {/* Day Picker */}
            <View style={{ flex: 1, marginHorizontal: 4 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: colors.text,
                textAlign: 'center',
                marginBottom: 8
              }}>
                Day
              </Text>
              {renderScrollPicker(
                days,
                selectedDay,
                setSelectedDay
              )}
            </View>

            {/* Year Picker */}
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: colors.text,
                textAlign: 'center',
                marginBottom: 8
              }}>
                Year
              </Text>
              {renderScrollPicker(
                years,
                selectedYear,
                setSelectedYear
              )}
            </View>
          </View>

          {/* Selected Date Display */}
          <View style={{
            backgroundColor: colors.primaryLight,
            padding: 16,
            borderRadius: radius.medium,
            marginBottom: 20,
            alignItems: 'center'
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.text
            }}>
              {months[selectedMonth]} {selectedDay}, {selectedYear}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 12
          }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                backgroundColor: '#f0f0f0',
                paddingVertical: 12,
                borderRadius: radius.medium,
                alignItems: 'center'
              }}
            >
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#666'
              }}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirm}
              style={{
                flex: 1,
                backgroundColor: colors.primary,
                paddingVertical: 12,
                borderRadius: radius.medium,
                alignItems: 'center'
              }}
            >
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: 'white'
              }}>
                Confirm
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ScrollingCalendar;
