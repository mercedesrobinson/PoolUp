import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  ScrollView,
  TextInput 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const colors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  background: '#F2F2F7',
  card: '#FFFFFF'
};

const radius = { sm: 8, md: 12, lg: 16 };

export default function ForfeitSystem({ 
  poolId, 
  userId, 
  missedDays, 
  onForfeitComplete,
  visible,
  onClose 
}) {
  const [selectedCharity, setSelectedCharity] = useState(null);
  const [charities, setCharities] = useState([]);
  const [customReason, setCustomReason] = useState('');
  const [forfeitAmount, setForfeitAmount] = useState(25);
  const [loading, setLoading] = useState(false);

  const defaultCharities = [
    { id: 'unicef', name: 'UNICEF', description: 'Children in need worldwide', emoji: '🌍' },
    { id: 'red_cross', name: 'Red Cross', description: 'Disaster relief and emergency aid', emoji: '🏥' },
    { id: 'feeding_america', name: 'Feeding America', description: 'Fighting hunger in communities', emoji: '🍽️' },
    { id: 'habitat', name: 'Habitat for Humanity', description: 'Building homes for families', emoji: '🏠' },
    { id: 'wwf', name: 'World Wildlife Fund', description: 'Protecting endangered species', emoji: '🐾' }
  ];

  useEffect(() => {
    fetchCharities();
    calculateForfeitAmount();
  }, [missedDays]);

  const fetchCharities = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/accountability/charities');
      const data = await response.json();
      setCharities(data.length > 0 ? data : defaultCharities);
    } catch (error) {
      console.error('Failed to fetch charities:', error);
      setCharities(defaultCharities);
    }
  };

  const calculateForfeitAmount = () => {
    // $25 base + $5 per missed day
    const amount = 25 + (missedDays * 5);
    setForfeitAmount(Math.min(amount, 100)); // Cap at $100
  };

  const processForfeit = async () => {
    if (!selectedCharity) {
      Alert.alert('Error', 'Please select a charity for your forfeit donation.');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`http://localhost:3000/api/accountability/forfeit/${poolId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          forfeitAmount: forfeitAmount * 100, // Convert to cents
          reason: customReason || `Missed ${missedDays} day(s) of contributions`,
          charityId: selectedCharity.id
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        Alert.alert(
          'Forfeit Processed 💔',
          `$${forfeitAmount} will be donated to ${selectedCharity.name}.\n\nYour streak has been reset, but you can start fresh tomorrow! 💪`,
          [{ text: 'OK', onPress: () => {
            onForfeitComplete?.(result);
            onClose();
          }}]
        );
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Forfeit processing error:', error);
      Alert.alert('Error', 'Failed to process forfeit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderCharityOption = (charity) => (
    <TouchableOpacity
      key={charity.id}
      style={[
        styles.charityOption,
        selectedCharity?.id === charity.id && styles.selectedCharity
      ]}
      onPress={() => setSelectedCharity(charity)}
    >
      <View style={styles.charityHeader}>
        <Text style={styles.charityEmoji}>{charity.emoji}</Text>
        <View style={styles.charityInfo}>
          <Text style={styles.charityName}>{charity.name}</Text>
          <Text style={styles.charityDescription}>{charity.description}</Text>
        </View>
        {selectedCharity?.id === charity.id && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>💔 Missed Contribution</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <LinearGradient
            colors={['#FF6B6B', '#FF8E53']}
            style={styles.forfeitCard}
          >
            <Text style={styles.forfeitTitle}>Accountability Forfeit</Text>
            <Text style={styles.forfeitSubtitle}>
              You missed {missedDays} day{missedDays > 1 ? 's' : ''} of contributions
            </Text>
            <Text style={styles.forfeitAmount}>${forfeitAmount}</Text>
            <Text style={styles.forfeitNote}>
              This amount will be donated to your chosen charity
            </Text>
          </LinearGradient>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose a Charity</Text>
            <Text style={styles.sectionSubtitle}>
              Your forfeit will make a positive impact
            </Text>
            
            {charities.map(renderCharityOption)}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add a Note (Optional)</Text>
            <TextInput
              style={styles.reasonInput}
              value={customReason}
              onChangeText={setCustomReason}
              placeholder="Why did you miss your contributions?"
              multiline
              maxLength={200}
            />
          </View>

          <View style={styles.motivationSection}>
            <Text style={styles.motivationTitle}>💪 Tomorrow is a Fresh Start</Text>
            <Text style={styles.motivationText}>
              Everyone stumbles sometimes. The important thing is getting back on track. 
              Your streak resets, but your determination doesn't!
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.processButton, loading && styles.processingButton]}
            onPress={processForfeit}
            disabled={loading || !selectedCharity}
          >
            <Text style={styles.processButtonText}>
              {loading ? 'Processing...' : `Donate $${forfeitAmount} & Reset Streak`}
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
  forfeitCard: {
    padding: 24,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginBottom: 24,
  },
  forfeitTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  forfeitSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
  },
  forfeitAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  forfeitNote: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  charityOption: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: radius.md,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCharity: {
    borderColor: colors.primary,
    backgroundColor: '#F0F8FF',
  },
  charityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  charityEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  charityInfo: {
    flex: 1,
  },
  charityName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  charityDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  checkmark: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: 'bold',
  },
  reasonInput: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: radius.md,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  motivationSection: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  motivationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  processButton: {
    backgroundColor: colors.error,
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  processingButton: {
    opacity: 0.7,
  },
  processButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
