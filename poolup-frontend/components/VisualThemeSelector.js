import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const VISUAL_THEMES = {
  beach_vacation: {
    name: 'Beach Vacation',
    description: 'Fill up the ocean as you save',
    primaryColor: '#4ECDC4',
    secondaryColor: '#44A08D',
    emoji: '🏖️',
    gradient: ['#4ECDC4', '#44A08D']
  },
  house_fund: {
    name: 'Dream House',
    description: 'Build your house brick by brick',
    primaryColor: '#8B4513',
    secondaryColor: '#D2691E',
    emoji: '🏠',
    gradient: ['#8B4513', '#D2691E']
  },
  travel_adventure: {
    name: 'Travel Adventure',
    description: 'Pack your suitcase for the journey',
    primaryColor: '#FF6B6B',
    secondaryColor: '#4ECDC4',
    emoji: '✈️',
    gradient: ['#FF6B6B', '#4ECDC4']
  },
  emergency_fund: {
    name: 'Safety Net',
    description: 'Build your financial fortress',
    primaryColor: '#6C5CE7',
    secondaryColor: '#A29BFE',
    emoji: '🛡️',
    gradient: ['#6C5CE7', '#A29BFE']
  },
  roadmap_journey: {
    name: 'Savings Roadmap',
    description: 'Follow your path to success',
    primaryColor: '#00B894',
    secondaryColor: '#00CEC9',
    emoji: '🗺️',
    gradient: ['#00B894', '#00CEC9']
  },
  concert_tickets: {
    name: 'Concert Fund',
    description: 'Rock your way to the show',
    primaryColor: '#E17055',
    secondaryColor: '#FDCB6E',
    emoji: '🎵',
    gradient: ['#E17055', '#FDCB6E']
  }
};

export default function VisualThemeSelector({ selectedTheme, onThemeSelect, goalType }) {
  const [showAll, setShowAll] = useState(false);

  // Suggest themes based on goal type
  const getSuggestedThemes = () => {
    const goalLower = goalType?.toLowerCase() || '';
    if (goalLower.includes('trip') || goalLower.includes('vacation')) {
      return ['beach_vacation', 'travel_adventure'];
    }
    if (goalLower.includes('house') || goalLower.includes('home')) {
      return ['house_fund'];
    }
    if (goalLower.includes('emergency')) {
      return ['emergency_fund'];
    }
    if (goalLower.includes('concert') || goalLower.includes('music')) {
      return ['concert_tickets'];
    }
    return ['roadmap_journey', 'beach_vacation'];
  };

  const suggestedThemes = getSuggestedThemes();
  const displayThemes = showAll ? Object.keys(VISUAL_THEMES) : suggestedThemes;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Savings Journey</Text>
      <Text style={styles.subtitle}>Pick a visual theme that matches your goal</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.themeScroll}>
        {displayThemes.map((themeKey) => {
          const theme = VISUAL_THEMES[themeKey];
          const isSelected = selectedTheme === themeKey;
          
          return (
            <TouchableOpacity
              key={themeKey}
              onPress={() => onThemeSelect(themeKey)}
              style={[styles.themeCard, isSelected && styles.selectedCard]}
            >
              <LinearGradient
                colors={theme.gradient}
                style={styles.themeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.themeEmoji}>{theme.emoji}</Text>
                <Text style={styles.themeName}>{theme.name}</Text>
                <Text style={styles.themeDescription}>{theme.description}</Text>
              </LinearGradient>
              {isSelected && (
                <View style={styles.selectedIndicator}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      
      {!showAll && (
        <TouchableOpacity 
          style={styles.showMoreButton}
          onPress={() => setShowAll(true)}
        >
          <Text style={styles.showMoreText}>See All Themes</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#2D3436',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#636E72',
    marginBottom: 20,
  },
  themeScroll: {
    paddingHorizontal: 10,
  },
  themeCard: {
    width: width * 0.4,
    height: 120,
    marginHorizontal: 8,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedCard: {
    borderWidth: 3,
    borderColor: '#00B894',
  },
  themeGradient: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  themeName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 2,
  },
  themeDescription: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#00B894',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  showMoreButton: {
    alignSelf: 'center',
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#DDD',
    borderRadius: 20,
  },
  showMoreText: {
    color: '#636E72',
    fontSize: 12,
    fontWeight: '600',
  },
});
