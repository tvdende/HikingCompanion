export type UserRole = 'admin' | 'planner' | 'user';

export type OAuthProvider = 'google' | 'microsoft' | 'github' | 'mock';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export interface AuthSession {
  user: UserProfile;
  expiresAt: string;
}

export interface AdminUserListItem extends UserProfile {
  oauthProviders: string[];
}
