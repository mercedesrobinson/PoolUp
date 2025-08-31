import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

class GoogleAuthService {
  constructor() {
    this.clientId = Platform.select({
      ios: '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com',
      android: '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com',
      web: '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com'
    });
  }

  async signIn() {
    try {
      const redirectUri = AuthSession.makeRedirectUri({
        useProxy: true,
      });

      const request = new AuthSession.AuthRequest({
        clientId: this.clientId,
        scopes: ['openid', 'profile', 'email'],
        redirectUri,
        responseType: AuthSession.ResponseType.IdToken,
        additionalParameters: {},
        extraParams: {},
      });

      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/oauth/authorize',
      });

      if (result.type === 'success') {
        const { id_token } = result.params;
        
        // Decode the ID token to get user info
        const userInfo = this.decodeIdToken(id_token);
        
        // Store tokens securely
        await this.storeTokens({ idToken: id_token });
        
        return {
          id: userInfo.sub,
          name: userInfo.name,
          email: userInfo.email,
          photo: userInfo.picture,
          authProvider: 'google',
          idToken: id_token,
          accessToken: null
        };
      } else {
        throw new Error('Google sign-in was cancelled or failed');
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);
      
      // For development, return a mock user to test the flow
      if (__DEV__) {
        const mockUser = {
          id: 'google_dev_' + Date.now(),
          name: 'Dev Google User',
          email: 'dev@gmail.com',
          photo: 'https://via.placeholder.com/150',
          authProvider: 'google',
          idToken: 'mock_id_token',
          accessToken: null
        };
        
        await this.storeTokens({ idToken: 'mock_id_token' });
        return mockUser;
      }
      
      throw error;
    }
  }

  decodeIdToken(idToken) {
    try {
      const base64Url = idToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding ID token:', error);
      return {};
    }
  }

  async signOut() {
    try {
      await this.clearTokens();
    } catch (error) {
      console.error('Google Sign-Out error:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const tokens = await this.getStoredTokens();
      return tokens ? { isSignedIn: true } : null;
    } catch (error) {
      return null;
    }
  }

  async isSignedIn() {
    try {
      const tokens = await this.getStoredTokens();
      return !!tokens;
    } catch (error) {
      return false;
    }
  }

  async storeTokens(tokens) {
    try {
      await SecureStore.setItemAsync('google_tokens', JSON.stringify(tokens));
    } catch (error) {
      console.error('Error storing tokens:', error);
    }
  }

  async getStoredTokens() {
    try {
      const tokens = await SecureStore.getItemAsync('google_tokens');
      return tokens ? JSON.parse(tokens) : null;
    } catch (error) {
      console.error('Error retrieving tokens:', error);
      return null;
    }
  }

  async clearTokens() {
    try {
      await SecureStore.deleteItemAsync('google_tokens');
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }
}

export default new GoogleAuthService();
