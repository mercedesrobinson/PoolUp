import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, SafeAreaView, Share } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

type InviteFriendsNavigationProp = StackNavigationProp<RootStackParamList, 'InviteFriends'>;
type InviteFriendsRouteProp = RouteProp<RootStackParamList, 'InviteFriends'>;

interface Props {
  navigation: InviteFriendsNavigationProp;
  route: InviteFriendsRouteProp;
}

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar: string;
  isInvited: boolean;
}

export default function InviteFriends({ navigation, route }: Props): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [contacts, setContacts] = useState<Contact[]>([
    { id: '1', name: 'Sarah Johnson', email: 'sarah@email.com', avatar: '👩‍💼', isInvited: false },
    { id: '2', name: 'Mike Chen', email: 'mike@email.com', avatar: '👨‍💻', isInvited: true },
    { id: '3', name: 'Emma Wilson', phone: '+1234567890', avatar: '👩‍🎨', isInvited: false },
    { id: '4', name: 'Alex Rodriguez', email: 'alex@email.com', avatar: '👨‍🚀', isInvited: false },
    { id: '5', name: 'Lisa Park', email: 'lisa@email.com', avatar: '👩‍🎓', isInvited: false },
  ]);

  const poolId = (route.params as any)?.poolId;
  const userId = (route.params as any)?.userId || '1756612920173';

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sendInvite = async (contact: Contact): Promise<void> => {
    try {
      if (poolId) {
        await api.inviteToPool(poolId, contact.email || contact.phone || '');
      } else {
        await api.inviteToApp(contact.email || contact.phone || '');
      }
      
      setContacts(prev => prev.map(c => 
        c.id === contact.id ? { ...c, isInvited: true } : c
      ));
      
      Alert.alert('Invite Sent', `Invitation sent to ${contact.name}`);
    } catch (error) {
      console.error('Failed to send invite:', error);
      Alert.alert('Error', 'Failed to send invitation. Please try again.');
    }
  };

  const shareInviteLink = async (): Promise<void> => {
    try {
      const inviteLink = poolId 
        ? `https://poolup.app/join/${poolId}`
        : 'https://poolup.app/download';
      
      const message = poolId
        ? `Join my savings pool on PoolUp! ${inviteLink}`
        : `Check out PoolUp - save money together with friends! ${inviteLink}`;

      await Share.share({
        message,
        url: inviteLink,
        title: 'Join PoolUp',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const renderContact = (contact: Contact) => (
    <View key={contact.id} style={{
      backgroundColor: 'white',
      padding: 16,
      marginBottom: 12,
      borderRadius: radius.medium,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }}>
      <Text style={{ fontSize: 32, marginRight: 16 }}>{contact.avatar}</Text>
      
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 }}>
          {contact.name}
        </Text>
        <Text style={{ fontSize: 14, color: '#666' }}>
          {contact.email || contact.phone}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => sendInvite(contact)}
        disabled={contact.isInvited}
        style={{
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: radius.medium,
          backgroundColor: contact.isInvited ? '#e9ecef' : colors.primary,
        }}
      >
        <Text style={{
          color: contact.isInvited ? '#666' : 'white',
          fontWeight: '600',
          fontSize: 14,
        }}>
          {contact.isInvited ? 'Invited' : 'Invite'}
        </Text>
      </TouchableOpacity>
    </View>
  );

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
          {poolId ? 'Invite to Pool' : 'Invite Friends'}
        </Text>
      </View>

      <View style={{ padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e9ecef' }}>
        <TextInput
          style={{
            backgroundColor: '#f8f9fa',
            padding: 12,
            borderRadius: radius.medium,
            fontSize: 16,
            borderWidth: 1,
            borderColor: '#e9ecef',
          }}
          placeholder="Search contacts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={{
        backgroundColor: 'white',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
      }}>
        <TouchableOpacity
          onPress={shareInviteLink}
          style={{
            backgroundColor: colors.primary,
            padding: 16,
            borderRadius: radius.medium,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 20, marginRight: 8 }}>📤</Text>
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
            Share Invite Link
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
      >
        {filteredContacts.length === 0 ? (
          <View style={{
            backgroundColor: 'white',
            padding: 32,
            borderRadius: radius.medium,
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>👥</Text>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#333',
              marginBottom: 8,
              textAlign: 'center',
            }}>
              No Contacts Found
            </Text>
            <Text style={{
              fontSize: 15,
              color: '#666',
              textAlign: 'center',
              lineHeight: 22,
            }}>
              Try adjusting your search or use the share link above.
            </Text>
          </View>
        ) : (
          filteredContacts.map(renderContact)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
