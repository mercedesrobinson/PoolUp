import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { GoalCategorySelector, GoalCategory } from '../components/GoalCategories';
import ScrollingCalendar from '../components/ScrollingCalendar';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

type RootStackParamList = {
  CreatePool: { user: any; poolType?: string };
};

type CreatePoolNavigationProp = StackNavigationProp<RootStackParamList, 'CreatePool'>;
type CreatePoolRouteProp = RouteProp<RootStackParamList, 'CreatePool'>;

interface Props {
  navigation: CreatePoolNavigationProp;
  route: CreatePoolRouteProp;
}

// Helper function to get category-specific filler text
const getFillerText = (categoryId: string | undefined, poolType: 'solo' | 'group'): string => {
  if (poolType === 'group') {
    switch (categoryId) {
      case 'travel': return 'Girls Trip';
      case 'education': return 'City College of New York';
      case 'tech': return 'New MacBook';
      case 'business': return 'New PoolUp Wannabe';
      case 'emergency': return 'Emergency Fund';
      case 'friends_family': return 'Visit Family';
      case 'wedding': return 'Dream Wedding';
      case 'car': return 'New Car Fund';
      case 'home': return 'Down Payment';
      default: return 'Barcelona Trip';
    }
  } else {
    switch (categoryId) {
      case 'travel': return 'Girls Trip';
      case 'education': return 'City College of New York';
      case 'tech': return 'New MacBook';
      case 'business': return 'New PoolUp Wannabe';
      case 'emergency': return 'Emergency Fund';
      case 'friends_family': return 'Visit Family';
      case 'wedding': return 'Dream Wedding';
      case 'car': return 'New Car Fund';
      case 'home': return 'Down Payment';
      default: return 'My Savings Goal';
    }
  }
};

