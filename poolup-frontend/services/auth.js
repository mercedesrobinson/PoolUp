import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as Keychain from 'react-native-keychain';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: '1234567890-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com', // Placeholder - replace with real client ID
  offlineAccess: true,
  hostedDomain: '',
  forceCodeForRefreshToken: true,
});

WebBrowser.maybeCompleteAuthSession();

class AuthService {
  constructor() {
    this.currentUser = null;
  }

  // Gmail OAuth Sign In
  async signInWithGoogle() {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      // Store user credentials securely
      await Keychain.setInternetCredentials(
        'poolup_user',
        userInfo.user.email,
        JSON.stringify(userInfo)
      );
      
      this.currentUser = {
        id: userInfo.user.id,
        name: userInfo.user.name,
        email: userInfo.user.email,
        photo: userInfo.user.photo,
        authProvider: 'google',
        accessToken: userInfo.idToken
      };
      
      return this.currentUser;
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('Sign in cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Sign in in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Play services not available');
      } else {
        throw new Error('Something went wrong with sign in');
      }
    }
  }

  // Sign out
  async signOut() {
    try {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
      await Keychain.resetInternetCredentials('poolup_user');
      this.currentUser = null;
      return true;
    } catch (error) {
      console.error('Sign out error:', error);
      return false;
    }
  }

  // Check if user is signed in
  async isSignedIn() {
    try {
      const credentials = await Keychain.getInternetCredentials('poolup_user');
      if (credentials) {
        this.currentUser = JSON.parse(credentials.password);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Refresh token if needed
  async refreshToken() {
    try {
      const tokens = await GoogleSignin.getTokens();
      return tokens.accessToken;
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }
}

export default new AuthService();
