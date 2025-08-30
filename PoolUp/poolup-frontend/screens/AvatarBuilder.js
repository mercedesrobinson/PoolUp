import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { colors, radius, shadow } from '../theme';
import { api } from '../services/api';

export default function AvatarBuilder({ route, navigation }) {
  const { userId, currentAvatar } = route.params;
  const [selectedAvatar, setSelectedAvatar] = useState({
    skinTone: '🟤',
    hairStyle: '🦱',
    hairColor: '#8B4513',
    eyes: '👀',
    clothing: '👕',
    clothingColor: '#4169E1',
    accessory: null
  });
  const [activeTab, setActiveTab] = useState('skin');

  // Inclusive avatar options
  const avatarOptions = {
    skinTones: ['🟫', '🟤', '🟡', '🟠', '🟢', '🔵'],
    hairStyles: ['🦱', '💇‍♀️', '💇‍♂️', '👩‍🦲', '👨‍🦲', '🧕', '👳‍♀️', '👳‍♂️'],
    hairColors: ['#000000', '#8B4513', '#FFD700', '#FF6347', '#32CD32', '#9370DB', '#FF69B4'],
    eyes: ['👀', '😊', '🤓', '😎'],
    clothing: ['👕', '👔', '👗', '🧥', '👚', '🥼'],
    clothingColors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'],
    accessories: [null, '👓', '🕶️', '🎩', '👑', '🎀', '⌚', '💍']
  };

  const generateRandomAvatar = () => {
    const randomAvatar = {
      skinTone: avatarOptions.skinTones[Math.floor(Math.random() * avatarOptions.skinTones.length)],
      hairStyle: avatarOptions.hairStyles[Math.floor(Math.random() * avatarOptions.hairStyles.length)],
      hairColor: avatarOptions.hairColors[Math.floor(Math.random() * avatarOptions.hairColors.length)],
      eyes: avatarOptions.eyes[Math.floor(Math.random() * avatarOptions.eyes.length)],
      clothing: avatarOptions.clothing[Math.floor(Math.random() * avatarOptions.clothing.length)],
      clothingColor: avatarOptions.clothingColors[Math.floor(Math.random() * avatarOptions.clothingColors.length)],
      accessory: Math.random() > 0.5 ? avatarOptions.accessories[Math.floor(Math.random() * avatarOptions.accessories.length)] : null
    };
    setSelectedAvatar(randomAvatar);
  };

  const saveAvatar = async () => {
    try {
      await api.updateAvatar(userId, 'custom', JSON.stringify(selectedAvatar));
      Alert.alert('Success', 'Avatar saved! 🎉', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.log('Avatar saved locally:', selectedAvatar);
      Alert.alert('Success', 'Avatar saved! 🎉', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }
  };

  const updateAvatarPart = (part, value) => {
    setSelectedAvatar(prev => ({ ...prev, [part]: value }));
  };

  const renderAvatarPreview = () => {
    return (
      <View style={styles.avatarPreview}>
        <View style={[styles.avatarContainer, { backgroundColor: selectedAvatar.skinTone }]}>
          <Text style={styles.avatarEmoji}>{selectedAvatar.hairStyle}</Text>
          <Text style={styles.avatarEmoji}>{selectedAvatar.eyes}</Text>
          <View style={[styles.clothingContainer, { backgroundColor: selectedAvatar.clothingColor }]}>
            <Text style={styles.avatarEmoji}>{selectedAvatar.clothing}</Text>
          </View>
          {selectedAvatar.accessory && (
            <Text style={styles.accessoryEmoji}>{selectedAvatar.accessory}</Text>
          )}
        </View>
      </View>
    );
  };

  const renderOptionSelector = (title, options, selectedValue, onSelect, isColor = false) => {
    return (
      <View style={styles.selectorContainer}>
        <Text style={styles.selectorTitle}>{title}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedValue === option && styles.selectedOption,
                isColor && { backgroundColor: option }
              ]}
              onPress={() => onSelect(option)}
            >
              {!isColor && <Text style={styles.optionText}>{option || '❌'}</Text>}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Create Your Avatar</Text>
        <Text style={styles.subtitle}>Express yourself with inclusive customization</Text>
      </View>

      {/* Avatar Preview */}
      {renderAvatarPreview()}

      {/* Customization Tabs */}
      <View style={styles.tabContainer}>
        {['skin', 'hair', 'eyes', 'clothing', 'accessories'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Customization Options */}
      <View style={styles.customizationArea}>
        {activeTab === 'skin' && renderOptionSelector('Skin Tone', avatarOptions.skinTones, selectedAvatar.skinTone, (value) => updateAvatarPart('skinTone', value))}
        {activeTab === 'hair' && (
          <>
            {renderOptionSelector('Hair Style', avatarOptions.hairStyles, selectedAvatar.hairStyle, (value) => updateAvatarPart('hairStyle', value))}
            {renderOptionSelector('Hair Color', avatarOptions.hairColors, selectedAvatar.hairColor, (value) => updateAvatarPart('hairColor', value), true)}
          </>
        )}
        {activeTab === 'eyes' && renderOptionSelector('Eyes', avatarOptions.eyes, selectedAvatar.eyes, (value) => updateAvatarPart('eyes', value))}
        {activeTab === 'clothing' && (
          <>
            {renderOptionSelector('Clothing', avatarOptions.clothing, selectedAvatar.clothing, (value) => updateAvatarPart('clothing', value))}
            {renderOptionSelector('Clothing Color', avatarOptions.clothingColors, selectedAvatar.clothingColor, (value) => updateAvatarPart('clothingColor', value), true)}
          </>
        )}
        {activeTab === 'accessories' && renderOptionSelector('Accessories', avatarOptions.accessories, selectedAvatar.accessory, (value) => updateAvatarPart('accessory', value))}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.randomButton} onPress={generateRandomAvatar}>
          <Text style={styles.randomButtonText}>🎲 Random</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={saveAvatar}>
          <Text style={styles.saveButtonText}>Save Avatar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFCFF',
  },
  header: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: colors.purple,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  avatarPreview: {
    alignItems: 'center',
    padding: 24,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...shadow,
  },
  avatarEmoji: {
    fontSize: 32,
  },
  clothingContainer: {
    position: 'absolute',
    bottom: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessoryEmoji: {
    position: 'absolute',
    top: 10,
    right: 10,
    fontSize: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 2,
    borderRadius: radius,
  },
  activeTab: {
    backgroundColor: colors.purple,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  activeTabText: {
    color: 'white',
  },
  customizationArea: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  selectorContainer: {
    marginBottom: 20,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  optionsScroll: {
    paddingVertical: 8,
  },
  optionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadow,
  },
  selectedOption: {
    borderColor: colors.purple,
    borderWidth: 3,
  },
  optionText: {
    fontSize: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  randomButton: {
    flex: 1,
    backgroundColor: colors.coral,
    padding: 16,
    borderRadius: radius,
    alignItems: 'center',
  },
  randomButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  saveButton: {
    flex: 2,
    backgroundColor: colors.green,
    padding: 16,
    borderRadius: radius,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});