export default function CreatePool({ navigation, route }: Props): React.JSX.Element {
  const user = route.params?.user;
  const [poolType, setPoolType] = useState<'solo' | 'group'>('solo');
  const [name, setName] = useState('');
  const [goalCents, setGoalCents] = useState('');
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [tripDate, setTripDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<GoalCategory | null>(null);
  const [destination, setDestination] = useState('');
  const [destinationFact, setDestinationFact] = useState<string | null>(null);
  const [enablePenalty, setEnablePenalty] = useState(false);
  const [penaltyPercentage, setPenaltyPercentage] = useState('5');
  const [calculatorKey, setCalculatorKey] = useState(0);
  const [savingPurpose, setSavingPurpose] = useState<string>('');
  const [customPurpose, setCustomPurpose] = useState<string>('');
  const [expectedMembers, setExpectedMembers] = useState<string>('1');
  const [enableCalculator, setEnableCalculator] = useState<boolean>(false);
  
  // Template budget states
  const [travelBudget, setTravelBudget] = useState({
    flights: '',
    accommodation: '',
    food: '',
    activities: '',
    transport: ''
  });
  
  const [emergencyBudget, setEmergencyBudget] = useState({
    monthlyExpenses: '',
    months: ''
  });
  
  const [homeBudget, setHomeBudget] = useState({
    homePrice: '',
    downPaymentPercent: '',
    closingCosts: '',
    movingCosts: ''
  });
  
  const [weddingBudget, setWeddingBudget] = useState({
    venue: '',
    photography: '',
    attire: '',
    flowers: '',
    music: '',
    other: ''
  });


  // Calculate totals for templates
  const calculateTravelTotal = () => {
    const flights = parseFloat(travelBudget.flights) || 0;
    const accommodation = parseFloat(travelBudget.accommodation) || 0;
    const food = parseFloat(travelBudget.food) || 0;
    const activities = parseFloat(travelBudget.activities) || 0;
    const transport = parseFloat(travelBudget.transport) || 0;
    return flights + accommodation + food + activities + transport;
  };

  const calculateEmergencyTotal = () => {
    const monthlyExpenses = parseFloat(emergencyBudget.monthlyExpenses) || 0;
    const months = parseFloat(emergencyBudget.months) || 0;
    return monthlyExpenses * months;
  };

  const calculateHomeTotal = () => {
    const homePrice = parseFloat(homeBudget.homePrice) || 0;
    const downPaymentPercent = parseFloat(homeBudget.downPaymentPercent) || 0;
    const closingCosts = parseFloat(homeBudget.closingCosts) || 0;
    const movingCosts = parseFloat(homeBudget.movingCosts) || 0;
    const downPayment = (homePrice * downPaymentPercent) / 100;
    return downPayment + closingCosts + movingCosts;
  };

  const calculateWeddingTotal = () => {
    const venue = parseFloat(weddingBudget.venue) || 0;
    const photography = parseFloat(weddingBudget.photography) || 0;
    const attire = parseFloat(weddingBudget.attire) || 0;
    const flowers = parseFloat(weddingBudget.flowers) || 0;
    const music = parseFloat(weddingBudget.music) || 0;
    const other = parseFloat(weddingBudget.other) || 0;
    return venue + photography + attire + flowers + music + other;
  };

  // AI-powered cost estimation based on destination
  const getAICostEstimates = (destination: string) => {
    const dest = destination.toLowerCase().trim();
    
    // Cost estimates based on destination (average per person for 5-7 days)
    const estimates = {
      // Popular US destinations
      'new york': { flights: 400, accommodation: 800, food: 350, activities: 300, transport: 150 },
      'nyc': { flights: 400, accommodation: 800, food: 350, activities: 300, transport: 150 },
      'los angeles': { flights: 350, accommodation: 600, food: 300, activities: 250, transport: 200 },
      'la': { flights: 350, accommodation: 600, food: 300, activities: 250, transport: 200 },
      'miami': { flights: 300, accommodation: 500, food: 250, activities: 200, transport: 100 },
      'las vegas': { flights: 250, accommodation: 400, food: 200, activities: 400, transport: 80 },
      'chicago': { flights: 300, accommodation: 450, food: 250, activities: 200, transport: 120 },
      'san francisco': { flights: 400, accommodation: 700, food: 400, activities: 300, transport: 150 },
      
      // International destinations
      'paris': { flights: 800, accommodation: 600, food: 300, activities: 250, transport: 100 },
      'london': { flights: 700, accommodation: 650, food: 350, activities: 300, transport: 120 },
      'tokyo': { flights: 1200, accommodation: 500, food: 250, activities: 200, transport: 100 },
      'barcelona': { flights: 600, accommodation: 400, food: 200, activities: 150, transport: 80 },
      'rome': { flights: 650, accommodation: 450, food: 250, activities: 200, transport: 90 },
      'amsterdam': { flights: 550, accommodation: 500, food: 300, activities: 200, transport: 100 },
      'bali': { flights: 1000, accommodation: 200, food: 150, activities: 200, transport: 100 },
      'thailand': { flights: 900, accommodation: 150, food: 100, activities: 150, transport: 80 },
      'mexico': { flights: 300, accommodation: 250, food: 150, activities: 200, transport: 100 },
      'cancun': { flights: 350, accommodation: 300, food: 200, activities: 250, transport: 120 },
      
      // Default estimates for unknown destinations
      'default': { flights: 500, accommodation: 400, food: 250, activities: 200, transport: 100 }
    };
    
    return estimates[dest] || estimates['default'];
  };

  // Update goal amount from template calculations
  const updateGoalFromTemplate = () => {
    let total = 0;
    if (selectedCategory?.id === 'travel') {
      total = calculateTravelTotal();
    } else if (selectedCategory?.id === 'emergency') {
      total = calculateEmergencyTotal();
    } else if (selectedCategory?.id === 'home') {
      total = calculateHomeTotal();
    } else if (selectedCategory?.id === 'wedding') {
      total = calculateWeddingTotal();
    }
    
    if (total > 0) {
      setGoalCents(total.toString());
      setCalculatorKey(prev => prev + 1);
    }
  };

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

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
    let targetDateObj = null;
    let isValidDate = false;
    
    if (tripDate) {
      targetDateObj = tripDate;
      isValidDate = !isNaN(tripDate.getTime());
      
      // Check if we have a valid future date
      if (!isNaN(targetDateObj.getTime()) && targetDateObj > new Date()) {
        isValidDate = true;
      }
    }
    
    // Show calculator even with $0 goal to encourage users to set amounts
    if (members <= 0) return null;
    
    let monthsRemaining = 12; // Default to 12 months if no target date
    let perPersonPerMonth = goalAmount / members / monthsRemaining;
    
    if (isValidDate && targetDateObj) {
      const today = new Date();
      const diffTime = targetDateObj.getTime() - today.getTime();
      monthsRemaining = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44))); // Average days per month
      perPersonPerMonth = goalAmount / members / monthsRemaining;
    }
    
    return {
      totalGoal: goalAmount,
      members: members,
      monthsRemaining: monthsRemaining,
      perPersonPerMonth: perPersonPerMonth,
      targetDate: targetDateObj,
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
      
      const result = await api.createPool(user.id, name.trim(), goal, destination.trim(), tripDate?.toISOString() || null, poolType, penaltyData);
      console.log('Pool creation result:', result);
      const successMessage = poolType === 'solo' 
        ? 'Solo goal created! 🎯'
        : 'Pool created! 🎉';
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
                : "✈️ Pack your bags and make memories — adventure is calling!")}
              {selectedCategory?.id === 'education' && "📚 Invest in yourself — it's the one investment that always pays dividends!"}
              {selectedCategory?.id === 'wedding' && "💍 Your dream wedding deserves dream funding — let's make your special day perfect!"}
              {selectedCategory?.id === 'home' && "🏡 Turning Zillow dreams into front-door keys — brick by brick, save by save!"}
              {selectedCategory?.id === 'car' && "🚗 Vroom vroom energy activated — your dream ride is fueling up one contribution at a time!"}
              {selectedCategory?.id === 'tech' && "📱 That upgrade won't pay for itself — save now, unbox happiness later!"}
              {selectedCategory?.id === 'emergency' && "🛡️ Building your safety net together — because life happens, but you'll be ready!"}
              {selectedCategory?.id === 'friends_family' && "❤️ Our little 'seeing each other' fund for when we miss each other too much!"}
              {selectedCategory.id === 'business' && "💼 Turning business dreams into reality — one contribution at a time!"}
              {selectedCategory.id === 'other' && "🎯 Custom goals deserve custom wins — you're building something uniquely yours together!"}
            </Text>
          </View>
        )}

        <Text style={{ fontSize:18, fontWeight:'700', color: colors.text, marginBottom:8 }}>
          {poolType === 'solo' ? 'Goal Name' : 'Pool Name'}
        </Text>
        <TextInput 
          value={name} 
          onChangeText={setName} 
          style={{ backgroundColor:'white', padding:16, borderRadius: radius.medium, marginBottom:16, fontSize:16 }} 
          placeholder={getFillerText(selectedCategory?.id, poolType)} 
        />

        {/* Category-specific templates */}
        {selectedCategory?.id === 'travel' && (
          <View style={{ 
            backgroundColor: 'white', 
            padding: 20, 
            borderRadius: 16, 
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
            borderWidth: 1,
            borderColor: colors.blue + '20'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ 
                backgroundColor: colors.blue + '15', 
                padding: 8, 
                borderRadius: 12, 
                marginRight: 12 
              }}>
                <Text style={{ fontSize: 20 }}>✈️</Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, flex: 1 }}>
                Travel Budget Planner
              </Text>
            </View>
            
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 16, marginRight: 6 }}>🌍</Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>Where are you going?</Text>
              </View>
              <TextInput 
                placeholder="Enter destination (e.g., Paris, Tokyo, NYC)"
                value={destination}
                onChangeText={setDestination}
                style={{ 
                  backgroundColor: colors.blue + '08', 
                  padding: 14, 
                  borderRadius: 12, 
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: colors.blue + '20',
                  fontWeight: '500'
                }}
              />
            </View>
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <View style={{ flex: 1, minWidth: '45%' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 16, marginRight: 6 }}>🛫</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Flights</Text>
                </View>
                <TextInput 
                  placeholder={destination ? `$${getAICostEstimates(destination).flights}` : "$0"}
                  keyboardType="numeric"
                  value={travelBudget.flights}
                  onChangeText={(text) => {
                    setTravelBudget(prev => ({ ...prev, flights: text }));
                    updateGoalFromTemplate();
                  }}
                  style={{ 
                    backgroundColor: colors.blue + '08', 
                    padding: 14, 
                    borderRadius: 12, 
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: colors.blue + '20',
                    fontWeight: '600'
                  }}
                />
              </View>
              
              <View style={{ flex: 1, minWidth: '45%' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 16, marginRight: 6 }}>🏨</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Stay</Text>
                </View>
                <TextInput 
                  placeholder={destination ? `$${getAICostEstimates(destination).accommodation}` : "$0"}
                  keyboardType="numeric"
                  value={travelBudget.accommodation}
                  onChangeText={(text) => {
                    setTravelBudget(prev => ({ ...prev, accommodation: text }));
                    updateGoalFromTemplate();
                  }}
                  style={{ 
                    backgroundColor: colors.blue + '08', 
                    padding: 14, 
                    borderRadius: 12, 
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: colors.blue + '20',
                    fontWeight: '600'
                  }}
                />
              </View>
              
              <View style={{ flex: 1, minWidth: '45%' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 16, marginRight: 6 }}>🍜</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Food</Text>
                </View>
                <TextInput 
                  placeholder={destination ? `$${getAICostEstimates(destination).food}` : "$0"}
                  keyboardType="numeric"
                  value={travelBudget.food}
                  onChangeText={(text) => {
                    setTravelBudget(prev => ({ ...prev, food: text }));
                    updateGoalFromTemplate();
                  }}
                  style={{ 
                    backgroundColor: colors.blue + '08', 
                    padding: 14, 
                    borderRadius: 12, 
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: colors.blue + '20',
                    fontWeight: '600'
                  }}
                />
              </View>
              
              <View style={{ flex: 1, minWidth: '45%' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 16, marginRight: 6 }}>🎯</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Activities</Text>
                </View>
                <TextInput 
                  placeholder={destination ? `$${getAICostEstimates(destination).activities}` : "$0"}
                  keyboardType="numeric"
                  value={travelBudget.activities}
                  onChangeText={(text) => {
                    setTravelBudget(prev => ({ ...prev, activities: text }));
                    updateGoalFromTemplate();
                  }}
                  style={{ 
                    backgroundColor: colors.blue + '08', 
                    padding: 14, 
                    borderRadius: 12, 
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: colors.blue + '20',
                    fontWeight: '600'
                  }}
                />
              </View>
              
              <View style={{ flex: 1, minWidth: '45%' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 16, marginRight: 6 }}>🚗</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Transport</Text>
                </View>
                <TextInput 
                  placeholder={destination ? `$${getAICostEstimates(destination).transport}` : "$0"}
                  keyboardType="numeric"
                  value={travelBudget.transport}
                  onChangeText={(text) => {
                    setTravelBudget(prev => ({ ...prev, transport: text }));
                    updateGoalFromTemplate();
                  }}
                  style={{ 
                    backgroundColor: colors.blue + '08', 
                    padding: 14, 
                    borderRadius: 12, 
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: colors.blue + '20',
                    fontWeight: '600'
                  }}
                />
              </View>
            </View>
            
            {calculateTravelTotal() > 0 && (
              <View style={{ 
                backgroundColor: colors.blue + '10', 
                padding: 16, 
                borderRadius: 12, 
                marginTop: 16,
                borderWidth: 1,
                borderColor: colors.blue + '30'
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, color: colors.text, fontWeight: '600' }}>Total per person</Text>
                  <Text style={{ fontSize: 20, color: colors.blue, fontWeight: '800' }}>
                    ${calculateTravelTotal().toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {selectedCategory?.id === 'emergency' && (
          <View style={{ 
            backgroundColor: 'white', 
            padding: 20, 
            borderRadius: 16, 
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
            borderWidth: 1,
            borderColor: colors.green + '20'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ 
                backgroundColor: colors.green + '15', 
                padding: 8, 
                borderRadius: 12, 
                marginRight: 12 
              }}>
                <Text style={{ fontSize: 20 }}>🛡️</Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, flex: 1 }}>
                Emergency Fund Calculator
              </Text>
            </View>
            
            <View style={{ gap: 16 }}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 16, marginRight: 6 }}>💰</Text>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>Monthly Expenses</Text>
                </View>
                <TextInput 
                  placeholder="Enter your monthly expenses"
                  keyboardType="numeric"
                  value={emergencyBudget.monthlyExpenses}
                  onChangeText={(text) => {
                    setEmergencyBudget(prev => ({ ...prev, monthlyExpenses: text }));
                    updateGoalFromTemplate();
                  }}
                  style={{ 
                    backgroundColor: colors.green + '08', 
                    padding: 16, 
                    borderRadius: 12, 
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: colors.green + '20',
                    fontWeight: '600'
                  }}
                />
              </View>
              
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 16, marginRight: 6 }}>📅</Text>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>Months to Save For</Text>
                </View>
                <TextInput 
                  placeholder="How many months? (3-12 recommended)"
                  keyboardType="numeric"
                  value={emergencyBudget.months}
                  onChangeText={(text) => {
                    setEmergencyBudget(prev => ({ ...prev, months: text }));
                    updateGoalFromTemplate();
                  }}
                  style={{ 
                    backgroundColor: colors.green + '08', 
                    padding: 16, 
                    borderRadius: 12, 
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: colors.green + '20',
                    fontWeight: '600'
                  }}
                />
              </View>
            </View>
            
            {calculateEmergencyTotal() > 0 && (
              <View style={{ 
                backgroundColor: colors.green + '10', 
                padding: 16, 
                borderRadius: 12, 
                marginTop: 16,
                borderWidth: 1,
                borderColor: colors.green + '30'
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, color: colors.text, fontWeight: '600' }}>Total needed</Text>
                  <Text style={{ fontSize: 20, color: colors.green, fontWeight: '800' }}>
                    ${calculateEmergencyTotal().toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
            
            <View style={{ backgroundColor: colors.green + '08', padding: 14, borderRadius: 12, marginTop: 16, borderWidth: 1, borderColor: colors.green + '15' }}>
              <Text style={{ fontSize: 13, color: colors.text, lineHeight: 18, textAlign: 'center' }}>
                💡 Experts recommend 3-6 months for most people, 6-12 months if self-employed
              </Text>
            </View>
          </View>
        )}

        {selectedCategory?.id === 'home' && (
          <View style={{ 
            backgroundColor: 'white', 
            padding: 20, 
            borderRadius: 16, 
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
            borderWidth: 1,
            borderColor: colors.orange + '20'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ 
                backgroundColor: colors.orange + '15', 
                padding: 8, 
                borderRadius: 12, 
                marginRight: 12 
              }}>
                <Text style={{ fontSize: 20 }}>🏠</Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, flex: 1 }}>
                Home Purchase Calculator
              </Text>
            </View>
            
            <View style={{ gap: 16 }}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 16, marginRight: 6 }}>🏡</Text>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>Home Price</Text>
                </View>
                <TextInput 
                  placeholder="Enter target home price"
                  keyboardType="numeric"
                  value={homeBudget.homePrice}
                  onChangeText={(text) => {
                    setHomeBudget(prev => ({ ...prev, homePrice: text }));
                    updateGoalFromTemplate();
                  }}
                  style={{ 
                    backgroundColor: colors.orange + '08', 
                    padding: 16, 
                    borderRadius: 12, 
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: colors.orange + '20',
                    fontWeight: '600'
                  }}
                />
              </View>
              
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 16, marginRight: 6 }}>📊</Text>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>Down Payment %</Text>
                </View>
                <TextInput 
                  placeholder="Enter % (typically 10-20%)"
                  keyboardType="numeric"
                  value={homeBudget.downPaymentPercent}
                  onChangeText={(text) => {
                    setHomeBudget(prev => ({ ...prev, downPaymentPercent: text }));
                    updateGoalFromTemplate();
                  }}
                  style={{ 
                    backgroundColor: colors.orange + '08', 
                    padding: 16, 
                    borderRadius: 12, 
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: colors.orange + '20',
                    fontWeight: '600'
                  }}
                />
              </View>
              
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontSize: 16, marginRight: 6 }}>📋</Text>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>Closing</Text>
                  </View>
                  <TextInput 
                    placeholder="Closing costs"
                    keyboardType="numeric"
                    value={homeBudget.closingCosts}
                    onChangeText={(text) => {
                      setHomeBudget(prev => ({ ...prev, closingCosts: text }));
                      updateGoalFromTemplate();
                    }}
                    style={{ 
                      backgroundColor: colors.orange + '08', 
                      padding: 16, 
                      borderRadius: 12, 
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: colors.orange + '20',
                      fontWeight: '600'
                    }}
                  />
                </View>
                
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontSize: 16, marginRight: 6 }}>🔧</Text>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>Moving</Text>
                  </View>
                  <TextInput 
                    placeholder="Moving costs"
                    keyboardType="numeric"
                    value={homeBudget.movingCosts}
                    onChangeText={(text) => {
                      setHomeBudget(prev => ({ ...prev, movingCosts: text }));
                      updateGoalFromTemplate();
                    }}
                    style={{ 
                      backgroundColor: colors.orange + '08', 
                      padding: 16, 
                      borderRadius: 12, 
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: colors.orange + '20',
                      fontWeight: '600'
                    }}
                  />
                </View>
              </View>
            </View>
            
            {calculateHomeTotal() > 0 && (
              <View style={{ 
                backgroundColor: colors.orange + '10', 
                padding: 16, 
                borderRadius: 12, 
                marginTop: 16,
                borderWidth: 1,
                borderColor: colors.orange + '30'
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, color: colors.text, fontWeight: '600' }}>Total needed</Text>
                  <Text style={{ fontSize: 20, color: colors.orange, fontWeight: '800' }}>
                    ${calculateHomeTotal().toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {selectedCategory?.id === 'wedding' && (
          <View style={{ 
            backgroundColor: 'white', 
            padding: 20, 
            borderRadius: 16, 
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
            borderWidth: 1,
            borderColor: colors.pink + '20'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ 
                backgroundColor: colors.pink + '15', 
                padding: 8, 
                borderRadius: 12, 
                marginRight: 12 
              }}>
                <Text style={{ fontSize: 20 }}>💒</Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, flex: 1 }}>
                Wedding Budget Planner
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <View style={{ flex: 1, minWidth: '45%' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 16, marginRight: 6 }}>🏛️</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Venue</Text>
                </View>
                <TextInput 
                  placeholder="$0"
                  keyboardType="numeric"
                  value={weddingBudget.venue}
                  onChangeText={(text) => {
                    setWeddingBudget(prev => ({ ...prev, venue: text }));
                    updateGoalFromTemplate();
                  }}
                  style={{ 
                    backgroundColor: colors.pink + '08', 
                    padding: 14, 
                    borderRadius: 12, 
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: colors.pink + '20',
                    fontWeight: '600'
                  }}
                />
              </View>
              
              <View style={{ flex: 1, minWidth: '45%' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 16, marginRight: 6 }}>📸</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Photo</Text>
                </View>
                <TextInput 
                  placeholder="$0"
                  keyboardType="numeric"
                  value={weddingBudget.photography}
                  onChangeText={(text) => {
                    setWeddingBudget(prev => ({ ...prev, photography: text }));
                    updateGoalFromTemplate();
                  }}
                  style={{ 
                    backgroundColor: colors.pink + '08', 
                    padding: 14, 
                    borderRadius: 12, 
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: colors.pink + '20',
                    fontWeight: '600'
                  }}
                />
              </View>
              
              <View style={{ flex: 1, minWidth: '45%' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 16, marginRight: 6 }}>👗</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Attire</Text>
                </View>
                <TextInput 
                  placeholder="$0"
                  keyboardType="numeric"
                  value={weddingBudget.attire}
                  onChangeText={(text) => {
                    setWeddingBudget(prev => ({ ...prev, attire: text }));
                    updateGoalFromTemplate();
                  }}
                  style={{ 
                    backgroundColor: colors.pink + '08', 
                    padding: 14, 
                    borderRadius: 12, 
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: colors.pink + '20',
                    fontWeight: '600'
                  }}
                />
              </View>
              
              <View style={{ flex: 1, minWidth: '45%' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 16, marginRight: 6 }}>💐</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Flowers</Text>
                </View>
                <TextInput 
                  placeholder="$0"
                  keyboardType="numeric"
                  value={weddingBudget.flowers}
                  onChangeText={(text) => {
                    setWeddingBudget(prev => ({ ...prev, flowers: text }));
                    updateGoalFromTemplate();
                  }}
                  style={{ 
                    backgroundColor: colors.pink + '08', 
                    padding: 14, 
                    borderRadius: 12, 
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: colors.pink + '20',
                    fontWeight: '600'
                  }}
                />
              </View>
              
              <View style={{ flex: 1, minWidth: '45%' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 16, marginRight: 6 }}>🎵</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Music</Text>
                </View>
                <TextInput 
                  placeholder="$0"
                  keyboardType="numeric"
                  value={weddingBudget.music}
                  onChangeText={(text) => {
                    setWeddingBudget(prev => ({ ...prev, music: text }));
                    updateGoalFromTemplate();
                  }}
                  style={{ 
                    backgroundColor: colors.pink + '08', 
                    padding: 14, 
                    borderRadius: 12, 
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: colors.pink + '20',
                    fontWeight: '600'
                  }}
                />
              </View>
              
              <View style={{ flex: 1, minWidth: '45%' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 16, marginRight: 6 }}>📋</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Other</Text>
                </View>
                <TextInput 
                  placeholder="$0"
                  keyboardType="numeric"
                  value={weddingBudget.other}
                  onChangeText={(text) => {
                    setWeddingBudget(prev => ({ ...prev, other: text }));
                    updateGoalFromTemplate();
                  }}
                  style={{ 
                    backgroundColor: colors.pink + '08', 
                    padding: 14, 
                    borderRadius: 12, 
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: colors.pink + '20',
                    fontWeight: '600'
                  }}
                />
              </View>
            </View>
            
            {calculateWeddingTotal() > 0 && (
              <View style={{ 
                backgroundColor: colors.pink + '10', 
                padding: 16, 
                borderRadius: 12, 
                marginTop: 16,
                borderWidth: 1,
                borderColor: colors.pink + '30'
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, color: colors.text, fontWeight: '600' }}>Total budget</Text>
                  <Text style={{ fontSize: 20, color: colors.pink, fontWeight: '800' }}>
                    ${calculateWeddingTotal().toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}


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
            {tripDate ? tripDate.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }) : 'Tap to select target date'}
          </Text>
          <Text style={{ fontSize: 16, color: '#999' }}>📅</Text>
        </TouchableOpacity>
        
        {showDatePicker && (
          <ScrollingCalendar
            onDateSelect={(date: Date) => {
              setTripDate(date);
              setShowDatePicker(false);
              setCalculatorKey(prev => prev + 1);
            }}
            onClose={() => setShowDatePicker(false)}
            initialDate={tripDate || null}
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
                  {calculation.isValidDate ? `${calculation.monthsRemaining} month${calculation.monthsRemaining !== 1 ? 's' : ''}` : '12 months (default)'}
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

        {/* Gamification Preview */}
        
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
