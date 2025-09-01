import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { colors, radius } from '../theme';

const GOAL_CATEGORIES = [
  { id: 'travel', name: 'Travel', icon: '✈️', color: '#4285F4' },
  { id: 'emergency', name: 'Emergency Fund', icon: '🛡️', color: '#34A853' },
  { id: 'car', name: 'Car/Vehicle', icon: '🚗', color: '#FBBC04' },
  { id: 'home', name: 'Home/Rent', icon: '🏠', color: '#FF6B35' },
  { id: 'education', name: 'Education', icon: '📚', color: '#9C27B0' },
  { id: 'wedding', name: 'Wedding', icon: '💒', color: '#E91E63' },
  { id: 'tech', name: 'Technology', icon: '📱', color: '#607D8B' },
  { id: 'health', name: 'Health/Fitness', icon: '💪', color: '#4CAF50' },
  { id: 'business', name: 'Business', icon: '💼', color: '#795548' },
  { id: 'other', name: 'Other', icon: '🎯', color: '#666' },
];

export const GoalCategorySelector = ({ selectedCategory, onSelect, style = {} }) => {
  return (
    <View style={[{ marginVertical: 16 }, style]}>
      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
        Goal Category
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 4 }}>
          {GOAL_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => onSelect(category)}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: radius,
                backgroundColor: selectedCategory?.id === category.id ? category.color : 'white',
                borderWidth: 1,
                borderColor: selectedCategory?.id === category.id ? category.color : '#e9ecef',
                alignItems: 'center',
                minWidth: 80,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              <Text style={{ fontSize: 20, marginBottom: 4 }}>{category.icon}</Text>
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: selectedCategory?.id === category.id ? 'white' : colors.text,
                textAlign: 'center',
              }}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export const GoalCategoryBadge = ({ category, size = 'small' }) => {
  if (!category) return null;
  
  const isLarge = size === 'large';
  
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: category.color + '20',
      paddingHorizontal: isLarge ? 12 : 8,
      paddingVertical: isLarge ? 8 : 4,
      borderRadius: isLarge ? 12 : 8,
    }}>
      <Text style={{ fontSize: isLarge ? 16 : 12, marginRight: 4 }}>
        {category.icon}
      </Text>
      <Text style={{
        fontSize: isLarge ? 14 : 12,
        fontWeight: '600',
        color: category.color,
      }}>
        {category.name}
      </Text>
    </View>
  );
};

export { GOAL_CATEGORIES };
export default GoalCategorySelector;
