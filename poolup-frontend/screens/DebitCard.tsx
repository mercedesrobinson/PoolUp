import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, FlatList } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import bankingService from '../services/banking';
import { ScreenProps } from '../types/navigation';
import { DebitCard as DebitCardType, User } from '../types/api';

interface Transaction {
  id: string | number;
  merchant: string;
  amount_cents: number;
  cashback_cents: number;
  points_earned: number;
  category: string;
  created_at: string;
}

interface CategoryBreakdown {
  category: string;
  total_spent: number;
  total_cashback: number;
}

interface SpendingInsights {
  categoryBreakdown: CategoryBreakdown[];
}

interface TravelPerks {
  travel_credits?: number;
  lounge_access?: boolean;
  cashbackMultiplier?: number;
  specialOffers?: string[];
  bonusPoints?: number;
}

interface BankAccount {
  name: string;
  subtype: string;
  type: string;
}

interface CardWithStats extends DebitCardType {
  cardNumber?: string;
  card_holder_name?: string;
  expiry_date?: string;
  is_active?: boolean;
  spending_limit_cents?: number;
  stats?: {
    total_cashback_cents: number;
    total_points_earned: number;
  };
}

interface TransactionItemProps {
  transaction: Transaction;
}

function TransactionItem({ transaction }: TransactionItemProps): JSX.Element {
  const isPositive = transaction.cashback_cents > 0;
  return (
    <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius, marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>{transaction.merchant}</Text>
          <Text style={{ fontSize: 14, color: '#666', marginTop: 2 }}>
            {new Date(transaction.created_at).toLocaleDateString()}
          </Text>
          <Text style={{ fontSize: 12, color: colors.blue, marginTop: 2, textTransform: 'capitalize' }}>
            {transaction.category}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
            -${(transaction.amount_cents / 100).toFixed(2)}
          </Text>
          {isPositive && (
            <Text style={{ fontSize: 14, color: colors.green, marginTop: 2 }}>
              +${(transaction.cashback_cents / 100).toFixed(2)} cashback
            </Text>
          )}
          {transaction.points_earned > 0 && (
            <Text style={{ fontSize: 12, color: colors.purple, marginTop: 2 }}>
              +{transaction.points_earned} pts
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

interface SpendingChartProps {
  insights: SpendingInsights;
}

function SpendingChart({ insights }: SpendingChartProps): JSX.Element | null {
  if (!insights || !insights.categoryBreakdown || insights.categoryBreakdown.length === 0) {
    return null;
  }
  const maxSpent = Math.max(...insights.categoryBreakdown.map(c => c.total_spent));
  
  return (
    <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius, marginBottom: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
        📊 Spending by Category
      </Text>
      {insights.categoryBreakdown.map((category, index) => (
        <View key={index} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, textTransform: 'capitalize' }}>
              {category.category}
            </Text>
            <Text style={{ fontSize: 14, color: '#666' }}>
              ${(category.total_spent / 100).toFixed(2)}
            </Text>
          </View>
          <View style={{ height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
            <View style={{ 
              width: `${(category.total_spent / maxSpent) * 100}%`, 
              backgroundColor: colors.blue, 
              height: '100%' 
            }} />
          </View>
          <Text style={{ fontSize: 12, color: colors.green, marginTop: 2 }}>
            ${(category.total_cashback / 100).toFixed(2)} cashback earned
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function DebitCard({ navigation, route }: ScreenProps<'DebitCard'>): JSX.Element {
  const { user, card: initialCard } = route.params;
  const [card, setCard] = useState<CardWithStats | null>(initialCard);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [insights, setInsights] = useState<SpendingInsights | null>(null);
  const [perks, setPerks] = useState<TravelPerks | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isConnectingBank, setIsConnectingBank] = useState<boolean>(false);

  const loadData = async (): Promise<void> => {
    try {
      // Set mock data immediately to prevent loading issues
      const mockCard: CardWithStats = {
        id: 'card_123',
        user_id: user.id,
        last_four: '4242',
        balance_cents: 125000,
        status: 'active',
        created_at: new Date().toISOString(),
        cardNumber: '**** **** **** 4242',
        card_holder_name: user.name,
        expiry_date: '12/28',
        is_active: true,
        spending_limit_cents: 500000,
        stats: {
          total_cashback_cents: 2500,
          total_points_earned: 1250
        }
      };
      
      const mockTransactions: Transaction[] = [
        {
          id: 1,
          merchant: 'Starbucks',
          amount_cents: 650,
          cashback_cents: 32,
          points_earned: 13,
          category: 'dining',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          merchant: 'Uber',
          amount_cents: 1250,
          cashback_cents: 0,
          points_earned: 25,
          category: 'transportation',
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      
      const mockInsights: SpendingInsights = {
        categoryBreakdown: [
          { category: 'dining', total_spent: 15000, total_cashback: 750 },
          { category: 'transportation', total_spent: 8500, total_cashback: 0 },
          { category: 'shopping', total_spent: 12000, total_cashback: 600 }
        ]
      };
      
      setCard(mockCard);
      setTransactions(mockTransactions);
      setInsights(mockInsights);
      setPerks({ 
        travel_credits: 5000, 
        lounge_access: true,
        cashbackMultiplier: 2,
        specialOffers: ['Free airport lounge access', '2x points on travel'],
        bonusPoints: 500
      });
      setBankAccounts([]);
      
      console.log('DebitCard loaded with mock data');
    } catch (error) {
      console.error('Failed to load card data:', error);
    }
  };

  const toggleCard = async (): Promise<void> => {
    if (!card) return;
    
    try {
      const result = await api.toggleCardStatus(card.id, user.id);
      setCard({ ...card, is_active: result.status === 'active' });
      Alert.alert(
        result.status === 'active' ? 'Card Activated' : 'Card Frozen',
        result.status === 'active' ? 'Your card is now active' : 'Your card has been frozen for security'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update card status');
    }
  };

  const connectBankAccount = async (): Promise<void> => {
    try {
      setIsConnectingBank(true);
      const linkToken = await bankingService.initializePlaidLink();
      
      // In a real app, you would use Plaid Link SDK here
      // For now, we'll simulate the connection
      Alert.alert(
        'Bank Connection',
        'In a real app, Plaid Link would open here to connect your bank account securely.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Simulate Connection', 
            onPress: async () => {
              try {
                // Simulate successful bank connection
                await new Promise(resolve => setTimeout(resolve, 2000));
                Alert.alert('Success!', 'Bank account connected successfully! 🎉');
                loadData();
              } catch (error) {
                Alert.alert('Error', 'Failed to connect bank account');
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Connection Error', (error as Error).message || 'Failed to initialize bank connection');
    } finally {
      setIsConnectingBank(false);
    }
  };

  const simulateTransaction = async (): Promise<void> => {
    if (!card) return;
    
    const merchants = ['Starbucks', 'Uber', 'Amazon', 'Target', 'Gas Station', 'Restaurant'];
    const categories = ['food', 'transport', 'shopping', 'travel', 'general'];
    const merchant = merchants[Math.floor(Math.random() * merchants.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const amount = Math.floor(Math.random() * 5000) + 500; // $5-$55

    try {
      await api.processCardTransaction(card.id, amount, merchant, category);
      Alert.alert('Transaction Processed!', `$${(amount/100).toFixed(2)} at ${merchant} with cashback earned! 💰`);
      loadData(); // Refresh data
    } catch (error) {
      Alert.alert('Transaction Failed', (error as Error).message || 'Insufficient funds or card inactive');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!card) return <View style={{ flex: 1, backgroundColor: '#FAFCFF' }} />;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FAFCFF' }}>
      {/* Header */}
      <View style={{ backgroundColor: colors.primary, paddingTop: 80, paddingBottom: 20, paddingHorizontal: 24 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
          <Text style={{ color: 'white', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: 'white', fontSize: 24, fontWeight: '700' }}>PoolUp Card</Text>
      </View>
      
      {/* Card Display */}
      <View style={{ padding: 24, paddingTop: 16 }}>
        <View style={{ 
          backgroundColor: colors.purple, 
          padding: 20, 
          borderRadius: 16, 
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4
        }}>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
            PoolUp Debit Card
          </Text>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: '800', letterSpacing: 2, marginBottom: 16 }}>
            {card.cardNumber || `**** **** **** ${card.last_four}`}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 4 }}>
                CARDHOLDER
              </Text>
              <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                {card.card_holder_name || user.name}
              </Text>
            </View>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 4 }}>
                EXPIRES
              </Text>
              <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                {card.expiry_date || '12/28'}
              </Text>
            </View>
          </View>
        </View>

        {/* Card Stats */}
        {card.stats && (
          <View style={{ flexDirection: 'row', marginBottom: 16 }}>
            <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius, flex: 1, marginRight: 8 }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: colors.green, textAlign: 'center' }}>
                ${(card.stats.total_cashback_cents / 100).toFixed(2)}
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'center', marginTop: 4 }}>
                Total Cashback
              </Text>
            </View>
            <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius, flex: 1, marginLeft: 8 }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: colors.purple, textAlign: 'center' }}>
                {card.stats.total_points_earned}
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'center', marginTop: 4 }}>
                Points Earned
              </Text>
            </View>
          </View>
        )}

        {/* Travel Perks */}
        {perks && (
          <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius, marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
              ✈️ Travel Perks
            </Text>
            {perks.cashbackMultiplier && (
              <Text style={{ fontSize: 16, color: colors.green, fontWeight: '600', marginBottom: 8 }}>
                {perks.cashbackMultiplier}x Cashback Multiplier
              </Text>
            )}
            {perks.specialOffers?.map((offer, index) => (
              <Text key={index} style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
                • {offer}
              </Text>
            ))}
            {perks.bonusPoints && perks.bonusPoints > 0 && (
              <Text style={{ fontSize: 14, color: colors.purple, marginTop: 8 }}>
                🎁 Bonus: {perks.bonusPoints} points available
              </Text>
            )}
          </View>
        )}

        {/* Bank Account Connection */}
        <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius, marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
            🏦 Connected Bank Accounts
          </Text>
          {bankAccounts.length > 0 ? (
            bankAccounts.map((account, index) => (
              <View key={index} style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: 12,
                backgroundColor: '#f8f9fa',
                borderRadius: 8,
                marginBottom: 8
              }}>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                    {account.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#666', textTransform: 'capitalize' }}>
                    {account.subtype} • {account.type}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: colors.green, fontWeight: '600' }}>
                  ✓ Connected
                </Text>
              </View>
            ))
          ) : (
            <TouchableOpacity 
              onPress={connectBankAccount}
              disabled={isConnectingBank}
              style={{ 
                backgroundColor: colors.blue, 
                padding: 12, 
                borderRadius: radius,
                opacity: isConnectingBank ? 0.7 : 1
              }}
            >
              <Text style={{ color: 'white', fontWeight: '700', textAlign: 'center' }}>
                {isConnectingBank ? '🔄 Connecting...' : '+ Connect Bank Account'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Card Controls */}
        <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius, marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
            Card Controls
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity 
              onPress={toggleCard}
              style={{ 
                backgroundColor: card.is_active ? colors.coral : colors.green, 
                padding: 12, 
                borderRadius: radius, 
                flex: 1 
              }}
            >
              <Text style={{ color: 'white', fontWeight: '700', textAlign: 'center' }}>
                {card.is_active ? '🔒 Freeze Card' : '🔓 Activate Card'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={simulateTransaction}
              style={{ backgroundColor: colors.blue, padding: 12, borderRadius: radius, flex: 1 }}
            >
              <Text style={{ color: 'white', fontWeight: '700', textAlign: 'center' }}>
                💳 Test Purchase
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Spending Insights */}
        {insights && insights.categoryBreakdown.length > 0 && (
          <SpendingChart insights={insights} />
        )}

        {/* Recent Transactions */}
        <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
            Recent Transactions
          </Text>
          {transactions.length > 0 ? (
            <FlatList
              data={transactions}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => <TransactionItem transaction={item} />}
              scrollEnabled={false}
            />
          ) : (
            <Text style={{ color: '#666', textAlign: 'center', padding: 20 }}>
              No transactions yet. Start using your card to earn cashback! 💳
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
