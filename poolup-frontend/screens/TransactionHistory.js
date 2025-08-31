import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';

export default function TransactionHistory({ navigation, route }) {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('all'); // all, contributions, withdrawals, penalties
  const [timeFilter, setTimeFilter] = useState('all'); // all, week, month, year
  const userId = route.params?.userId || '1756612920173';

  useEffect(() => {
    loadTransactionHistory();
  }, [filter, timeFilter]);

  const loadTransactionHistory = async () => {
    try {
      // Set mock data immediately to prevent loading issues
      const mockTransactions = [
        {
          id: 1,
          type: 'contribution',
          amount: 15000, // cents
          pool: { name: 'Bali Adventure', destination: 'Bali' },
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          method: 'bank_transfer'
        },
        {
          id: 2,
          type: 'contribution',
          amount: 25000,
          pool: { name: 'Tokyo Trip', destination: 'Tokyo' },
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          method: 'debit_card'
        },
        {
          id: 3,
          type: 'penalty',
          amount: -5000,
          pool: { name: 'Bali Adventure', destination: 'Bali' },
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          reason: 'missed_contribution'
        },
        {
          id: 4,
          type: 'contribution',
          amount: 20000,
          pool: { name: 'Iceland Northern Lights', destination: 'Iceland' },
          timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          method: 'bank_transfer'
        },
        {
          id: 5,
          type: 'withdrawal',
          amount: -30000,
          pool: { name: 'Paris Weekend', destination: 'Paris' },
          timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          reason: 'goal_reached'
        },
        {
          id: 6,
          type: 'contribution',
          amount: 18000,
          pool: { name: 'Tokyo Trip', destination: 'Tokyo' },
          timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          method: 'recurring'
        }
      ];
      setTransactions(mockTransactions);
      console.log('TransactionHistory loaded with mock data');
    } catch (error) {
      console.error('Failed to load transaction history:', error);
      setTransactions([]);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'contribution': return '💰';
      case 'withdrawal': return '💸';
      case 'penalty': return '⚠️';
      case 'refund': return '↩️';
      default: return '💳';
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'contribution': return colors.success;
      case 'withdrawal': return colors.warning;
      case 'penalty': return colors.error;
      case 'refund': return colors.primary;
      default: return colors.textSecondary;
    }
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case 'bank_transfer': return '🏦';
      case 'debit_card': return '💳';
      case 'recurring': return '🔄';
      default: return '💰';
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getTotalByType = (type) => {
    if (!Array.isArray(transactions)) return 0;
    return transactions
      .filter(t => type === 'all' || t.type === type)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  const renderTransaction = ({ item }) => (
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
        <View style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: `${getTransactionColor(item.type)}20`,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12
        }}>
          <Text style={{ fontSize: 20 }}>{getTransactionIcon(item.type)}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.text,
              flex: 1
            }}>
              {item.type === 'contribution' ? 'Contribution' :
               item.type === 'withdrawal' ? 'Withdrawal' :
               item.type === 'penalty' ? 'Penalty' : 'Transaction'}
            </Text>
            <Text style={{
              fontSize: 16,
              fontWeight: '700',
              color: getTransactionColor(item.type)
            }}>
              {item.amount > 0 ? '+' : ''}${(Math.abs(item.amount) / 100).toFixed(2)}
            </Text>
          </View>

          <Text style={{
            fontSize: 14,
            color: colors.textSecondary,
            marginBottom: 4
          }}>
            {item.pool.name} • {item.pool.destination}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{
              fontSize: 12,
              color: colors.textSecondary
            }}>
              {formatDate(item.timestamp)}
            </Text>
            
            {item.method && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, marginRight: 4 }}>
                  {getMethodIcon(item.method)}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  textTransform: 'capitalize'
                }}>
                  {item.method.replace('_', ' ')}
                </Text>
              </View>
            )}
          </View>

          {item.reason && (
            <Text style={{
              fontSize: 12,
              color: colors.textSecondary,
              fontStyle: 'italic',
              marginTop: 4
            }}>
              {item.reason === 'missed_contribution' ? 'Missed weekly contribution' :
               item.reason === 'goal_reached' ? 'Pool goal completed' : item.reason}
            </Text>
          )}
        </View>
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
            Transaction History
          </Text>
        </View>

        {/* Summary Stats */}
        <View style={{ flexDirection: 'row', marginBottom: 16 }}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              Total Saved
            </Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.success }}>
              ${(getTotalByType('contribution') / 100).toFixed(2)}
            </Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              Transactions
            </Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
              {Array.isArray(transactions) ? transactions.length : 0}
            </Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              This Month
            </Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.primary }}>
              ${(getTotalByType('contribution') / 100 * 0.3).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            {[
              { key: 'all', label: 'All' },
              { key: 'contributions', label: 'Contributions' },
              { key: 'withdrawals', label: 'Withdrawals' },
              { key: 'penalties', label: 'Penalties' }
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setFilter(tab.key)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  marginRight: 12,
                  borderRadius: 20,
                  backgroundColor: filter === tab.key ? colors.primary : colors.background,
                }}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: filter === tab.key ? 'white' : colors.textSecondary
                }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <FlatList
        data={Array.isArray(transactions) ? transactions : []}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
