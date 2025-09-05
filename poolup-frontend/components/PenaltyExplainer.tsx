import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { colors, radius } from '../theme';

interface PenaltyExplainerProps {
  visible: boolean;
  onClose: () => void;
}

export const PenaltyExplainer: React.FC<PenaltyExplainerProps> = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          backgroundColor: 'white',
          borderBottomWidth: 1,
          borderBottomColor: '#e9ecef',
        }}>
          <TouchableOpacity
            onPress={onClose}
            style={{ padding: 8, marginRight: 12 }}
          >
            <Text style={{ fontSize: 18 }}>✕</Text>
          </TouchableOpacity>
          <Text style={{
            fontSize: 20,
            fontWeight: '700',
            color: '#333',
            flex: 1,
          }}>
            Understanding Penalties
          </Text>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {/* Early Withdrawal Penalty */}
          <View style={{
            backgroundColor: 'white',
            padding: 16,
            borderRadius: radius.medium,
            marginBottom: 16,
            borderLeftWidth: 4,
            borderLeftColor: '#ffc107',
          }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 }}>
              🚫 Early Withdrawal Penalty
            </Text>
            <Text style={{ fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 12 }}>
              <Text style={{ fontWeight: '600' }}>When:</Text> You take money out BEFORE reaching your goal or target date
            </Text>
            <Text style={{ fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 12 }}>
              <Text style={{ fontWeight: '600' }}>Purpose:</Text> Keeps you committed to your savings goal
            </Text>
            <Text style={{ fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 12 }}>
              <Text style={{ fontWeight: '600' }}>Set during:</Text> Pool/goal creation
            </Text>
            <View style={{ backgroundColor: '#fff3cd', padding: 12, borderRadius: radius.medium }}>
              <Text style={{ fontSize: 13, color: '#856404', fontWeight: '500' }}>
                Example: You're saving $5,000 for a vacation by December. If you withdraw $1,000 in October, you pay a 5% penalty ($50).
              </Text>
            </View>
          </View>

          {/* Missed Payment Penalty */}
          <View style={{
            backgroundColor: 'white',
            padding: 16,
            borderRadius: radius.medium,
            marginBottom: 16,
            borderLeftWidth: 4,
            borderLeftColor: '#dc3545',
          }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 }}>
              📅 Missed Payment Penalty
            </Text>
            <Text style={{ fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 12 }}>
              <Text style={{ fontWeight: '600' }}>When:</Text> You skip or miss your scheduled contribution
            </Text>
            <Text style={{ fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 12 }}>
              <Text style={{ fontWeight: '600' }}>Purpose:</Text> Encourages consistent saving habits
            </Text>
            <Text style={{ fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 12 }}>
              <Text style={{ fontWeight: '600' }}>Set in:</Text> Settings → Penalty Settings
            </Text>
            <View style={{ backgroundColor: '#f8d7da', padding: 12, borderRadius: radius.medium }}>
              <Text style={{ fontSize: 13, color: '#721c24', fontWeight: '500' }}>
                Example: You're supposed to contribute $100 weekly. If you miss a week, you pay a $10 penalty or 5% of the missed amount.
              </Text>
            </View>
          </View>

          {/* Savings Type Differences */}
          <View style={{
            backgroundColor: 'white',
            padding: 16,
            borderRadius: radius.medium,
            marginBottom: 16,
          }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 16 }}>
              💰 Penalty Differences by Savings Type
            </Text>

            {/* Solo Goals */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.primary, marginBottom: 8 }}>
                🎯 Solo Goals
              </Text>
              <Text style={{ fontSize: 14, color: '#666', lineHeight: 20 }}>
                • You decide all penalty settings yourself{'\n'}
                • Penalties help with self-discipline{'\n'}
                • No need for group agreement{'\n'}
                • Can change settings anytime
              </Text>
            </View>

            {/* Group Pools */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.secondary, marginBottom: 8 }}>
                👥 Group Pools
              </Text>
              <Text style={{ fontSize: 14, color: '#666', lineHeight: 20 }}>
                • Pool creator sets initial penalty rules{'\n'}
                • Members are notified of penalty settings{'\n'}
                • Members can leave if they disagree{'\n'}
                • Creates group accountability{'\n'}
                • Harder to change once established
              </Text>
            </View>

            {/* Penalty Savings */}
            <View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.accent, marginBottom: 8 }}>
                ⚠️ Penalty Savings
              </Text>
              <Text style={{ fontSize: 14, color: '#666', lineHeight: 20 }}>
                • Specifically designed around penalties{'\n'}
                • Higher penalty rates (10-25%){'\n'}
                • Stricter withdrawal rules{'\n'}
                • Maximum accountability mode{'\n'}
                • Best for breaking bad habits
              </Text>
            </View>
          </View>

          {/* Recommendations */}
          <View style={{
            backgroundColor: '#d1ecf1',
            padding: 16,
            borderRadius: radius.medium,
            borderLeftWidth: 4,
            borderLeftColor: '#17a2b8',
          }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#0c5460', marginBottom: 8 }}>
              💡 Our Recommendations
            </Text>
            <Text style={{ fontSize: 14, color: '#0c5460', lineHeight: 20 }}>
              • <Text style={{ fontWeight: '600' }}>New users:</Text> Start with low penalties (2-5%){'\n'}
              • <Text style={{ fontWeight: '600' }}>Group pools:</Text> Let creator set rules, members can opt out{'\n'}
              • <Text style={{ fontWeight: '600' }}>Penalty destination:</Text> Add to pool (earns interest) {'>'}  Charity {'>'}  Forfeit{'\n'}
              • <Text style={{ fontWeight: '600' }}>Serious savers:</Text> Use penalty savings type for maximum accountability
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};
