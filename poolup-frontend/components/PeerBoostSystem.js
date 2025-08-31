import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  TextInput,
  Image 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const colors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  background: '#F2F2F7',
  card: '#FFFFFF'
};

const radius = { sm: 8, md: 12, lg: 16 };

export default function PeerBoostSystem({ 
  poolId, 
  boosterId, 
  targetUser, 
  onBoostComplete,
  visible,
  onClose 
}) {
  const [boostAmount, setBoostAmount] = useState('25');
  const [encouragementMessage, setEncouragementMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const quickMessages = [
    "You've got this! 💪",
    "Don't give up on your goal! 🎯",
    "We're here to support you! 🤝",
    "Every step counts! 👣",
    "Your future self will thank you! ✨"
  ];

  const processPeerBoost = async () => {
    try {
      setLoading(true);
      
      const amount = Math.round(parseFloat(boostAmount) * 100);
      if (amount <= 0) {
        Alert.alert('Error', 'Please enter a valid boost amount');
        return;
      }

      const response = await fetch(`http://localhost:3000/api/accountability/peer-boost/${poolId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boosterId,
          targetUserId: targetUser.id,
          amountCents: amount,
          message: encouragementMessage || "Helping you stay on track! 🤝"
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        Alert.alert(
          'Peer Boost Complete! 🎉',
          `You helped ${targetUser.name} stay on track!\n\n• Contributed $${boostAmount} on their behalf\n• Earned ${result.bonusPoints} bonus points\n• Strengthened team spirit! 🤝`,
          [{ text: 'Amazing!', onPress: () => {
            onBoostComplete?.(result);
            onClose();
          }}]
        );
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Peer boost error:', error);
      Alert.alert('Error', 'Failed to process peer boost. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🤝 Peer Boost</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <LinearGradient
            colors={[colors.success, '#32D74B']}
            style={styles.boostCard}
          >
            <Text style={styles.boostTitle}>Help a Friend Stay on Track</Text>
            <Text style={styles.boostSubtitle}>
              Cover {targetUser.name}'s contribution and earn bonus points!
            </Text>
          </LinearGradient>

          <View style={styles.targetUserCard}>
            <View style={styles.userInfo}>
              {targetUser.profile_image ? (
                <Image source={{ uri: targetUser.profile_image }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.defaultAvatar]}>
                  <Text style={styles.avatarText}>
                    {targetUser.name?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
              )}
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{targetUser.name}</Text>
                <Text style={styles.userStatus}>Needs support to maintain streak</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Boost Amount</Text>
            <TextInput
              style={styles.amountInput}
              value={boostAmount}
              onChangeText={setBoostAmount}
              keyboardType="numeric"
              placeholder="25"
            />
            <Text style={styles.bonusNote}>
              💰 You'll earn {Math.round(parseFloat(boostAmount || 0) * 2)} bonus points for helping!
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Encouragement Message</Text>
            <TextInput
              style={styles.messageInput}
              value={encouragementMessage}
              onChangeText={setEncouragementMessage}
              placeholder="Add an encouraging message..."
              multiline
              maxLength={150}
            />
            
            <Text style={styles.quickMessagesTitle}>Quick Messages:</Text>
            <View style={styles.quickMessagesContainer}>
              {quickMessages.map((message, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickMessage}
                  onPress={() => setEncouragementMessage(message)}
                >
                  <Text style={styles.quickMessageText}>{message}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.benefitsSection}>
            <Text style={styles.benefitsTitle}>🌟 Peer Boost Benefits</Text>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitEmoji}>🏆</Text>
              <Text style={styles.benefitText}>Earn 2x points for helping others</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitEmoji}>🤝</Text>
              <Text style={styles.benefitText}>Strengthen team accountability</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitEmoji}>🎯</Text>
              <Text style={styles.benefitText}>Help friends maintain their streaks</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitEmoji}>🏅</Text>
              <Text style={styles.benefitText}>Unlock Helper badges</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.boostButton, loading && styles.boostingButton]}
            onPress={processPeerBoost}
            disabled={loading}
          >
            <Text style={styles.boostButtonText}>
              {loading ? 'Processing Boost...' : `🚀 Boost ${targetUser.name} ($${boostAmount})`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    fontSize: 24,
    color: colors.textSecondary,
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  boostCard: {
    padding: 24,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginBottom: 24,
  },
  boostTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  boostSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  targetUserCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: radius.md,
    marginBottom: 24,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  defaultAvatar: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  userStatus: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  amountInput: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: radius.md,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 8,
  },
  bonusNote: {
    fontSize: 14,
    color: colors.success,
    textAlign: 'center',
    fontWeight: '600',
  },
  messageInput: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: radius.md,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 12,
  },
  quickMessagesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  quickMessagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickMessage: {
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  quickMessageText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  benefitsSection: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: radius.lg,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitEmoji: {
    fontSize: 16,
    marginRight: 12,
    width: 20,
  },
  benefitText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  footer: {
    padding: 20,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  boostButton: {
    backgroundColor: colors.success,
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  boostingButton: {
    opacity: 0.7,
  },
  boostButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
