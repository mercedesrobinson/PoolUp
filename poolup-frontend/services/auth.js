// Simple auth service for development - no external dependencies

class AuthService {
  constructor() {
    this.currentUser = null;
  }

  // Simple demo sign in
  async signInWithGoogle() {
    return {
      id: 'demo_user_' + Date.now(),
      name: 'Demo User',
      email: 'demo@poolup.com',
      photo: null,
      authProvider: 'demo'
    };
  }

  // Sign out
  async signOut() {
    this.currentUser = null;
    return true;
  }

  // Check if user is signed in
  async isSignedIn() {
    return false;
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Refresh token if needed
  async refreshToken() {
    return null;
  }
}

export default new AuthService();
