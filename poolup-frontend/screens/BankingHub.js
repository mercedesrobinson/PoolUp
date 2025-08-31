import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MoneyApi from '../services/moneyApi';
import PlaidLink from '../components/PlaidLink';

const BankingHub = ({ navigation, route }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [poolupAccount, setPoolupAccount] = useState(null);
  const [userInterest, setUserInterest] = useState(null);
  const [transferLimits, setTransferLimits] = useState(null);
  const [recentTransfers, setRecentTransfers] = useState([]);

  const userId = route.params?.userId || 'guest-user';

  useEffect(() => {
    loadBankingData();
  }, []);

  const loadBankingData = async () => {
    try {
      setLoading(true);
      
      // Load all banking data in parallel
      const [
        accountsResponse,
        interestResponse,
        limitsResponse,
        transfersResponse
      ] = await Promise.allSettled([
        MoneyApi.getLinkedAccounts(),
        MoneyApi.getUserInterest(),
        MoneyApi.getTransferLimits(),
        MoneyApi.getTransferHistory({ limit: 5 })
      ]);

      if (accountsResponse.status === 'fulfilled') {
        setAccounts(accountsResponse.value.bank_accounts || []);
        setPoolupAccount(accountsResponse.value.poolup_account);
      }

      if (interestResponse.status === 'fulfilled') {
        setUserInterest(interestResponse.value.interest_summary);
      }

      if (limitsResponse.status === 'fulfilled') {
        setTransferLimits(limitsResponse.value.limits);
      }

      if (transfersResponse.status === 'fulfilled') {
        setRecentTransfers(transfersResponse.value.transfers || []);
      }

    } catch (error) {
      console.error('Error loading banking data:', error);
      Alert.alert('Error', 'Failed to load banking information');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBankingData();
    setRefreshing(false);
  };

  const handlePlaidSuccess = (response) => {
    Alert.alert('Success', 'Bank account linked successfully!');
    loadBankingData(); // Refresh data
  };

  const handleTransfer = (type) => {
    navigation.navigate('Transfer', { 
      type, 
      accounts, 
      poolupAccount,
      limits: transferLimits 
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading your banking information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Banking Hub</Text>
          <Text style={styles.subtitle}>Manage your money and earn interest</Text>
        </View>

        {/* PoolUp Account Balance */}
        {poolupAccount && (
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>PoolUp Balance</Text>
              <Text style={styles.accountNumber}>••••{poolupAccount.account_number?.slice(-4)}</Text>
            </View>
            <Text style={styles.balanceAmount}>
              {formatCurrency(poolupAccount.balance)}
            </Text>
            {userInterest && (
              <View style={styles.interestInfo}>
                <Text style={styles.interestText}>
                  💰 Earning {userInterest.interest_rate}% APY
                </Text>
                <Text style={styles.interestEarned}>
                  Total Interest: {formatCurrency(userInterest.total_interest_earned)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.depositButton]}
              onPress={() => handleTransfer('deposit')}
            >
              <Text style={styles.actionButtonText}>💸 Deposit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.withdrawButton]}
              onPress={() => handleTransfer('withdrawal')}
            >
              <Text style={styles.actionButtonText}>🏦 Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Linked Bank Accounts */}
        <View style={styles.accountsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Linked Accounts</Text>
            <TouchableOpacity onPress={loadBankingData}>
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>
          
          {accounts.length > 0 ? (
            accounts.map((account) => (
              <View key={account.id} style={styles.accountItem}>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>{account.account_name}</Text>
                  <Text style={styles.institutionName}>{account.institution_name}</Text>
                  <Text style={styles.accountType}>
                    {account.account_type} ••••{account.mask}
                  </Text>
                </View>
                <View style={styles.accountBalance}>
                  <Text style={styles.accountBalanceText}>
                    {formatCurrency(account.available_balance)}
                  </Text>
                  {account.is_primary && (
                    <Text style={styles.primaryBadge}>PRIMARY</Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noAccountsContainer}>
              <Text style={styles.noAccountsText}>No bank accounts linked</Text>
              <PlaidLink
                userId={userId}
                onSuccess={handlePlaidSuccess}
                style={styles.linkAccountButton}
              />
            </View>
          )}
        </View>

        {/* Recent Transfers */}
        {recentTransfers.length > 0 && (
          <View style={styles.transfersCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Recent Transfers</Text>
              <TouchableOpacity onPress={() => navigation.navigate('TransferHistory')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {recentTransfers.map((transfer) => (
              <View key={transfer.id} style={styles.transferItem}>
                <View style={styles.transferInfo}>
                  <Text style={styles.transferType}>
                    {transfer.transfer_type === 'deposit' ? '💸' : '🏦'} {transfer.transfer_type}
                  </Text>
                  <Text style={styles.transferDate}>
                    {formatDate(transfer.created_at)}
                  </Text>
                </View>
                <View style={styles.transferAmount}>
                  <Text style={[
                    styles.transferAmountText,
                    transfer.transfer_type === 'deposit' ? styles.positiveAmount : styles.negativeAmount
                  ]}>
                    {transfer.transfer_type === 'deposit' ? '+' : '-'}{formatCurrency(transfer.amount)}
                  </Text>
                  <Text style={[styles.transferStatus, styles[`status_${transfer.status}`]]}>
                    {transfer.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Transfer Limits Info */}
        {transferLimits && (
          <View style={styles.limitsCard}>
            <Text style={styles.cardTitle}>Transfer Limits</Text>
            <View style={styles.limitItem}>
              <Text style={styles.limitLabel}>Daily Remaining</Text>
              <Text style={styles.limitAmount}>
                {formatCurrency(transferLimits.daily.remaining)} / {formatCurrency(transferLimits.daily.limit)}
              </Text>
            </View>
            <View style={styles.limitItem}>
              <Text style={styles.limitLabel}>Monthly Remaining</Text>
              <Text style={styles.limitAmount}>
                {formatCurrency(transferLimits.monthly.remaining)} / {formatCurrency(transferLimits.monthly.limit)}
              </Text>
            </View>
          </View>
        )}

        {/* Add Account Button */}
        {accounts.length > 0 && (
          <View style={styles.addAccountCard}>
            <PlaidLink
              userId={userId}
              onSuccess={handlePlaidSuccess}
              style={styles.addAccountButton}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 5,
  },
  balanceCard: {
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 20,
    borderRadius: 15,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  accountNumber: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
  },
  interestInfo: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  interestText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  interestEarned: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 5,
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 15,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  depositButton: {
    backgroundColor: '#34C759',
  },
  withdrawButton: {
    backgroundColor: '#FF9500',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  accountsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  refreshText: {
    color: '#007AFF',
    fontSize: 16,
  },
  viewAllText: {
    color: '#007AFF',
    fontSize: 16,
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  institutionName: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  accountType: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  accountBalance: {
    alignItems: 'flex-end',
  },
  accountBalanceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  primaryBadge: {
    fontSize: 10,
    color: '#007AFF',
    fontWeight: 'bold',
    marginTop: 2,
  },
  noAccountsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noAccountsText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
  },
  linkAccountButton: {
    width: '100%',
  },
  transfersCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 15,
  },
  transferItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  transferInfo: {
    flex: 1,
  },
  transferType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    textTransform: 'capitalize',
  },
  transferDate: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  transferAmount: {
    alignItems: 'flex-end',
  },
  transferAmountText: {
    fontSize: 16,
    fontWeight: '600',
  },
  positiveAmount: {
    color: '#34C759',
  },
  negativeAmount: {
    color: '#FF3B30',
  },
  transferStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  status_completed: {
    color: '#34C759',
  },
  status_pending: {
    color: '#FF9500',
  },
  status_failed: {
    color: '#FF3B30',
  },
  limitsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 15,
  },
  limitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  limitLabel: {
    fontSize: 16,
    color: '#333333',
  },
  limitAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  addAccountCard: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  addAccountButton: {
    backgroundColor: '#34C759',
  },
});

export default BankingHub;
