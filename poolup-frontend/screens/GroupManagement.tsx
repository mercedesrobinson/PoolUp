import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert, TextInput, Modal } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';

interface Member {
  id: number;
  name: string;
  email: string;
  avatar: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  totalContributed: number;
  isActive: boolean;
}

interface RouteParams {
  poolId?: string;
  poolName?: string;
  isOwner?: boolean;
}

interface Props {
  navigation: any;
  route: {
    params?: RouteParams;
  };
}

export default function GroupManagement({ navigation, route }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const poolId = (route.params as any)?.poolId;
  const poolName = (route.params as any)?.poolName || 'Savings Pool';
  const isOwner = (route.params as any)?.isOwner || true;

  useEffect(() => {
    loadGroupMembers();
  }, []);

  const loadGroupMembers = async (): Promise<void> => {
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
          totalContributed: 28500,
          isActive: true
        },
        {
          id: 4,
          name: 'Emily Davis',
          email: 'emily@example.com',
          avatar: '👩‍🎨',
          role: 'member',
          joinedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          totalContributed: 19000,
          isActive: false
        }
      ]);
    }
  };

  const inviteMember = async (): Promise<void> => {
    if (!newMemberEmail.trim()) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      await api.inviteToPool(poolId, newMemberEmail);
      Alert.alert('Success', 'Invitation sent successfully!');
      setNewMemberEmail('');
      setShowInviteModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to send invitation. Please try again.');
    }
  };

  const removeMember = async (memberId: number): Promise<void> => {
    Alert.alert(
      'Remove Member',
      'Are you sure you want to remove this member from the pool?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.removeMemberFromPool(poolId, memberId);
              setMembers(members.filter(m => m.id !== memberId));
              Alert.alert('Success', 'Member removed successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove member');
            }
          }
        }
      ]
    );
  };

  const changeRole = async (memberId: number, newRole: string): Promise<void> => {
    try {
      await api.changeMemberRole(poolId, memberId.toString(), newRole);
      setMembers(members.map(m => 
        m.id === memberId ? { ...m, role: newRole as Member['role'] } : m
      ));
      Alert.alert('Success', 'Role updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update role');
    }
  };

  const renderMember = ({ item }: { item: Member }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberInfo}>
        <Text style={styles.memberAvatar}>{item.avatar}</Text>
        <View style={styles.memberDetails}>
          <Text style={styles.memberName}>{item.name}</Text>
          <Text style={styles.memberEmail}>{item.email}</Text>
          <Text style={styles.memberRole}>
            {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
          </Text>
        </View>
      </View>
      
      <View style={styles.memberStats}>
        <Text style={styles.contributionAmount}>
          ${(item.totalContributed / 100).toFixed(0)}
        </Text>
        <Text style={styles.contributionLabel}>contributed</Text>
        <View style={[styles.statusBadge, { 
          backgroundColor: item.isActive ? colors.success : colors.warning 
        }]}>
          <Text style={styles.statusText}>
            {item.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {isOwner && item.role !== 'owner' && (
        <View style={styles.memberActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => changeRole(item.id, item.role === 'admin' ? 'member' : 'admin')}
          >
            <Text style={styles.actionButtonText}>
              {item.role === 'admin' ? 'Demote' : 'Promote'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.removeButton]}
            onPress={() => removeMember(item.id)}
          >
            <Text style={[styles.actionButtonText, styles.removeButtonText]}>Remove</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Manage {poolName}</Text>
        {isOwner && (
          <TouchableOpacity
            style={styles.inviteButton}
            onPress={() => setShowInviteModal(true)}
          >
            <Text style={styles.inviteButtonText}>+ Invite</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{members.length}</Text>
          <Text style={styles.statLabel}>Total Members</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{members.filter(m => m.isActive).length}</Text>
          <Text style={styles.statLabel}>Active Members</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            ${(members.reduce((sum, m) => (Number(sum) || 0) + (Number(m.totalContributed) || 0), 0) / 100).toFixed(0)}
          </Text>
          <Text style={styles.statLabel}>Total Contributed</Text>
        </View>
      </View>

      <FlatList
        data={members}
        renderItem={renderMember}
        keyExtractor={(item) => item.id.toString()}
        style={styles.membersList}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={showInviteModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Invite New Member</Text>
            <TextInput
              style={styles.emailInput}
              placeholder="Enter email address"
              value={newMemberEmail}
              onChangeText={setNewMemberEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowInviteModal(false);
                  setNewMemberEmail('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.sendButton]}
                onPress={inviteMember}
              >
                <Text style={styles.sendButtonText}>Send Invite</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.primary,
  },
  backButton: {
    color: colors.white,
    fontSize: 16,
  },
  title: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold' as const,
  },
  inviteButton: {
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.small,
  },
  inviteButtonText: {
    color: colors.primary,
    fontWeight: 'bold' as const,
  },
  statsContainer: {
    flexDirection: 'row' as const,
    backgroundColor: colors.white,
    margin: 20,
    borderRadius: radius.medium,
    padding: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center' as const,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  membersList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  memberCard: {
    backgroundColor: colors.white,
    borderRadius: radius.medium,
    padding: 16,
    marginBottom: 12,
  },
  memberInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  memberAvatar: {
    fontSize: 32,
    marginRight: 12,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: colors.text,
  },
  memberEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  memberRole: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 2,
    fontWeight: '500' as const,
  },
  memberStats: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 12,
  },
  contributionAmount: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: colors.success,
  },
  contributionLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.small,
  },
  statusText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: 'bold' as const,
  },
  memberActions: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    borderRadius: radius.small,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: colors.white,
    textAlign: 'center' as const,
    fontWeight: 'bold' as const,
  },
  removeButton: {
    backgroundColor: colors.error,
  },
  removeButtonText: {
    color: colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: radius.medium,
    padding: 20,
    width: 100,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center' as const,
  },
  emailInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.small,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.small,
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: colors.lightGray,
  },
  cancelButtonText: {
    color: colors.text,
    textAlign: 'center' as const,
    fontWeight: 'bold' as const,
  },
  sendButton: {
    backgroundColor: colors.primary,
  },
  sendButtonText: {
    color: colors.white,
    textAlign: 'center' as const,
    fontWeight: 'bold' as const,
  },
};
