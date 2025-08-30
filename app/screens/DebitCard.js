import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, FlatList } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';

function TransactionItem({ transaction }) {
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

function SpendingChart({ insights }) {
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

export default function DebitCard({ navigation, route }) {
  const { user, card: initialCard } = route.params;
  const [card, setCard] = useState(initialCard);
  const [transactions, setTransactions] = useState([]);
  const [insights, setInsights] = useState(null);
  const [perks, setPerks] = useState(null);

  const loadData = async () => {
    try {
      const [cardData, transactionsData, insightsData, perksData] = await Promise.all([
        api.getDebitCard(user.id),
        api.getCardTransactions(user.id, 20),
        api.getSpendingInsights(user.id, 30),
        api.getTravelPerks(user.id)
      ]);
      setCard(cardData);
      setTransactions(transactionsData);
      setInsights(insightsData);
      setPerks(perksData);
    } catch (error) {
      console.error('Failed to load card data:', error);
    }
  };

  const toggleCard = async () => {
    try {
      const result = await api.toggleCardStatus(card.id, user.id);
      setCard({ ...card, is_active: result.isActive });
      Alert.alert(
        result.isActive ? 'Card Activated' : 'Card Frozen',
        result.isActive ? 'Your card is now active' : 'Your card has been frozen for security'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update card status');
    }
  };

  const simulateTransaction = async () => {
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
      Alert.alert('Transaction Failed', error.message || 'Insufficient funds or card inactive');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!card) return <View style={{ flex: 1, backgroundColor: '#FAFCFF' }} />;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FAFCFF' }}>
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
            {card.cardNumber}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 4 }}>
                CARDHOLDER
              </Text>
              <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                {card.card_holder_name}
              </Text>
            </View>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 4 }}>
                EXPIRES
              </Text>
              <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                {card.expiry_date}
              </Text>
            </View>
          </View>
        </View>

        {/* Card Stats */}
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

        {/* Travel Perks */}
        {perks && (
          <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius, marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
              ✈️ Travel Perks
            </Text>
            <Text style={{ fontSize: 16, color: colors.green, fontWeight: '600', marginBottom: 8 }}>
              {perks.cashbackMultiplier}x Cashback Multiplier
            </Text>
            {perks.specialOffers.map((offer, index) => (
              <Text key={index} style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
                • {offer}
              </Text>
            ))}
            {perks.bonusPoints > 0 && (
              <Text style={{ fontSize: 14, color: colors.purple, marginTop: 8 }}>
                🎁 Bonus: {perks.bonusPoints} points available
              </Text>
            )}
          </View>
        )}

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
              keyExtractor={item => item.id}
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
