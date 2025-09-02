// Simple auth service for development - no external dependencies

interface DemoUser {
  id: string;
  name: string;
  email: string;
  photo: string | null;
  authProvider: string;
}

class AuthService {
  private currentUser: DemoUser | null = null;

  // Simple demo sign in
  async signInWithGoogle(): Promise<DemoUser> {
    return {
      id: 'demo_user_' + Date.now(),
      name: 'Demo User',
      email: 'demo@poolup.com',
      photo: null,
      authProvider: 'demo'
    };
  }

  // Sign out
  async signOut(): Promise<boolean> {
    this.currentUser = null;
    return true;
  }

  // Check if user is signed in
  async isSignedIn(): Promise<boolean> {
    return false;
  }

  // Get current user
  getCurrentUser(): DemoUser | null {
    return this.currentUser;
  }

  // Refresh token if needed
  async refreshToken(): Promise<string | null> {
    return null;
  }
}

export default new AuthService();
