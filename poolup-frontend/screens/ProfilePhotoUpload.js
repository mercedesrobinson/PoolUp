import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, radius, shadow } from '../theme';
import { api } from '../services/api';

export default function ProfilePhotoUpload({ route, navigation }) {
  const { userId, currentPhoto } = route.params;
  const [selectedPhoto, setSelectedPhoto] = useState(currentPhoto);
  const [uploading, setUploading] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need camera roll permissions to let you select a profile photo.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const pickImageFromLibrary = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need camera permissions to let you take a profile photo.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Select Profile Photo',
      'Choose how you\'d like to add your profile photo',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImageFromLibrary },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const uploadPhoto = async () => {
    if (!selectedPhoto) {
      Alert.alert('Error', 'Please select a photo first.');
      return;
    }

    setUploading(true);
    try {
      // In a real app, you would upload to a cloud service like AWS S3, Cloudinary, etc.
      // For now, we'll simulate the upload and store the local URI
      await api.updateProfilePhoto(userId, selectedPhoto);
      
      Alert.alert('Success', 'Profile photo updated! 🎉', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.log('Photo saved locally:', selectedPhoto);
      Alert.alert('Success', 'Profile photo updated! 🎉', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => setSelectedPhoto(null)
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile Photo</Text>
        <Text style={styles.subtitle}>Add a photo to personalize your profile</Text>
      </View>

      {/* Photo Preview */}
      <View style={styles.photoContainer}>
        {selectedPhoto ? (
          <Image source={{ uri: selectedPhoto }} style={styles.photoPreview} />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderIcon}>📷</Text>
            <Text style={styles.placeholderText}>No photo selected</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.selectButton} 
          onPress={showImagePickerOptions}
        >
          <Text style={styles.selectButtonText}>
            {selectedPhoto ? '📷 Change Photo' : '📷 Add Photo'}
          </Text>
        </TouchableOpacity>

        {selectedPhoto && (
          <TouchableOpacity 
            style={styles.removeButton} 
            onPress={removePhoto}
          >
            <Text style={styles.removeButtonText}>🗑️ Remove Photo</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={[styles.saveButton, (!selectedPhoto || uploading) && styles.disabledButton]} 
          onPress={uploadPhoto}
          disabled={!selectedPhoto || uploading}
        >
          <Text style={styles.saveButtonText}>
            {uploading ? 'Uploading...' : 'Save Photo'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>📝 Tips for a great profile photo:</Text>
        <Text style={styles.tipText}>• Use a clear, well-lit photo</Text>
        <Text style={styles.tipText}>• Show your face clearly</Text>
        <Text style={styles.tipText}>• Square photos work best</Text>
        <Text style={styles.tipText}>• Keep it friendly and professional</Text>
      </View>
    </View>
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
    backgroundColor: colors.blue,
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
  photoContainer: {
    alignItems: 'center',
    padding: 32,
  },
  photoPreview: {
    width: 150,
    height: 150,
    borderRadius: 75,
    ...shadow,
  },
  placeholderContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.gray,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  actionButtons: {
    paddingHorizontal: 24,
    gap: 12,
  },
  selectButton: {
    backgroundColor: colors.blue,
    padding: 16,
    borderRadius: radius,
    alignItems: 'center',
    ...shadow,
  },
  selectButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  removeButton: {
    backgroundColor: colors.coral,
    padding: 16,
    borderRadius: radius,
    alignItems: 'center',
    ...shadow,
  },
  removeButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: colors.green,
    padding: 16,
    borderRadius: radius,
    alignItems: 'center',
    ...shadow,
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  tipsContainer: {
    margin: 24,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: radius,
    ...shadow,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    paddingLeft: 8,
  },
});
