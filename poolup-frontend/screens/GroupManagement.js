import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert, TextInput, Modal } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';

export default function GroupManagement({ navigation, route }) {
  const [members, setMembers] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const poolId = route.params?.poolId;
  const poolName = route.params?.poolName || 'Savings Pool';
  const isOwner = route.params?.isOwner || true;

  useEffect(() => {
    loadGroupMembers();
  }, []);

  const loadGroupMembers = async () => {
    try {
      const groupMembers = await api.getPoolMembers(poolId);
      setMembers(groupMembers);
    } catch (error) {
      // Mock data for development
      setMembers([
        {
          id: 1,
          name: 'You',
          email: 'you@example.com',
          avatar: '👤',
          role: 'owner',
          joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          totalContributed: 45000,
          isActive: true
        },
        {
          id: 2,
          name: 'Sarah Johnson',
          email: 'sarah@example.com',
          avatar: '👩‍💼',
          role: 'member',
          joinedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
          totalContributed: 32000,
          isActive: true
        },
        {
          id: 3,
          name: 'Mike Chen',
          email: 'mike@example.com',
          avatar: '👨‍💻',
          role: 'member',
          joinedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          totalContributed: 28000,
          isActive: true
        },
        {
          id: 4,
          name: 'Emma Wilson',
          email: 'emma@example.com',
          avatar: '👩‍🎨',
          role: 'member',
          joinedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          totalContributed: 15000,
          isActive: false
        }
      ]);
    }
  };

  const removeMember = (member) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.name} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.removeMemberFromPool(poolId, member.id);
              setMembers(members.filter(m => m.id !== member.id));
            } catch (error) {
              Alert.alert('Error', 'Failed to remove member');
            }
          }
        }
      ]
    );
  };

  const inviteMember = async () => {
    if (!newMemberEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    try {
      await api.inviteMemberToPool(poolId, newMemberEmail);
      Alert.alert('Success', 'Invitation sent!');
      setNewMemberEmail('');
      setShowInviteModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to send invitation');
    }
  };

  const makeAdmin = (member) => {
    Alert.alert(
      'Make Admin',
      `Give ${member.name} admin privileges for this pool?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Make Admin',
          onPress: async () => {
            try {
              await api.updateMemberRole(poolId, member.id, 'admin');
              loadGroupMembers();
            } catch (error) {
              Alert.alert('Error', 'Failed to update member role');
            }
          }
        }
      ]
    );
  };

  const renderMember = ({ item }) => (
    <View style={{
      backgroundColor: 'white',
      padding: 16,
      marginBottom: 12,
      borderRadius: radius,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 32, marginRight: 12 }}>{item.avatar}</Text>
        
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: colors.text,
              flex: 1
            }}>
              {item.name}
            </Text>
            {item.role === 'owner' && (
              <View style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 12
              }}>
                <Text style={{ fontSize: 10, color: 'white', fontWeight: '600' }}>
                  OWNER
                </Text>
              </View>
            )}
            {item.role === 'admin' && (
              <View style={{
                backgroundColor: colors.warning,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 12
              }}>
                <Text style={{ fontSize: 10, color: 'white', fontWeight: '600' }}>
                  ADMIN
                </Text>
              </View>
            )}
          </View>
          
          <Text style={{ 
            fontSize: 12, 
            color: colors.textSecondary,
            marginBottom: 4
          }}>
            {item.email}
          </Text>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              Contributed: ${(item.totalContributed / 100).toFixed(2)}
            </Text>
            <Text style={{ 
              fontSize: 12, 
              color: item.isActive ? colors.success : colors.textSecondary
            }}>
              {item.isActive ? '🟢 Active' : '🔴 Inactive'}
            </Text>
          </View>
        </View>

        {isOwner && item.role !== 'owner' && (
          <View style={{ marginLeft: 12 }}>
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Member Actions',
                  `What would you like to do with ${item.name}?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    ...(item.role === 'member' ? [{
                      text: 'Make Admin',
                      onPress: () => makeAdmin(item)
                    }] : []),
                    {
                      text: 'Remove',
                      style: 'destructive',
                      onPress: () => removeMember(item)
                    }
                  ]
                );
              }}
              style={{
                backgroundColor: colors.background,
                padding: 8,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border
              }}
            >
              <Text style={{ fontSize: 12 }}>⋯</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

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
            Group Members
          </Text>
          {isOwner && (
            <TouchableOpacity
              onPress={() => setShowInviteModal(true)}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16
              }}
            >
              <Text style={{ fontSize: 12, color: 'white', fontWeight: '600' }}>
                + Add
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={{ 
          fontSize: 16, 
          color: colors.textSecondary,
          marginBottom: 8
        }}>
          {members.length} members in "{poolName}"
        </Text>
      </View>

      <View style={{ padding: 20, flex: 1 }}>
        <FlatList
          data={members}
          renderItem={renderMember}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
        />

        {isOwner && (
          <TouchableOpacity
            onPress={() => navigation.navigate('InviteFriends', { poolId, poolName })}
            style={{
              backgroundColor: colors.primary,
              padding: 16,
              borderRadius: radius,
              marginTop: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Text style={{ fontSize: 18, marginRight: 8 }}>👥</Text>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: 'white'
            }}>
              Invite More Friends
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Invite Modal */}
      <Modal
        visible={showInviteModal}
        transparent
        animationType="slide"
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          padding: 20
        }}>
          <View style={{
            backgroundColor: 'white',
            borderRadius: radius,
            padding: 20
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: colors.text,
              marginBottom: 16,
              textAlign: 'center'
            }}>
              Invite Member
            </Text>

            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius,
                padding: 12,
                fontSize: 16,
                marginBottom: 16
              }}
              placeholder="Enter email address"
              value={newMemberEmail}
              onChangeText={setNewMemberEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                onPress={() => {
                  setShowInviteModal(false);
                  setNewMemberEmail('');
                }}
                style={{
                  backgroundColor: colors.background,
                  padding: 12,
                  borderRadius: radius,
                  flex: 1,
                  marginRight: 8,
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontSize: 16, color: colors.textSecondary }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={inviteMember}
                style={{
                  backgroundColor: colors.primary,
                  padding: 12,
                  borderRadius: radius,
                  flex: 1,
                  marginLeft: 8,
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontSize: 16, color: 'white', fontWeight: '600' }}>
                  Send Invite
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
