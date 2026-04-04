export interface AuthUser {
  id: string;
  name: string;
  avatar: string;
  role: string;
  subscription: string | null;
  email: string;
  teamId: string;
  authSource: 'firestore' | 'supabase';
}

export type LoginResult =
  | { success: true }
  | { success: false; message: string };

export type RegisterFields = {
  name: string;
  email: string;
  password: string;
  role: string;
  teamCode?: string;
  teamName?: string;
};

export type RegisterResult =
  | { success: true; emailSent: boolean; autoApproved: boolean; teamCode?: string; isAdminRegistration: boolean }
  | { success: false; message: string };

export interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (fields: RegisterFields) => Promise<RegisterResult>;
  logout: () => void;
  approveUser: (uid: string, status: 'approved' | 'rejected') => Promise<boolean>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}
