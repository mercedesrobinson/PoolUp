
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Switch, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calculatorKey, setCalculatorKey] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedFields, setCompletedFields] = useState<Set<string>>(new Set());
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [draftKey] = useState(`pool_draft_${user.id}_${Date.now()}`);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [destinationSuggestions, setDestinationSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [skipTemplateDetails, setSkipTemplateDetails] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.95));

  // Animate in on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Animate field completion
  const animateFieldCompletion = () => {
    const pulseAnim = new Animated.Value(1);
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Visual completion indicators
  const getFieldCompletionStatus = () => {
    const required = ['name', 'selectedCategory'];
    const optional = ['destination', 'goalCents', 'expectedMembers'];
    
    const completedRequired = required.filter(field => {
      if (field === 'name') return name.trim().length > 0;
      if (field === 'selectedCategory') return selectedCategory !== null;
      return false;
    });
    
    const completedOptional = optional.filter(field => {
      if (field === 'destination') return destination.trim().length > 0;
      if (field === 'goalCents') return goalCents.trim().length > 0;
      if (field === 'expectedMembers') return expectedMembers !== '1' && expectedMembers.trim().length > 0;
      return false;
    });
    
    return {
      requiredComplete: completedRequired.length,
      requiredTotal: required.length,
      optionalComplete: completedOptional.length,
      optionalTotal: optional.length,
      overallProgress: Math.round(((completedRequired.length + completedOptional.length) / (required.length + optional.length)) * 100)
    };
  };

  const FieldCompletionIndicator = ({ isComplete, isRequired = false }: { isComplete: boolean, isRequired?: boolean }) => (
    <View style={{
      width: 0,
      height: 0,
      marginLeft: 8
    }}>
      {isComplete && (
        <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>✓</Text>
      )}
    </View>
  );
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [enablePenalty, setEnablePenalty] = useState<boolean>(false);
  const [penaltyPercentage, setPenaltyPercentage] = useState<string>('');
  const [poolType, setPoolType] = useState<string>((route.params as any)?.poolType || 'group');
  const [savingPurpose, setSavingPurpose] = useState<string>('');
  const [customPurpose, setCustomPurpose] = useState<string>('');
  const [destinationFact, setDestinationFact] = useState<string>('');
  const [expectedMembers, setExpectedMembers] = useState<string>('1');
  const [enableCalculator, setEnableCalculator] = useState<boolean>(true);
  const [privacyLevel, setPrivacyLevel] = useState<'public' | 'amounts_only' | 'fully_private'>('public');
  
  // Template field states
  const [travelFields, setTravelFields] = useState({
    flight: '',
    hotel: '',
    activities: '',
    food: '',
    transport: '',
    shopping: ''
  });
  
  const [homeFields, setHomeFields] = useState({
    downPayment: '',
    closingCosts: '',
    legalFees: '',
    inspection: '',
    moving: ''
  });
  
  const [weddingFields, setWeddingFields] = useState({
    venue: '',
    catering: '',
    flowers: '',
    photography: '',
    attire: '',
    music: '',
    cake: ''
  });
  
  const [emergencyFields, setEmergencyFields] = useState({
    monthlyExpenses: '',
    targetMonths: ''
  });

  // Validation functions
  const validateField = (fieldName: string, value: string) => {
    const errors = { ...validationErrors };
    
    switch (fieldName) {
      case 'name':
        if (!value.trim()) {
          errors.name = 'Pool name is required';
        } else if (value.length < 3) {
          errors.name = 'Pool name must be at least 3 characters';
        } else {
          delete errors.name;
        }
        break;
      
      case 'goalCents':
        const amount = parseFloat(value);
        if (!value.trim()) {
          errors.goalCents = 'Goal amount is required';
        } else if (isNaN(amount) || amount <= 0) {
          errors.goalCents = 'Please enter a valid amount';
        } else if (amount < 10) {
          errors.goalCents = 'Minimum goal is $10';
        } else {
          delete errors.goalCents;
        }
        break;
      
      case 'destination':
        if (selectedCategory?.id === 'travel' && !value.trim()) {
          errors.destination = 'Destination is required for travel goals';
        } else {
          delete errors.destination;
        }
        break;
      
      case 'tripDate':
        if (!value.trim()) {
          errors.tripDate = 'Target date is required';
        } else {
          const targetDate = new Date(value);
          const today = new Date();
          if (targetDate <= today) {
            errors.tripDate = 'Target date must be in the future';
          } else {
            delete errors.tripDate;
          }
        }
        break;
      
      case 'expectedMembers':
        const members = parseInt(value);
        if (poolType === 'group' && (!value.trim() || isNaN(members) || members < 2)) {
          errors.expectedMembers = 'Group pools need at least 2 members';
        } else {
          delete errors.expectedMembers;
        }
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    // Mark field as touched
    setTouchedFields(prev => new Set([...prev, fieldName]));
    
    // Update field value
    switch (fieldName) {
      case 'name':
        setName(value);
        break;
      case 'goalCents':
        setGoalCents(value);
        break;
      case 'destination':
        setDestination(value);
        break;
      case 'tripDate':
        setTripDate(value);
        break;
      case 'expectedMembers':
        setExpectedMembers(value);
        break;
    }
    
    // Validate field if it's been touched
    if (touchedFields.has(fieldName) || value.trim()) {
      validateField(fieldName, value);
    }
  };

  // Auto-save draft functionality
  const saveDraft = async () => {
    try {
      const draftData = {
        name,
        goalCents,
        destination,
        tripDate,
        selectedCategory,
        enablePenalty,
        penaltyPercentage,
        poolType,
        savingPurpose,
        customPurpose,
        expectedMembers,
        enableCalculator,
        travelFields,
        homeFields,
        weddingFields,
        emergencyFields,
        timestamp: Date.now()
      };
      
      await AsyncStorage.setItem(draftKey, JSON.stringify(draftData));
      setIsDraftSaved(true);
      
      // Hide the saved indicator after 2 seconds
      setTimeout(() => setIsDraftSaved(false), 2000);
    } catch (error) {
      console.log('Failed to save draft:', error);
    }
  };

  const loadDraft = async () => {
    try {
      const savedDraft = await AsyncStorage.getItem(`pool_draft_${user.id}`);
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        
        // Only load if draft is less than 24 hours old
        const isRecent = Date.now() - draftData.timestamp < 24 * 60 * 60 * 1000;
        
        if (isRecent) {
          setName(draftData.name || '');
          setGoalCents(draftData.goalCents || '');
          setDestination(draftData.destination || '');
          setTripDate(draftData.tripDate || '');
          setSelectedCategory(draftData.selectedCategory || null);
          setEnablePenalty(draftData.enablePenalty || false);
          setPenaltyPercentage(draftData.penaltyPercentage || '');
          setPoolType(draftData.poolType || 'group');
          setSavingPurpose(draftData.savingPurpose || '');
          setCustomPurpose(draftData.customPurpose || '');
          setExpectedMembers(draftData.expectedMembers || '1');
          setEnableCalculator(draftData.enableCalculator !== undefined ? draftData.enableCalculator : true);
          setTravelFields(draftData.travelFields || {
            flight: '', hotel: '', activities: '', food: '', transport: '', shopping: ''
          });
          setHomeFields(draftData.homeFields || {
            downPayment: '', closingCosts: '', legalFees: '', inspection: '', moving: ''
          });
          setWeddingFields(draftData.weddingFields || {
            venue: '', catering: '', flowers: '', photography: '', attire: '', music: '', cake: ''
          });
          setEmergencyFields(draftData.emergencyFields || {
            monthlyExpenses: '', targetMonths: ''
          });
        }
      }
    } catch (error) {
      console.log('Failed to load draft:', error);
    }
  };

  const clearDraft = async () => {
    try {
      await AsyncStorage.removeItem(`pool_draft_${user.id}`);
    } catch (error) {
      console.log('Failed to clear draft:', error);
    }
  };

  // Load draft on component mount
  useEffect(() => {
    loadDraft();
  }, []);

  // Auto-save draft when form data changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (name || goalCents || destination || selectedCategory) {
        saveDraft();
      }
    }, 1000); // Save 1 second after user stops typing

    return () => clearTimeout(timeoutId);
  }, [name, goalCents, destination, tripDate, selectedCategory, enablePenalty, penaltyPercentage, 
      poolType, savingPurpose, customPurpose, expectedMembers, enableCalculator, 
      travelFields, homeFields, weddingFields, emergencyFields]);

  // Smart destination suggestions
  const getDestinationSuggestions = (input: string): string[] => {
    const popularDestinations = [
      // International
      'Paris, France', 'Tokyo, Japan', 'London, England', 'Rome, Italy', 'Barcelona, Spain',
      'Amsterdam, Netherlands', 'Berlin, Germany', 'Prague, Czech Republic', 'Vienna, Austria',
      'Budapest, Hungary', 'Istanbul, Turkey', 'Dubai, UAE', 'Bangkok, Thailand', 'Bali, Indonesia',
      'Sydney, Australia', 'Melbourne, Australia', 'Auckland, New Zealand', 'Reykjavik, Iceland',
      'Stockholm, Sweden', 'Copenhagen, Denmark', 'Oslo, Norway', 'Helsinki, Finland',
      'Lisbon, Portugal', 'Madrid, Spain', 'Athens, Greece', 'Santorini, Greece', 'Mykonos, Greece',
      'Cairo, Egypt', 'Marrakech, Morocco', 'Cape Town, South Africa', 'Mumbai, India', 'Delhi, India',
      'Seoul, South Korea', 'Singapore', 'Hong Kong', 'Taipei, Taiwan', 'Manila, Philippines',
      'Ho Chi Minh City, Vietnam', 'Hanoi, Vietnam', 'Kuala Lumpur, Malaysia', 'Jakarta, Indonesia',
      'Buenos Aires, Argentina', 'Rio de Janeiro, Brazil', 'São Paulo, Brazil', 'Lima, Peru',
      'Bogotá, Colombia', 'Mexico City, Mexico', 'Cancun, Mexico', 'Tulum, Mexico',
      
      // US Cities
      'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ',
      'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'San Jose, CA',
      'Austin, TX', 'Jacksonville, FL', 'Fort Worth, TX', 'Columbus, OH', 'Charlotte, NC',
      'San Francisco, CA', 'Indianapolis, IN', 'Seattle, WA', 'Denver, CO', 'Washington, DC',
      'Boston, MA', 'El Paso, TX', 'Nashville, TN', 'Detroit, MI', 'Oklahoma City, OK',
      'Portland, OR', 'Las Vegas, NV', 'Memphis, TN', 'Louisville, KY', 'Baltimore, MD',
      'Milwaukee, WI', 'Albuquerque, NM', 'Tucson, AZ', 'Fresno, CA', 'Mesa, AZ',
      'Sacramento, CA', 'Atlanta, GA', 'Kansas City, MO', 'Colorado Springs, CO', 'Miami, FL',
      'Raleigh, NC', 'Omaha, NE', 'Long Beach, CA', 'Virginia Beach, VA', 'Oakland, CA',
      'Minneapolis, MN', 'Tulsa, OK', 'Arlington, TX', 'Tampa, FL', 'New Orleans, LA',
      
      // Popular vacation spots
      'Maui, Hawaii', 'Honolulu, Hawaii', 'Key West, FL', 'Napa Valley, CA', 'Aspen, CO',
      'Martha\'s Vineyard, MA', 'Nantucket, MA', 'Charleston, SC', 'Savannah, GA', 'Asheville, NC'
    ];

    if (!input || input.length < 2) return [];
    
    const filtered = popularDestinations.filter(dest => 
      dest.toLowerCase().includes(input.toLowerCase())
    ).slice(0, 5);
    
    return filtered;
  };

  const handleDestinationChange = (value: string) => {
    handleFieldChange('destination', value);
    
    // Update destination fact immediately when destination changes
    setDestinationFact(getDestinationFact(value));
    
    if (value.length >= 2) {
      const suggestions = getDestinationSuggestions(value);
      setDestinationSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectDestination = (suggestion: string) => {
    setDestination(suggestion);
    setShowSuggestions(false);
    setDestinationFact(getDestinationFact(suggestion));
  };


  const tooltips = {
    goalAmount: "💡 Set a target amount to save towards. You can always adjust this later or leave it open-ended for flexible saving.",
    penalty: "⚠️ Penalty fees help keep everyone motivated! If someone misses their monthly contribution, the penalty goes to your chosen charity.",
    groupSize: "👥 This helps calculate per-person costs for shared expenses like accommodations and group activities.",
    travelBudget: "✈️ Break down your trip costs to get a realistic budget. Include flights, hotels, food, and activities for the full experience.",
    weddingBudget: "💒 Wedding costs add up quickly! Consider venue, catering, photography, and all the special touches that make your day perfect.",
    homeBudget: "🏠 Buying a home involves more than just the purchase price. Factor in down payment, closing costs, inspections, and moving expenses."
  };

  // Category-specific color themes
  const getCategoryColors = () => {
    const categoryId = selectedCategory?.id;
    switch (categoryId) {
      case 'travel':
        return {
          primary: '#4A90E2',
          secondary: '#7BB3F0',
          background: '#E8F4FD',
          accent: '#2E5BBA'
        };
      case 'wedding':
        return {
          primary: '#E91E63',
          secondary: '#F06292',
          background: '#FCE4EC',
          accent: '#AD1457'
        };
      case 'home':
        return {
          primary: '#4CAF50',
          secondary: '#81C784',
          background: '#E8F5E8',
          accent: '#2E7D32'
        };
      case 'car':
        return {
          primary: '#FF9800',
          secondary: '#FFB74D',
          background: '#FFF3E0',
          accent: '#F57C00'
        };
      case 'emergency':
        return {
          primary: '#F44336',
          secondary: '#EF5350',
          background: '#FFEBEE',
          accent: '#C62828'
        };
      case 'education':
        return {
          primary: '#9C27B0',
          secondary: '#BA68C8',
          background: '#F3E5F5',
          accent: '#7B1FA2'
        };
      case 'business':
        return {
          primary: '#607D8B',
          secondary: '#90A4AE',
          background: '#ECEFF1',
          accent: '#455A64'
        };
      default:
        return {
          primary: colors.blue,
          secondary: colors.blue + '80',
          background: colors.blue + '15',
          accent: colors.blue
        };
    }
  };

  // Dynamic placeholder generator
  const getDynamicPlaceholder = (fieldType: string): string => {
    const category = selectedCategory?.id;
    const dest = destination.toLowerCase();
    
    switch (fieldType) {
      case 'poolName':
        // Match the selected category for both group and solo goals
        if (category === 'travel' && destination) {
          return `e.g., ${destination} Adventure 2024`;
        }
        if (category === 'travel') {
          return poolType === 'solo' ? 'e.g., Girls Trip' : 'e.g., Paris Trip 2024';
        }
        if (category === 'wedding') {
          return poolType === 'solo' ? 'e.g., Wedding Savings' : 'e.g., Jordan & Alex\'s Wedding Fund';
        }
        if (category === 'home') {
          return poolType === 'solo' ? 'e.g., Home Down Payment' : 'e.g., Our Dream Home Fund';
        }
        if (category === 'car') {
          return poolType === 'solo' ? 'e.g., Car Purchase Fund' : 'e.g., Tesla Model 3 Fund';
        }
        if (category === 'emergency') {
          return 'e.g., Family Emergency Fund';
        }
        if (category === 'education') {
          return poolType === 'solo' ? 'e.g., City College of New York' : 'e.g., College Fund';
        }
        if (category === 'technology') {
          return poolType === 'solo' ? 'e.g., New Macbook' : 'e.g., Tech Upgrade Fund';
        }
        if (category === 'business') {
          return poolType === 'solo' ? 'e.g., New PoolUp Wannabe' : 'e.g., Startup Fund';
        }
        
        // Default fallback
        return poolType === 'solo' ? 'e.g., Personal Savings Goal' : 'e.g., Group Savings Goal';
        
      case 'goalAmount':
        if (category === 'travel') {
          if (dest.includes('japan') || dest.includes('tokyo')) return 'e.g., 8000';
          if (dest.includes('europe') || dest.includes('paris') || dest.includes('london')) return 'e.g., 6000';
          if (dest.includes('domestic') || dest.includes('usa')) return 'e.g., 3000';
          return 'e.g., 5000';
        }
        if (category === 'wedding') return 'e.g., 25000';
        if (category === 'home') return 'e.g., 50000';
        if (category === 'car') return 'e.g., 15000';
        if (category === 'emergency') return 'e.g., 10000';
        return 'e.g., 5000';
        
      case 'flight':
        if (dest.includes('japan') || dest.includes('tokyo')) return 'e.g., 1200';
        if (dest.includes('europe')) return 'e.g., 800';
        if (dest.includes('domestic')) return 'e.g., 400';
        return 'e.g., 800';
        
      case 'hotel':
        if (dest.includes('japan') || dest.includes('tokyo')) return 'e.g., 1200 total';
        if (dest.includes('paris') || dest.includes('london')) return 'e.g., 1600 total';
        if (dest.includes('domestic')) return 'e.g., 960 total';
        return 'e.g., 1200 total';
        
      default:
        return '';
    }
  };

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
      'vegas': "🎰 Vegas has more neon signs than anywhere else—the city uses enough electricity to power 1.3 million homes!",
      'san francisco': "🌉 The Golden Gate Bridge's International Orange color was chosen to enhance visibility in fog!",
      'seattle': "☕ Seattle has more coffee shops per capita than any other US city—caffeine paradise!",
      'austin': "🎸 Austin's slogan 'Keep Austin Weird' started as a bumper sticker to support local businesses!",
      'nashville': "🎤 Nashville's Grand Ole Opry is the longest-running radio show in history (since 1925)!",
      'orlando': "🎢 Orlando is home to more theme parks than anywhere else on Earth—the ultimate fun destination!",
      'new orleans': "🎷 New Orleans is the birthplace of jazz music and has the most festivals of any US city!",
      'atlanta': "🍑 Atlanta is the birthplace of Coca-Cola and has the world's busiest airport—gateway to everywhere!",
      'salt lake city': "🏔️ Salt Lake City has the Great Salt Lake where you can't sink—it's saltier than the ocean!",
      'aspen': "⛷️ Aspen has four world-class ski mountains and is where celebrities go to play in the snow!",
      'charlotte': "🏁 Charlotte is NASCAR's hometown and has more banking headquarters than anywhere except New York!",
      'charleston': "🏛️ Charleston has the most preserved antebellum architecture and invented she-crab soup!",
      'savannah': "🌳 Savannah has 24 historic squares with Spanish moss-draped trees and the most haunted houses in America!",
      
      // International Destinations
      'tokyo': "🍣 Tokyo has more Michelin-starred restaurants than any other city in the world!",
      'paris': "🥐 Paris has over 400 parks and gardens—perfect for picnics with fresh croissants!",
      'london': "☂️ London has more green space than any other major city—over 40% is parks and gardens!",
      'rome': "🏛️ Rome has more fountains than any other city—legend says tossing a coin in Trevi guarantees your return!",
      'barcelona': "🏛️ Gaudí's Sagrada Família has been under construction for over 140 years and counting!",
      'amsterdam': "🚲 Amsterdam has more bikes than residents—over 880,000 bicycles for 820,000 people!",
      'cartagena': "🏰 Colombia's Cartagena has the most complete colonial walled city in South America—pure magic!",
      'medellin': "🌸 Colombia's Medellin is the 'City of Eternal Spring' with perfect weather year-round and incredible transformation story!",
      'colombia': "🦋 Colombia has more bird species than any other country and is the world's leading source of emeralds!",
      'costa rica': "🦥 Costa Rica has no army and dedicates 25% of its land to national parks—pure vida lifestyle!",
      'napa': "🍷 Napa Valley produces world-class wines in just 30 miles and has more Michelin stars per capita than anywhere outside major cities!",
      'napa valley': "🍷 Napa Valley produces world-class wines in just 30 miles and has more Michelin stars per capita than anywhere outside major cities!",
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
      'mexico city': "🏛️ Mexico City is built on a lake and has more museums than any other city in the world—over 150!",
      'tulum': "🏖️ Tulum has ancient Mayan ruins overlooking pristine Caribbean beaches—history meets paradise!",
      'punta cana': "🌴 Punta Cana has 32 miles of white sand beaches and the clearest turquoise water in the Caribbean!",
      'dominican republic': "🏝️ Dominican Republic shares an island with Haiti and has 27 climate zones—from desert to rainforest!",
      'puerto rico': "🐸 Puerto Rico is home to the only tropical rainforest in the US and glowing bioluminescent bays!",
      'cuba': "🎺 Cuba has the world's smallest bird (bee hummingbird) and invented the mojito and daiquiri!",
      'mexico': "🌮 Mexico gave the world chocolate, vanilla, and tomatoes—imagine Italian food without tomatoes!",
      'greece': "🏛️ Greece has over 6,000 islands, but only 227 are inhabited—island hopping paradise!",
      'egypt': "🐪 The Great Pyramid of Giza was the world's tallest building for over 3,800 years!",
      'marrakesh': "🕌 Marrakesh's medina is a UNESCO World Heritage site with the most vibrant souks and snake charmers!",
      'morocco': "🐪 Morocco has the Sahara Desert, Atlas Mountains, and Atlantic coast all in one country—diverse paradise!",
      'portugal': "🏄‍♂️ Portugal has the best surfing in Europe and invented custard tarts that are now world-famous!",
      'italy': "🍝 Italy has more UNESCO World Heritage sites than any other country and invented pizza, pasta, and gelato!",
      'france': "🥖 France has 400+ types of cheese, invented champagne, and has the most visited museum in the world—the Louvre!",
      'spain': "💃 Spain invented flamenco dancing and has more bars per capita than any other European country—¡Olé!",
      'monaco': "🏎️ Monaco is smaller than Central Park but hosts the most glamorous Formula 1 race and has no income tax!",
      'germany': "🍺 Germany has over 1,500 breweries, invented the printing press, and has the most castles in Europe!",
      'europe': "🏰 Europe has over 400 UNESCO World Heritage sites and you can visit 44 countries without a passport!",
      
      // States and Regions
      'california': "🌊 California has Hollywood, Silicon Valley, and more billionaires than most countries—where dreams come true!",
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

  // Smart auto-calculation function
  const calculateTemplateTotal = () => {
    let total = 0;
    
    if (selectedCategory?.id === 'travel') {
      Object.values(travelFields).forEach(value => {
        const num = parseFloat(value) || 0;
        total += num;
      });
      // For group travel, multiply by expected members since template fields are per person
      if (poolType === 'group') {
        const members = parseInt(expectedMembers) || 1;
        total = total * members;
      }
    } else if (selectedCategory?.id === 'home') {
      Object.values(homeFields).forEach(value => {
        const num = parseFloat(value) || 0;
        total += num;
      });
      // Home purchases are typically shared costs, no multiplication needed
    } else if (selectedCategory?.id === 'wedding') {
      Object.values(weddingFields).forEach(value => {
        const num = parseFloat(value) || 0;
        total += num;
      });
      // Wedding costs are typically shared, no multiplication needed
    } else if (selectedCategory?.id === 'emergency') {
      const monthly = parseFloat(emergencyFields.monthlyExpenses) || 0;
      const months = parseFloat(emergencyFields.targetMonths) || 0;
      total = monthly * months;
      // Emergency fund is household-level, no multiplication needed
    }
    
    return total;
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
    
    // For solo goals, use 1 member
    const effectiveMembers = poolType === 'solo' ? 1 : members;
    
    if (goalAmount <= 0 || effectiveMembers <= 0) return null;
    
    // Only show calculator if we have a valid target date
    if (!isValidDate || !targetDate) return null;
    
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const monthsRemaining = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44))); // Average days per month
    
    const perPersonPerMonth = goalAmount / effectiveMembers / monthsRemaining;
    
    return {
      totalGoal: goalAmount,
      members: effectiveMembers,
      monthsRemaining: monthsRemaining,
      perPersonPerMonth: perPersonPerMonth,
      targetDate: targetDate,
      isValidDate: isValidDate
    };
  };


  const create = async ()=>{
    try {
      setIsCreating(true);
      
      // Friendly validation messages
      if(!name.trim()) {
        setIsCreating(false);
        return Alert.alert(
          '🎯 Almost there!', 
          'Your pool needs a memorable name to get started. What would you like to call it?',
          [{ text: 'Got it!', style: 'default' }]
        );
      }
      
      // Allow pools without goal amounts (open-ended saving)
      let goal = 0;
      if (goalCents && goalCents.trim()) {
        const parsedGoal = parseFloat(goalCents);
        if (isNaN(parsedGoal)) {
          setIsCreating(false);
          return Alert.alert(
            '💰 Oops!', 
            'Please enter a valid number for your goal amount, or leave it blank for flexible saving.',
            [{ text: 'Fix it', style: 'default' }]
          );
        }
        goal = Math.round(parsedGoal * 100);
        if(goal < 0) {
          setIsCreating(false);
          return Alert.alert(
            '🤔 Hmm...', 
            'Goal amounts should be positive! Even small goals are worth celebrating.',
            [{ text: 'Update amount', style: 'default' }]
          );
        }
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
      
      const response = await api.createPool(user.id, name.trim(), goal, destination.trim(), tripDate, poolType, penaltyData);
      
      if(response.success) {
        // Clear draft after successful creation
        await clearDraft();
        
        Alert.alert(
          '🎉 Success!', 
          `Your ${poolType === 'solo' ? 'goal' : 'pool'} "${name}" is ready! ${poolType === 'group' ? "Time to invite your friends and start saving together!" : "You're all set to start saving!"}`,
          [{ 
            text: poolType === 'group' ? 'Invite Friends' : 'Start Saving!', 
            onPress: () => {
              if (poolType === 'group') {
                navigation.navigate('InviteFriends', { poolName: name });
              } else {
                navigation.goBack();
              }
            }
          }]
        );
      } else {
        setIsCreating(false);
        Alert.alert(
          '😔 Something went wrong', 
          'We couldn\'t create your pool right now. Your progress is saved as a draft - please try again in a moment.',
          [{ text: 'Try Again', style: 'default' }]
        );
      }
    } catch (error) {
      setIsCreating(false);
      console.error('Pool creation error:', error);
      Alert.alert(
        '📱 Connection Issue', 
        'We\'re having trouble connecting right now. Don\'t worry - your progress is automatically saved! Please check your internet connection and try again.',
        [
          { text: 'Try Again', style: 'default' },
          { text: 'Save Draft', style: 'cancel', onPress: () => saveDraft() }
        ]
      );
    }
  };

  // Progress calculation
  const totalSteps = 7;
  const getProgress = () => {
    let progress = 0;
    if (selectedCategory) progress += 1;
    if (name.trim()) progress += 1;
    if (destination.trim() && (selectedCategory?.id === 'travel' || selectedCategory?.id === 'wedding')) progress += 1;
    if (expectedMembers && poolType === 'group' && selectedCategory?.id === 'travel') progress += 1;
    if (goalCents.trim()) progress += 1;
    if (tripDate.trim()) progress += 1;
    if (enablePenalty !== undefined) progress += 1;
    return Math.min(progress, totalSteps);
  };

  const progressPercentage = (getProgress() / totalSteps) * 100;

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFCFF' }}>
      {/* Fixed Header with Progress Bar */}
      <View style={{ 
        backgroundColor: '#FAFCFF', 
        paddingTop: 60, 
        paddingHorizontal: 24, 
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E9ECEF'
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.primary, fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 8 }}>
          {poolType === 'solo' ? 'Create Personal Goal' : 'Create Group Pool'}
        </Text>
        <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 16 }}>
          {poolType === 'solo' ? 'Set up your personal savings goal' : 'Start saving together with friends'}
        </Text>

        {/* Progress Indicator - Now Sticky */}
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: '#666' }}>Progress</Text>
            <Text style={{ fontSize: 14, color: colors.primary, fontWeight: '600' }}>
              Step {getProgress()} of {totalSteps}
            </Text>
          </View>
          <View style={{ 
            height: 6, 
            backgroundColor: '#e9ecef', 
            borderRadius: 3, 
            overflow: 'hidden' 
          }}>
            <View style={{ 
              width: `${progressPercentage}%`,
              height: '100%',
              backgroundColor: colors.primary,
              borderRadius: 3
            }} />
          </View>
        </View>
      </View>

      {/* Scrollable Content with Top Padding */}
      <Animated.ScrollView 
        style={{ 
          flex: 1,
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ]
        }} 
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 24, paddingTop: 0 }}>
          {isDraftSaved && (
            <Text style={{ fontSize: 12, color: '#4CAF50', marginTop: 4, textAlign: 'center' }}>
              ✓ Draft saved automatically
            </Text>
          )}

        {/* Pool Type Selection */}
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

        {/* Original Category-specific messaging */}
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
              {selectedCategory?.id === 'visit_friends' && "❤️ Your little 'seeing one another' fund for when you miss your people 🥺"}
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

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize:18, fontWeight:'700', color: colors.text }}>
            {poolType === 'solo' ? 'Goal Name' : 'Pool Name'}
          </Text>
        </View>
        <TextInput 
          value={name} 
          onChangeText={(value) => handleFieldChange('name', value)}
          style={[
            { backgroundColor:'white', padding:16, borderRadius: radius.medium, marginBottom: validationErrors.name ? 8 : 24, fontSize:16 },
            validationErrors.name && { borderWidth: 2, borderColor: '#FF6B6B' }
          ]} 
          placeholder={getDynamicPlaceholder('poolName')} 
        />
        {validationErrors.name && (
          <Text style={{ color: '#FF6B6B', fontSize: 14, marginBottom: 16, marginLeft: 4 }}>
            {validationErrors.name}
          </Text>
        )}

        {/* Destination field for travel and wedding - moved before group size */}
        {(selectedCategory?.id === 'travel' || selectedCategory?.id === 'wedding') && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize:18, fontWeight:'700', color: colors.text }}>
                🌍 {selectedCategory?.id === 'travel' ? 'Destination' : 'Wedding Location'} (Optional)
              </Text>
            </View>
            <View style={{ position: 'relative' }}>
              <TextInput 
                value={destination} 
                onChangeText={handleDestinationChange}
                style={{ backgroundColor:'white', padding:16, borderRadius:radius.medium, marginBottom:12, fontSize:16 }} 
                placeholder={selectedCategory?.id === 'travel' ? "e.g. Tokyo, Japan" : "e.g. Napa Valley, CA"} 
              />
              
              {/* Smart destination suggestions */}
              {showSuggestions && destinationSuggestions.length > 0 && (
                <View style={{ 
                  position: 'absolute', 
                  top: 60, 
                  left: 0, 
                  right: 0, 
                  backgroundColor: 'white', 
                  borderRadius: radius.medium, 
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                  zIndex: 1000,
                  maxHeight: 200
                }}>
                  {destinationSuggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => selectDestination(suggestion)}
                      style={{ 
                        padding: 16, 
                        borderBottomWidth: index < destinationSuggestions.length - 1 ? 1 : 0, 
                        borderBottomColor: '#f0f0f0' 
                      }}
                    >
                      <Text style={{ fontSize: 16, color: colors.text }}>
                        📍 {suggestion}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            
            
            {destinationFact && (
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
            )}
          </>
        )}

        {/* Expected Group Size - only for travel category */}
        {poolType === 'group' && selectedCategory?.id === 'travel' && (
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize:18, fontWeight:'700', color: colors.text }}>
                👥 How Many Travelers?
              </Text>
            </View>
            <TextInput 
              value={expectedMembers} 
              onChangeText={(text) => {
                handleFieldChange('expectedMembers', text);
                // Force calculator re-render when group size changes
                setCalculatorKey(prev => prev + 1);
              }} 
              keyboardType="numeric" 
              style={[
                { backgroundColor:'white', padding:16, borderRadius: radius.medium, marginBottom: validationErrors.expectedMembers ? 8 : 12, fontSize:16 },
                validationErrors.expectedMembers && { borderWidth: 2, borderColor: '#FF6B6B' }
              ]} 
              placeholder="6" 
            />
            {validationErrors.expectedMembers && (
              <Text style={{ color: '#FF6B6B', fontSize: 14, marginBottom: 8, marginLeft: 4 }}>
                {validationErrors.expectedMembers}
              </Text>
            )}
            <Text style={{ fontSize:12, color:'#666', marginBottom:0 }}>
              ✈️ This calculates per-person travel costs (flights, hotels, etc.)
            </Text>
          </View>
        )}

        {/* Skip/Later option for template details */}
        {(selectedCategory?.id === 'travel' || selectedCategory?.id === 'wedding' || selectedCategory?.id === 'home') && skipTemplateDetails && (
          <View style={{
            backgroundColor: getCategoryColors().background,
            padding: 16,
            borderRadius: radius.medium,
            marginBottom: 24,
            borderLeftWidth: 4,
            borderLeftColor: getCategoryColors().primary
          }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
              📝 Budget Details Skipped
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>
              You can add detailed budget breakdowns later in your pool settings.
            </Text>
            <TouchableOpacity
              onPress={() => setSkipTemplateDetails(false)}
              style={{
                backgroundColor: getCategoryColors().primary,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: radius.small,
                alignSelf: 'flex-start'
              }}
            >
              <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                Add Details Now
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Category-specific template fields */}
        {selectedCategory?.id === 'travel' && !skipTemplateDetails && (
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
                ✈️ Travel Budget Breakdown (Optional)
              </Text>
              <TouchableOpacity
                onPress={() => setSkipTemplateDetails(true)}
                style={{
                  backgroundColor: '#f0f0f0',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: radius.small
                }}
              >
                <Text style={{ color: '#666', fontSize: 12, fontWeight: '600' }}>
                  Skip for now
                </Text>
              </TouchableOpacity>
            </View>
            
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
              Flight Budget
            </Text>
            <TextInput 
              value={travelFields.flight}
              onChangeText={(value) => setTravelFields(prev => ({...prev, flight: value}))}
              style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, marginBottom: 12, fontSize: 16 }} 
              placeholder={getDynamicPlaceholder('flight')}
              keyboardType="numeric"
            />
            
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
              Hotel/Stay Budget
            </Text>
            <TextInput 
              value={travelFields.hotel}
              onChangeText={(value) => setTravelFields(prev => ({...prev, hotel: value}))}
              style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, marginBottom: 12, fontSize: 16 }} 
              placeholder={getDynamicPlaceholder('hotel')}
              keyboardType="numeric"
            />
            
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
              Activities & Excursions
            </Text>
            <TextInput 
              value={travelFields.activities}
              onChangeText={(value) => setTravelFields(prev => ({...prev, activities: value}))}
              style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, marginBottom: 12, fontSize: 16 }} 
              placeholder="600"
              keyboardType="numeric"
            />
            
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
              Food & Dining
            </Text>
            <TextInput 
              value={travelFields.food}
              onChangeText={(value) => setTravelFields(prev => ({...prev, food: value}))}
              style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, marginBottom: 12, fontSize: 16 }} 
              placeholder="400"
              keyboardType="numeric"
            />
            
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
              Transportation (Local)
            </Text>
            <TextInput 
              value={travelFields.transport}
              onChangeText={(value) => setTravelFields(prev => ({...prev, transport: value}))}
              style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, marginBottom: 12, fontSize: 16 }} 
              placeholder="200"
              keyboardType="numeric"
            />
            
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
              Shopping & Souvenirs
            </Text>
            <TextInput 
              value={travelFields.shopping}
              onChangeText={(value) => setTravelFields(prev => ({...prev, shopping: value}))}
              style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, marginBottom: 12, fontSize: 16 }} 
              placeholder="300"
              keyboardType="numeric"
            />
            
            {/* Auto-calculation display */}
            {calculateTemplateTotal() > 0 && (
              <TouchableOpacity 
                onPress={() => setGoalCents(calculateTemplateTotal().toString())}
                style={{ backgroundColor: '#E8F5E8', padding: 16, borderRadius: radius.medium, marginTop: 8, borderWidth: 2, borderColor: '#4CAF50' }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'center', marginBottom: 4 }}>
                  ✈️ {poolType === 'group' ? 'Group Trip Budget' : 'Total Trip Budget'}: ${calculateTemplateTotal().toLocaleString()}
                </Text>
                <Text style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>
                  {poolType === 'group' && selectedCategory?.id === 'travel'
                    ? `$${(calculateTemplateTotal() / (parseInt(expectedMembers) || 1)).toLocaleString()} per person × ${expectedMembers || 1} people`
                    : poolType === 'group' 
                    ? 'Total group budget'
                    : 'Your total trip budget'}
                </Text>
                <Text style={{ fontSize: 12, color: '#666', textAlign: 'center', marginTop: 4 }}>
                  Tap to use this as your goal amount
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {selectedCategory?.id === 'emergency' && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 }}>
              🛡️ Emergency Fund Calculator
            </Text>
            
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
              Monthly Expenses
            </Text>
            <TextInput 
              value={emergencyFields.monthlyExpenses}
              onChangeText={(value) => setEmergencyFields(prev => ({...prev, monthlyExpenses: value}))}
              style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, marginBottom: 12, fontSize: 16 }} 
              placeholder="3000"
              keyboardType="numeric"
            />
            
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
              Target Months of Coverage
            </Text>
            <TextInput 
              value={emergencyFields.targetMonths}
              onChangeText={(value) => setEmergencyFields(prev => ({...prev, targetMonths: value}))}
              style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, marginBottom: 12, fontSize: 16 }} 
              placeholder="6"
              keyboardType="numeric"
            />
            
            {/* Emergency Fund Auto-calculation */}
            {calculateTemplateTotal() > 0 && (
              <TouchableOpacity 
                onPress={() => setGoalCents(calculateTemplateTotal().toString())}
                style={{ backgroundColor: colors.green + '20', padding: 16, borderRadius: radius.medium, marginTop: 8, borderWidth: 2, borderColor: colors.green }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'center', marginBottom: 4 }}>
                  🛡️ Emergency Fund Total: ${calculateTemplateTotal().toLocaleString()}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center' }}>
                  {emergencyFields.targetMonths} months × ${emergencyFields.monthlyExpenses} = ${calculateTemplateTotal().toLocaleString()}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: 4 }}>
                  Tap to use this as your goal amount
                </Text>
              </TouchableOpacity>
            )}
            
            <View style={{ backgroundColor: colors.green + '15', padding: 16, borderRadius: radius.medium, borderLeftWidth: 4, borderLeftColor: colors.green, marginTop: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
                🛡️ Emergency Fund Tips:
              </Text>
              <Text style={{ fontSize: 13, color: colors.text, lineHeight: 18 }}>
                • Start with $1,000, then build to 3-6 months of expenses{'\n'}
                • Only use for true emergencies (job loss, medical bills){'\n'}
                • Replenish immediately after using{'\n'}
                • Keep funds easily accessible but separate from daily spending
              </Text>
            </View>
          </View>
        )}

        {selectedCategory?.id === 'home' && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 }}>
              🏠 Home Purchase Details (Optional)
            </Text>
            
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
              Down Payment
            </Text>
            <TextInput 
              value={homeFields.downPayment}
              onChangeText={(value) => setHomeFields(prev => ({...prev, downPayment: value}))}
              style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, marginBottom: 12, fontSize: 16 }} 
              placeholder="40000"
              keyboardType="numeric"
            />
            
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
              Closing Costs
            </Text>
            <TextInput 
              value={homeFields.closingCosts}
              onChangeText={(value) => setHomeFields(prev => ({...prev, closingCosts: value}))}
              style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, marginBottom: 12, fontSize: 16 }} 
              placeholder="8000"
              keyboardType="numeric"
            />
            
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
              Legal Fees
            </Text>
            <TextInput 
              value={homeFields.legalFees}
              onChangeText={(value) => setHomeFields(prev => ({...prev, legalFees: value}))}
              style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, marginBottom: 12, fontSize: 16 }} 
              placeholder="2500"
              keyboardType="numeric"
            />
            
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
              Home Inspection
            </Text>
            <TextInput 
              value={homeFields.inspection}
              onChangeText={(value) => setHomeFields(prev => ({...prev, inspection: value}))}
              style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, marginBottom: 12, fontSize: 16 }} 
              placeholder="500"
              keyboardType="numeric"
            />
            
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
              Moving Expenses
            </Text>
            <TextInput 
              value={homeFields.moving}
              onChangeText={(value) => setHomeFields(prev => ({...prev, moving: value}))}
              style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, marginBottom: 12, fontSize: 16 }} 
              placeholder="2000"
              keyboardType="numeric"
            />
            
            {/* Home Auto-calculation */}
            {calculateTemplateTotal() > 0 && (
              <TouchableOpacity 
                onPress={() => setGoalCents(calculateTemplateTotal().toString())}
                style={{ backgroundColor: colors.green + '20', padding: 16, borderRadius: radius.medium, marginTop: 8, borderWidth: 2, borderColor: colors.green }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'center', marginBottom: 4 }}>
                  🏠 {poolType === 'group' ? 'Group Home Budget' : 'Total Home Budget'}: ${calculateTemplateTotal().toLocaleString()}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center' }}>
                  {poolType === 'group' ? 'Total group budget' : 'Your total home budget'}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: 4 }}>
                  Tap to use this as your goal amount
                </Text>
              </TouchableOpacity>
            )}
            
            <View style={{ backgroundColor: colors.green + '15', padding: 16, borderRadius: radius.medium, borderLeftWidth: 4, borderLeftColor: colors.green, marginTop: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
                💡 Home Buying Tips:
              </Text>
              <Text style={{ fontSize: 13, color: colors.text, lineHeight: 18 }}>
                • Budget 2-5% of home price for closing costs{'\n'}
                • Get pre-approved before house hunting{'\n'}
                • Factor in moving costs and immediate repairs{'\n'}
                • Consider PMI if down payment is less than 20%
              </Text>
            </View>
          </View>
        )}

        {selectedCategory?.id === 'wedding' && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 }}>
              💒 Wedding Details (Optional)
            </Text>
            
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
              Venue Cost
            </Text>
            <TextInput 
              value={weddingFields.venue}
              onChangeText={(value) => setWeddingFields(prev => ({...prev, venue: value}))}
              style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, marginBottom: 12, fontSize: 16 }} 
              placeholder="12000"
              keyboardType="numeric"
            />
            
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
              Catering & Food
            </Text>
            <TextInput 
              value={weddingFields.catering}
              onChangeText={(value) => setWeddingFields(prev => ({...prev, catering: value}))}
              style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, marginBottom: 12, fontSize: 16 }} 
              placeholder="8000"
              keyboardType="numeric"
            />
            
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
              Flowers & Decor
            </Text>
            <TextInput 
              value={weddingFields.flowers}
              onChangeText={(value) => setWeddingFields(prev => ({...prev, flowers: value}))}
              style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, marginBottom: 12, fontSize: 16 }} 
              placeholder="3000"
              keyboardType="numeric"
            />
            
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
              Photography
            </Text>
            <TextInput 
              value={weddingFields.photography}
              onChangeText={(value) => setWeddingFields(prev => ({...prev, photography: value}))}
              style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, marginBottom: 12, fontSize: 16 }} 
              placeholder="2500"
              keyboardType="numeric"
            />
            
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
              Wedding Dress/Attire
            </Text>
            <TextInput 
              value={weddingFields.attire}
              onChangeText={(value) => setWeddingFields(prev => ({...prev, attire: value}))}
              style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, marginBottom: 12, fontSize: 16 }} 
              placeholder="1500"
              keyboardType="numeric"
            />
            
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
              Music/Entertainment
            </Text>
            <TextInput 
              value={weddingFields.music}
              onChangeText={(value) => setWeddingFields(prev => ({...prev, music: value}))}
              style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, marginBottom: 12, fontSize: 16 }} 
              placeholder="1200"
              keyboardType="numeric"
            />
            
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
              Wedding Cake
            </Text>
            <TextInput 
              value={weddingFields.cake}
              onChangeText={(value) => setWeddingFields(prev => ({...prev, cake: value}))}
              style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, marginBottom: 12, fontSize: 16 }} 
              placeholder="800"
              keyboardType="numeric"
            />
            
            {/* Wedding Auto-calculation */}
            {calculateTemplateTotal() > 0 && (
              <TouchableOpacity 
                onPress={() => setGoalCents(calculateTemplateTotal().toString())}
                style={{ backgroundColor: colors.green + '20', padding: 16, borderRadius: radius.medium, marginTop: 8, borderWidth: 2, borderColor: colors.green }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'center', marginBottom: 4 }}>
                  💒 {poolType === 'group' ? 'Group Wedding Budget' : 'Total Wedding Budget'}: ${calculateTemplateTotal().toLocaleString()}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center' }}>
                  {poolType === 'group' ? 'Total group budget' : 'Your total wedding budget'}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: 4 }}>
                  Tap to use this as your goal amount
                </Text>
              </TouchableOpacity>
            )}
            
            <View style={{ backgroundColor: colors.purple + '15', padding: 16, borderRadius: radius.medium, borderLeftWidth: 4, borderLeftColor: colors.purple }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
                💍 Wedding Planning Tips:
              </Text>
              <Text style={{ fontSize: 13, color: colors.text, lineHeight: 18 }}>
                • Book venue 12-18 months in advance{'\n'}
                • Venue & catering typically cost 40-50% of budget{'\n'}
                • Add 10-20% buffer for unexpected costs{'\n'}
                • Consider off-peak dates for savings
              </Text>
            </View>
          </View>
        )}


        {/* Goal Amount Section - moved after template details */}
        <Text style={{ fontSize:18, fontWeight:'700', color: colors.text, marginBottom:8 }}>
          💰 {poolType === 'group' ? 'Goal Amount for the Group' : 'Goal Amount'} (Optional)
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
          placeholder={poolType === 'group' ? "10500" : "1000"} 
        />
        <Text style={{ fontSize:12, color:'#666', marginBottom:18 }}>
          {poolType === 'group' 
            ? `Leave blank for open-ended saving (no goal limit). Amount will be shared among group members.`
            : 'Leave blank for open-ended saving (no goal limit)'}
        </Text>


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


        {/* Smart Calculator - works for both group and solo goals */}
        {(poolType === 'group' || poolType === 'solo') && (
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
            
            {(() => {
              const goal = parseInt(goalCents) || 0;
              const members = parseInt(expectedMembers) || 1;
              
              if (!goalCents && !tripDate) {
                return (
                  <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', fontStyle: 'italic' }}>
                    Enter your goal amount and target date to see monthly savings breakdown
                  </Text>
                );
              }
              
              if (!goalCents) {
                return (
                  <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', fontStyle: 'italic' }}>
                    Enter your goal amount to see savings calculation
                  </Text>
                );
              }
              
              if (!tripDate) {
                return (
                  <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500' }}>Total Goal:</Text>
                      <Text style={{ fontSize: 14, color: colors.text, fontWeight: '700' }}>${goal.toLocaleString()}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500' }}>Group Size:</Text>
                      <Text style={{ fontSize: 14, color: colors.text, fontWeight: '700' }}>{members} people</Text>
                    </View>
                    <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', fontStyle: 'italic', marginTop: 8 }}>
                      Add a target date to see monthly savings breakdown
                    </Text>
                  </View>
                );
              }
              
              const targetDate = new Date(tripDate);
              const now = new Date();
              const monthsRemaining = Math.max(1, Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)));
              const perPersonPerMonth = goal / members / monthsRemaining;
              
              return (
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500' }}>Total Goal:</Text>
                    <Text style={{ fontSize: 14, color: colors.text, fontWeight: '700' }}>${goal.toLocaleString()}</Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500' }}>Group Size:</Text>
                    <Text style={{ fontSize: 14, color: colors.text, fontWeight: '700' }}>{members} people</Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500' }}>Time Frame:</Text>
                    <Text style={{ fontSize: 14, color: colors.text, fontWeight: '700' }}>
                      {monthsRemaining} month{monthsRemaining !== 1 ? 's' : ''}
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
                      Each person saves:
                    </Text>
                    <Text style={{ fontSize: 24, color: colors.green, fontWeight: '700' }}>
                      ${perPersonPerMonth.toFixed(2)}/month
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                      That's just ${(perPersonPerMonth / 30).toFixed(2)} per day!
                    </Text>
                  </View>
                  
                  <Text style={{ fontSize: 12, color: colors.text, marginTop: 12, textAlign: 'center', fontStyle: 'italic' }}>
                    💡 When friends join or leave, PoolUp automatically updates everyone's monthly amount
                  </Text>
                </View>
              );
            })()}
          </View>
        )}

        {/* Travel Planning Tips */}
        {selectedCategory?.id === 'travel' && (
          <View style={{ backgroundColor: colors.blue + '15', padding: 16, borderRadius: radius.medium, borderLeftWidth: 4, borderLeftColor: colors.blue, marginBottom: 24 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
              ✈️ Travel Planning Tips:
            </Text>
            <Text style={{ fontSize: 13, color: colors.text, lineHeight: 18 }}>
              • Set your target date as your actual TRIP DATE, not booking date{'\n'}
              • Book domestic flights 1-3 months before trip (3-6 months for holidays){'\n'}
              • Book international flights 2-8 months before trip{'\n'}
              • You'll book early but keep saving until your trip date{'\n'}
              • Budget 20% extra for unexpected expenses{'\n'}
              • Check visa requirements and travel insurance early
            </Text>
          </View>
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
          
          
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 12, lineHeight: 16 }}>
            {poolType === 'group' 
              ? 'Penalty for withdrawing before goal is reached'
              : 'Penalty for early withdrawal before target date'}
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


        {/* Badges Section */}
        <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 16 }}>
            🏆 Earn Badges for This Goal
          </Text>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {/* First Contribution Badge */}
            <View style={{ 
              backgroundColor: colors.green + '15', 
              padding: 12, 
              borderRadius: radius.medium, 
              alignItems: 'center',
              minWidth: '48%',
              borderWidth: 1,
              borderColor: colors.green + '40'
            }}>
              <Text style={{ fontSize: 24, marginBottom: 4 }}>🎯</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text, textAlign: 'center' }}>
                First Contribution
              </Text>
              <Text style={{ fontSize: 10, color: colors.textSecondary, textAlign: 'center', marginTop: 2 }}>
                Make your first deposit
              </Text>
            </View>

            {/* Streak Badge */}
            <View style={{ 
              backgroundColor: colors.purple + '15', 
              padding: 12, 
              borderRadius: radius.medium, 
              alignItems: 'center',
              minWidth: '48%',
              borderWidth: 1,
              borderColor: colors.purple + '40'
            }}>
              <Text style={{ fontSize: 24, marginBottom: 4 }}>🔥</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text, textAlign: 'center' }}>
                7-Day Streak
              </Text>
              <Text style={{ fontSize: 10, color: colors.textSecondary, textAlign: 'center', marginTop: 2 }}>
                Save for 7 days straight
              </Text>
            </View>

            {/* Goal Achiever Badge */}
            <View style={{ 
              backgroundColor: colors.blue + '15', 
              padding: 12, 
              borderRadius: radius.medium, 
              alignItems: 'center',
              minWidth: '48%',
              borderWidth: 1,
              borderColor: colors.blue + '40'
            }}>
              <Text style={{ fontSize: 24, marginBottom: 4 }}>🎉</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text, textAlign: 'center' }}>
                Goal Achiever
              </Text>
              <Text style={{ fontSize: 10, color: colors.textSecondary, textAlign: 'center', marginTop: 2 }}>
                Reach your target amount
              </Text>
            </View>

            {poolType === 'group' && (
              <View style={{ 
                backgroundColor: '#ff6b6b15', 
                padding: 12, 
                borderRadius: radius.medium, 
                alignItems: 'center',
                minWidth: '48%',
                borderWidth: 1,
                borderColor: '#ff6b6b40'
              }}>
                <Text style={{ fontSize: 24, marginBottom: 4 }}>👥</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text, textAlign: 'center' }}>
                  Team Player
                </Text>
                <Text style={{ fontSize: 10, color: colors.textSecondary, textAlign: 'center', marginTop: 2 }}>
                  Complete group goal together
                </Text>
              </View>
            )}
          </View>

          <View style={{ backgroundColor: colors.green + '10', padding: 12, borderRadius: radius.medium, marginTop: 12 }}>
            <Text style={{ fontSize: 12, color: colors.text, textAlign: 'center', fontWeight: '500' }}>
              💡 Earn badges to unlock achievements and climb the leaderboards!
            </Text>
          </View>
        </View>

        {/* Privacy Settings */}
        <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 16 }}>
            🔒 Privacy Settings
          </Text>
          
          {/* Public Option */}
          <TouchableOpacity 
            onPress={() => setPrivacyLevel('public')}
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              padding: 12, 
              borderRadius: radius.medium, 
              backgroundColor: privacyLevel === 'public' ? colors.blue + '20' : '#f8f9fa',
              marginBottom: 8,
              borderWidth: privacyLevel === 'public' ? 2 : 1,
              borderColor: privacyLevel === 'public' ? colors.blue : '#e9ecef'
            }}
          >
            <Text style={{ fontSize: 18, marginRight: 12 }}>👥</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Public</Text>
              <Text style={{ fontSize: 12, color: '#666' }}>Everything visible to friends</Text>
            </View>
            {privacyLevel === 'public' && <Text style={{ color: colors.blue, fontSize: 16 }}>✓</Text>}
          </TouchableOpacity>
          
          {/* Amounts Only Private Option */}
          <TouchableOpacity 
            onPress={() => setPrivacyLevel('amounts_only')}
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              padding: 12, 
              borderRadius: radius.medium, 
              backgroundColor: privacyLevel === 'amounts_only' ? colors.blue + '20' : '#f8f9fa',
              marginBottom: 8,
              borderWidth: privacyLevel === 'amounts_only' ? 2 : 1,
              borderColor: privacyLevel === 'amounts_only' ? colors.blue : '#e9ecef'
            }}
          >
            <Text style={{ fontSize: 18, marginRight: 12 }}>💰</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Hide Dollar Amounts</Text>
              <Text style={{ fontSize: 12, color: '#666' }}>Goal name visible, amounts private</Text>
            </View>
            {privacyLevel === 'amounts_only' && <Text style={{ color: colors.blue, fontSize: 16 }}>✓</Text>}
          </TouchableOpacity>
          
          {/* Fully Private Option */}
          <TouchableOpacity 
            onPress={() => setPrivacyLevel('fully_private')}
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              padding: 12, 
              borderRadius: radius.medium, 
              backgroundColor: privacyLevel === 'fully_private' ? colors.blue + '20' : '#f8f9fa',
              borderWidth: privacyLevel === 'fully_private' ? 2 : 1,
              borderColor: privacyLevel === 'fully_private' ? colors.blue : '#e9ecef'
            }}
          >
            <Text style={{ fontSize: 18, marginRight: 12 }}>🔐</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Fully Private</Text>
              <Text style={{ fontSize: 12, color: '#666' }}>Hidden from friends feed</Text>
            </View>
            {privacyLevel === 'fully_private' && <Text style={{ color: colors.blue, fontSize: 16 }}>✓</Text>}
          </TouchableOpacity>
        </View>

        
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

        <TouchableOpacity 
          onPress={create} 
          disabled={isCreating}
          style={{ 
            backgroundColor: isCreating ? getCategoryColors().secondary : getCategoryColors().primary, 
            padding: 16, 
            borderRadius: radius.medium, 
            alignItems: 'center',
            opacity: isCreating ? 0.7 : 1,
            transform: [{ scale: isCreating ? 0.98 : 1 }]
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {isCreating && (
              <Animated.View style={{ 
                marginRight: 8,
                transform: [{ rotate: '360deg' }] 
              }}>
                <Text style={{ color: 'white', fontSize: 16 }}>⏳</Text>
              </Animated.View>
            )}
            <Text style={{ color:'white', fontSize:18, fontWeight:'700' }}>
              {isCreating 
                ? 'Creating...' 
                : (poolType === 'group' ? 'Create Pool' : 'Create Solo Goal')
              }
            </Text>
          </View>
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
      </Animated.ScrollView>
    </View>
  );
}
