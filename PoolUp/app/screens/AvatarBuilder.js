import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { api } from '../services/api';

export default function AvatarBuilder({ route, navigation }) {
  const { userId, currentAvatar } = route.params;
  const [avatarOptions, setAvatarOptions] = useState(null);
  const [presets, setPresets] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || null);
  const [activeTab, setActiveTab] = useState('presets');

  useEffect(() => {
    loadAvatarData();
  }, []);

  const loadAvatarData = async () => {
    try {
      const [options, presetData] = await Promise.all([
        api.getAvatarOptions(),
        api.getAvatarPresets()
      ]);
      setAvatarOptions(options);
      setPresets(presetData);
    } catch (error) {
      console.error('Error loading avatar data:', error);
    }
  };

  const generateRandomAvatar = async () => {
    try {
      const result = await api.generateAvatar();
      setSelectedAvatar(result.avatar);
    } catch (error) {
      console.error('Error generating avatar:', error);
    }
  };

  const saveAvatar = async () => {
    if (!selectedAvatar) return;
    
    try {
      await api.updateAvatar(userId, 'generated', JSON.stringify(selectedAvatar));
      Alert.alert('Success', 'Avatar updated!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error saving avatar:', error);
      Alert.alert('Error', 'Failed to save avatar');
    }
  };

  const renderAvatarPreview = (avatar) => {
    if (!avatar) return null;
    
    return (
      <View style={styles.avatarPreview}>
        <View style={[styles.avatarCircle, { backgroundColor: avatar.skinTone }]}>
          <Text style={styles.avatarEmoji}>
            {avatar.hairStyle?.emoji}{avatar.accessory?.emoji}
          </Text>
        </View>
        <View style={[styles.outfitBadge, { backgroundColor: avatar.outfit?.color }]}>
          <Text style={styles.outfitEmoji}>{avatar.outfit?.emoji}</Text>
        </View>
      </View>
    );
  };

  const renderCustomizer = () => {
    if (!avatarOptions || !selectedAvatar) return null;

    return (
      <ScrollView style={styles.customizer}>
        <Text style={styles.sectionTitle}>Skin Tone</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionRow}>
          {avatarOptions.skinTones.map((tone, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.colorOption, { backgroundColor: tone }]}
              onPress={() => setSelectedAvatar({...selectedAvatar, skinTone: tone})}
            />
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Hair Style</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionRow}>
          {avatarOptions.hairStyles.map((style, index) => (
            <TouchableOpacity
              key={index}
              style={styles.emojiOption}
              onPress={() => setSelectedAvatar({...selectedAvatar, hairStyle: style})}
            >
              <Text style={styles.optionEmoji}>{style.emoji}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Accessories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionRow}>
          {avatarOptions.accessories.map((accessory, index) => (
            <TouchableOpacity
              key={index}
              style={styles.emojiOption}
              onPress={() => setSelectedAvatar({...selectedAvatar, accessory})}
            >
              <Text style={styles.optionEmoji}>{accessory.emoji || '∅'}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Outfits</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionRow}>
          {avatarOptions.outfits.map((outfit, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.emojiOption, { backgroundColor: outfit.color + '20' }]}
              onPress={() => setSelectedAvatar({...selectedAvatar, outfit})}
            >
              <Text style={styles.optionEmoji}>{outfit.emoji}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Customize Your Avatar</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.previewContainer}>
        {renderAvatarPreview(selectedAvatar)}
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'presets' && styles.activeTab]}
          onPress={() => setActiveTab('presets')}
        >
          <Text style={[styles.tabText, activeTab === 'presets' && styles.activeTabText]}>
            Presets
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'custom' && styles.activeTab]}
          onPress={() => setActiveTab('custom')}
        >
          <Text style={[styles.tabText, activeTab === 'custom' && styles.activeTabText]}>
            Custom
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'presets' ? (
        <ScrollView style={styles.presetsContainer}>
          {presets.map((preset, index) => (
            <TouchableOpacity
              key={index}
              style={styles.presetCard}
              onPress={() => setSelectedAvatar(preset.avatar)}
            >
              <View style={styles.presetPreview}>
                {renderAvatarPreview(preset.avatar)}
              </View>
              <Text style={styles.presetName}>{preset.name}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.randomButton} onPress={generateRandomAvatar}>
            <Text style={styles.randomButtonText}>🎲 Random Avatar</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        renderCustomizer()
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={saveAvatar}>
          <Text style={styles.saveButtonText}>Save Avatar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  previewContainer: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
  },
  avatarPreview: {
    alignItems: 'center',
    position: 'relative',
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#4285F4',
  },
  avatarEmoji: {
    fontSize: 40,
  },
  outfitBadge: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  outfitEmoji: {
    fontSize: 20,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4285F4',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#4285F4',
    fontWeight: 'bold',
  },
  presetsContainer: {
    flex: 1,
    padding: 20,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  presetPreview: {
    marginRight: 15,
    transform: [{ scale: 0.6 }],
  },
  presetName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  randomButton: {
    backgroundColor: '#4285F4',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  randomButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  customizer: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    marginTop: 15,
  },
  optionRow: {
    marginBottom: 15,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  emojiOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  optionEmoji: {
    fontSize: 24,
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  saveButton: {
    backgroundColor: '#34A853',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
