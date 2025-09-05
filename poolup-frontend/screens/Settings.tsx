import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, Linking } from 'react-native';
import { colors } from '../theme';
import { api } from '../services/api';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { CurrencySelector } from '../components/CurrencySelector';
import { getUserCurrency, getCurrencyInfo } from '../utils/currency';

type SettingsNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;
type SettingsRouteProp = RouteProp<RootStackParamList, 'Settings'>;

interface Props {
  navigation: SettingsNavigationProp;
  route: SettingsRouteProp;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  last4?: string;
  brand?: string;
  name?: string;
  isDefault: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function Settings({ navigation, route }: Props): React.JSX.Element {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(getUserCurrency());

  const user = (route.params as any)?.user;

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async (): Promise<void> => {
    try {
      const methods = await api.getPaymentMethods(user?.id || '');
      setPaymentMethods(methods);
    } catch (error) {
      // Mock data for development
      setPaymentMethods([
        { id: '1', type: 'card', last4: '4242', brand: 'visa', isDefault: true },
        { id: '2', type: 'bank', name: 'Chase Checking', last4: '1234', isDefault: false }
      ]);
    }
  };

  const handleContactSupport = (): void => {
    Alert.alert(
      'Contact Support',
      'How would you like to reach us?',
      [
        { text: 'Email', onPress: () => Linking.openURL('mailto:support@poolup.com') },
        { text: 'Chat', onPress: () => Alert.alert('Chat', 'Live chat coming soon!') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleFeedback = (): void => {
    Alert.alert(
      'Send Feedback',
      'We love hearing from you! What would you like to share?',
      [
        { text: 'Bug Report', onPress: () => navigation.navigate("FeedbackForm" as any, { type: 'bug' }) },
        { text: 'Feature Request', onPress: () => navigation.navigate("FeedbackForm" as any, { type: 'feature' }) },
        { text: 'General Feedback', onPress: () => navigation.navigate("FeedbackForm" as any, { type: 'general' }) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleLogout = (): void => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          style: 'destructive',
          onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] })
        }
      ]
    );
  };

  interface SettingItemProps {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showArrow?: boolean;
    textColor?: string;
  }

  const SettingItem = ({ icon, title, subtitle, onPress, showArrow = true, textColor = colors.text }: SettingItemProps): React.JSX.Element => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
      }}
    >
      <Text style={{ fontSize: 20, marginRight: 16, width: 24, textAlign: 'center' }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: textColor }}>{title}</Text>
        {subtitle && (
          <Text style={{ fontSize: 14, color: '#666', marginTop: 2 }}>{subtitle}</Text>
        )}
      </View>
      {showArrow && (
        <Text style={{ fontSize: 16, color: '#ccc' }}>›</Text>
      )}
    </TouchableOpacity>
  );

  interface SectionHeaderProps {
    title: string;
  }

  const SectionHeader = ({ title }: SectionHeaderProps): React.JSX.Element => (
    <Text style={{
      fontSize: 14,
      fontWeight: '600',
      color: '#666',
      textTransform: 'uppercase',
      marginTop: 24,
      marginBottom: 8,
      marginLeft: 20
    }}>
      {title}
    </Text>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFCFF' }}>
      {/* Header */}
      <View style={{ backgroundColor: colors.primary, paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
          <Text style={{ color: 'white', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: 'white', fontSize: 24, fontWeight: '700' }}>Settings</Text>
        <Text style={{ color: 'white', fontSize: 16, opacity: 0.9, marginTop: 4 }}>
          Manage your PoolUp account
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* App Info */}
        <View style={{ backgroundColor: 'white', marginTop: 16, paddingVertical: 16, paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={require('../assets/poolup-logo.png')}
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                marginRight: 12
              }}
              resizeMode="contain"
            />
            <View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                PoolUp - Social Savings
              </Text>
              <Text style={{ fontSize: 14, color: '#666' }}>Version 1.0.0</Text>
            </View>
          </View>
        </View>

        <SectionHeader title="Account" />
        <View style={{ backgroundColor: 'white' }}>
          <SettingItem
            icon="👤"
            title="Profile"
            subtitle="Update your personal information"
            onPress={() => navigation.navigate("Profile" as any, { user })}
          />
          <SettingItem
            icon="💳"
            title="Payment Methods"
            subtitle={`${paymentMethods.length} method${paymentMethods.length !== 1 ? 's' : ''} added`}
            onPress={() => navigation.navigate('PaymentMethods')}
          />
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }} onPress={() => navigation.navigate('NotificationSettings')}>
            <Text style={{ fontSize: 20, marginRight: 16, width: 24, textAlign: 'center' }}>🔔</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>Notification Settings</Text>
            </View>
            <Text style={{ fontSize: 16, color: '#ccc' }}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }} onPress={() => navigation.navigate('ProgressSharingSimple')}>
            <Text style={{ fontSize: 20, marginRight: 16, width: 24, textAlign: 'center' }}>📱</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>Share Progress</Text>
            </View>
            <Text style={{ fontSize: 16, color: '#ccc' }}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }} onPress={() => navigation.navigate('SocialProofSimple')}>
            <Text style={{ fontSize: 20, marginRight: 16, width: 24, textAlign: 'center' }}>🌟</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>Community</Text>
            </View>
            <Text style={{ fontSize: 16, color: '#ccc' }}>›</Text>
          </TouchableOpacity>
          <SettingItem
            icon="🔒"
            title="Privacy & Security"
            subtitle="Control your privacy settings"
            onPress={() => navigation.navigate('PrivacySettings')}
          />
        </View>

        <SectionHeader title="Savings" />
        <View style={{ backgroundColor: 'white' }}>
          <SettingItem
            icon="📊"
            title="Savings Summary"
            subtitle="View your savings progress"
            onPress={() => navigation.navigate('SavingsSummary')}
          />
          <SettingItem
            icon="📋"
            title="Transaction History"
            subtitle="See all your contributions"
            onPress={() => navigation.navigate('TransactionHistory')}
          />
          <SettingItem
            icon="💰"
            title="Contribution Settings"
            subtitle="Payday schedule, auto-contribute, and streaks"
            onPress={() => navigation.navigate("ContributionSettings" as any, { userId: user?.id })}
          />
        </View>

        <SectionHeader title="International" />
        <View style={{ backgroundColor: 'white' }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 16,
            paddingHorizontal: 20,
            backgroundColor: 'white',
            borderBottomWidth: 1,
            borderBottomColor: '#f0f0f0'
          }}>
            <Text style={{ fontSize: 20, marginRight: 16, width: 24, textAlign: 'center' }}>💱</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>Currency</Text>
              <Text style={{ fontSize: 14, color: '#666', marginTop: 2 }}>
                {getCurrencyInfo(selectedCurrency)?.name || 'US Dollar'}
              </Text>
            </View>
          </View>
          <View style={{ paddingHorizontal: 20, paddingBottom: 16, backgroundColor: 'white' }}>
            <CurrencySelector
              selectedCurrency={selectedCurrency}
              onCurrencyChange={(currency) => {
                setSelectedCurrency(currency);
                // In a real app, save to user preferences
                console.log('Currency changed to:', currency);
              }}
            />
          </View>
        </View>

        <SectionHeader title="Penalties" />
        <View style={{ backgroundColor: 'white' }}>
          <SettingItem
            icon="⚠️"
            title="Penalty Settings"
            subtitle="Configure missed contribution penalties"
            onPress={() => navigation.navigate('PenaltySettings')}
          />
        </View>

        <SectionHeader title="Social" />
        <View style={{ backgroundColor: 'white' }}>
          <SettingItem
            icon="👥"
            title="Friends & Groups"
            subtitle="Manage your connections"
            onPress={() => navigation.navigate('FriendsFeed')}
          />
          <SettingItem
            icon="🤝"
            title="Accountability Partners"
            subtitle="Manage your support network"
            onPress={() => navigation.navigate('AccountabilityPartners')}
          />
          <SettingItem
            icon="📱"
            title="Invite Friends"
            subtitle="Share PoolUp with others"
            onPress={() => navigation.navigate('InviteFriends')}
          />
        </View>

        <SectionHeader title="Support" />
        <View style={{ backgroundColor: 'white' }}>
          <SettingItem
            icon="💬"
            title="Contact Support"
            subtitle="Get help when you need it"
            onPress={handleContactSupport}
          />
          <SettingItem
            icon="💡"
            title="Send Feedback"
            subtitle="Help us improve PoolUp"
            onPress={handleFeedback}
          />
          <SettingItem
            icon="❓"
            title="Help Center"
            subtitle="FAQs and guides"
            onPress={() => navigation.navigate('Settings' as any)}
          />
          <SettingItem
            icon="⭐"
            title="Rate PoolUp"
            subtitle="Share your experience"
            onPress={() => Linking.openURL('https://apps.apple.com/app/poolup')}
          />
        </View>

        <SectionHeader title="Legal" />
        <View style={{ backgroundColor: 'white' }}>
          <SettingItem
            icon="📄"
            title="Terms of Service"
            onPress={() => navigation.navigate("Legal" as any, { type: 'terms' })}
          />
          <SettingItem
            icon="🔐"
            title="Privacy Policy"
            onPress={() => navigation.navigate("Legal" as any, { type: 'privacy' })}
          />
          <SettingItem
            icon="ℹ️"
            title="About PoolUp"
            onPress={() => navigation.navigate('Settings' as any)}
          />
        </View>

        {/* Logout */}
        <View style={{ backgroundColor: 'white', marginTop: 24, marginBottom: 40 }}>
          <SettingItem
            icon="🚪"
            title="Log Out"
            onPress={handleLogout}
            showArrow={false}
            textColor={colors.red}
          />
        </View>
      </ScrollView>
    </View>
  );
}
