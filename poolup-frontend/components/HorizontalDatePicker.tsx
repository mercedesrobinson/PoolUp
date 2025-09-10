import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';

interface HorizontalDatePickerProps {
  onDateSelect: (date: Date) => void;
  onClose: () => void;
  initialDate?: Date;
}

const HorizontalDatePicker: React.FC<HorizontalDatePickerProps> = ({ onDateSelect, onClose, initialDate }) => {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(initialDate?.getMonth() || today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(initialDate?.getDate() || today.getDate());
  const [selectedYear, setSelectedYear] = useState<number>(initialDate?.getFullYear() || today.getFullYear());
  
  const monthScrollRef = useRef<ScrollView>(null);
  const dayScrollRef = useRef<ScrollView>(null);
  const yearScrollRef = useRef<ScrollView>(null);
  
  const { width } = Dimensions.get('window');
  const itemWidth = 80;
  const itemHeight = 50;
  
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  // Generate years (current year + next 5 years)
  const years = Array.from({ length: 6 }, (_, i) => today.getFullYear() + i);
  
  // Get days in selected month/year
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const daysInSelectedMonth = getDaysInMonth(selectedMonth, selectedYear);
  const days = Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1);

  // Update days when month/year changes
  useEffect(() => {
    const maxDays = getDaysInMonth(selectedMonth, selectedYear);
    if (selectedDay > maxDays) {
      setSelectedDay(maxDays);
    }
  }, [selectedMonth, selectedYear]);

  const handleConfirm = () => {
    const selectedDate = new Date(selectedYear, selectedMonth, selectedDay);
    onDateSelect(selectedDate);
    onClose();
  };

  const renderPickerItem = (
    items: (string | number)[],
    selectedValue: string | number,
    onSelect: (value: any) => void,
    scrollRef: React.RefObject<ScrollView>
  ) => {
    return (
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: width / 2 - itemWidth / 2 }}
        snapToInterval={itemWidth}
        decelerationRate="fast"
        style={{ height: itemHeight + 20 }}
      >
        {items.map((item, index) => {
          const isSelected = item === selectedValue;
          return (
            <TouchableOpacity
              key={index}
              onPress={() => onSelect(item)}
              style={{
                width: itemWidth,
                height: itemHeight,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: isSelected ? '#2D8CFF' : 'transparent',
                borderRadius: 8,
                marginHorizontal: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: isSelected ? '600' : '400',
                  color: isSelected ? 'white' : '#333',
                }}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
        justifyContent: 'flex-end'
      }}>
        <View style={{
          backgroundColor: 'white',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingBottom: 40,
          width: '100%',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: '#f0f0f0'
          }}>
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#0B1221'
            }}>
              Select Target Date
            </Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Text style={{ fontSize: 18, color: '#999' }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Date Picker Sections */}
          <View style={{ paddingVertical: 20 }}>
            {/* Month Picker */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#333',
                textAlign: 'center',
                marginBottom: 10
              }}>
                Month
              </Text>
              {renderPickerItem(
                monthNames,
                monthNames[selectedMonth],
                (month: string) => setSelectedMonth(monthNames.indexOf(month)),
                monthScrollRef
              )}
            </View>

            {/* Day Picker */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#333',
                textAlign: 'center',
                marginBottom: 10
              }}>
                Day
              </Text>
              {renderPickerItem(
                days,
                selectedDay,
                (day: number) => setSelectedDay(day),
                dayScrollRef
              )}
            </View>

            {/* Year Picker */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#333',
                textAlign: 'center',
                marginBottom: 10
              }}>
                Year
              </Text>
              {renderPickerItem(
                years,
                selectedYear,
                (year: number) => setSelectedYear(year),
                yearScrollRef
              )}
            </View>
          </View>

          {/* Selected Date Display */}
          <View style={{
            backgroundColor: '#f9f9f9',
            padding: 16,
            marginHorizontal: 20,
            borderRadius: 12,
            marginBottom: 20
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#2D8CFF',
              textAlign: 'center'
            }}>
              Selected: {new Date(selectedYear, selectedMonth, selectedDay).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>

          {/* Confirm Button */}
          <TouchableOpacity
            onPress={handleConfirm}
            style={{
              backgroundColor: '#2D8CFF',
              marginHorizontal: 20,
              padding: 16,
              borderRadius: 12,
              alignItems: 'center'
            }}
          >
            <Text style={{
              color: 'white',
              fontSize: 16,
              fontWeight: '600'
            }}>
              Confirm Date
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default HorizontalDatePicker;
