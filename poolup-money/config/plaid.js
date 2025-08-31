const { PlaidApi, Configuration, PlaidEnvironments } = require('plaid');
const logger = require('../utils/logger');

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

// Plaid Link configuration
const PLAID_PRODUCTS = (process.env.PLAID_PRODUCTS || 'transactions,auth,identity').split(',');
const PLAID_COUNTRY_CODES = (process.env.PLAID_COUNTRY_CODES || 'US').split(',');

async function createLinkToken(userId) {
  try {
    const request = {
      user: {
        client_user_id: userId,
      },
      client_name: 'PoolUp',
      products: PLAID_PRODUCTS,
      country_codes: PLAID_COUNTRY_CODES,
      language: 'en',
      webhook: process.env.PLAID_WEBHOOK_URL,
      redirect_uri: process.env.PLAID_REDIRECT_URI,
    };

    const response = await plaidClient.linkTokenCreate(request);
    return response.data;
  } catch (error) {
    logger.error('Error creating Plaid link token:', error);
    throw error;
  }
}

async function exchangePublicToken(publicToken) {
  try {
    const request = {
      public_token: publicToken,
    };

    const response = await plaidClient.linkTokenExchange(request);
    return response.data;
  } catch (error) {
    logger.error('Error exchanging public token:', error);
    throw error;
  }
}

async function getAccounts(accessToken) {
  try {
    const request = {
      access_token: accessToken,
    };

    const response = await plaidClient.accountsGet(request);
    return response.data;
  } catch (error) {
    logger.error('Error fetching accounts:', error);
    throw error;
  }
}

async function getAuthData(accessToken) {
  try {
    const request = {
      access_token: accessToken,
    };

    const response = await plaidClient.authGet(request);
    return response.data;
  } catch (error) {
    logger.error('Error fetching auth data:', error);
    throw error;
  }
}

async function getTransactions(accessToken, startDate, endDate, accountIds = null) {
  try {
    const request = {
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
      count: 500,
      offset: 0,
    };

    if (accountIds) {
      request.account_ids = accountIds;
    }

    const response = await plaidClient.transactionsGet(request);
    return response.data;
  } catch (error) {
    logger.error('Error fetching transactions:', error);
    throw error;
  }
}

async function getInstitution(institutionId) {
  try {
    const request = {
      institution_id: institutionId,
      country_codes: PLAID_COUNTRY_CODES,
    };

    const response = await plaidClient.institutionsGetById(request);
    return response.data;
  } catch (error) {
    logger.error('Error fetching institution:', error);
    throw error;
  }
}

async function createProcessorToken(accessToken, accountId) {
  try {
    const request = {
      access_token: accessToken,
      account_id: accountId,
      processor: 'stripe',
    };

    const response = await plaidClient.processorTokenCreate(request);
    return response.data;
  } catch (error) {
    logger.error('Error creating processor token:', error);
    throw error;
  }
}

async function getIdentity(accessToken) {
  try {
    const request = {
      access_token: accessToken,
    };

    const response = await plaidClient.identityGet(request);
    return response.data;
  } catch (error) {
    logger.error('Error fetching identity:', error);
    throw error;
  }
}

module.exports = {
  plaidClient,
  createLinkToken,
  exchangePublicToken,
  getAccounts,
  getAuthData,
  getTransactions,
  getInstitution,
  createProcessorToken,
  getIdentity
};
