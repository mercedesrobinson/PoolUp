import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';

interface VerticalDatePickerProps {
  onDateSelect: (date: Date) => void;
  onClose: () => void;
  initialDate?: Date;
}

const VerticalDatePicker: React.FC<VerticalDatePickerProps> = ({ onDateSelect, onClose, initialDate }) => {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(initialDate?.getMonth() || today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(initialDate?.getDate() || today.getDate());
  const [selectedYear, setSelectedYear] = useState<number>(initialDate?.getFullYear() || today.getFullYear());
  
  const monthScrollRef = useRef<ScrollView>(null);
  const dayScrollRef = useRef<ScrollView>(null);
  const yearScrollRef = useRef<ScrollView>(null);
  
  const { width, height } = Dimensions.get('window');
  const itemHeight = 60;
  const visibleItems = 5;
  const containerHeight = itemHeight * visibleItems;
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
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

  const renderVerticalPicker = (
    items: (string | number)[],
    selectedValue: string | number,
    onSelect: (value: any) => void,
    scrollRef: React.RefObject<ScrollView>,
    label: string
  ) => {
    return (
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={{
          fontSize: 14,
          fontWeight: '600',
          color: '#666',
          marginBottom: 10,
          textAlign: 'center'
        }}>
          {label}
        </Text>
        <View style={{
          height: containerHeight,
          width: '100%',
          position: 'relative'
        }}>
          {/* Selection indicator */}
          <View style={{
            position: 'absolute',
            top: itemHeight * 2,
            left: 0,
            right: 0,
            height: itemHeight,
            backgroundColor: '#2D8CFF15',
            borderRadius: 8,
            zIndex: 1
          }} />
          
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            snapToInterval={itemHeight}
            decelerationRate="fast"
            contentContainerStyle={{
              paddingVertical: itemHeight * 2
            }}
            onMomentumScrollEnd={(event) => {
              const y = event.nativeEvent.contentOffset.y;
              const index = Math.round(y / itemHeight);
              const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
              onSelect(items[clampedIndex]);
            }}
          >
            {items.map((item, index) => {
              const isSelected = item === selectedValue;
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    onSelect(item);
                    scrollRef.current?.scrollTo({ 
                      y: index * itemHeight, 
                      animated: true 
                    });
                  }}
                  style={{
                    height: itemHeight,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 10
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: isSelected ? '600' : '400',
                      color: isSelected ? '#2D8CFF' : '#333',
                      textAlign: 'center'
                    }}
                  >
                    {typeof item === 'number' ? item.toString().padStart(2, '0') : item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
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
        alignItems: 'center'
      }}>
        <View style={{
          backgroundColor: 'white',
          borderRadius: 20,
          width: width * 0.9,
          maxHeight: height * 0.7,
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

          {/* Date Picker Columns */}
          <View style={{
            flexDirection: 'row',
            paddingHorizontal: 20,
            paddingVertical: 20,
            gap: 10
          }}>
            {renderVerticalPicker(
              monthNames,
              monthNames[selectedMonth],
              (month: string) => setSelectedMonth(monthNames.indexOf(month)),
              monthScrollRef,
              'Month'
            )}
            
            {renderVerticalPicker(
              days,
              selectedDay,
              (day: number) => setSelectedDay(day),
              dayScrollRef,
              'Day'
            )}
            
            {renderVerticalPicker(
              years,
              selectedYear,
              (year: number) => setSelectedYear(year),
              yearScrollRef,
              'Year'
            )}
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
              {new Date(selectedYear, selectedMonth, selectedDay).toLocaleDateString('en-US', {
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
              marginBottom: 20,
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

export default VerticalDatePicker;
