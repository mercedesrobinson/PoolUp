import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';

export default function CreatePool({ navigation, route }){
  const { user } = route.params;
  const [name, setName] = useState('');
  const [goalCents, setGoalCents] = useState('');
  const [destination, setDestination] = useState('');
  const [tripDate, setTripDate] = useState('');
  const [poolType, setPoolType] = useState(route.params?.poolType || 'group');
  const [savingPurpose, setSavingPurpose] = useState('');
  const [customPurpose, setCustomPurpose] = useState('');
  const [destinationFact, setDestinationFact] = useState('');
  const [expectedMembers, setExpectedMembers] = useState('1');
  const [enableCalculator, setEnableCalculator] = useState(false);

  const getDestinationFact = (dest) => {
    const location = dest.toLowerCase().trim();
    const facts = {
      // Major US Cities
      'detroit': "🎵 Detroit is the birthplace of Motown! Berry Gordy Jr. founded Motown Records here in 1959, launching legends like Stevie Wonder, Diana Ross, and The Jackson 5.",
      'new york': "🗽 NYC has over 800 languages spoken—it's the most linguistically diverse city in the world!",
      'los angeles': "🌟 LA produces more entertainment content than anywhere else on Earth—you might spot a celebrity!",
      'chicago': "🏗️ Chicago invented the skyscraper! The Home Insurance Building (1885) was the world's first.",
      'miami': "🏖️ Miami Beach's Art Deco District has the world's largest collection of Art Deco architecture!",
      'las vegas': "🎰 Vegas uses more electricity per capita than anywhere in the US—all those neon lights!",
      'san francisco': "🌉 The Golden Gate Bridge's International Orange color was chosen to enhance visibility in fog!",
      'seattle': "☕ Seattle has more coffee shops per capita than any other US city—caffeine paradise!",
      'austin': "🎸 Austin's slogan 'Keep Austin Weird' started as a bumper sticker to support local businesses!",
      'nashville': "🎤 Nashville's Grand Ole Opry is the longest-running radio show in history (since 1925)!",
      
      // International Destinations
      'tokyo': "🍣 Tokyo has more Michelin-starred restaurants than any other city in the world!",
      'paris': "🥐 Paris has over 400 parks and gardens—perfect for picnics with fresh croissants!",
      'london': "☂️ London's red double-decker buses were originally painted different colors for different routes!",
      'rome': "🏛️ Rome has more fountains than any other city—legend says tossing a coin in Trevi guarantees your return!",
      'barcelona': "🏛️ Gaudí's Sagrada Família has been under construction for over 140 years and counting!",
      'amsterdam': "🚲 Amsterdam has more bikes than residents—over 880,000 bicycles for 820,000 people!",
      'thailand': "🐘 Thailand is home to over 3,000 elephants and has more Buddhist temples than any other country!",
      'bali': "🌺 Bali has over 20,000 temples and is known as the 'Island of the Gods'!",
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
    const targetDate = tripDate ? new Date(tripDate) : null;
    
    if (goalAmount <= 0 || members <= 0) return null;
    
    let monthsRemaining = 12; // Default to 12 months if no date
    if (targetDate) {
      const today = new Date();
      const diffTime = targetDate.getTime() - today.getTime();
      monthsRemaining = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44))); // Average days per month
    }
    
    const perPersonPerMonth = goalAmount / members / monthsRemaining;
    
    return {
      totalGoal: goalAmount,
      members: members,
      monthsRemaining: monthsRemaining,
      perPersonPerMonth: perPersonPerMonth,
      targetDate: targetDate
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
      const goal = Math.round(parseFloat(goalCents) * 100);
      if(goal <= 0) return Alert.alert('Error','Valid goal amount required');
      
      console.log('Creating pool with data:', { userId: user.id, name: name.trim(), goal, destination: destination.trim(), tripDate, poolType });
      const result = await api.createPool(user.id, name.trim(), goal, destination.trim(), tripDate, poolType);
      console.log('Pool creation result:', result);
      const successMessage = poolType === 'solo' 
        ? 'Solo goal created! 🎯\n\n• Personal challenges activated\n• Public encouragement enabled\n• Streak tracking started'
        : 'Pool created with gamification features! 🎉\n\n• Challenges activated\n• Unlockables ready\n• Leaderboard initialized';
      Alert.alert('Success!', successMessage, [
        {
          text: 'OK',
          onPress: () => {
            // Navigate back and force refresh
            navigation.navigate('Pools', { user, refresh: Date.now() });
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

        {/* Purpose for Saving */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize:18, fontWeight:'700', color: colors.text, marginBottom:12 }}>What are you saving for?</Text>
          
          <TouchableOpacity 
            style={{ 
              backgroundColor: 'white', 
              padding: 16, 
              borderRadius: radius, 
              borderWidth: 1, 
              borderColor: '#ddd',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
            onPress={() => {
              const purposes = [
                { id: 'trip', emoji: '✈️', label: 'Trip', color: colors.blue },
                { id: 'wedding', emoji: '💍', label: 'Wedding', color: colors.coral },
                { id: 'house', emoji: '🏡', label: 'House', color: colors.green },
                { id: 'car', emoji: '🚗', label: 'Car', color: colors.purple },
                { id: 'emergency', emoji: '🛡️', label: 'Emergency Fund', color: '#FF6B6B' },
                { id: 'general', emoji: '💪', label: 'General Savings', color: colors.primary },
                { id: 'education', emoji: '🎓', label: 'Education', color: '#9B59B6' },
                { id: 'celebration', emoji: '🎉', label: 'Big Celebration', color: '#F39C12' },
                { id: 'pet', emoji: '🐶', label: 'Pet', color: '#E67E22' },
                { id: 'tech', emoji: '🎮', label: 'Tech / Gadgets', color: '#34495E' },
                { id: 'hobbies', emoji: '🏀', label: 'Sports / Hobbies', color: '#E74C3C' },
                { id: 'gifts', emoji: '🎁', label: 'Holiday Gifts', color: '#27AE60' },
                { id: 'dining', emoji: '🍽️', label: 'Foodie / Dining', color: '#D35400' }
              ];
              
              Alert.alert(
                'Choose Your Saving Purpose',
                'What are you working towards?',
                purposes.map(purpose => ({
                  text: `${purpose.emoji} ${purpose.label}`,
                  onPress: () => setSavingPurpose(purpose.id)
                })).concat([
                  { 
                    text: '✏️ Other (Custom)', 
                    onPress: () => {
                      Alert.prompt(
                        'Custom Saving Purpose',
                        'What are you saving for?',
                        (text) => {
                          if (text && text.trim()) {
                            setCustomPurpose(text.trim());
                            setSavingPurpose('custom');
                          }
                        },
                        'plain-text',
                        '',
                        'default'
                      );
                    }
                  },
                  { text: 'Cancel', style: 'cancel' }
                ])
              );
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {savingPurpose ? (
                <>
                  <Text style={{ fontSize: 18, marginRight: 12 }}>
                    {savingPurpose === 'trip' && '✈️'}
                    {savingPurpose === 'wedding' && '💍'}
                    {savingPurpose === 'house' && '🏡'}
                    {savingPurpose === 'car' && '🚗'}
                    {savingPurpose === 'emergency' && '🛡️'}
                    {savingPurpose === 'general' && '💪'}
                    {savingPurpose === 'education' && '🎓'}
                    {savingPurpose === 'celebration' && '🎉'}
                    {savingPurpose === 'pet' && '🐶'}
                    {savingPurpose === 'tech' && '🎮'}
                    {savingPurpose === 'hobbies' && '🏀'}
                    {savingPurpose === 'gifts' && '🎁'}
                    {savingPurpose === 'dining' && '🍽️'}
                    {savingPurpose === 'custom' && '✏️'}
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                    {savingPurpose === 'trip' && 'Trip'}
                    {savingPurpose === 'wedding' && 'Wedding'}
                    {savingPurpose === 'house' && 'House'}
                    {savingPurpose === 'car' && 'Car'}
                    {savingPurpose === 'emergency' && 'Emergency Fund'}
                    {savingPurpose === 'general' && 'General Savings'}
                    {savingPurpose === 'education' && 'Education'}
                    {savingPurpose === 'celebration' && 'Big Celebration'}
                    {savingPurpose === 'pet' && 'Pet'}
                    {savingPurpose === 'tech' && 'Tech / Gadgets'}
                    {savingPurpose === 'hobbies' && 'Sports / Hobbies'}
                    {savingPurpose === 'gifts' && 'Holiday Gifts'}
                    {savingPurpose === 'dining' && 'Foodie / Dining'}
                    {savingPurpose === 'custom' && customPurpose}
                  </Text>
                </>
              ) : (
                <Text style={{ fontSize: 16, color: '#999' }}>Select a saving purpose...</Text>
              )}
            </View>
            <Text style={{ fontSize: 16, color: '#999' }}>▼</Text>
          </TouchableOpacity>
          
          {/* Purpose-specific messaging */}
          {savingPurpose && (
            <View style={{ 
              backgroundColor: savingPurpose === 'trip' ? colors.blue + '20' : 
                             savingPurpose === 'wedding' ? colors.coral + '20' :
                             savingPurpose === 'house' ? colors.green + '20' :
                             savingPurpose === 'car' ? colors.purple + '20' :
                             savingPurpose === 'emergency' ? '#FF6B6B20' :
                             savingPurpose === 'education' ? '#9B59B620' :
                             savingPurpose === 'celebration' ? '#F39C1220' :
                             savingPurpose === 'pet' ? '#E67E2220' :
                             savingPurpose === 'tech' ? '#34495E20' :
                             savingPurpose === 'hobbies' ? '#E74C3C20' :
                             savingPurpose === 'gifts' ? '#27AE6020' :
                             savingPurpose === 'dining' ? '#D3540020' :
                             colors.primary + '20',
              padding: 16, 
              borderRadius: radius, 
              marginTop: 12 
            }}>
              <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500', textAlign: 'center' }}>
                {savingPurpose === 'trip' && (poolType === 'group' 
                  ? "🌍 Finally take that trip out of the group chat—let's make it real this time!"
                  : "✈️ Your solo adventure awaits—pack your bags and your savings account!")}
                {savingPurpose === 'wedding' && (poolType === 'group'
                  ? "💕 From 'Will you?' to 'I do!'—every contribution brings the party closer."
                  : "💍 Your dream wedding fund—because you deserve to walk down the aisle in style!")}
                {savingPurpose === 'house' && (poolType === 'group'
                  ? "🏡 Turning Zillow dreams into front-door keys—brick by brick, save by save."
                  : "🏠 Your future home is calling—time to turn house hunting into house buying!")}
                {savingPurpose === 'car' && (poolType === 'group'
                  ? "🚗 Vroom vroom energy activated—your dream ride is fueling up one contribution at a time!"
                  : "🚙 That car upgrade isn't going to finance itself—rev up those savings!")}
                {savingPurpose === 'emergency' && "🛡️ Life happens. You'll be ready. Peace of mind is the best ROI."}
                {savingPurpose === 'general' && "💪 Every dollar's a rep in the financial gym—keep flexing that savings muscle!"}
                {savingPurpose === 'education' && (poolType === 'group'
                  ? "📚 Degrees aren't cheap—but your future self will thank you for this tuition piggy bank."
                  : "🎓 Investing in yourself is the best investment—your brain (and wallet) will thank you!")}
                {savingPurpose === 'celebration' && (poolType === 'group'
                  ? "🎉 Balloons, cake, and good vibes—let's party without the IOUs."
                  : "🥳 Your special day deserves special funding—celebrate without the credit card regret!")}
                {savingPurpose === 'pet' && "🐾 For the 'oops, my dog ate a sock' vet bills and the cutest splurges—because fur babies deserve the best."}
                {savingPurpose === 'tech' && (poolType === 'group'
                  ? "📱 That upgrade won't pay for itself—save now, unbox happiness later."
                  : "💻 New tech, new you—time to upgrade your life one gadget at a time!")}
                {savingPurpose === 'hobbies' && (poolType === 'group'
                  ? "🏀 Gear up, level up, glow up—whether it's sneakers, golf clubs, or guitars, your hobby fund is in play."
                  : "⚽ Your passion project needs funding—time to invest in what makes you happy!")}
                {savingPurpose === 'gifts' && (poolType === 'group'
                  ? "🎁 Santa called—he said budgeting now beats maxing out the credit card later."
                  : "🎀 Generous hearts need generous budgets—save now, give big later!")}
                {savingPurpose === 'dining' && (poolType === 'group'
                  ? "🍣 Because sushi dates and taco Tuesdays hit different when they're guilt-free."
                  : "🍽️ Your foodie adventures deserve proper funding—eat well, save smart!")}
                {savingPurpose === 'custom' && (poolType === 'group'
                  ? "💡 Custom goals deserve custom wins—you're building something uniquely yours together!"
                  : "✨ Your unique goal, your unique journey—time to make it happen!")}
              </Text>
            </View>
          )}
        </View>

        <Text style={{ fontSize:18, fontWeight:'700', color: colors.text, marginBottom:8 }}>
          {poolType === 'solo' ? 'Goal Name' : 'Pool Name'}
        </Text>
        <TextInput 
          value={name} 
          onChangeText={setName} 
          style={{ backgroundColor:'white', padding:16, borderRadius:radius, marginBottom:18, fontSize:16 }} 
          placeholder="e.g. Tokyo Trip 2024" 
        />
        
        <Text style={{ fontSize:18, fontWeight:'700', color: colors.text, marginBottom:8 }}>Goal Amount</Text>
        <TextInput 
          value={goalCents} 
          onChangeText={setGoalCents} 
          keyboardType="numeric" 
          style={{ backgroundColor:'white', padding:16, borderRadius:radius, marginBottom:18, fontSize:16 }} 
          placeholder="1000" 
        />

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
                  marginRight: 4
                }}>
                  {enableCalculator ? 'ON' : 'OFF'}
                </Text>
                <Text style={{ fontSize: 10 }}>
                  {enableCalculator ? '✅' : '⚪'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 16, lineHeight: 20 }}>
              Let PoolUp calculate how much each person needs to save monthly to reach your goal. We'll automatically update amounts when friends join or leave your group.
            </Text>
            
            {enableCalculator && (
              <>
                <Text style={{ fontSize:16, fontWeight:'600', color: colors.text, marginBottom:8 }}>Expected Group Size</Text>
                <TextInput 
                  value={expectedMembers} 
                  onChangeText={setExpectedMembers} 
                  keyboardType="numeric" 
                  style={{ backgroundColor:'white', padding:16, borderRadius:radius, marginBottom:12, fontSize:16 }} 
                  placeholder="7" 
                />
                <Text style={{ fontSize:12, color:'#666', marginBottom:16 }}>
                  💡 This helps us calculate monthly contributions—don't worry if it changes later!
                </Text>
              </>
            )}
          </View>
        )}

        <Text style={{ fontSize:18, fontWeight:'700', color: colors.text, marginBottom:8 }}>
          🌍 Destination (Optional)
        </Text>
        <TextInput 
          value={destination} 
          onChangeText={handleDestinationChange} 
          style={{ backgroundColor:'white', padding:16, borderRadius:radius, marginBottom:12, fontSize:16 }} 
          placeholder="e.g. Tokyo, Japan" 
        />
        
        {destinationFact ? (
          <View style={{ 
            backgroundColor: colors.blue + '15', 
            padding: 16, 
            borderRadius: radius, 
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
          📅 Trip Date (Optional)
        </Text>
        <TextInput 
          value={tripDate} 
          onChangeText={setTripDate} 
          style={{ backgroundColor:'white', padding:16, borderRadius:radius, marginBottom:24, fontSize:16 }} 
          placeholder="e.g. 2024-12-25" 
        />
        <Text style={{ fontSize:12, color:'#666', marginBottom:24, marginTop:-18 }}>
          Format: YYYY-MM-DD
        </Text>

        {/* Savings Calculator */}
        {(() => {
          const calculation = calculateMonthlySavings();
          if (!calculation || !enableCalculator) return null;
          
          return (
            <View style={{ 
              backgroundColor: colors.green + '15', 
              padding: 20, 
              borderRadius: radius, 
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
                borderRadius: radius, 
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
        <View style={{ backgroundColor: colors.blue + '20', padding: 16, borderRadius: radius, marginBottom: 24 }}>
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
          <ScrollView style={{ backgroundColor: '#E8F5E8', padding: 16, borderRadius: radius, marginBottom: 16, maxHeight: 200 }}>
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
          <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius, marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
              👥 Add Members (Optional)
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>
              You can invite friends now or add them later
            </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('InviteFriends', { poolName: name || 'New Pool' })}
              style={{ backgroundColor: colors.blue, padding: 12, borderRadius: radius, alignItems: 'center' }}
            >
              <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                📧 Send Invites Now
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity onPress={create} style={{ backgroundColor: colors.purple, padding:16, borderRadius:radius, alignItems:'center' }}>
          <Text style={{ color:'white', fontSize:18, fontWeight:'700' }}>
            {poolType === 'group' ? 'Create Pool' : 'Create Solo Goal'}
          </Text>
        </TouchableOpacity>
        
        {poolType === 'group' && (
          <View style={{ backgroundColor: colors.green + '20', padding: 16, borderRadius: radius, marginTop: 12 }}>
            <Text style={{ fontSize: 14, color: colors.green, textAlign: 'center', fontWeight: '500' }}>
              💡 After creating your pool, you can invite more friends anytime from the pool details page
            </Text>
          </View>
        )}

        {poolType === 'solo' && (
          <TouchableOpacity 
            onPress={() => navigation.navigate('AccountabilityPartners')}
            style={{ backgroundColor: colors.blue, padding:16, borderRadius:radius, alignItems:'center', marginTop: 12 }}
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
