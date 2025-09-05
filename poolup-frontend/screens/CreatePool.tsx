import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { GoalCategorySelector } from '../components/GoalCategories';
import CustomCalendar from '../components/CustomCalendar';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

type RootStackParamList = {
  CreatePool: { user: any; poolType?: string };
  InviteFriends: { poolName?: string };
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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
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
  const [isPrivate, setIsPrivate] = useState<boolean>(false);

  const getDestinationFact = (dest: string) => {
    const location = dest.toLowerCase().trim();
    const facts = {
      // Major US Cities
      'detroit': "🎵 Detroit is the birthplace of Motown! Berry Gordy Jr. founded Motown Records here in 1959, launching legends like Stevie Wonder, Diana Ross, and The Jackson 5.",
      'new york': "🗽 NYC has over 800 languages spoken—it's the most linguistically diverse city in the world!",
      'nyc': "🗽 NYC has over 800 languages spoken—it's the most linguistically diverse city in the world!",
      'los angeles': "🌟 LA produces more entertainment content than anywhere else on Earth—you might spot a celebrity!",
      'la': "🌟 LA produces more entertainment content than anywhere else on Earth—you might spot a celebrity!",
      'chicago': "🏗️ Chicago invented the skyscraper! The Home Insurance Building (1885) was the world's first.",
      'miami': "🏖️ Miami Beach's Art Deco District has the world's largest collection of Art Deco architecture!",
      'las vegas': "🎰 Vegas has more neon signs than anywhere else—the city uses enough electricity to power 1.3 million homes!",
      'san francisco': "🌉 The Golden Gate Bridge's International Orange color was chosen to enhance visibility in fog!",
      'seattle': "☕ Seattle has more coffee shops per capita than any other US city—caffeine paradise!",
      'austin': "🎸 Austin's slogan 'Keep Austin Weird' started as a bumper sticker to support local businesses!",
      'nashville': "🎤 Nashville's Grand Ole Opry is the longest-running radio show in history (since 1925)!",
      'orlando': "🎢 Orlando is home to more theme parks than anywhere else on Earth—the ultimate fun destination!",
      'new orleans': "🎷 New Orleans is the birthplace of jazz music and has the most festivals of any US city!",
      
      // International Destinations
      'tokyo': "🍣 Tokyo has more Michelin-starred restaurants than any other city in the world!",
      'paris': "🥐 Paris has over 400 parks and gardens—perfect for picnics with fresh croissants!",
      'london': "☂️ London has more green space than any other major city—over 40% is parks and gardens!",
      'rome': "🏛️ Rome has more fountains than any other city—legend says tossing a coin in Trevi guarantees your return!",
      'barcelona': "🏛️ Gaudí's Sagrada Família has been under construction for over 140 years and counting!",
      'amsterdam': "🚲 Amsterdam has more bikes than residents—over 880,000 bicycles for 820,000 people!",
      'cartagena': "🏰 Colombia's Cartagena has the most complete colonial walled city in South America—pure magic!",
      'dubai': "🏗️ Dubai built the world's tallest building, largest mall, and biggest fountain—city of superlatives!",
      'cancun': "🏖️ Mexico's Cancun sits on the world's second-largest coral reef system—underwater paradise!",
      'bali': "🌺 Indonesia's Bali has over 20,000 temples and is known as the 'Island of the Gods'!",
      'phuket': "🏝️ Thailand's Phuket has 32 beaches and the most beautiful sunsets in Southeast Asia!",
      'maldives': "🐠 The Maldives has 1,192 coral islands and the clearest water on Earth—pure paradise!",
      'santorini': "🌅 Greece's Santorini has the most spectacular sunsets and blue-domed churches in the world!",
      'ibiza': "🎵 Spain's Ibiza is a UNESCO World Heritage site with the best electronic music scene globally!",
      'rio de janeiro': "🎭 Brazil's Rio has the world's largest carnival celebration and most beautiful beaches!",
      'bangkok': "🛺 Thailand's Bangkok has the most street food vendors and golden temples of any city!",
      'machu picchu': "🏔️ Peru's Machu Picchu is one of the New Seven Wonders and sits 8,000 feet above sea level!",
      'cape town': "🐧 South Africa's Cape Town is the only city where you can see penguins and go wine tasting!",
      'accra': "🌟 Ghana's Accra is known as the Gateway to Africa with incredible hospitality and rich cultural heritage!",
      'thailand': "🐘 Thailand is home to over 3,000 elephants and has more Buddhist temples than any other country!",
      'iceland': "🌋 Iceland runs almost entirely on renewable energy from geothermal and hydroelectric sources!",
      'japan': "🌸 Japan has a 99% literacy rate and vending machines that sell everything from hot coffee to fresh flowers!",
      'mexico': "🌮 Mexico gave the world chocolate, vanilla, and tomatoes—imagine Italian food without tomatoes!",
      'greece': "🏛️ Greece has over 6,000 islands, but only 227 are inhabited—island hopping paradise!",
      'egypt': "🐪 The Great Pyramid of Giza was the world's tallest building for over 3,800 years!",
      'morocco': "🕌 Morocco's blue city, Chefchaouen, is painted blue to repel mosquitoes and keep houses cool!",
      
      // States and Regions
      'california': "🌞 California produces 80% of the world's almonds and has more national parks than any other state!",
      'florida': "🐊 Florida is the only place on Earth where alligators and crocodiles coexist naturally!",
      'hawaii': "🌺 Hawaii is the only US state that grows coffee commercially and has its own time zone!",
      'alaska': "🐻 Alaska has more coastline than all other US states combined—over 34,000 miles!",
      'colorado': "🏔️ Colorado has the highest average elevation of any state and 58 peaks over 14,000 feet!",
      'texas': "🤠 Texas is so big that El Paso is closer to California than to Dallas!",
      
      // Default for unrecognized places
      'default': "🌍 Every destination has its own magic—you're about to create amazing memories!"
    };

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
      isValidDate: isValidDate
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

  const create = async ()=>{
    try {
      if(!name.trim()) return Alert.alert('Error','Pool name required');
      
      // Allow pools without goal amounts (open-ended saving)
      let goal = 0;
      if (goalCents && goalCents.trim()) {
        goal = Math.round(parseFloat(goalCents) * 100);
        if(goal < 0) return Alert.alert('Error','Goal amount cannot be negative');
      }
      
      const penaltyData = enablePenalty ? {
        enabled: true,
        percentage: parseFloat(penaltyPercentage) || 5,
        requiresConsensus: poolType === 'group'
      } : { enabled: false };

      console.log('Creating pool with data:', { 
        userId: user.id, 
        name: name.trim(), 
        goal, 
        destination: destination.trim(), 
        tripDate, 
        poolType,
        penalty: penaltyData
      });
      
      const result = await api.createPool(user.id, name.trim(), goal, destination.trim(), tripDate, poolType, penaltyData, isPrivate);
      console.log('Pool creation result:', result);
      const successMessage = poolType === 'solo' 
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
          }
        }
      ]);
    } catch (error) {
      console.log('Create pool error:', error);
      Alert.alert('Error', 'Failed to create pool. Please try again.');
    }
  };

  return (
    <ScrollView style={{ flex:1, backgroundColor:'#FAFCFF' }}>
      <View style={{ backgroundColor: colors.primary, paddingTop: 80, paddingBottom: 20, paddingHorizontal: 24 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
          <Text style={{ color: 'white', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: 'white', fontSize: 24, fontWeight: '700' }}>Create Pool</Text>
        <Text style={{ color: 'white', fontSize: 16, opacity: 0.9, marginTop: 4 }}>
          Start your savings journey
        </Text>
      </View>
      <View style={{ padding: 24 }}>
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize:18, fontWeight:'700', color: colors.text, marginBottom:12 }}>Pool Type</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity 
              style={[
                { flex: 1, padding: 15, borderRadius: radius.md, borderWidth: 2, alignItems: 'center' },
                poolType === 'group' ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: '#fff', borderColor: '#ddd' }
              ]}
              onPress={() => setPoolType('group')}
            >
              <Text style={{ fontSize: 20, marginBottom: 5 }}>👥</Text>
              <Text style={[{ fontWeight: '600' }, poolType === 'group' ? { color: '#fff' } : { color: colors.text }]}>
                Group Pool
              </Text>
              <Text style={[{ fontSize: 12, textAlign: 'center' }, poolType === 'group' ? { color: '#fff' } : { color: colors.textSecondary }]}>
                Save with friends
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                { flex: 1, padding: 15, borderRadius: radius.md, borderWidth: 2, alignItems: 'center' },
                poolType === 'solo' ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: '#fff', borderColor: '#ddd' }
              ]}
              onPress={() => setPoolType('solo')}
            >
              <Text style={{ fontSize: 20, marginBottom: 5 }}>🎯</Text>
              <Text style={[{ fontWeight: '600' }, poolType === 'solo' ? { color: '#fff' } : { color: colors.text }]}>
                Solo Goal
              </Text>
              <Text style={[{ fontSize: 12, textAlign: 'center' }, poolType === 'solo' ? { color: '#fff' } : { color: colors.textSecondary }]}>
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

        {/* Category-specific messaging */}
        {selectedCategory && (
          <View style={{ 
            backgroundColor: (selectedCategory?.color || colors.blue) + '20',
            padding: 16, 
            borderRadius: radius.medium, 
            marginBottom: 20 
          }}>
            <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500', textAlign: 'center' }}>
              {selectedCategory?.id === 'travel' && (poolType === 'group' 
                ? "🌍 Finally take that trip out of the group chat—let's make it real this time!"
                : "✈️ Your solo adventure awaits—pack your bags and your savings account!")}
              {selectedCategory?.id === 'emergency' && (poolType === 'group'
                ? "🛡️ Building your safety net together—because life happens, but you'll be ready!"
                : "🛡️ Your financial peace of mind starts here—3-6 months of expenses, one save at a time!")}
              {selectedCategory?.id === 'education' && "📚 Invest in yourself—it's the one investment that always pays dividends!"}
              {selectedCategory?.id === 'wedding' && (poolType === 'group'
                ? "💒 Your dream wedding deserves dream funding—let's make your special day perfect!"
                : "💍 Walking down the aisle shouldn't break the bank—save smart for your big day!")}
              {selectedCategory?.id === 'home' && (poolType === 'group'
                ? "🏡 Turning Zillow dreams into front-door keys—brick by brick, save by save."
                : "🏠 Your future home is calling—time to turn house hunting into house buying!")}
              {selectedCategory?.id === 'car' && (poolType === 'group'
                ? "🚗 Vroom vroom energy activated—your dream ride is fueling up one contribution at a time!"
                : "🚙 That car upgrade isn't going to finance itself—rev up those savings!")}
              {selectedCategory?.id === 'tech' && (poolType === 'group'
                ? "📱 That upgrade won't pay for itself—save now, unbox happiness later."
                : "💻 New tech, new you—time to upgrade your life one gadget at a time!")}
              {selectedCategory?.id === 'health' && (poolType === 'group'
                ? "💪 Stronger together—your wellness journey deserves proper funding!"
                : "🏃‍♀️ Invest in your health—your future self will thank you!")}
              {selectedCategory.id === 'business' && (poolType === 'group'
                ? "💼 Turning business dreams into reality—one contribution at a time!"
                : "🚀 Your entrepreneurial journey starts with smart saving!")}
              {selectedCategory.id === 'other' && (poolType === 'group'
                ? "🎯 Custom goals deserve custom wins—you're building something uniquely yours together!"
                : "✨ Your unique goal, your unique journey—time to make it happen!")}
            </Text>
          </View>
        )}

        <Text style={{ fontSize:18, fontWeight:'700', color: colors.text, marginBottom:8 }}>
          {poolType === 'solo' ? 'Goal Name' : 'Pool Name'}
        </Text>
        <TextInput 
          value={name} 
          onChangeText={setName} 
          style={{ backgroundColor:'white', padding:16, borderRadius: radius.medium, marginBottom:24, fontSize:16 }} 
          placeholder={poolType === 'solo' ? 'My Savings Goal' : 'Barcelona Trip'} 
        />

        <Text style={{ fontSize:18, fontWeight:'700', color: colors.text, marginBottom:8 }}>
          💰 Goal Amount (Optional)
        </Text>
        <TextInput 
          value={goalCents} 
          onChangeText={(text) => {
            setGoalCents(text);
            // Force calculator re-render when goal changes
            setCalculatorKey(prev => prev + 1);
          }} 
          keyboardType="numeric" 
          style={{ backgroundColor:'white', padding:16, borderRadius: radius.medium, marginBottom:6, fontSize:16 }} 
          placeholder="1000" 
        />
        <Text style={{ fontSize:12, color:'#666', marginBottom:18 }}>
          Leave blank for open-ended saving (no goal limit)
        </Text>

        {poolType === 'group' && (
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize:18, fontWeight:'700', color: colors.text }}>
                🧮 Smart Savings Calculator
              </Text>
              <TouchableOpacity
                onPress={() => setEnableCalculator(!enableCalculator)}
                style={{
                  backgroundColor: enableCalculator ? colors.green : '#f0f0f0',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
              >
                <Text style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: enableCalculator ? 'white' : colors.textSecondary,
                }}>
                  {enableCalculator ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 16, lineHeight: 20 }}>
              Let PoolUp calculate how much each person needs to save monthly to reach your goal. We'll automatically update amounts when friends join or leave your group.
            </Text>
            
            {enableCalculator && (
              <>
                <Text style={{ fontSize:16, fontWeight:'600', color: colors.text, marginBottom:8 }}>
                  Expected Group Size
                </Text>
                <TextInput 
                  value={expectedMembers} 
                  onChangeText={(text) => {
                    setExpectedMembers(text);
                    // Force calculator re-render when group size changes
                    setCalculatorKey(prev => prev + 1);
                  }} 
                  keyboardType="numeric" 
                  style={{ backgroundColor:'white', padding:16, borderRadius: radius.medium, marginBottom:18, fontSize:16 }} 
                  placeholder="6" 
                />
              </>
            )}
            <Text style={{ fontSize:12, color:'#666', marginBottom:16 }}>
              💡 This helps us calculate monthly contributions—don't worry if it changes later!
            </Text>
          </View>
        )}

        <Text style={{ fontSize:18, fontWeight:'700', color: colors.text, marginBottom:8 }}>
          🌍 Destination (Optional)
        </Text>
        <TextInput 
          value={destination} 
          onChangeText={handleDestinationChange} 
          style={{ backgroundColor:'white', padding:16, borderRadius:radius.medium, marginBottom:12, fontSize:16 }} 
          placeholder="e.g. Tokyo, Japan" 
        />
        
        {destinationFact ? (
          <View style={{ 
            backgroundColor: colors.blue + '15', 
            padding: 16, 
            borderRadius: radius.medium, 
            marginBottom: 18,
            borderLeftWidth: 4,
            borderLeftColor: colors.blue
          }}>
            <Text style={{ fontSize: 14, color: colors.text, lineHeight: 20 }}>
              {destinationFact}
            </Text>
          </View>
        ) : (
          <Text style={{ fontSize:12, color:'#666', marginBottom:18 }}>
            Adding a destination unlocks travel-themed rewards and content!
          </Text>
        )}

        <Text style={{ fontSize:18, fontWeight:'700', color: colors.text, marginBottom:8 }}>
          📅 Target Date (Optional)
        </Text>
        <TouchableOpacity 
          onPress={() => setShowDatePicker(true)}
          style={{ 
            backgroundColor:'white', 
            padding:16, 
            borderRadius: radius.medium, 
            marginBottom:24, 
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderWidth: 1,
            borderColor: '#e0e0e0'
          }}
        >
          <Text style={{ fontSize:16, color: tripDate ? colors.text : '#999' }}>
            {tripDate ? new Date(tripDate).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }) : 'Tap to select target date'}
          </Text>
          <Text style={{ fontSize: 16, color: '#999' }}>📅</Text>
        </TouchableOpacity>
        
        {showDatePicker && (
          <CustomCalendar
            onDateSelect={(date: Date) => {
              setTripDate(date.toISOString());
              setShowDatePicker(false);
              setCalculatorKey(prev => prev + 1);
            }}
            onClose={() => setShowDatePicker(false)}
            initialDate={tripDate && tripDate.trim() ? new Date(tripDate) : null}
          />
        )}

        {/* Early Withdrawal Penalty (Optional) */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
              ⚠️ Early Withdrawal Penalty
            </Text>
            <TouchableOpacity
              onPress={() => setEnablePenalty(!enablePenalty)}
              style={{
                backgroundColor: enablePenalty ? colors.primary : '#f0f0f0',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center'
              }}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: enablePenalty ? 'white' : colors.textSecondary,
              }}>
                {enablePenalty ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={{ backgroundColor: '#fff3cd', padding: 12, borderRadius: radius.medium, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#ffc107' }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#856404', marginBottom: 4 }}>
              💡 What's this penalty for?
            </Text>
            <Text style={{ fontSize: 13, color: '#856404', lineHeight: 18 }}>
              This penalty applies when you withdraw money BEFORE reaching your goal or target date. It's different from missed payment penalties (which you can set up separately in Settings).
            </Text>
          </View>
          
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 16, lineHeight: 20 }}>
            {poolType === 'group' 
              ? 'Discourage early withdrawals by adding a penalty. Members will be notified of this setting and can choose whether to join or leave the pool.'
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
                keyboardType="numeric" 
                style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, marginBottom: 12, fontSize: 16 }} 
                placeholder="5" 
              />
              <Text style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>
                Percentage of withdrawn amount that will be forfeited as penalty
              </Text>

              <View style={{ backgroundColor: colors.primaryLight, padding: 16, borderRadius: radius.medium, borderLeftWidth: 4, borderLeftColor: colors.primary }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
                  💡 How it works:
                </Text>
                <Text style={{ fontSize: 13, color: colors.text, lineHeight: 18 }}>
                  • Withdraw early = pay {penaltyPercentage || '5'}% penalty on withdrawn amount{'\n'}
                  • Penalty funds are forfeited (not returned){'\n'}
                  • {poolType === 'group' ? 'All members must agree to enable penalties' : 'Only applies if you set a target date'}{'\n'}
                  • Encourages commitment to your savings goal
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
                borderLeftColor: colors.green
              }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
                🧮 PoolUp's Smart Calculator
              </Text>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500' }}>Total Goal:</Text>
                <Text style={{ fontSize: 14, color: colors.text, fontWeight: '700' }}>${calculation.totalGoal.toLocaleString()}</Text>
              </View>
              
              {poolType === 'group' && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500' }}>Group Size:</Text>
                  <Text style={{ fontSize: 14, color: colors.text, fontWeight: '700' }}>{calculation.members} people</Text>
                </View>
              )}
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500' }}>Time Frame:</Text>
                <Text style={{ fontSize: 14, color: colors.text, fontWeight: '700' }}>
                  {calculation.monthsRemaining} month{calculation.monthsRemaining !== 1 ? 's' : ''}
                </Text>
              </View>
              
              <View style={{ 
                backgroundColor: 'white', 
                padding: 16, 
                borderRadius: radius.medium, 
                marginTop: 12,
                alignItems: 'center'
              }}>
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
                <Text style={{ fontSize: 12, color: colors.text, marginTop: 12, textAlign: 'center', fontStyle: 'italic' }}>
                  💡 When friends join or leave, PoolUp automatically updates everyone's monthly amount
                </Text>
              )}
            </View>
          );
        })()}

        {/* Privacy Settings */}
        <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                🔒 Privacy Settings
              </Text>
              <Text style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
                {isPrivate ? 'Only you can see this goal' : 'Visible to friends in your feed'}
              </Text>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: '#e9ecef', true: colors.primary }}
              thumbColor={isPrivate ? 'white' : '#f4f3f4'}
            />
          </View>
          
          <View style={{ backgroundColor: isPrivate ? '#fff3cd' : '#d1ecf1', padding: 12, borderRadius: radius.medium, borderLeftWidth: 4, borderLeftColor: isPrivate ? '#ffc107' : '#17a2b8' }}>
            <Text style={{ fontSize: 14, color: isPrivate ? '#856404' : '#0c5460', lineHeight: 18 }}>
              {isPrivate 
                ? '🔐 Private goals are hidden from your friends feed and leaderboards. Only you can see your progress.'
                : '👥 Public goals appear in your friends feed and can motivate others. You can change this anytime.'}
            </Text>
          </View>
        </View>

        {/* Gamification Preview */}
        <View style={{ backgroundColor: colors.blue + '20', padding: 16, borderRadius: radius.medium, marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
            🎮 Gamification Features Included:
          </Text>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>• Team challenges with bonus rewards</Text>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>• Streak tracking and badges</Text>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>• Leaderboards and social competition</Text>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>• Progress unlockables and milestones</Text>
          {destination && <Text style={{ fontSize: 14, color: colors.green, marginTop: 8 }}>✨ Travel rewards enabled for {destination}!</Text>}
        </View>
        
        {poolType === 'group' && (
          <ScrollView style={{ backgroundColor: '#E8F5E8', padding: 16, borderRadius: radius.medium, marginBottom: 16, maxHeight: 200 }}>
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
              onPress={() => navigation.navigate('InviteFriends', { poolName: name })}
              style={{ backgroundColor: colors.blue, padding: 12, borderRadius: radius.medium, alignItems: 'center' }}
            >
              <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                📧 Send Invites Now
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity onPress={create} style={{ backgroundColor: colors.purple, padding:16, borderRadius: radius.medium, alignItems:'center' }}>
          <Text style={{ color:'white', fontSize:18, fontWeight:'700' }}>
            {poolType === 'group' ? 'Create Pool' : 'Create Solo Goal'}
          </Text>
        </TouchableOpacity>
        
        {poolType === 'group' && (
          <View style={{ backgroundColor: colors.green + '20', padding: 16, borderRadius: radius.medium, marginTop: 12 }}>
            <Text style={{ fontSize: 14, color: colors.green, textAlign: 'center', fontWeight: '500' }}>
              💡 After creating your pool, you can invite more friends anytime from the pool details page
            </Text>
          </View>
        )}

        {poolType === 'solo' && (
          <TouchableOpacity 
            onPress={() => navigation.navigate('AccountabilityPartners' as any)}
            style={{ backgroundColor: colors.blue, padding:16, borderRadius: radius.medium, alignItems:'center', marginTop: 12 }}
          >
            <Text style={{ color:'white', fontSize:16, fontWeight:'600' }}>
              🤝 Add Accountability Partners
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}
