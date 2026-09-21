import { User, LoginCredentials } from '../models/user';

const TOKEN_STORAGE_KEY = 'realestate_jwt_token';
const EXPLICIT_LOGOUT_KEY = 'realestate_explicit_logout';

export class AuthService {
  private currentUser: User | null = null;
  private token: string | null = null;
  private isInitialized = false;
  private listeners: Array<(user: User | null) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.token = localStorage.getItem(TOKEN_STORAGE_KEY);
      } catch {
        this.token = null;
      }
    }
    this.checkSession();
  }

  getToken(): string | null {
    return this.token;
  }

  setToken(token: string | null): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      try {
        if (token) {
          localStorage.setItem(TOKEN_STORAGE_KEY, token);
        } else {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
      } catch {
        // Ignore localStorage quota/security errors
      }
    }
  }

  /**
   * Validates active session with the backend.
   * Sends Authorization: Bearer <token> and credentials: 'include' for cross-origin iframe support.
   * Auto-logs in with demo account if initial session is unauthenticated, eliminating initial 401 errors.
   */
  async checkSession(): Promise<User | null> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const res = await fetch('/api/auth/me', {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        this.currentUser = data.user;
        if (data.token) {
          this.setToken(data.token);
        }
        return this.currentUser;
      }
    } catch (e) {
      console.warn('Session verification network check:', e);
    }

    // If no valid session and user did NOT explicitly log out, auto-login with default admin demo account
    const wasExplicitlyLoggedOut =
      typeof window !== 'undefined' && sessionStorage.getItem(EXPLICIT_LOGOUT_KEY) === 'true';

    if (!wasExplicitlyLoggedOut) {
      try {
        const autoUser = await this.login({
          email: 'admin@realestate.com.tw',
          password: 'password123',
        });
        return autoUser;
      } catch (err) {
        console.warn('Default demo auto-login attempt failed:', err);
      }
    }

    this.currentUser = null;
    this.setToken(null);
    this.isInitialized = true;
    this.notify();
    return null;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  subscribe(listener: (user: User | null) => void): () => void {
    this.listeners.push(listener);
    listener(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((l) => l(this.currentUser));
  }

  /**
   * Log in via POST /api/auth/login
   * Stores token in memory and localStorage, sets HttpOnly cookie as well.
   */
  async login(credentials: LoginCredentials): Promise<User> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || '登入失敗，請確認帳號與密碼');
    }

    if (data.token) {
      this.setToken(data.token);
    }

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(EXPLICIT_LOGOUT_KEY);
      } catch {
        // Ignore
      }
    }

    this.currentUser = data.user;
    this.isInitialized = true;
    this.notify();
    return data.user;
  }

  /**
   * Log out via POST /api/auth/logout
   * Clears token, marks explicit logout, and clears backend session cookie.
   */
  async logout(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(EXPLICIT_LOGOUT_KEY, 'true');
      }
      this.setToken(null);
      this.currentUser = null;
      this.notify();

      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      console.warn('Logout warning:', e);
    }
  }
}

export const authService = new AuthService();
