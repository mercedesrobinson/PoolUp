import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { api } from '../services/api';

const colors = {
  background: '#1a1a2e',
  primary: '#16213e',
  secondary: '#0f3460',
  accent: '#e94560',
  text: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.7)',
  success: '#28a745',
  warning: '#ffc107',
};

interface Expense {
  id: string;
  description: string;
  amount_cents: number;
  paid_by: string;
  paid_by_name: string;
  split_between: string[];
  created_at: string;
  pool_id: string;
}

interface ExpenseSplittingProps {
  navigation: any;
  route: any;
}

const ExpenseSplitting: React.FC<ExpenseSplittingProps> = ({ navigation, route }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [poolMembers, setPoolMembers] = useState<any[]>([]);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    paidBy: '',
    splitBetween: [] as string[],
  });

  const poolId = route.params?.poolId || '1';
  const userId = route.params?.userId || '1756612920173';

  useEffect(() => {
    loadExpenses();
    loadPoolMembers();
  }, []);

  const loadExpenses = async () => {
    try {
      // Mock expenses data for now
      const mockExpenses: Expense[] = [
        {
          id: '1',
          description: 'Hotel booking',
          amount_cents: 24000,
          paid_by: userId,
          paid_by_name: 'You',
          split_between: [userId, '2', '3'],
          created_at: '2024-01-15',
          pool_id: poolId,
        },
        {
          id: '2',
          description: 'Dinner at restaurant',
          amount_cents: 8500,
          paid_by: '2',
          paid_by_name: 'Sarah',
          split_between: [userId, '2'],
          created_at: '2024-01-16',
          pool_id: poolId,
        },
      ];
      setExpenses(mockExpenses);
    } catch (error) {
      console.log('Load expenses error:', error);
    }
  };

  const loadPoolMembers = async () => {
    try {
      const members = await api.getPoolMembers(poolId);
      setPoolMembers([
        { id: userId, name: 'You' },
        { id: '2', name: 'Sarah Chen' },
        { id: '3', name: 'Mike Rodriguez' },
      ]);
    } catch (error) {
      console.log('Load members error:', error);
    }
  };

  const addExpense = async () => {
    if (!newExpense.description.trim() || !newExpense.amount || !newExpense.paidBy) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (newExpense.splitBetween.length === 0) {
      Alert.alert('Error', 'Please select who to split the expense with');
      return;
    }

    try {
      const expense: Expense = {
        id: Date.now().toString(),
        description: newExpense.description,
        amount_cents: Math.round(parseFloat(newExpense.amount) * 100),
        paid_by: newExpense.paidBy,
        paid_by_name: poolMembers.find(m => m.id === newExpense.paidBy)?.name || 'Unknown',
        split_between: newExpense.splitBetween,
        created_at: new Date().toISOString(),
        pool_id: poolId,
      };

      setExpenses([expense, ...expenses]);
      setShowAddModal(false);
      setNewExpense({ description: '', amount: '', paidBy: '', splitBetween: [] });
      Alert.alert('Success', 'Expense added!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add expense');
    }
  };

  const toggleSplitMember = (memberId: string) => {
    const splitBetween = [...newExpense.splitBetween];
    const index = splitBetween.indexOf(memberId);
    
    if (index > -1) {
      splitBetween.splice(index, 1);
    } else {
      splitBetween.push(memberId);
    }
    
    setNewExpense({ ...newExpense, splitBetween });
  };

  const calculateBalance = () => {
    const balances: { [key: string]: number } = {};
    
    // Initialize balances
    poolMembers.forEach(member => {
      balances[member.id] = 0;
    });

    // Calculate what each person owes/is owed
    expenses.forEach(expense => {
      const amountPerPerson = expense.amount_cents / expense.split_between.length;
      
      // Person who paid gets credited
      balances[expense.paid_by] += expense.amount_cents;
      
      // Everyone who should pay gets debited
      expense.split_between.forEach(memberId => {
        balances[memberId] -= amountPerPerson;
      });
    });

    return balances;
  };

  const renderExpense = ({ item }: { item: Expense }) => {
    const amountDollars = item.amount_cents / 100;
    const amountPerPerson = amountDollars / item.split_between.length;

    return (
      <View style={styles.expenseCard}>
        <View style={styles.expenseHeader}>
          <Text style={styles.expenseDescription}>{item.description}</Text>
          <Text style={styles.expenseAmount}>${amountDollars.toFixed(2)}</Text>
        </View>
        <Text style={styles.expenseDetails}>
          Paid by {item.paid_by_name} • ${amountPerPerson.toFixed(2)} per person
        </Text>
        <Text style={styles.expenseDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
    );
  };

  const balances = calculateBalance();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Expense Splitting</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Text style={styles.addButton}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Balances Summary */}
      <View style={styles.balancesSection}>
        <Text style={styles.sectionTitle}>Balances</Text>
        {poolMembers.map(member => {
          const balance = balances[member.id] / 100;
          const isPositive = balance > 0;
          const isZero = Math.abs(balance) < 0.01;
          
          return (
            <View key={member.id} style={styles.balanceItem}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={[
                styles.balanceAmount,
                isZero ? styles.balanceZero : isPositive ? styles.balancePositive : styles.balanceNegative
              ]}>
                {isZero ? 'Settled' : `${isPositive ? '+' : ''}$${balance.toFixed(2)}`}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Expenses List */}
      <View style={styles.expensesSection}>
        <Text style={styles.sectionTitle}>Recent Expenses</Text>
        <FlatList
          data={expenses}
          renderItem={renderExpense}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No expenses yet</Text>
              <Text style={styles.emptySubtext}>
                Add shared expenses to split costs with your group
              </Text>
            </View>
          }
        />
      </View>

      {/* Add Expense Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Expense</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Description (e.g., Dinner, Hotel)"
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={newExpense.description}
              onChangeText={(text) => setNewExpense({...newExpense, description: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Amount ($)"
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={newExpense.amount}
              onChangeText={(text) => setNewExpense({...newExpense, amount: text})}
              keyboardType="numeric"
            />

            <Text style={styles.fieldLabel}>Who paid?</Text>
            <ScrollView horizontal style={styles.memberSelector}>
              {poolMembers.map(member => (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    styles.memberChip,
                    newExpense.paidBy === member.id && styles.memberChipSelected
                  ]}
                  onPress={() => setNewExpense({...newExpense, paidBy: member.id})}
                >
                  <Text style={[
                    styles.memberChipText,
                    newExpense.paidBy === member.id && styles.memberChipTextSelected
                  ]}>
                    {member.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Split between:</Text>
            <ScrollView horizontal style={styles.memberSelector}>
              {poolMembers.map(member => (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    styles.memberChip,
                    newExpense.splitBetween.includes(member.id) && styles.memberChipSelected
                  ]}
                  onPress={() => toggleSplitMember(member.id)}
                >
                  <Text style={[
                    styles.memberChipText,
                    newExpense.splitBetween.includes(member.id) && styles.memberChipTextSelected
                  ]}>
                    {member.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddModal(false);
                  setNewExpense({ description: '', amount: '', paidBy: '', splitBetween: [] });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={addExpense}
              >
                <Text style={styles.saveButtonText}>Add Expense</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  balancesSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  balanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  memberName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  balancePositive: {
    color: colors.success,
  },
  balanceNegative: {
    color: colors.accent,
  },
  balanceZero: {
    color: colors.textSecondary,
  },
  expensesSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  expenseCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expenseDescription: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  expenseAmount: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  expenseDetails: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  expenseDate: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: 'white',
    fontSize: 16,
    marginBottom: 16,
  },
  fieldLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  memberSelector: {
    marginBottom: 16,
  },
  memberChip: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  memberChipSelected: {
    backgroundColor: colors.accent,
  },
  memberChipText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  memberChipTextSelected: {
    color: 'white',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ExpenseSplitting;
