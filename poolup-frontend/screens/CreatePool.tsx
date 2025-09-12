import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { GoalCategorySelector } from '../components/GoalCategories';
import CustomCalendar from '../components/CustomCalendar';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { facts } from './utils/consts';

type RootStackParamList = {
  CreatePool: { user: any; poolType?: string };
};

type CreatePoolNavigationProp = StackNavigationProp<RootStackParamList, 'CreatePool'>;
type CreatePoolRouteProp = RouteProp<RootStackParamList, 'CreatePool'>;

interface Props {
  navigation: CreatePoolNavigationProp;
  route: CreatePoolRouteProp;
}

export default function CreatePool({ navigation, route }: Props) {
  const { user } = route?.params || {};
  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }
  const [name, setName] = useState<string>('');
  const [goalCents, setGoalCents] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [tripDate, setTripDate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [calculatorKey, setCalculatorKey] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [enablePenalty, setEnablePenalty] = useState<boolean>(false);
  const [penaltyPercentage, setPenaltyPercentage] = useState<string>('');
  const [poolType, setPoolType] = useState<string>((route.params as any)?.poolType || 'group');
  const [savingPurpose, setSavingPurpose] = useState<string>('');
  const [customPurpose, setCustomPurpose] = useState<string>('');
  const [destinationFact, setDestinationFact] = useState<string>('');
  const [expectedMembers, setExpectedMembers] = useState<string>('1');
  const [enableCalculator, setEnableCalculator] = useState<boolean>(false);

  const getDestinationFact = (dest: string) => {
    const location = dest.toLowerCase().trim();

    // Check for exact matches first
    for (const [key, fact] of Object.entries(facts)) {
      if (location.includes(key)) {
        return fact;
      }
    }

    return facts.default;
  };

  const calculateMonthlySavings = () => {
    const goalAmount = parseFloat(goalCents) || 0;
    const members = poolType === 'solo' ? 1 : parseInt(expectedMembers) || 1;
    let targetDate = null;
    let isValidDate = false;

    if (tripDate && tripDate.trim()) {
      // Try to parse US format first (Month Day, Year)
      targetDate = new Date(tripDate);

      // If invalid, try different parsing approaches
      if (isNaN(targetDate.getTime())) {
        // Try with explicit formatting
        const cleanDate = tripDate.replace(/(\w+)\s+(\d+),\s+(\d+)/, '$1 $2, $3');
        targetDate = new Date(cleanDate);

        // If still invalid, try MM/DD/YYYY format
        if (isNaN(targetDate.getTime())) {
          const parts = tripDate.split(/[\/\-\s,]+/);
          if (parts.length >= 3) {
            // Assume MM/DD/YYYY or similar
            const month = parseInt(parts[0]) - 1; // Month is 0-indexed
            const day = parseInt(parts[1]);
            const year = parseInt(parts[2]);
            targetDate = new Date(year, month, day);
          }
        }
      }

      // Check if we have a valid future date
      if (!isNaN(targetDate.getTime()) && targetDate > new Date()) {
        isValidDate = true;
      }
    }

    if (goalAmount <= 0 || members <= 0) return null;

    // Only show calculator if we have a valid target date
    if (!isValidDate || !targetDate) return null;

    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const monthsRemaining = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44))); // Average days per month

    const perPersonPerMonth = goalAmount / members / monthsRemaining;

    return {
      totalGoal: goalAmount,
      members: members,
      monthsRemaining: monthsRemaining,
      perPersonPerMonth: perPersonPerMonth,
      targetDate: targetDate,
      isValidDate: isValidDate,
    };
  };

  const handleDestinationChange = (text) => {
    setDestination(text);
    if (text.trim().length > 2) {
      const fact = getDestinationFact(text);
      setDestinationFact(fact);
    } else {
      setDestinationFact('');
    }
  };

  const create = async () => {
    try {
      if (!name.trim()) return Alert.alert('Error', 'Pool name required');

      // Allow pools without goal amounts (open-ended saving)
      let goal = 0;
      if (goalCents && goalCents.trim()) {
        goal = Math.round(parseFloat(goalCents) * 100);
        if (goal < 0) return Alert.alert('Error', 'Goal amount cannot be negative');
      }

      const penaltyData = enablePenalty
        ? {
            enabled: true,
            percentage: parseFloat(penaltyPercentage) || 5,
            requiresConsensus: poolType === 'group',
          }
        : { enabled: false };

      console.log('Creating pool with data:', {
        userId: user.id,
        name: name.trim(),
        goal,
        destination: destination.trim(),
        tripDate,
        poolType,
        penalty: penaltyData,
      });

      const result = await api.createPool(
        user.id,
        name.trim(),
        goal,
        destination.trim(),
        tripDate,
        poolType,
        penaltyData
      );
      console.log('Pool creation result:', result);
      const successMessage =
        poolType === 'solo'
          ? 'Solo goal created! 🎯\n\n• Personal challenges activated\n• Public encouragement enabled\n• Streak tracking started'
          : goal > 0
          ? 'Pool created with gamification features! 🎉\n\n• Challenges activated\n• Unlockables ready\n• Leaderboard initialized'
          : 'Open savings pot created! 💰\n\n• No goal limit - save as much as you want\n• Perfect for flexible group saving\n• Add contributions anytime';
      Alert.alert('Success!', successMessage, [
        {
          text: 'OK',
          onPress: () => {
            // Navigate back and force refresh
            navigation.navigate('Pools' as any, { user, refresh: Date.now() });
          },
        },
      ]);
    } catch (error) {
      console.log('Create pool error:', error);
      Alert.alert('Error', 'Failed to create pool. Please try again.');
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FAFCFF' }}>
      <View style={{ backgroundColor: colors.primary, paddingTop: 80, paddingBottom: 20, paddingHorizontal: 24 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
          <Text style={{ color: 'white', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: 'white', fontSize: 24, fontWeight: '700' }}>Create Pool</Text>
        <Text style={{ color: 'white', fontSize: 16, opacity: 0.9, marginTop: 4 }}>Start your savings journey</Text>
      </View>
      <View style={{ padding: 24 }}>
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>Pool Type</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={[
                { flex: 1, padding: 15, borderRadius: radius.md, borderWidth: 2, alignItems: 'center' },
                poolType === 'group'
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: '#fff', borderColor: '#ddd' },
              ]}
              onPress={() => setPoolType('group')}
            >
              <Text style={{ fontSize: 20, marginBottom: 5 }}>👥</Text>
              <Text style={[{ fontWeight: '600' }, poolType === 'group' ? { color: '#fff' } : { color: colors.text }]}>
                Group Pool
              </Text>
              <Text
                style={[
                  { fontSize: 12, textAlign: 'center' },
                  poolType === 'group' ? { color: '#fff' } : { color: colors.textSecondary },
                ]}
              >
                Save with friends
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                { flex: 1, padding: 15, borderRadius: radius.md, borderWidth: 2, alignItems: 'center' },
                poolType === 'solo'
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: '#fff', borderColor: '#ddd' },
              ]}
              onPress={() => setPoolType('solo')}
            >
              <Text style={{ fontSize: 20, marginBottom: 5 }}>🎯</Text>
              <Text style={[{ fontWeight: '600' }, poolType === 'solo' ? { color: '#fff' } : { color: colors.text }]}>
                Solo Goal
              </Text>
              <Text
                style={[
                  { fontSize: 12, textAlign: 'center' },
                  poolType === 'solo' ? { color: '#fff' } : { color: colors.textSecondary },
                ]}
              >
                Personal accountability
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Goal Category Selection */}
        <GoalCategorySelector
          selectedCategory={selectedCategory}
          onSelect={(category: any) => setSelectedCategory(category)}
          style={{ marginBottom: 20 }}
        />
        {/* TODO: needs refactor... move this to a new component. */}
        {/* Category-specific messaging */}
        {selectedCategory && (
          <View
            style={{
              backgroundColor: (selectedCategory?.color || colors.blue) + '20',
              padding: 16,
              borderRadius: radius.medium,
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500', textAlign: 'center' }}>
              {selectedCategory?.id === 'travel' &&
                (poolType === 'group'
                  ? "🌍 Finally take that trip out of the group chat—let's make it real this time!"
                  : '✈️ Your solo adventure awaits—pack your bags and your savings account!')}
              {selectedCategory?.id === 'visit_friends' &&
                "❤️ Your little 'seeing one another' fund for when you miss your people 🥺"}
              {selectedCategory?.id === 'emergency' &&
                (poolType === 'group'
                  ? "🛡️ Building your safety net together—because life happens, but you'll be ready!"
                  : '🛡️ Your financial peace of mind starts here—3-6 months of expenses, one save at a time!')}
              {selectedCategory?.id === 'education' &&
                "📚 Invest in yourself—it's the one investment that always pays dividends!"}
              {selectedCategory?.id === 'wedding' &&
                (poolType === 'group'
                  ? "💒 Your dream wedding deserves dream funding—let's make your special day perfect!"
                  : "💍 Walking down the aisle shouldn't break the bank—save smart for your big day!")}
              {selectedCategory?.id === 'home' &&
                (poolType === 'group'
                  ? '🏡 Turning Zillow dreams into front-door keys—brick by brick, save by save.'
                  : '🏠 Your future home is calling—time to turn house hunting into house buying!')}
              {selectedCategory?.id === 'car' &&
                (poolType === 'group'
                  ? '🚗 Vroom vroom energy activated—your dream ride is fueling up one contribution at a time!'
                  : "🚙 That car upgrade isn't going to finance itself—rev up those savings!")}
              {selectedCategory?.id === 'tech' &&
                (poolType === 'group'
                  ? "📱 That upgrade won't pay for itself—save now, unbox happiness later."
                  : '💻 New tech, new you—time to upgrade your life one gadget at a time!')}
              {selectedCategory?.id === 'health' &&
                (poolType === 'group'
                  ? '💪 Stronger together—your wellness journey deserves proper funding!'
                  : '🏃‍♀️ Invest in your health—your future self will thank you!')}
              {selectedCategory.id === 'business' &&
                (poolType === 'group'
                  ? '💼 Turning business dreams into reality—one contribution at a time!'
                  : '🚀 Your entrepreneurial journey starts with smart saving!')}
              {selectedCategory.id === 'other' &&
                (poolType === 'group'
                  ? "🎯 Custom goals deserve custom wins—you're building something uniquely yours together!"
                  : '✨ Your unique goal, your unique journey—time to make it happen!')}
            </Text>
          </View>
        )}

        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
          {poolType === 'solo' ? 'Goal Name' : 'Pool Name'}
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, marginBottom: 24, fontSize: 16 }}
          placeholder={poolType === 'solo' ? 'My Savings Goal' : 'Barcelona Trip'}
        />

        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
          💰 Goal Amount (Optional)
        </Text>
        <TextInput
          value={goalCents}
          onChangeText={(text) => {
            setGoalCents(text);
            // Force calculator re-render when goal changes
            setCalculatorKey((prev) => prev + 1);
          }}
          keyboardType='numeric'
          style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, marginBottom: 6, fontSize: 16 }}
          placeholder='1000'
        />
        <Text style={{ fontSize: 12, color: '#666', marginBottom: 18 }}>
          Leave blank for open-ended saving (no goal limit)
        </Text>

        {poolType === 'group' && (
          <View style={{ marginBottom: 20 }}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>🧮 Smart Savings Calculator</Text>
              <TouchableOpacity
                onPress={() => setEnableCalculator(!enableCalculator)}
                style={{
                  backgroundColor: enableCalculator ? colors.green : '#f0f0f0',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: enableCalculator ? 'white' : colors.textSecondary,
                  }}
                >
                  {enableCalculator ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 16, lineHeight: 20 }}>
              Let PoolUp calculate how much each person needs to save monthly to reach your goal. We'll automatically
              update amounts when friends join or leave your group.
            </Text>

            {enableCalculator && (
              <>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
                  Expected Group Size
                </Text>
                <TextInput
                  value={expectedMembers}
                  onChangeText={(text) => {
                    setExpectedMembers(text);
                    // Force calculator re-render when group size changes
                    setCalculatorKey((prev) => prev + 1);
                  }}
                  keyboardType='numeric'
                  style={{
                    backgroundColor: 'white',
                    padding: 16,
                    borderRadius: radius.medium,
                    marginBottom: 18,
                    fontSize: 16,
                  }}
                  placeholder='6'
                />
              </>
            )}
            <Text style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>
              💡 This helps us calculate monthly contributions—don't worry if it changes later!
            </Text>
          </View>
        )}

        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
          🌍 Destination (Optional)
        </Text>
        <TextInput
          value={destination}
          onChangeText={handleDestinationChange}
          style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, marginBottom: 12, fontSize: 16 }}
          placeholder='e.g. Tokyo, Japan'
        />

        {destinationFact ? (
          <View
            style={{
              backgroundColor: colors.blue + '15',
              padding: 16,
              borderRadius: radius.medium,
              marginBottom: 18,
              borderLeftWidth: 4,
              borderLeftColor: colors.blue,
            }}
          >
            <Text style={{ fontSize: 14, color: colors.text, lineHeight: 20 }}>{destinationFact}</Text>
          </View>
        ) : (
          <Text style={{ fontSize: 12, color: '#666', marginBottom: 18 }}>
            Adding a destination unlocks travel-themed rewards and content!
          </Text>
        )}

        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
          📅 Target Date (Optional)
        </Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={{
            backgroundColor: 'white',
            padding: 16,
            borderRadius: radius.medium,
            marginBottom: 24,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderWidth: 1,
            borderColor: '#e0e0e0',
          }}
        >
          <Text style={{ fontSize: 16, color: tripDate ? colors.text : '#999' }}>
            {tripDate
              ? new Date(tripDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : 'Tap to select target date'}
          </Text>
          <Text style={{ fontSize: 16, color: '#999' }}>📅</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <CustomCalendar
            onDateSelect={(date: Date) => {
              setTripDate(date.toISOString());
              setShowDatePicker(false);
              setCalculatorKey((prev) => prev + 1);
            }}
            onClose={() => setShowDatePicker(false)}
            initialDate={tripDate && tripDate.trim() ? new Date(tripDate) : null}
          />
        )}

        {/* Early Withdrawal Penalty (Optional) */}
        <View style={{ marginBottom: 24 }}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>⚠️ Early Withdrawal Penalty</Text>
            <TouchableOpacity
              onPress={() => setEnablePenalty(!enablePenalty)}
              style={{
                backgroundColor: enablePenalty ? colors.primary : '#f0f0f0',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: enablePenalty ? 'white' : colors.textSecondary,
                }}
              >
                {enablePenalty ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 16, lineHeight: 20 }}>
            {poolType === 'group'
              ? 'Add accountability by penalizing early withdrawals. All group members must agree to enable this feature.'
              : 'Stay committed to your goal by adding a penalty for early withdrawals before your target date.'}
          </Text>

          {enablePenalty && (
            <>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
                Penalty Amount (%)
              </Text>
              <TextInput
                value={penaltyPercentage}
                onChangeText={setPenaltyPercentage}
                keyboardType='numeric'
                style={{
                  backgroundColor: 'white',
                  padding: 16,
                  borderRadius: radius.medium,
                  marginBottom: 12,
                  fontSize: 16,
                }}
                placeholder='5'
              />
              <Text style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>
                Percentage of withdrawn amount that will be forfeited as penalty
              </Text>

              <View
                style={{
                  backgroundColor: colors.primaryLight,
                  padding: 16,
                  borderRadius: radius.medium,
                  borderLeftWidth: 4,
                  borderLeftColor: colors.primary,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
                  💡 How it works:
                </Text>
                <Text style={{ fontSize: 13, color: colors.text, lineHeight: 18 }}>
                  • Withdraw early = pay {penaltyPercentage || '5'}% penalty on withdrawn amount{'\n'}• Penalty funds
                  are forfeited (not returned){'\n'}•{' '}
                  {poolType === 'group'
                    ? 'All members must agree to enable penalties'
                    : 'Only applies if you set a target date'}
                  {'\n'}• Encourages commitment to your savings goal
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Savings Calculator */}
        {(() => {
          const calculation = calculateMonthlySavings();
          if (!calculation) return null;

          return (
            <View
              key={calculatorKey}
              style={{
                backgroundColor: colors.green + '15',
                padding: 20,
                borderRadius: radius.medium,
                marginBottom: 24,
                borderLeftWidth: 4,
                borderLeftColor: colors.green,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
                🧮 PoolUp's Smart Calculator
              </Text>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500' }}>Total Goal:</Text>
                <Text style={{ fontSize: 14, color: colors.text, fontWeight: '700' }}>
                  ${calculation.totalGoal.toLocaleString()}
                </Text>
              </View>

              {poolType === 'group' && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500' }}>Group Size:</Text>
                  <Text style={{ fontSize: 14, color: colors.text, fontWeight: '700' }}>
                    {calculation.members} people
                  </Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500' }}>Time Frame:</Text>
                <Text style={{ fontSize: 14, color: colors.text, fontWeight: '700' }}>
                  {calculation.monthsRemaining} month{calculation.monthsRemaining !== 1 ? 's' : ''}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: 'white',
                  padding: 16,
                  borderRadius: radius.medium,
                  marginTop: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 16, color: colors.text, fontWeight: '600', marginBottom: 4 }}>
                  {poolType === 'group' ? 'Each person saves:' : 'You need to save:'}
                </Text>
                <Text style={{ fontSize: 24, color: colors.green, fontWeight: '700' }}>
                  ${calculation.perPersonPerMonth.toFixed(2)}/month
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                  That's just ${(calculation.perPersonPerMonth / 30).toFixed(2)} per day!
                </Text>
              </View>

              {poolType === 'group' && (
                <Text
                  style={{ fontSize: 12, color: colors.text, marginTop: 12, textAlign: 'center', fontStyle: 'italic' }}
                >
                  💡 When friends join or leave, PoolUp automatically updates everyone's monthly amount
                </Text>
              )}
            </View>
          );
        })()}

        {/* Gamification Preview */}
        <View
          style={{ backgroundColor: colors.blue + '20', padding: 16, borderRadius: radius.medium, marginBottom: 24 }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
            🎮 Gamification Features Included:
          </Text>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>• Team challenges with bonus rewards</Text>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>• Streak tracking and badges</Text>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>• Leaderboards and social competition</Text>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>• Progress unlockables and milestones</Text>
          {destination && (
            <Text style={{ fontSize: 14, color: colors.green, marginTop: 8 }}>
              ✨ Travel rewards enabled for {destination}!
            </Text>
          )}
        </View>

        {poolType === 'group' && (
          <ScrollView
            style={{
              backgroundColor: '#E8F5E8',
              padding: 16,
              borderRadius: radius.medium,
              marginBottom: 16,
              maxHeight: 200,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
              👥 Group Pool Features:
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>• Invite friends after creation</Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>• Shared progress tracking</Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>• Team challenges and rewards</Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>• Group chat and encouragement</Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>• Leaderboards and social competition</Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>• Progress unlockables and milestones</Text>
            <Text style={{ fontSize: 14, color: '#666' }}>• Streak tracking and badges</Text>
          </ScrollView>
        )}

        {poolType === 'group' && (
          <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
              👥 Add Members (Optional)
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>
              You can invite friends now or add them later
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('InviteFriends' as any, { poolName: name })}
              style={{ backgroundColor: colors.blue, padding: 12, borderRadius: radius.medium, alignItems: 'center' }}
            >
              <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>📧 Send Invites Now</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          onPress={create}
          style={{ backgroundColor: colors.purple, padding: 16, borderRadius: radius.medium, alignItems: 'center' }}
        >
          <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>
            {poolType === 'group' ? 'Create Pool' : 'Create Solo Goal'}
          </Text>
        </TouchableOpacity>

        {poolType === 'group' && (
          <View
            style={{ backgroundColor: colors.green + '20', padding: 16, borderRadius: radius.medium, marginTop: 12 }}
          >
            <Text style={{ fontSize: 14, color: colors.green, textAlign: 'center', fontWeight: '500' }}>
              💡 After creating your pool, you can invite more friends anytime from the pool details page
            </Text>
          </View>
        )}

        {poolType === 'solo' && (
          <TouchableOpacity
            onPress={() => navigation.navigate('AccountabilityPartners' as any)}
            style={{
              backgroundColor: colors.blue,
              padding: 16,
              borderRadius: radius.medium,
              alignItems: 'center',
              marginTop: 12,
            }}
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>🤝 Add Accountability Partners</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}
