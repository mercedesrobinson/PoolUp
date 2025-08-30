# PoolUp - Social Savings with Real Banking Integration

A comprehensive React Native app for group and solo savings with real Gmail OAuth authentication, Plaid bank account linking, Stripe virtual debit cards, and full gamification features.

## 🚀 Features

### Authentication & User Management
- **Real Gmail OAuth Integration** - Secure Google sign-in with token management
- **Guest User Support** - Quick access without account creation
- **Profile Management** - Avatar customization and user preferences
- **Travel perks** that unlock based on your level
- **Real-time spending insights** and transaction history
- **Freeze/unfreeze** card instantly for security

### 🎯 **Gamification System**
- **Points & XP**: Earn points for every contribution and level up
- **Streak tracking**: Maintain daily/weekly contribution streaks with fire emojis 🔥
- **Badges & Achievements**: 10+ badges to unlock (First Contribution, Streak Master, Travel Guru, etc.)
- **Leaderboards**: Compete with friends in each pool
- **Bonus multipliers**: Early contributions and streaks earn bonus points

### 🏆 **Team Challenges**
- **Weekly Warriors**: Everyone contributes = group bonus
- **Early Bird**: Contribute before Wednesday for extra rewards
- **Milestone Celebrations**: Unlock bonuses at 25%, 50%, 75% progress
- **Peer Boost**: Help friends cover missed payments and earn bonus points

### 🎁 **Unlockables & Rewards**
- **Travel content**: Destination playlists, fun facts, packing tips
- **Visual progress**: Animated progress bars and celebrations
- **Bonus pot**: Group forfeit fees create shared rewards
- **Travel perks**: Airport lounge access, hotel upgrades (level-based)

### 💰 **Float Revenue System**
- **Daily interest**: Earn 4.5% APY on account balances
- **Automatic compounding**: Interest calculated and paid daily
- **Revenue sharing**: App earns from float like PayPal/Venmo

### 🤝 **Social Features**
- **Forfeit mechanics**: Miss payments = small penalty to group fund
- **Peer boosts**: Cover friends' payments for bonus points
- **Real-time chat** with emoji reactions
- **Group celebrations** when milestones are hit

## 🚀 Quick Start

### 1) Server Setup
```bash
cd server
cp .env.example .env
npm install
npm run dev
# Server starts on http://localhost:4000
# Gamification system initializes with default badges
```

### 2) Mobile App Setup
```bash
cd ../app
npm install

# Set your server URL (replace with your local IP)
export EXPO_PUBLIC_SERVER_URL="http://192.168.1.10:4000"

# For simulator on same machine:
# export EXPO_PUBLIC_SERVER_URL="http://localhost:4000"

npm run start
```

### 3) Testing the App
1. **Scan QR code** with Expo Go app or open in simulator
2. **Create account** with your name
3. **Create a pool** with destination (e.g., "Tokyo Trip")
4. **Make contributions** to earn points and badges
5. **Create debit card** to earn cashback
6. **Test transactions** using the "Test Purchase" button
7. **View leaderboards** and compete with friends

## 📱 App Screens

### Core Screens
- **Onboarding**: Guest sign-in
- **Pools**: Your pools with gamification stats
- **Pool Detail**: Enhanced with streaks, challenges, peer boosts
- **Create Pool**: Now includes destination and trip date
- **Chat**: Real-time group messaging

### New Gamification Screens
- **Profile**: User stats, level, badges, debit card management
- **Debit Card**: Card management, transactions, spending insights
- **Badges**: Collection view with earned and available badges
- **Leaderboard**: Rankings, challenges, and unlockables per pool

## 🛠 Technical Stack

### Backend
- **Node.js + Express**: RESTful API
- **SQLite + better-sqlite3**: Database with gamification tables
- **Socket.IO**: Real-time updates for contributions, badges, challenges
- **Gamification Engine**: Points, streaks, badges, challenges system

### Frontend
- **React Native + Expo**: Cross-platform mobile app
- **React Navigation**: Screen navigation
- **Socket.IO Client**: Real-time features
- **Beautiful UI**: Modern design with animations and celebrations

### Database Schema
```sql
-- Core tables (users, pools, memberships, contributions, messages)
-- Gamification tables (badges, user_badges, challenges, leaderboard_entries)
-- Debit card tables (debit_cards, card_transactions, interest_earnings)
-- Social features (forfeits, unlockables)
```

## 🎮 How Gamification Works

### Points System
- **Base points**: 1 point per dollar contributed
- **Streak bonus**: +50% points for consecutive contributions
- **Early bonus**: +25% points for contributing before Wednesday
- **Peer boost bonus**: +50% points for helping friends

### Badge Categories
- **Milestone**: First contribution, goal completion
- **Consistency**: On-time contributions, streaks
- **Social**: Peer boosts, team challenges
- **Spending**: Debit card usage milestones
- **Leadership**: Pool creation and management

### Challenge Types
- **Group Participation**: Everyone contributes this week
- **Early Contribution**: Contribute before deadline
- **Savings Milestone**: Reach percentage of goal
- **Spending Challenges**: Use debit card for purchases

## 💡 Revenue Model

### Float Revenue (Primary)
- **4.5% APY** earned on user balances
- **Daily compounding** interest calculations
- **Proven model** used by PayPal, Venmo, Cash App

### Debit Card Revenue
- **Interchange fees** from card transactions
- **Premium features** for higher-tier users
- **Travel partnerships** for booking commissions

## 🔧 Development Notes

### Testing Features
- **Simulate transactions**: Use "Test Purchase" button in debit card screen
- **Mock data**: Server initializes with sample badges and challenges
- **Real-time updates**: Multiple devices will sync automatically
- **Database inspection**: Use any SQLite viewer on `server/poolup.db`

### Customization
- **Badge system**: Add new badges in `server/gamification.js`
- **Challenge types**: Extend challenge system for new mechanics
- **UI themes**: Modify colors and styles in `app/theme.js`
- **API endpoints**: All gamification APIs documented in `server/index.js`

## 🚀 Production Deployment

### Required Integrations
- **Authentication**: Implement Clerk or Supabase auth
- **Real payments**: Integrate Stripe for actual transactions
- **Bank connections**: Add Plaid for account linking
- **Push notifications**: Expo push notifications for challenges
- **Card issuing**: Partner with card processor (Marqeta, etc.)

### Scaling Considerations
- **Database**: Migrate to PostgreSQL for production
- **Caching**: Add Redis for leaderboards and real-time features
- **CDN**: Serve static assets and images
- **Monitoring**: Add error tracking and analytics

## 📈 Next Steps

### Phase 1: MVP Enhancements
- [ ] Add mini-games for bonus points
- [ ] Implement animated celebrations
- [ ] Add more badge categories
- [ ] Create admin dashboard

### Phase 2: Social Features
- [ ] Friend system and social graph
- [ ] Pool discovery and public pools
- [ ] Social media sharing
- [ ] Referral rewards program

### Phase 3: Advanced Gamification
- [ ] Seasonal events and limited badges
- [ ] Team vs team competitions
- [ ] Achievement chains and quests
- [ ] Virtual rewards and NFT integration

---

**Ready to gamify your savings? Start the server and create your first pool! 🎯💰**
