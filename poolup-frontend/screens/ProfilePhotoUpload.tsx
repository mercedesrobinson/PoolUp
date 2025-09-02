import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, SafeAreaView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';

type ProfilePhotoUploadNavigationProp = StackNavigationProp<RootStackParamList, 'ProfilePhotoUpload'>;
type ProfilePhotoUploadRouteProp = RouteProp<RootStackParamList, 'ProfilePhotoUpload'>;

interface Props {
  navigation: ProfilePhotoUploadNavigationProp;
  route: ProfilePhotoUploadRouteProp;
}

export default function ProfilePhotoUpload({ navigation, route }: Props): React.JSX.Element {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  const userId = (route.params as any)?.userId || '1756612920173';

  const pickImage = async (): Promise<void> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async (): Promise<void> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera permissions to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const uploadPhoto = async (): Promise<void> => {
    if (!selectedImage) return;

    setUploading(true);
    try {
      await api.uploadProfilePhoto(userId, selectedImage);
      Alert.alert('Success', 'Profile photo updated successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to upload photo:', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 8, marginRight: 12 }}
        >
          <Text style={{ fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={{
          fontSize: 20,
          fontWeight: '700',
          color: '#333',
          flex: 1,
        }}>
          Profile Photo
        </Text>
      </View>

      <View style={{ flex: 1, padding: 16, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{
          backgroundColor: 'white',
          padding: 32,
          borderRadius: radius.medium,
          alignItems: 'center',
          width: '100%',
          maxWidth: 400,
        }}>
          <Text style={{ fontSize: 32, marginBottom: 16 }}>📸</Text>
          <Text style={{
            fontSize: 20,
            fontWeight: '600',
            color: '#333',
            marginBottom: 8,
            textAlign: 'center',
          }}>
            Add Your Photo
          </Text>
          <Text style={{
            fontSize: 15,
            color: '#666',
            textAlign: 'center',
            lineHeight: 22,
            marginBottom: 32,
          }}>
            Upload a profile photo to personalize your PoolUp experience and help friends recognize you.
          </Text>

          {selectedImage && (
            <View style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              marginBottom: 24,
              overflow: 'hidden',
              borderWidth: 3,
              borderColor: colors.primary,
            }}>
              <Image
                source={{ uri: selectedImage }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </View>
          )}

          <TouchableOpacity
            onPress={pickImage}
            style={{
              backgroundColor: colors.primary,
              padding: 16,
              borderRadius: radius.medium,
              alignItems: 'center',
              width: '100%',
              marginBottom: 12,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
              📱 Choose from Library
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={takePhoto}
            style={{
              backgroundColor: '#f8f9fa',
              padding: 16,
              borderRadius: radius.medium,
              alignItems: 'center',
              width: '100%',
              marginBottom: 24,
              borderWidth: 1,
              borderColor: '#e9ecef',
            }}
          >
            <Text style={{ color: '#333', fontWeight: '600', fontSize: 16 }}>
              📷 Take Photo
            </Text>
          </TouchableOpacity>

          {selectedImage && (
            <TouchableOpacity
              onPress={uploadPhoto}
              disabled={uploading}
              style={{
                backgroundColor: '#28a745',
                padding: 16,
                borderRadius: radius.medium,
                alignItems: 'center',
                width: '100%',
                opacity: uploading ? 0.7 : 1,
              }}
            >
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
                {uploading ? 'Uploading...' : '✓ Save Photo'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{
          backgroundColor: '#d1ecf1',
          padding: 16,
          borderRadius: radius.medium,
          marginTop: 24,
          borderLeftWidth: 4,
          borderLeftColor: '#17a2b8',
        }}>
          <Text style={{ fontSize: 14, color: '#0c5460', lineHeight: 20, textAlign: 'center' }}>
            💡 Your photo will be cropped to a square and resized for optimal display across the app.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
