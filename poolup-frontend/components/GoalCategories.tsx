import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ViewStyle } from 'react-native';
import { colors, radius } from '../theme';

export interface GoalCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  tips?: string[];
}

const GOAL_CATEGORIES: GoalCategory[] = [
  { 
    id: 'travel', 
    name: 'Travel', 
    icon: '✈️', 
    color: '#4285F4',
    description: 'Save for your dream vacation or adventure',
    tips: ['Book flights 6-8 weeks in advance', 'Consider off-season travel for savings', 'Use travel rewards credit cards']
  },
  { 
    id: 'visit_friends', 
    name: 'Visit Friends/Family', 
    icon: '❤️', 
    color: '#8E44AD',
    description: 'Finally take that trip out of the group chat—let\'s make it real this time! 💫'
  },
  { 
    id: 'emergency', 
    name: 'Emergency Fund', 
    icon: '🛡️', 
    color: '#34A853',
    description: 'Build financial security for unexpected expenses',
    tips: ['Aim for 3-6 months of expenses', 'Keep funds in high-yield savings', 'Automate contributions']
  },
  { 
    id: 'car', 
    name: 'Car/Vehicle', 
    icon: '🚗', 
    color: '#FBBC04',
    description: 'Save for reliable transportation',
    tips: ['Research reliability ratings', 'Consider certified pre-owned', 'Factor in insurance costs']
  },
  { 
    id: 'home', 
    name: 'Home/Rent', 
    icon: '🏠', 
    color: '#FF6B35',
    description: 'Save for your living space or down payment',
    tips: ['Research neighborhood prices', 'Factor in closing costs', 'Consider first-time buyer programs']
  },
  { 
    id: 'education', 
    name: 'Education', 
    icon: '📚', 
    color: '#9C27B0',
    description: 'Invest in learning and personal growth',
    tips: ['Look into employer tuition assistance', 'Consider online courses', 'Research scholarships']
  },
  { 
    id: 'wedding', 
    name: 'Wedding', 
    icon: '💒', 
    color: '#E91E63',
    description: 'Plan your special day',
    tips: ['Set priorities for must-haves', 'Consider off-season dates', 'DIY elements save costs']
  },
  { 
    id: 'tech', 
    name: 'Technology', 
    icon: '📱', 
    color: '#607D8B',
    description: 'Save for gadgets and tech upgrades',
    tips: ['Wait for seasonal sales', 'Compare prices across retailers', 'Consider refurbished options']
  },
  { 
    id: 'health', 
    name: 'Health/Fitness', 
    icon: '💪', 
    color: '#4CAF50',
    description: 'Invest in your health and wellness',
    tips: ['Research insurance coverage', 'Consider HSA contributions', 'Compare provider prices']
  },
  { 
    id: 'business', 
    name: 'Business', 
    icon: '💼', 
    color: '#795548',
    description: 'Fund your entrepreneurial dreams',
    tips: ['Create detailed business plan', 'Research startup costs', 'Consider loans and grants']
  },
  { 
    id: 'other', 
    name: 'Other', 
    icon: '🎯', 
    color: '#666',
    description: 'Custom savings goal',
    tips: ['Set specific targets', 'Break into smaller milestones', 'Track progress regularly']
  },
];

interface GoalCategorySelectorProps {
  selectedCategory?: GoalCategory | null;
  onSelect: (category: GoalCategory) => void;
  style?: ViewStyle;
}

export const GoalCategorySelector: React.FC<GoalCategorySelectorProps> = ({ selectedCategory, onSelect, style = {} }) => {
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
                borderRadius: radius.medium,
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

interface GoalCategoryBadgeProps {
  category?: GoalCategory | null;
  size?: 'small' | 'large';
}

export const GoalCategoryBadge: React.FC<GoalCategoryBadgeProps> = ({ category, size = 'small' }) => {
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
