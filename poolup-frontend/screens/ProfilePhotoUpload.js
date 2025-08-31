import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, radius, shadow } from '../theme';

export default function ProfilePhotoUpload({ navigation, route }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async (source) => {
    try {
      let result;
      
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Camera permission is required to take photos');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Photo library permission is required');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const uploadPhoto = async () => {
    if (!selectedImage) {
      Alert.alert('No photo selected', 'Please select a photo first');
      return;
    }

    setUploading(true);
    try {
      // Simulate upload for development
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Photo Updated! 📸',
        'Your profile photo has been updated successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Upload failed', 'Please try again');
    } finally {
      setUploading(false);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Select Photo',
      'Choose how you want to add your photo',
      [
        { text: 'Camera', onPress: () => pickImage('camera') },
        { text: 'Photo Library', onPress: () => pickImage('library') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFCFF' }}>
      {/* Header */}
      <View style={{ backgroundColor: colors.primary, paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
          <Text style={{ color: 'white', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: 'white', fontSize: 24, fontWeight: '700' }}>Upload Photo</Text>
        <Text style={{ color: 'white', fontSize: 16, opacity: 0.9, marginTop: 4 }}>
          Add a profile photo to personalize your account
        </Text>
      </View>

      <View style={{ flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' }}>
        {/* Photo Preview */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: colors.gray,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            ...shadow
          }}>
            {selectedImage ? (
              <Image
                source={{ uri: selectedImage }}
                style={{ width: 200, height: 200, borderRadius: 100 }}
              />
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 60, marginBottom: 8 }}>📸</Text>
                <Text style={{ fontSize: 16, color: '#666', textAlign: 'center' }}>
                  No photo selected
                </Text>
              </View>
            )}
          </View>

          {selectedImage && (
            <TouchableOpacity
              onPress={() => setSelectedImage(null)}
              style={{
                backgroundColor: colors.red + '20',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: radius
              }}
            >
              <Text style={{ color: colors.red, fontWeight: '600' }}>Remove Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons */}
        <View style={{ width: '100%', maxWidth: 300 }}>
          <TouchableOpacity
            onPress={showImageOptions}
            style={{
              backgroundColor: colors.primary,
              padding: 16,
              borderRadius: radius,
              alignItems: 'center',
              marginBottom: 16,
              ...shadow
            }}
          >
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>
              {selectedImage ? 'Change Photo' : 'Select Photo'}
            </Text>
          </TouchableOpacity>

          {selectedImage && (
            <TouchableOpacity
              onPress={uploadPhoto}
              disabled={uploading}
              style={{
                backgroundColor: uploading ? '#ccc' : colors.green,
                padding: 16,
                borderRadius: radius,
                alignItems: 'center',
                marginBottom: 16,
                ...shadow
              }}
            >
              <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>
                {uploading ? '⏳ Uploading...' : '✅ Save Photo'}
              </Text>
            </TouchableOpacity>
          )}

        </View>

        {/* Tips */}
        <View style={{ marginTop: 40, backgroundColor: colors.blue + '20', padding: 16, borderRadius: radius }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
            📝 Photo Tips
          </Text>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
            • Use a clear, well-lit photo
          </Text>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
            • Face should be clearly visible
          </Text>
          <Text style={{ fontSize: 14, color: '#666' }}>
            • Square photos work best
          </Text>
        </View>
      </View>
    </View>
  );
}
