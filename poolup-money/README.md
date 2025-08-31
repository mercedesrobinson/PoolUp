# PoolUp Money - Financial Services Module

A comprehensive financial infrastructure for PoolUp's savings pools and banking features, including Plaid integration, ACH transfers, and Float revenue generation.

## 🏗️ Architecture

This module provides:
- **Plaid Integration** - Bank account linking and verification
- **ACH Transfers** - Deposits, withdrawals, and pool contributions
- **Savings Pools** - Group and solo savings management
- **Float Revenue** - Interest earnings on user balances (like PayPal/Venmo)
- **Analytics** - Financial insights and reporting

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- SQLite3
- Plaid developer account
- Stripe account (optional, for future card features)

### Installation

```bash
cd poolup-money
npm install
cp .env.example .env
```

### Environment Setup

Edit `.env` with your credentials:

```bash
# Plaid Configuration
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret_key
PLAID_ENV=sandbox

# JWT Secret
JWT_SECRET=your_super_secure_jwt_secret_key_here

# Float Revenue Rate (4.5% APY)
FLOAT_INTEREST_RATE=0.045
```

### Database Setup

```bash
npm run migrate
```

### Start Server

```bash
# Development
npm run dev

# Production
npm start
```

Server runs on `http://localhost:3001`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Plaid Banking
- `POST /api/plaid/link/token/create` - Create Plaid Link token
- `POST /api/plaid/link/token/exchange` - Exchange public token
- `GET /api/plaid/accounts` - Get linked accounts
- `POST /api/plaid/accounts/:id/set-primary` - Set primary account

### ACH Transfers
- `POST /api/transfers/ach` - Create ACH transfer
- `GET /api/transfers/history` - Transfer history
- `GET /api/transfers/limits` - Get transfer limits
- `POST /api/transfers/:id/cancel` - Cancel pending transfer

### Savings Pools
- `POST /api/pools` - Create savings pool
- `GET /api/pools/my-pools` - Get user's pools
- `POST /api/pools/:id/join` - Join pool
- `POST /api/pools/:id/contribute` - Make contribution
- `GET /api/pools/discover/public` - Discover public pools

### Float Revenue
- `GET /api/float/revenue/analytics` - Revenue analytics
- `GET /api/float/user-interest` - User interest summary
- `GET /api/float/rates` - Interest rates
- `POST /api/float/calculate/manual` - Manual calculation (admin)

### Analytics
- `GET /api/analytics/user/financial` - User financial analytics
- `GET /api/analytics/pools/:id` - Pool analytics
- `GET /api/analytics/platform/overview` - Platform overview (admin)

## 💰 Float Revenue Model

PoolUp earns revenue through the **Float Model** - the same proven strategy used by PayPal, Venmo, and Cash App:

### How It Works
1. **User Deposits**: Users transfer money from their bank to PoolUp accounts
2. **High-Yield Investment**: PoolUp invests pooled funds at 4.5% APY
3. **User Interest**: Users earn 2.0% APY on their balances
4. **PoolUp Revenue**: 2.5% spread generates revenue

### Revenue Calculation
- **Daily Calculation**: Interest calculated daily (APY ÷ 365)
- **Automatic Processing**: Cron job runs at 2 AM daily
- **Minimum Balance**: $1.00 minimum for interest eligibility
- **Transparent Reporting**: Full analytics and reporting

### Example Revenue
- $1M in user balances = $25,000 annual revenue
- $10M in user balances = $250,000 annual revenue
- Scales linearly with user adoption

## 🏦 Database Schema

### Core Tables
- `users` - User profiles and KYC data
- `plaid_items` - Bank connections
- `bank_accounts` - Linked bank accounts
- `poolup_accounts` - Internal PoolUp accounts
- `savings_pools` - Group/solo savings pools
- `pool_memberships` - Pool participation
- `ach_transfers` - All money movements
- `transactions` - Transaction history
- `float_revenue` - Daily revenue tracking
- `user_interest` - User interest earnings

## 🔒 Security Features

- **JWT Authentication** - Secure API access
- **Rate Limiting** - Prevent abuse
- **Input Validation** - Joi schema validation
- **SQL Injection Protection** - Parameterized queries
- **Audit Logging** - Comprehensive logging
- **Environment Variables** - Secure credential storage

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3001/health
```

### Logs
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure production database
- [ ] Set up Redis for rate limiting
- [ ] Configure proper logging
- [ ] Set up monitoring/alerts
- [ ] Enable HTTPS
- [ ] Configure CORS properly

### Environment Variables
See `.env.example` for all required variables.

## 🤝 Integration with PoolUp App

This module integrates with the main PoolUp React Native app:

1. **Authentication**: Share JWT tokens between services
2. **API Calls**: Frontend calls this service for all money operations
3. **Real-time Updates**: WebSocket integration for live balance updates
4. **Error Handling**: Consistent error responses

## 📈 Scaling Considerations

- **Database**: Consider PostgreSQL for production scale
- **Caching**: Redis for session and data caching
- **Queue System**: Bull/Agenda for background jobs
- **Microservices**: Split into smaller services as needed
- **Load Balancing**: Multiple instances behind load balancer

## 🔧 Development

### Code Structure
```
poolup-money/
├── config/          # Database and service configs
├── routes/          # API route handlers
├── middleware/      # Authentication, validation, etc.
├── utils/           # Logging and utilities
├── scripts/         # Migration and setup scripts
└── logs/           # Application logs
```

### Contributing
1. Create feature branch from `main`
2. Follow existing code style
3. Add tests for new features
4. Update documentation
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**PoolUp Money Services** - Powering the future of social savings 💰
