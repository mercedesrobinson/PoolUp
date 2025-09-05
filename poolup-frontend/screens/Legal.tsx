import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../theme';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';

type LegalNavigationProp = StackNavigationProp<any, any>;
type LegalRouteProp = RouteProp<any, any>;

interface Props {
  navigation: LegalNavigationProp;
  route: LegalRouteProp;
}

export default function Legal({ navigation, route }: Props): React.JSX.Element {
  const type = (route.params as any)?.type || 'privacy';
  const isPrivacy = type === 'privacy';

  const privacyContent = `# Privacy Policy for PoolUp

**Last updated:** January 2025

## What We Collect

**Account Information:**
- Email address (for Google sign-in)
- Profile information (name, avatar)
- Banking information (via Stripe Connect for secure payment processing)

**Usage Data:**
- Pool creation and contribution activity
- App usage analytics (crashes, performance)
- Device information for push notifications

**Financial Data:**
- Transaction history within pools
- Payment method information (securely stored by Stripe)
- Account balances and interest earnings

## How We Use Your Data

- **Pool Management:** Process contributions, track savings goals
- **Payments:** Secure money transfers via Stripe Connect
- **Communication:** Send pool updates and achievement notifications
- **Compliance:** Meet financial regulations (KYC/AML via Stripe)

## Data Sharing

- **Stripe:** Payment processing and compliance (required by law)
- **Google:** Authentication services only
- **Pool Members:** Your contributions and activity within shared pools
- **We never sell your personal data**

## Your Rights

- **Access:** Request your data
- **Delete:** Remove your account and data
- **Correct:** Update incorrect information
- **Export:** Download your data

## Security

- All data encrypted in transit and at rest
- Banking handled by Stripe (PCI DSS compliant)
- Regular security audits and monitoring

## Contact

Email: privacy@poolup.app

This policy may be updated. We'll notify you of significant changes.`;

  const termsContent = `# Terms of Service for PoolUp

**Last updated:** January 2025

## Service Description

PoolUp is a group savings platform that helps users save money together for shared goals. We facilitate money pooling, contributions, and group accountability through our mobile app.

## Financial Services

**Money Handling:**
- All funds are processed through Stripe Connect
- We do not directly custody user funds
- Interest earnings are calculated on pooled balances
- Withdrawals subject to pool rules and penalties

**Fees:**
- Payment processing fees apply (varies by method)
- Early withdrawal penalties (if agreed by pool members)
- Interest spread on pooled funds (disclosed rate)

## User Responsibilities

**Account Security:**
- Keep login credentials secure
- Report unauthorized access immediately
- Verify all transactions and contributions

**Pool Participation:**
- Honor contribution commitments to your pools
- Respect other members' savings goals
- Follow pool rules and penalty agreements

## Prohibited Uses

- Money laundering or illegal activities
- Fraudulent transactions or chargebacks
- Harassment of other users
- Circumventing security measures

## Liability

**Service Availability:**
- We strive for 99.9% uptime but cannot guarantee uninterrupted service
- Not liable for losses due to technical issues or user error
- Banking services subject to Stripe's terms and availability

**Investment Risk:**
- Pooled funds earn market-rate interest (risk disclosed)
- No guarantee of returns or principal protection
- Users responsible for tax implications

## Account Termination

**By You:**
- Delete account anytime from Settings
- Withdraw remaining balances before deletion
- Data permanently removed within 30 days

**By Us:**
- May terminate for terms violations
- Will provide 30 days notice when possible
- Remaining balances returned via original payment method

## Changes to Terms

We may update these terms with 30 days notice. Continued use constitutes acceptance of new terms.

## Contact

Email: legal@poolup.app

**Governing Law:** United States`;

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFCFF' }}>
      {/* Header */}
      <View style={{ backgroundColor: colors.primary, paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
          <Text style={{ color: 'white', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: 'white', fontSize: 24, fontWeight: '700' }}>
          {isPrivacy ? 'Privacy Policy' : 'Terms of Service'}
        </Text>
      </View>

      <ScrollView style={{ flex: 1, padding: 20 }}>
        <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 20 }}>
          <Text style={{ fontSize: 14, lineHeight: 20, color: colors.text }}>
            {isPrivacy ? privacyContent : termsContent}
          </Text>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
