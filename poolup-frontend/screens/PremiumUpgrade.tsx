import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radius, shadow } from '../theme';
import { RootStackParamList } from '../types/navigation';

const PREMIUM_TIERS = {
  FREE: {
    name: 'Free',
    price: '$0',
    pools_limit: 3,
    members_per_pool: 5,
    interest_rate: '2.0%',
    features: ['3 savings pools', '5 members per pool', '2% interest rate', 'Basic badges']
  },
  PLUS: {
    name: 'PoolUp Plus',
    price: '$4.99/mo',
    pools_limit: 10,
    members_per_pool: 15,
    interest_rate: '2.5%',
    features: ['10 savings pools', '15 members per pool', '2.5% interest rate', 'No withdrawal fees', 'Premium themes', 'Priority support']
  },
  PRO: {
    name: 'PoolUp Pro',
    price: '$9.99/mo',
    pools_limit: 'Unlimited',
    members_per_pool: 50,
    interest_rate: '3.0%',
    features: ['Unlimited pools', '50 members per pool', '3% interest rate', 'Advanced analytics', 'API access', 'White label options']
  }
};

type PremiumUpgradeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PremiumUpgrade'>;

interface Props {
  navigation: PremiumUpgradeNavigationProp;
}

export default function PremiumUpgrade({ navigation }: Props): React.JSX.Element {
  // For demo purposes, use default values
  const currentTier = 'FREE';
  const [selectedTier, setSelectedTier] = useState(currentTier);

  const handleUpgrade = async (tier: keyof typeof PREMIUM_TIERS): Promise<void> => {
    if (tier === 'FREE') return;
    
    Alert.alert(
      'Upgrade to ' + PREMIUM_TIERS[tier].name,
      `Unlock premium features for ${PREMIUM_TIERS[tier].price}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Upgrade', 
          onPress: () => {
            // TODO: Implement Stripe payment integration
            Alert.alert('Coming Soon', 'Premium subscriptions will be available soon!');
          }
        }
      ]
    );
  };

  const renderTierCard = (tierKey: keyof typeof PREMIUM_TIERS, tier: typeof PREMIUM_TIERS[keyof typeof PREMIUM_TIERS]) => {
    const isSelected = selectedTier === tierKey;
    const isCurrent = currentTier === tierKey;
    
    return (
      <TouchableOpacity
        key={tierKey}
        style={[
          styles.tierCard,
          isSelected && styles.selectedTier,
          isCurrent && styles.currentTier
        ]}
        onPress={() => setSelectedTier(tierKey)}
      >
        <View style={styles.tierHeader}>
          <Text style={styles.tierName}>{tier.name}</Text>
          <Text style={styles.tierPrice}>{tier.price}</Text>
          {isCurrent && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>CURRENT</Text>
            </View>
          )}
        </View>
        
        <View style={styles.interestRate}>
          <Text style={styles.interestText}>🏦 {tier.interest_rate} APY</Text>
        </View>
        
        <View style={styles.features}>
          {tier.features.map((feature: string, index: number) => (
            <View key={index} style={styles.feature}>
              <Text style={styles.featureText}>✓ {feature}</Text>
            </View>
          ))}
        </View>
        
        {!isCurrent && (
          <TouchableOpacity
            style={[
              styles.upgradeButton,
              (tierKey as string) === 'FREE' && styles.disabledButton
            ]}
            onPress={() => handleUpgrade(tierKey)}
            disabled={(tierKey as string) === 'FREE' || false}
          >
            <Text style={styles.upgradeButtonText}>
              {(tierKey as string) === 'FREE' ? 'Current Plan' : 'Upgrade'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Plan</Text>
        <Text style={styles.subtitle}>
          Unlock premium features and earn higher interest rates
        </Text>
      </View>

      <View style={styles.tiersContainer}>
        {Object.keys(PREMIUM_TIERS).map((key) =>
          renderTierCard(key as keyof typeof PREMIUM_TIERS, PREMIUM_TIERS[key as keyof typeof PREMIUM_TIERS])
        )}
      </View>

      <View style={styles.benefits}>
        <Text style={styles.benefitsTitle}>Why Upgrade?</Text>
        <View style={styles.benefit}>
          <Text style={styles.benefitText}>💰 Higher interest rates on your savings</Text>
        </View>
        <View style={styles.benefit}>
          <Text style={styles.benefitText}>🚫 No withdrawal fees</Text>
        </View>
        <View style={styles.benefit}>
          <Text style={styles.benefitText}>👥 Larger group pools</Text>
        </View>
        <View style={styles.benefit}>
          <Text style={styles.benefitText}>📊 Advanced analytics and insights</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  header: {
    padding: 20,
    alignItems: "center" as const
  },
  title: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: colors.text,
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center' as const
  },
  tiersContainer: {
    padding: 20,
    gap: 16
  },
  tierCard: {
    backgroundColor: 'white',
    borderRadius: radius.medium,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e9ecef'
  },
  selectedTier: {
    borderColor: colors.primary
  },
  currentTier: {
    borderColor: colors.green,
    backgroundColor: '#f8fff8'
  },
  tierHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 12
  },
  tierName: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: colors.text
  },
  tierPrice: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: colors.primary
  },
  currentBadge: {
    backgroundColor: colors.green,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  currentBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: "600" as const
  },
  interestRate: {
    backgroundColor: '#e8f5e8',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12
  },
  interestText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: colors.green,
    textAlign: 'center' as const
  },
  features: {
    marginBottom: 16
  },
  feature: {
    marginBottom: 6
  },
  featureText: {
    fontSize: 14,
    color: colors.text
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: radius.medium,
    alignItems: "center" as const
  },
  disabledButton: {
    backgroundColor: '#ccc'
  },
  upgradeButtonText: {
    color: 'white',
    fontWeight: "600" as const
  },
  benefits: {
    padding: 20,
    backgroundColor: 'white',
    margin: 20,
    borderRadius: radius.medium
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 16
  },
  benefit: {
    marginBottom: 8
  },
  benefitText: {
    fontSize: 14,
    color: colors.text
  }
};
