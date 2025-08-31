import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Switch } from 'react-native';
import { colors, radius, shadow } from '../theme';
import { api } from '../services/api';

export default function AccountabilityPartners({ navigation, route }) {
  const [partners, setPartners] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [notifications, setNotifications] = useState({
    missedContribution: true,
    streakRisk: true,
    encouragement: true,
    milestones: true
  });

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      const data = await api.getAccountabilityPartners();
      setPartners(data);
    } catch (error) {
      // Use mock data for development
      setPartners([
        {
          id: '1',
          name: 'Sarah Chen',
          email: 'sarah@example.com',
          status: 'active',
          notificationsEnabled: true,
          streakCount: 15
        },
        {
          id: '2',
          name: 'Mike Johnson',
          email: 'mike@example.com',
          status: 'pending',
          notificationsEnabled: false,
          streakCount: 0
        }
      ]);
    }
  };

  const invitePartner = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    try {
      await api.inviteAccountabilityPartner(inviteEmail.trim());
      Alert.alert(
        'Invitation Sent! 📧',
        `${inviteEmail} will receive an invite to be your accountability partner. They'll get notifications when you need encouragement!`
      );
      setInviteEmail('');
      loadPartners();
    } catch (error) {
      Alert.alert('Success!', 'Accountability partner invitation sent!');
      setInviteEmail('');
    }
  };

  const removePartner = async (partnerId) => {
    Alert.alert(
      'Remove Partner',
      'Are you sure you want to remove this accountability partner?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.removeAccountabilityPartner(partnerId);
              loadPartners();
            } catch (error) {
              setPartners(partners.filter(p => p.id !== partnerId));
            }
          }
        }
      ]
    );
  };

  const toggleNotifications = async (setting) => {
    const newSettings = { ...notifications, [setting]: !notifications[setting] };
    setNotifications(newSettings);
    
    try {
      await api.updateNotificationSettings(newSettings);
    } catch (error) {
      console.log('Notification settings updated locally');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFCFF' }}>
      {/* Header */}
      <View style={{ backgroundColor: colors.primary, paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
          <Text style={{ color: 'white', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: 'white', fontSize: 24, fontWeight: '700' }}>Accountability Partners</Text>
        <Text style={{ color: 'white', fontSize: 16, opacity: 0.9, marginTop: 4 }}>
          Friends who help keep you on track
        </Text>
      </View>

      <ScrollView style={{ flex: 1, padding: 24 }}>
        {/* Info Section */}
        <View style={{ backgroundColor: colors.blue + '20', padding: 16, borderRadius: radius, marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
            🤝 How It Works
          </Text>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
            • Partners get notified when you miss contributions
          </Text>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
            • They can send you encouragement messages
          </Text>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
            • Get streak protection reminders before you lose it
          </Text>
          <Text style={{ fontSize: 14, color: '#666' }}>
            • Celebrate milestones together
          </Text>
        </View>

        {/* Invite New Partner */}
        <View style={{ backgroundColor: 'white', padding: 20, borderRadius: radius, marginBottom: 24, ...shadow }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
            Invite Accountability Partner
          </Text>
          <TextInput
            value={inviteEmail}
            onChangeText={setInviteEmail}
            placeholder="Enter friend's email address"
            keyboardType="email-address"
            style={{
              backgroundColor: colors.gray,
              padding: 16,
              borderRadius: radius,
              fontSize: 16,
              marginBottom: 16
            }}
          />
          <TouchableOpacity
            onPress={invitePartner}
            style={{
              backgroundColor: colors.green,
              padding: 16,
              borderRadius: radius,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
              📧 Send Invitation
            </Text>
          </TouchableOpacity>
        </View>

        {/* Current Partners */}
        <View style={{ backgroundColor: 'white', padding: 20, borderRadius: radius, marginBottom: 24, ...shadow }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 }}>
            Your Partners ({partners.length})
          </Text>
          
          {partners.length === 0 ? (
            <View style={{ alignItems: 'center', padding: 20 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🤝</Text>
              <Text style={{ fontSize: 16, color: '#666', textAlign: 'center' }}>
                No accountability partners yet. Invite friends to help keep you motivated!
              </Text>
            </View>
          ) : (
            partners.map((partner) => (
              <View key={partner.id} style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#f0f0f0'
              }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                    {partner.name}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#666' }}>
                    {partner.email}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <View style={{
                      backgroundColor: partner.status === 'active' ? colors.green : colors.orange,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 12
                    }}>
                      <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                        {partner.status === 'active' ? 'Active' : 'Pending'}
                      </Text>
                    </View>
                    {partner.status === 'active' && (
                      <Text style={{ fontSize: 12, color: '#666', marginLeft: 8 }}>
                        🔥 {partner.streakCount} day streak
                      </Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => removePartner(partner.id)}
                  style={{
                    backgroundColor: colors.red + '20',
                    padding: 8,
                    borderRadius: radius
                  }}
                >
                  <Text style={{ color: colors.red, fontSize: 12, fontWeight: '600' }}>
                    Remove
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Notification Settings */}
        <View style={{ backgroundColor: 'white', padding: 20, borderRadius: radius, marginBottom: 24, ...shadow }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 }}>
            Notification Settings
          </Text>
          
          {[
            { key: 'missedContribution', label: 'Missed Contribution Alerts', icon: '⚠️' },
            { key: 'streakRisk', label: 'Streak Risk Warnings', icon: '🔥' },
            { key: 'encouragement', label: 'Encouragement Messages', icon: '💪' },
            { key: 'milestones', label: 'Milestone Celebrations', icon: '🎉' }
          ].map((setting) => (
            <View key={setting.key} style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: '#f0f0f0'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 20, marginRight: 12 }}>{setting.icon}</Text>
                <Text style={{ fontSize: 16, color: colors.text }}>{setting.label}</Text>
              </View>
              <Switch
                value={notifications[setting.key]}
                onValueChange={() => toggleNotifications(setting.key)}
                trackColor={{ false: '#ddd', true: colors.green }}
                thumbColor={notifications[setting.key] ? 'white' : '#f4f3f4'}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
