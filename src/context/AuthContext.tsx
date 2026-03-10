import React, { createContext, useContext, useState, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  avatar: string;
  position: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

// ─── Demo Accounts ────────────────────────────────────────────────────────────

// Demo credentials (in production these would be server-validated)
const DEMO_ACCOUNTS: (AuthUser & { password: string })[] = [
  {
    id: 'p1', name: 'Alex Rivera', avatar: 'AR', position: 'Outside Hitter',
    email: 'alex@pbt.com', password: 'password123',
  },
  {
    id: 'p2', name: 'Jordan Blake', avatar: 'JB', position: 'Setter',
    email: 'jordan@pbt.com', password: 'password123',
  },
  {
    id: 'p3', name: 'Morgan Chen', avatar: 'MC', position: 'Libero',
    email: 'morgan@pbt.com', password: 'password123',
  },
  {
    id: 'p4', name: 'Taylor Davis', avatar: 'TD', position: 'Middle Blocker',
    email: 'taylor@pbt.com', password: 'password123',
  },
  {
    id: 'p5', name: 'Sam Nguyen', avatar: 'SN', position: 'Opposite Hitter',
    email: 'sam@pbt.com', password: 'password123',
  },
];

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'pbt_auth_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = (email: string, password: string): boolean => {
    const account = DEMO_ACCOUNTS.find(
      a => a.email.toLowerCase() === email.toLowerCase() && a.password === password
    );
    if (!account) return false;
    const { password: _, ...authUser } = account;
    void _;
    setUser(authUser);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
