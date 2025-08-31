import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import api from '../services/api';

const colors = {
  primary: '#007AFF',
  primaryLight: '#E3F2FD',
  green: '#34C759',
  red: '#FF3B30',
  orange: '#FF9500',
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  background: '#F2F2F7',
  white: '#FFFFFF'
};

export default function WithdrawFunds({ navigation, route }) {
  const { pool, user } = route.params;
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [reason, setReason] = useState('');
  const [penaltyInfo, setPenaltyInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPenaltyInfo();
  }, []);

  const loadPenaltyInfo = async () => {
    try {
      const response = await api.get(`/pools/${pool.id}/penalty-status`);
      setPenaltyInfo(response);
    } catch (error) {
      console.error('Failed to load penalty info:', error);
    }
  };

  const calculatePenalty = () => {
    if (!penaltyInfo?.penaltyEnabled || !penaltyInfo?.penaltyActive) return 0;
    
    const amount = parseFloat(withdrawAmount) || 0;
    const targetDate = new Date(pool.trip_date);
    const currentDate = new Date();
    
    if (currentDate < targetDate) {
      return Math.round(amount * 100 * (penaltyInfo.penaltyPercentage / 100));
    }
    return 0;
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid withdrawal amount');
      return;
    }

    const amountCents = Math.round(parseFloat(withdrawAmount) * 100);
    const penaltyCents = calculatePenalty();
    const netAmountCents = amountCents - penaltyCents;

    const confirmMessage = penaltyCents > 0 
      ? `Withdraw $${withdrawAmount}?\n\nEarly withdrawal penalty: $${(penaltyCents/100).toFixed(2)} (${penaltyInfo.penaltyPercentage}%)\nYou'll receive: $${(netAmountCents/100).toFixed(2)}\n\nPenalty funds are forfeited and cannot be recovered.`
      : `Withdraw $${withdrawAmount}?\n\nNo penalty applies - withdrawal after target date.`;

    Alert.alert('Confirm Withdrawal', confirmMessage, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Withdraw', 
        style: penaltyCents > 0 ? 'destructive' : 'default',
        onPress: processWithdrawal 
      }
    ]);
  };

  const processWithdrawal = async () => {
    setLoading(true);
    try {
      const amountCents = Math.round(parseFloat(withdrawAmount) * 100);
      
      const response = await api.post(`/pools/${pool.id}/withdraw`, {
        userId: user.id,
        amountCents,
        reason: reason.trim() || 'User withdrawal'
      });

      Alert.alert('Withdrawal Requested', response.message, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);

    } catch (error) {
      console.error('Withdrawal error:', error);
      Alert.alert('Error', 'Failed to process withdrawal request');
    } finally {
      setLoading(false);
    }
  };

  const penaltyCents = calculatePenalty();
  const netAmount = parseFloat(withdrawAmount) - (penaltyCents / 100);
  const isEarlyWithdrawal = penaltyCents > 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Withdraw Funds</Text>
        <Text style={styles.poolName}>{pool.name}</Text>
      </View>

      {/* Penalty Status */}
      {penaltyInfo?.penaltyEnabled && (
        <View style={[styles.card, { backgroundColor: isEarlyWithdrawal ? colors.red + '15' : colors.green + '15' }]}>
          <Text style={styles.cardTitle}>
            {isEarlyWithdrawal ? '⚠️ Early Withdrawal Penalty' : '✅ No Penalty Period'}
          </Text>
          <Text style={styles.cardText}>
            {isEarlyWithdrawal 
              ? `Withdrawing before ${new Date(pool.trip_date).toLocaleDateString()} incurs a ${penaltyInfo.penaltyPercentage}% penalty`
              : `No penalty - withdrawing after target date of ${new Date(pool.trip_date).toLocaleDateString()}`}
          </Text>
          
          {penaltyInfo.poolType === 'group' && penaltyInfo.requiresConsensus && (
            <Text style={[styles.cardText, { marginTop: 8, fontStyle: 'italic' }]}>
              All {penaltyInfo.totalMembers} group members agreed to penalty system
            </Text>
          )}
        </View>
      )}

      {/* Withdrawal Amount */}
      <View style={styles.card}>
        <Text style={styles.label}>Withdrawal Amount ($)</Text>
        <TextInput
          value={withdrawAmount}
          onChangeText={setWithdrawAmount}
          keyboardType="numeric"
          style={styles.input}
          placeholder="0.00"
        />
      </View>

      {/* Penalty Calculation */}
      {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Withdrawal Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Requested Amount:</Text>
            <Text style={styles.summaryValue}>${parseFloat(withdrawAmount).toFixed(2)}</Text>
          </View>
          
          {penaltyCents > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.red }]}>
                Penalty ({penaltyInfo.penaltyPercentage}%):
              </Text>
              <Text style={[styles.summaryValue, { color: colors.red }]}>
                -${(penaltyCents/100).toFixed(2)}
              </Text>
            </View>
          )}
          
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>You'll Receive:</Text>
            <Text style={styles.summaryTotalValue}>
              ${Math.max(0, netAmount).toFixed(2)}
            </Text>
          </View>
          
          {penaltyCents > 0 && (
            <Text style={styles.penaltyWarning}>
              ⚠️ Penalty funds are forfeited and cannot be recovered
            </Text>
          )}
        </View>
      )}

      {/* Reason (Optional) */}
      <View style={styles.card}>
        <Text style={styles.label}>Reason (Optional)</Text>
        <TextInput
          value={reason}
          onChangeText={setReason}
          style={[styles.input, { height: 80 }]}
          placeholder="Why are you withdrawing funds?"
          multiline
          textAlignVertical="top"
        />
      </View>

      {/* Withdraw Button */}
      <TouchableOpacity
        style={[
          styles.withdrawButton,
          { backgroundColor: isEarlyWithdrawal ? colors.red : colors.primary }
        ]}
        onPress={handleWithdraw}
        disabled={loading || !withdrawAmount}
      >
        <Text style={styles.withdrawButtonText}>
          {loading ? 'Processing...' : isEarlyWithdrawal ? 'Withdraw with Penalty' : 'Withdraw Funds'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  poolName: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.white,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: colors.text,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    marginTop: 8,
    paddingTop: 8,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.green,
  },
  penaltyWarning: {
    fontSize: 12,
    color: colors.red,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  withdrawButton: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  withdrawButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
});
