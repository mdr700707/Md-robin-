export type CredentialCategory =
  | 'social'
  | 'email'
  | 'finance'
  | 'entertainment'
  | 'work'
  | 'crypto'
  | 'shopping'
  | 'other';

export interface PasswordItem {
  id: string;
  userId?: string | number;    // টেলিগ্রাম ইউজার আইডি (chat.id / from.id)
  appName: string;             // যেমন: Facebook, Twitter, Instagram, Google
  category: CredentialCategory;
  username: string;            // ইউজার নেম (e.g. user@gmail.com, @username)
  primaryPassword: string;     // প্রথম পাসওয়ার্ড (Password 1)
  secondaryPassword: string;   // দ্বিতীয় পাসওয়ার্ড (Password 2 / Security PIN / 2FA secret)
  notes?: string;              // নোট / সিকিউরিটি তথ্য
  url?: string;                // ওয়েবসাইট লিঙ্ক
  createdAt: number;
  updatedAt: number;
  isFavorite?: boolean;
  strength?: 'weak' | 'medium' | 'strong';
}

export interface TelegramBotLog {
  id: string;
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'error' | 'message' | 'alert';
  user?: string;
  userId?: number | string;
  action: string;
  details?: string;
}

export interface TelegramBotStats {
  totalQueries: number;
  passwordsSaved: number;
  totalMessages: number;
  uniqueUsers: number;
  startedAt: number | null;
}

export interface TelegramBotConfig {
  token: string;
  adminId: string;
  isRunning: boolean;
  botInfo: {
    id?: number;
    first_name?: string;
    username?: string;
  } | null;
  stats: TelegramBotStats;
  hasGemini: boolean;
}

export interface VaultAuditStats {
  total: number;
  withSecondary: number;
  strong: number;
  medium: number;
  weak: number;
  reused: number;
  overallScore: number;
}
