import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Share, Clipboard, Alert, ScrollView, Linking } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';

export default function InviteFriends({ navigation, route }) {
  const [inviteCode, setInviteCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const poolId = route.params?.poolId;
  const poolName = route.params?.poolName || 'Savings Pool';

  React.useEffect(() => {
    generateInviteCode();
  }, []);

  const generateInviteCode = async () => {
    setIsGenerating(true);
    try {
      const code = await api.generateInviteCode(poolId);
      setInviteCode(code || '');
    } catch (error) {
      // Generate mock invite code for development
      const mockCode = `POOL${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      setInviteCode(mockCode);
    }
    setIsGenerating(false);
  };

  const shareInvite = async () => {
    if (!inviteCode) {
      Alert.alert('Error', 'Invite code not ready. Please wait a moment and try again.');
      return;
    }
    
    const inviteUrl = `https://poolup.app/join/${inviteCode}`;
    const message = `🎯 Join my savings pool "${poolName}"! Let's save together and reach our goals faster.\n\nUse code: ${inviteCode}\nOr click: ${inviteUrl}\n\n💰 PoolUp - Save together, travel together!`;
    
    try {
      const result = await Share.share({
        message: message,
        title: `Join ${poolName} on PoolUp!`
      });
      
      if (result.action === Share.sharedAction) {
        console.log('Successfully shared');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Could not share invite. Please try again.');
    }
  };

  const copyToClipboard = () => {
    const inviteUrl = `https://poolup.app/join/${inviteCode}`;
    Clipboard.setString(inviteUrl);
    Alert.alert('Copied!', 'Invite link copied to clipboard');
  };

  const sendSMSInvite = async () => {
    try {
      const inviteUrl = `https://poolup.app/join/${inviteCode}`;
      const message = `Join my savings pool "${poolName}" on PoolUp! Use code ${inviteCode} or visit ${inviteUrl}`;
      const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
      
      await Linking.openURL(smsUrl);
    } catch (error) {
      console.error('Error opening SMS:', error);
      Alert.alert('Error', 'Could not open SMS app. Please try sharing via other methods.');
    }
  };

  const sendEmailInvite = async () => {
    try {
      const inviteUrl = `https://poolup.app/join/${inviteCode}`;
      const subject = `Join my savings pool: ${poolName}`;
      const body = `Hi!\n\nI'm using PoolUp to save for ${poolName} and I'd love for you to join me!\n\nPoolUp makes saving fun with friends - we can track our progress together, celebrate milestones, and keep each other motivated.\n\nJoin my pool:\n• Use invite code: ${inviteCode}\n• Or visit: ${inviteUrl}\n\nLet's reach our savings goals together! 🎯\n\nCheers!`;
      
      const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      await Linking.openURL(emailUrl);
    } catch (error) {
      console.error('Error opening email:', error);
      Alert.alert('Error', 'Could not open email app. Please try sharing via other methods.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ 
        backgroundColor: 'white', 
        paddingHorizontal: 20, 
        paddingTop: 60, 
        paddingBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={{ marginRight: 16, padding: 8 }}
          >
            <Text style={{ fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <Text style={{ 
            fontSize: 28, 
            fontWeight: '700', 
            color: colors.text,
            flex: 1
          }}>
            Invite Friends
          </Text>
        </View>
        <Text style={{ 
          fontSize: 16, 
          color: colors.textSecondary,
          marginBottom: 8
        }}>
          Invite friends to join "{poolName}"
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        {/* Invite Code Section */}
        <View style={{
          backgroundColor: 'white',
          padding: 20,
          borderRadius: radius,
          marginBottom: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3
        }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '600', 
            color: colors.text,
            marginBottom: 12,
            textAlign: 'center'
          }}>
            🎯 Your Invite Code
          </Text>
          
          <View style={{
            backgroundColor: colors.primaryLight,
            padding: 16,
            borderRadius: radius,
            borderWidth: 2,
            borderColor: colors.primary,
            borderStyle: 'dashed',
            marginBottom: 16
          }}>
            <Text style={{
              fontSize: 24,
              fontWeight: '700',
              color: colors.primary,
              textAlign: 'center',
              letterSpacing: 2
            }}>
              {isGenerating ? 'Generating...' : inviteCode}
            </Text>
          </View>

          <TouchableOpacity
            onPress={copyToClipboard}
            style={{
              backgroundColor: colors.background,
              padding: 12,
              borderRadius: radius,
              borderWidth: 1,
              borderColor: colors.border
            }}
          >
            <Text style={{
              fontSize: 14,
              color: colors.textSecondary,
              textAlign: 'center'
            }}>
              📋 Tap to copy invite link
            </Text>
          </TouchableOpacity>
        </View>

        {/* Share Options */}
        <View style={{
          backgroundColor: 'white',
          padding: 20,
          borderRadius: radius,
          marginBottom: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3
        }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '600', 
            color: colors.text,
            marginBottom: 16
          }}>
            Share Invite
          </Text>

          <TouchableOpacity
            onPress={shareInvite}
            style={{
              backgroundColor: colors.primary,
              padding: 16,
              borderRadius: radius,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Text style={{ fontSize: 18, marginRight: 8 }}>📤</Text>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: 'white'
            }}>
              Share via Apps
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity
              onPress={sendSMSInvite}
              style={{
                backgroundColor: '#25D366',
                padding: 16,
                borderRadius: radius,
                flex: 1,
                marginRight: 8,
                alignItems: 'center'
              }}
            >
              <Text style={{ fontSize: 18, marginBottom: 4 }}>💬</Text>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: 'white'
              }}>
                SMS
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={sendEmailInvite}
              style={{
                backgroundColor: '#EA4335',
                padding: 16,
                borderRadius: radius,
                flex: 1,
                marginLeft: 8,
                alignItems: 'center'
              }}
            >
              <Text style={{ fontSize: 18, marginBottom: 4 }}>📧</Text>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: 'white'
              }}>
                Email
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* How it Works */}
        <View style={{
          backgroundColor: 'white',
          padding: 20,
          borderRadius: radius,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3
        }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '600', 
            color: colors.text,
            marginBottom: 16
          }}>
            How it works
          </Text>

          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 16, color: colors.text, marginBottom: 4 }}>
              1. 📱 Share your invite code
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary }}>
              Friends can join using the code or link
            </Text>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 16, color: colors.text, marginBottom: 4 }}>
              2. 🤝 They join your pool
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary }}>
              Automatically added to your savings group
            </Text>
          </View>

          <View>
            <Text style={{ fontSize: 16, color: colors.text, marginBottom: 4 }}>
              3. 🎯 Save together
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary }}>
              Track progress, celebrate milestones, stay motivated!
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
