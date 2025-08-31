import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import MoneyApi from '../services/moneyApi';

const Transfer = ({ navigation, route }) => {
  const { type, accounts, poolupAccount, limits } = route.params;
  
  const [amount, setAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');

  useEffect(() => {
    // Set default account selection
    if (accounts && accounts.length > 0) {
      const primaryAccount = accounts.find(acc => acc.is_primary);
      setSelectedAccount(primaryAccount?.account_id || accounts[0]?.account_id || '');
    }
  }, [accounts]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value || 0);
  };

  const validateAmount = () => {
    const numAmount = parseFloat(amount);
    
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than $0');
      return false;
    }

    if (numAmount < 1) {
      Alert.alert('Minimum Amount', 'Minimum transfer amount is $1.00');
      return false;
    }

    // Check daily limits
    if (limits && numAmount > parseFloat(limits.daily.remaining)) {
      Alert.alert(
        'Daily Limit Exceeded',
        `You can only transfer ${formatCurrency(limits.daily.remaining)} more today.`
      );
      return false;
    }

    // Check monthly limits
    if (limits && numAmount > parseFloat(limits.monthly.remaining)) {
      Alert.alert(
        'Monthly Limit Exceeded',
        `You can only transfer ${formatCurrency(limits.monthly.remaining)} more this month.`
      );
      return false;
    }

    // Check sufficient balance for withdrawals
    if (type === 'withdrawal' && poolupAccount) {
      const availableBalance = parseFloat(poolupAccount.balance);
      const fee = parseFloat(limits?.processing_fee || 0.25);
      const totalRequired = numAmount + fee;
      
      if (totalRequired > availableBalance) {
        Alert.alert(
          'Insufficient Balance',
          `You need ${formatCurrency(totalRequired)} (including ${formatCurrency(fee)} fee) but only have ${formatCurrency(availableBalance)} available.`
        );
        return false;
      }
    }

    return true;
  };

  const handleTransfer = async () => {
    if (!validateAmount()) return;
    
    if (!selectedAccount) {
      Alert.alert('Account Required', 'Please select a bank account');
      return;
    }

    const transferData = {
      amount: parseFloat(amount),
      transfer_type: type,
      scheduled_date: scheduledDate || undefined,
    };

    if (type === 'deposit') {
      transferData.from_account_id = selectedAccount;
      transferData.to_account_id = poolupAccount?.account_number;
    } else {
      transferData.from_account_id = poolupAccount?.account_number;
      transferData.to_account_id = selectedAccount;
    }

    try {
      setLoading(true);
      
      const response = await MoneyApi.createTransfer(transferData);
      
      Alert.alert(
        'Transfer Initiated',
        `Your ${type} of ${formatCurrency(amount)} has been initiated. Transfer ID: ${response.transfer_id}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
      
    } catch (error) {
      console.error('Transfer error:', error);
      Alert.alert('Transfer Failed', error.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedAccountInfo = () => {
    return accounts?.find(acc => acc.account_id === selectedAccount);
  };

  const calculateFee = () => {
    if (type === 'withdrawal') {
      return parseFloat(limits?.processing_fee || 0.25);
    }
    return 0;
  };

  const calculateTotal = () => {
    const numAmount = parseFloat(amount) || 0;
    const fee = calculateFee();
    return numAmount + fee;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {type === 'deposit' ? 'Deposit Money' : 'Withdraw Money'}
          </Text>
        </View>

        {/* Transfer Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Transfer Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Type:</Text>
            <Text style={styles.summaryValue}>
              {type === 'deposit' ? '💸 Deposit' : '🏦 Withdrawal'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>From:</Text>
            <Text style={styles.summaryValue}>
              {type === 'deposit' ? 'Bank Account' : 'PoolUp Account'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>To:</Text>
            <Text style={styles.summaryValue}>
              {type === 'deposit' ? 'PoolUp Account' : 'Bank Account'}
            </Text>
          </View>
        </View>

        {/* Amount Input */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Amount</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              maxLength={10}
            />
          </View>
          
          {/* Quick Amount Buttons */}
          <View style={styles.quickAmounts}>
            {['25', '50', '100', '250'].map((quickAmount) => (
              <TouchableOpacity
                key={quickAmount}
                style={styles.quickAmountButton}
                onPress={() => setAmount(quickAmount)}
              >
                <Text style={styles.quickAmountText}>${quickAmount}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Account Selection */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>
            {type === 'deposit' ? 'From Bank Account' : 'To Bank Account'}
          </Text>
          
          {accounts && accounts.length > 0 ? (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedAccount}
                onValueChange={setSelectedAccount}
                style={styles.picker}
              >
                {accounts.map((account) => (
                  <Picker.Item
                    key={account.account_id}
                    label={`${account.account_name} (••••${account.mask})`}
                    value={account.account_id}
                  />
                ))}
              </Picker>
            </View>
          ) : (
            <Text style={styles.noAccountsText}>No bank accounts linked</Text>
          )}
          
          {/* Selected Account Info */}
          {getSelectedAccountInfo() && (
            <View style={styles.accountInfo}>
              <Text style={styles.accountInfoText}>
                {getSelectedAccountInfo().institution_name}
              </Text>
              <Text style={styles.accountBalance}>
                Available: {formatCurrency(getSelectedAccountInfo().available_balance)}
              </Text>
            </View>
          )}
        </View>

        {/* Fee Information */}
        {calculateFee() > 0 && (
          <View style={styles.feeCard}>
            <Text style={styles.feeTitle}>Fee Information</Text>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Processing Fee:</Text>
              <Text style={styles.feeAmount}>{formatCurrency(calculateFee())}</Text>
            </View>
            <View style={styles.feeRow}>
              <Text style={styles.feeTotalLabel}>Total Amount:</Text>
              <Text style={styles.feeTotalAmount}>{formatCurrency(calculateTotal())}</Text>
            </View>
          </View>
        )}

        {/* Limits Information */}
        {limits && (
          <View style={styles.limitsCard}>
            <Text style={styles.limitsTitle}>Transfer Limits</Text>
            <View style={styles.limitRow}>
              <Text style={styles.limitLabel}>Daily Remaining:</Text>
              <Text style={styles.limitAmount}>
                {formatCurrency(limits.daily.remaining)}
              </Text>
            </View>
            <View style={styles.limitRow}>
              <Text style={styles.limitLabel}>Monthly Remaining:</Text>
              <Text style={styles.limitAmount}>
                {formatCurrency(limits.monthly.remaining)}
              </Text>
            </View>
          </View>
        )}

        {/* Current Balance */}
        {poolupAccount && (
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Current PoolUp Balance</Text>
            <Text style={styles.balanceAmount}>
              {formatCurrency(poolupAccount.balance)}
            </Text>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!amount || !selectedAccount || loading) && styles.submitButtonDisabled
          ]}
          onPress={handleTransfer}
          disabled={!amount || !selectedAccount || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              {type === 'deposit' ? 'Deposit' : 'Withdraw'} {amount ? formatCurrency(amount) : ''}
            </Text>
          )}
        </TouchableOpacity>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            • Transfers typically take 1-3 business days to complete
            {type === 'withdrawal' && `\n• A ${formatCurrency(calculateFee())} processing fee applies to withdrawals`}
            • You can cancel pending transfers before they are processed
          </Text>
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 15,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 10,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  quickAmountButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  noAccountsText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  accountInfo: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  accountInfoText: {
    fontSize: 14,
    color: '#666666',
  },
  accountBalance: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginTop: 2,
  },
  feeCard: {
    backgroundColor: '#FFF3CD',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  feeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 10,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  feeLabel: {
    fontSize: 14,
    color: '#856404',
  },
  feeAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
  },
  feeTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
  },
  feeTotalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
  },
  limitsCard: {
    backgroundColor: '#E3F2FD',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 15,
  },
  limitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 10,
  },
  limitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  limitLabel: {
    fontSize: 14,
    color: '#1976D2',
  },
  limitAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
  },
  balanceCard: {
    backgroundColor: '#E8F5E8',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#2E7D32',
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  disclaimer: {
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 18,
  },
});

export default Transfer;
