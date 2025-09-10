import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Share } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

type RootStackParamList = {
  InfluencerCodes: { user: any };
};

type InfluencerCodesNavigationProp = StackNavigationProp<RootStackParamList, 'InfluencerCodes'>;
type InfluencerCodesRouteProp = RouteProp<RootStackParamList, 'InfluencerCodes'>;

interface Props {
  navigation: InfluencerCodesNavigationProp;
  route: InfluencerCodesRouteProp;
}

export default function InfluencerCodes({ navigation, route }: Props) {
  const { user } = route?.params || {};
  const [referralCode, setReferralCode] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<any>({
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarnings: 0
  });

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      const data = await api.createReferralCode(user.id);
      setReferralCode(data.code);
      setStats(data.stats || { totalReferrals: 0, activeReferrals: 0, totalEarnings: 0 });
    } catch (error) {
      console.error('Failed to load referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewCode = async () => {
    try {
      const data = await api.createReferralCode(user.id);
      setReferralCode(data.code);
      Alert.alert('Success!', 'New referral code generated!');
    } catch (error) {
      console.error('Failed to generate code:', error);
      Alert.alert('Error', 'Failed to generate referral code. Please try again.');
    }
  };

  const validateReferralCode = async () => {
    if (!inputCode.trim()) {
      Alert.alert('Error', 'Please enter a referral code');
      return;
    }

    try {
      const result = await api.validateReferralCode(inputCode.trim());
      if (result.valid) {
        Alert.alert(
          'Valid Code!', 
          `This code belongs to ${result.influencer}. You'll get special bonuses when you create your first pool!`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Use Code', 
              onPress: () => {
                // Navigate to CreatePool with referral code
                navigation.navigate('CreatePool' as any, { 
                  user, 
                  referralCode: inputCode.trim() 
                });
              }
            }
          ]
        );
      } else {
        Alert.alert('Invalid Code', 'This referral code is not valid or has expired.');
      }
    } catch (error) {
      console.error('Failed to validate code:', error);
      Alert.alert('Error', 'Failed to validate referral code. Please try again.');
    }
  };

  const shareReferralCode = async () => {
    if (!referralCode) return;

    try {
      await Share.share({
        message: `Join me on PoolUp and start saving together! Use my referral code: ${referralCode}\n\nPoolUp makes saving fun with friends - download the app and let's reach our goals together! 🎯💰`,
        title: 'Join PoolUp with my referral code!'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFCFF' }}>
        <Text style={{ fontSize: 16, color: colors.text }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FAFCFF' }}>
      <View style={{ backgroundColor: colors.primary, paddingTop: 80, paddingBottom: 20, paddingHorizontal: 24 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
          <Text style={{ color: 'white', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: 'white', fontSize: 24, fontWeight: '700' }}>Influencer Codes</Text>
        <Text style={{ color: 'white', fontSize: 16, opacity: 0.9, marginTop: 4 }}>
          Share your code and earn rewards
        </Text>
      </View>

      <View style={{ padding: 24 }}>
        {/* Your Referral Code */}
        <View style={{ backgroundColor: 'white', padding: 20, borderRadius: radius.medium, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
            🎯 Your Referral Code
          </Text>
          
          {referralCode ? (
            <>
              <View style={{ backgroundColor: colors.primary + '15', padding: 16, borderRadius: radius.medium, marginBottom: 16, alignItems: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: '700', color: colors.primary, letterSpacing: 2 }}>
                  {referralCode}
                </Text>
              </View>
              
              <TouchableOpacity 
                onPress={shareReferralCode}
                style={{ backgroundColor: colors.primary, padding: 16, borderRadius: radius.medium, alignItems: 'center', marginBottom: 12 }}
              >
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                  📤 Share Your Code
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={generateNewCode}
                style={{ backgroundColor: '#f0f0f0', padding: 12, borderRadius: radius.medium, alignItems: 'center' }}
              >
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500' }}>
                  🔄 Generate New Code
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              onPress={generateNewCode}
              style={{ backgroundColor: colors.primary, padding: 16, borderRadius: radius.medium, alignItems: 'center' }}
            >
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                ✨ Create Your Referral Code
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        {referralCode && (
          <View style={{ backgroundColor: 'white', padding: 20, borderRadius: radius.medium, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 }}>
              📊 Your Impact
            </Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 24, fontWeight: '700', color: colors.primary }}>
                  {stats.totalReferrals}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center' }}>
                  Total Referrals
                </Text>
              </View>
              
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 24, fontWeight: '700', color: colors.green }}>
                  {stats.activeReferrals}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center' }}>
                  Active Savers
                </Text>
              </View>
              
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 24, fontWeight: '700', color: colors.purple }}>
                  ${stats.totalEarnings}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center' }}>
                  Earnings
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Use Referral Code */}
        <View style={{ backgroundColor: 'white', padding: 20, borderRadius: radius.medium, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
            🎁 Use a Referral Code
          </Text>
          
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 16 }}>
            Got a code from a friend? Enter it here to get special bonuses!
          </Text>
          
          <TextInput 
            value={inputCode}
            onChangeText={setInputCode}
            style={{ backgroundColor: '#f9f9f9', padding: 16, borderRadius: radius.medium, marginBottom: 16, fontSize: 16, textAlign: 'center', letterSpacing: 1 }}
            placeholder="Enter referral code"
            autoCapitalize="characters"
            maxLength={10}
          />
          
          <TouchableOpacity 
            onPress={validateReferralCode}
            style={{ backgroundColor: colors.green, padding: 16, borderRadius: radius.medium, alignItems: 'center' }}
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
              ✅ Validate Code
            </Text>
          </TouchableOpacity>
        </View>

        {/* How It Works */}
        <View style={{ backgroundColor: colors.blue + '15', padding: 20, borderRadius: radius.medium, borderLeftWidth: 4, borderLeftColor: colors.blue }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
            💡 How Referral Codes Work
          </Text>
          
          <Text style={{ fontSize: 14, color: colors.text, lineHeight: 20, marginBottom: 8 }}>
            • Share your code with friends and family
          </Text>
          <Text style={{ fontSize: 14, color: colors.text, lineHeight: 20, marginBottom: 8 }}>
            • They get bonus rewards when they create their first pool
          </Text>
          <Text style={{ fontSize: 14, color: colors.text, lineHeight: 20, marginBottom: 8 }}>
            • You earn rewards for each active referral
          </Text>
          <Text style={{ fontSize: 14, color: colors.text, lineHeight: 20 }}>
            • Build your savings community together!
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
