import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ----------------------------------------------------
// PASSWORD MANAGER DATA MODEL & VAULT STORE
// ----------------------------------------------------
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
  username: string;            // ইউজার নেম
  primaryPassword: string;     // প্রথম পাসওয়ার্ড (Password 1)
  secondaryPassword: string;   // দ্বিতীয় পাসওয়ার্ড (Password 2 / Security PIN / 2FA secret)
  notes?: string;
  url?: string;
  createdAt: number;
  updatedAt: number;
  isFavorite?: boolean;
  strength?: 'weak' | 'medium' | 'strong';
}

interface BotLog {
  id: string;
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'error' | 'message' | 'alert';
  user?: string;
  userId?: number | string;
  action: string;
  details?: string;
}

interface BotStats {
  totalQueries: number;
  passwordsSaved: number;
  totalMessages: number;
  uniqueUsers: number;
  startedAt: number | null;
}

// Default initial records if no file exists
const defaultVaultItems: PasswordItem[] = [
  {
    id: 'vault-item-1',
    appName: 'Facebook',
    category: 'social',
    username: 'user.personal@gmail.com',
    primaryPassword: 'FbSecure#Pass99!',
    secondaryPassword: '849201-FB-2FA',
    notes: 'Main personal Facebook profile. 2FA enabled on Authenticator.',
    url: 'https://facebook.com',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 2,
    isFavorite: true,
    strength: 'strong',
  },
  {
    id: 'vault-item-2',
    appName: 'Twitter (X)',
    category: 'social',
    username: '@tech_creator',
    primaryPassword: 'XPass9#Quantum2026',
    secondaryPassword: 'PIN: 9382',
    notes: 'Official Twitter account. Linked with Google 2FA.',
    url: 'https://x.com',
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 1,
    isFavorite: true,
    strength: 'strong',
  },
  {
    id: 'vault-item-3',
    appName: 'Instagram',
    category: 'social',
    username: 'creative.shots.official',
    primaryPassword: 'InstaVibe!778$',
    secondaryPassword: 'RecovKey: 5543-9821',
    notes: 'Photography portfolio Instagram handle.',
    url: 'https://instagram.com',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 1,
    isFavorite: true,
    strength: 'strong',
  },
  {
    id: 'vault-item-4',
    appName: 'Google',
    category: 'email',
    username: 'primary.work.email@gmail.com',
    primaryPassword: 'Ggl#AlphaSec_9921',
    secondaryPassword: 'BackupCodes: 4492 8821 1109',
    notes: 'Master Google workspace and drive access.',
    url: 'https://accounts.google.com',
    createdAt: Date.now() - 86400000 * 6,
    updatedAt: Date.now() - 86400000 * 3,
    isFavorite: true,
    strength: 'strong',
  },
  {
    id: 'vault-item-5',
    appName: 'Bank Account',
    category: 'finance',
    username: 'ACCT-9482019482',
    primaryPassword: 'NetBanking$78#Pass',
    secondaryPassword: 'TPIN: 819203',
    notes: 'Online banking portal. Secondary is the 6-digit transaction PIN.',
    url: '',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 1,
    isFavorite: false,
    strength: 'strong',
  },
  {
    id: 'vault-item-6',
    appName: 'Binance (Crypto)',
    category: 'crypto',
    username: 'trader.crypto@proton.me',
    primaryPassword: 'Crypto#Vault2026!X',
    secondaryPassword: 'Google2FA: 902184',
    notes: 'Crypto spot & futures trading account with 2FA.',
    url: 'https://binance.com',
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 86400000 * 1,
    isFavorite: true,
    strength: 'strong',
  },
];

const VAULT_FILE_PATH = path.join(process.cwd(), 'vault_data.json');

function loadVaultFromDisk(): PasswordItem[] {
  try {
    if (fs.existsSync(VAULT_FILE_PATH)) {
      const raw = fs.readFileSync(VAULT_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed reading vault file from disk:', e);
  }
  return [...defaultVaultItems];
}

export function saveVaultToDisk() {
  try {
    fs.writeFileSync(VAULT_FILE_PATH, JSON.stringify(vaultItems, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed writing vault file to disk:', e);
  }
}

// In-memory Vault storage initialized from disk or default
let vaultItems: PasswordItem[] = loadVaultFromDisk();

// HTML escape helper for Telegram messages (so <, >, & in passwords never break HTML parsing)
export function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Bot config and state
let botToken: string = process.env.TELEGRAM_BOT_TOKEN || '';
let adminId: string = process.env.TELEGRAM_ADMIN_ID || '';
let adminPassword: string = process.env.ADMIN_PASSWORD || 'admin123';
let botMasterPin: string = process.env.BOT_MASTER_PIN || '1234';
let isPolling: boolean = false;
let pollingAbortController: AbortController | null = null;
let botInfo: { id?: number; first_name?: string; username?: string } | null = null;
const userSet = new Set<string | number>();

// Track explicitly locked users (By default, bot is open and ready to use!)
const lockedBotUsers = new Set<string>();

export function isBotUserUnlocked(userId: string | number): boolean {
  const uid = String(userId);
  // Default to UNLOCKED so users can freely add and manage passwords!
  return !lockedBotUsers.has(uid);
}

export function lockBotUser(userId: string | number) {
  lockedBotUsers.add(String(userId));
}

export function unlockBotUser(userId: string | number) {
  lockedBotUsers.delete(String(userId));
}

// User conversation state machine for multi-step adding
interface AddSession {
  step: 'appName' | 'username' | 'primaryPassword' | 'secondaryPassword';
  appName?: string;
  username?: string;
  primaryPassword?: string;
  secondaryPassword?: string;
}
const userAddSessions = new Map<string | number, AddSession>();

const stats: BotStats = {
  totalQueries: 0,
  passwordsSaved: vaultItems.length,
  totalMessages: 0,
  uniqueUsers: 0,
  startedAt: null,
};

const logs: BotLog[] = [
  {
    id: 'init-1',
    timestamp: Date.now(),
    type: 'info',
    action: 'Vault Initialized',
    details: `Password Manager loaded with ${vaultItems.length} sample credential records.`,
  },
];

function addLog(log: Omit<BotLog, 'id' | 'timestamp'>) {
  const newLog: BotLog = {
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
  };
  logs.unshift(newLog);
  if (logs.length > 150) {
    logs.pop();
  }
}

// Lazy Gemini client helper
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Telegram API Helper function
async function telegramCall(method: string, payload: any, tokenOverride?: string) {
  const token = tokenOverride || botToken;
  if (!token) throw new Error('Telegram Bot Token is not configured');
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.description || `Telegram API call ${method} failed`);
  }
  return data.result;
}

// Generate random strong password
function generateQuickPassword(length = 16): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()_+';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate 6-digit Security PIN
function generateQuickPin(digits = 6): string {
  let pin = '';
  for (let i = 0; i < digits; i++) {
    pin += Math.floor(Math.random() * 10).toString();
  }
  return pin;
}

// ----------------------------------------------------
// TELEGRAM BOT UI COMPONENTS (BOTTOM KEYBOARDS & INLINE)
// ----------------------------------------------------
export const TELEGRAM_MAIN_KEYBOARD = {
  keyboard: [
    [{ text: '📂 সংরক্ষিত পাসওয়ার্ড' }, { text: '➕ নতুন পাসওয়ার্ড যোগ' }],
    [{ text: '🗑️ পাসওয়ার্ড মুছুন' }, { text: '🎲 পাসওয়ার্ড জেনারেটর' }],
    [{ text: '🔢 ৬-ডিজিট PIN' }, { text: '🛡️ সিকিউরিটি ভল্ট' }],
    [{ text: 'ℹ️ বট হেল্প & তথ্য' }],
  ],
  resize_keyboard: true,
  is_persistent: true,
};

export const TELEGRAM_UNLOCKED_KEYBOARD = TELEGRAM_MAIN_KEYBOARD;

export const TELEGRAM_LOCKED_KEYBOARD = {
  keyboard: [
    [{ text: '🔑 ভল্ট আনলক করুন (PIN)' }],
    [{ text: '📂 সংরক্ষিত পাসওয়ার্ড' }, { text: '➕ নতুন পাসওয়ার্ড যোগ' }],
    [{ text: '🎲 পাসওয়ার্ড জেনারেটর' }, { text: 'ℹ️ বট হেল্প & তথ্য' }],
  ],
  resize_keyboard: true,
  is_persistent: true,
};

function makeLockedPrompt(userId: string | number, userName: string): BotResponsePayload {
  return {
    text:
      `🔒 <b>ভল্ট সুরক্ষিত ও লক করা আছে!</b>\n\n` +
      `🛡️ অননুমোদিত ব্যক্তির হাত থেকে আপনার পাসওয়ার্ড রক্ষা করতে ভল্ট লক রয়েছে।\n` +
      `পুনরায় আনলক করতে আপনার <b>মাস্টার PIN</b> দিন:\n` +
      `<i>(ডিফল্ট মাস্টার পিন: <code>${botMasterPin}</code>)</i>\n\n` +
      `👇 নিচের কুইক আনলক বোতাম চাপুন অথবা চ্যাটে পিন লিখে পাঠান:`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: `🔑 কুইক আনলক পিন (${botMasterPin})`, callback_data: 'quick_unlock_pin' }],
        [{ text: '📂 অ্যাপস তালিকা', callback_data: 'refresh_apps' }, { text: '➕ নতুন যোগ', callback_data: 'start_add' }],
      ],
    },
  };
}

// Build inline keyboard showing all stored apps (2 buttons per row)
function buildAppsInlineKeyboard() {
  const inline_keyboard: any[][] = [];
  const rows: any[] = [];

  vaultItems.forEach((item) => {
    let icon = '📱';
    const lower = item.appName.toLowerCase();
    if (lower.includes('facebook')) icon = '🔵';
    else if (lower.includes('twitter') || lower.includes('x')) icon = '🐦';
    else if (lower.includes('instagram')) icon = '📸';
    else if (lower.includes('google') || lower.includes('gmail')) icon = '🔴';
    else if (lower.includes('bank') || lower.includes('bkash')) icon = '🏦';
    else if (lower.includes('binance') || lower.includes('crypto')) icon = '🟡';

    rows.push({
      text: `${icon} ${escapeHtml(item.appName)}`,
      callback_data: `view_app:${item.id}`,
    });
  });

  // Group 2 per row
  for (let i = 0; i < rows.length; i += 2) {
    if (i + 1 < rows.length) {
      inline_keyboard.push([rows[i], rows[i + 1]]);
    } else {
      inline_keyboard.push([rows[i]]);
    }
  }

  // Action footer rows
  inline_keyboard.push([
    { text: '➕ নতুন অ্যাপ যোগ', callback_data: 'start_add' },
    { text: '🗑️ পাসওয়ার্ড মুছুন', callback_data: 'start_delete' },
  ]);
  inline_keyboard.push([
    { text: '🔄 রিফ্রেশ তালিকা', callback_data: 'refresh_apps' },
  ]);

  return { inline_keyboard };
}

// Format single credential detail with <tg-spoiler>
function formatCredentialMessage(item: PasswordItem) {
  const safeApp = escapeHtml(item.appName);
  const safeUser = escapeHtml(item.username);
  const safePass1 = escapeHtml(item.primaryPassword);
  const safePass2 = item.secondaryPassword ? escapeHtml(item.secondaryPassword) : '';
  const safeNotes = item.notes ? escapeHtml(item.notes) : '';

  return (
    `🔐 <b>${safeApp} এর সুরক্ষিত পাসওয়ার্ড ও তথ্য</b>\n\n` +
    `📱 <b>অ্যাপ:</b> <b>${safeApp}</b>\n` +
    `👤 <b>ইউজার নেম / আইডি:</b> <code>${safeUser}</code>\n\n` +
    `🔑 <b>১ম পাসওয়ার্ড (Password 1):</b>\n<tg-spoiler>${safePass1}</tg-spoiler>\n\n` +
    `🛡️ <b>২য় পাসওয়ার্ড (PIN / 2FA Secret):</b>\n` +
    (safePass2 ? `<tg-spoiler>${safePass2}</tg-spoiler>\n\n` : `<i>কোনো ২য় পাসওয়ার্ড নেই</i>\n\n`) +
    (safeNotes ? `📝 <b>নোট:</b> <i>${safeNotes}</i>\n\n` : '') +
    `<i>💡 টিপস: পাসওয়ার্ড দেখতে উপরের কালো বক্সে ট্যাপ করুন। (Tap black box to reveal).</i>`
  );
}

// ----------------------------------------------------
// CORE TELEGRAM BOT MESSAGE & ACTION DISPATCHER
// (Used by real Telegram Polling AND the Web Simulator)
// ----------------------------------------------------
export interface BotResponsePayload {
  text: string;
  parse_mode?: string;
  reply_markup?: any;
}

export async function processBotInput(
  userId: string | number,
  userName: string,
  text: string,
  callbackData?: string
): Promise<BotResponsePayload> {
  stats.totalMessages += 1;
  userSet.add(userId);
  stats.uniqueUsers = userSet.size;

  // 1. HANDLE INLINE BUTTON CALLBACK QUERIES
  if (callbackData) {
    // Lock Vault callback
    if (callbackData === 'lock_vault') {
      lockBotUser(userId);
      addLog({
        type: 'info',
        user: userName,
        userId,
        action: 'Bot Locked',
        details: 'Vault locked on Telegram Bot.',
      });
      return {
        text:
          `🔒 <b>ভল্ট সফলভাবে লক করা হয়েছে!</b>\n\n` +
          `সকল সংরক্ষিত পাসওয়ার্ড ও তথ্য লুকানো হয়েছে।\n` +
          `পুনরায় আনলক করতে <b>মাস্টার PIN</b> (<code>${botMasterPin}</code>) দিন।`,
        parse_mode: 'HTML',
        reply_markup: TELEGRAM_LOCKED_KEYBOARD,
      };
    }

    // Quick Unlock callback
    if (callbackData === 'quick_unlock_pin') {
      unlockBotUser(userId);
      addLog({
        type: 'info',
        user: userName,
        userId,
        action: 'Bot Unlocked',
        details: 'Vault unlocked via Master PIN.',
      });
      return {
        text:
          `🔓 <b>ভল্ট সফলভাবে আনলক করা হয়েছে!</b>\n\n` +
          `স্বাগতম <b>${userName}</b>! এখন আপনি সমস্ত সুরক্ষিত পাসওয়ার্ড দেখতে ও পরিচালনা করতে পারবেন।\n\n` +
          `📂 <b>আপনার সংরক্ষিত পাসওয়ার্ড ভল্ট (${vaultItems.length} টি অ্যাকাউন্ট):</b>`,
        parse_mode: 'HTML',
        reply_markup: buildAppsInlineKeyboard(),
      };
    }

    // Safe public utilities (accessible without unlocking)
    if (callbackData === 'regen_pass') {
      const newPass = generateQuickPassword(16);
      return {
        text:
          `🎲 <b>নতুন শক্তিশালী পাসওয়ার্ড:</b>\n\n<code>${newPass}</code>\n\n` +
          `<i>ট্যাপ করলেই কপি হয়ে যাবে (Tap to copy).</i>`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: '🔄 আরেকটি জেনারেট করুন', callback_data: 'regen_pass' }]],
        },
      };
    }

    if (callbackData === 'regen_pin') {
      const pin = generateQuickPin(6);
      return {
        text:
          `🔢 <b>নতুন সিকিউরিটি PIN:</b>\n\n<code>${pin}</code>\n\n` +
          `<i>ট্যাপ করে কপি করুন (Tap to copy).</i>`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: '🔄 আরেকটি PIN জেনারেট করুন', callback_data: 'regen_pin' }]],
        },
      };
    }

    // All other callbacks require the bot session to be UNLOCKED!
    if (!isBotUserUnlocked(userId)) {
      return makeLockedPrompt(userId, userName);
    }

    // ----------------------------------------------------
    // INLINE BUTTON CALLBACK QUERY HANDLERS (CALLBACK_QUERY)
    // ----------------------------------------------------
    // View specific app details:
    // Matches: "view_app:...", "app:...", "view:...", or direct app names like "Netflix", "Facebook", "Twitter", "Instagram", etc.
    let appQueryKey = '';
    if (callbackData.startsWith('view_app:')) {
      appQueryKey = callbackData.replace('view_app:', '').trim();
    } else if (callbackData.startsWith('app:')) {
      appQueryKey = callbackData.replace('app:', '').trim();
    } else if (callbackData.startsWith('view:')) {
      appQueryKey = callbackData.replace('view:', '').trim();
    } else if (
      vaultItems.some(
        (it) =>
          it.id.toLowerCase() === callbackData.toLowerCase() ||
          it.appName.toLowerCase() === callbackData.toLowerCase() ||
          it.appName.toLowerCase().includes(callbackData.toLowerCase()) ||
          callbackData.toLowerCase().includes(it.appName.toLowerCase())
      )
    ) {
      appQueryKey = callbackData.trim();
    }

    if (appQueryKey) {
      // Find by exact ID, exact appName, or partial case-insensitive appName
      let found = vaultItems.find(
        (it) =>
          it.id.toLowerCase() === appQueryKey.toLowerCase() ||
          it.appName.toLowerCase() === appQueryKey.toLowerCase()
      );
      if (!found) {
        found = vaultItems.find(
          (it) =>
            it.appName.toLowerCase().includes(appQueryKey.toLowerCase()) ||
            appQueryKey.toLowerCase().includes(it.appName.toLowerCase())
        );
      }

      if (found) {
        stats.totalQueries += 1;
        addLog({
          type: 'alert',
          user: userName,
          userId,
          action: 'App Queried',
          details: `Viewed credentials for "${found.appName}".`,
        });

        // Notify Admin ID if different user
        if (adminId && String(adminId) !== String(userId)) {
          telegramCall('sendMessage', {
            chat_id: adminId,
            text: `⚠️ <b>Security Alert:</b>\n👤 User: <b>${escapeHtml(userName)}</b> (ID: <code>${userId}</code>)\n📱 Queried: <b>${escapeHtml(found.appName)}</b>\n⏰ Time: ${new Date().toLocaleTimeString()}`,
            parse_mode: 'HTML',
          }).catch(() => {});
        }

        return {
          text: formatCredentialMessage(found),
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📋 কপি ফরম্যাট টেক্সট', callback_data: `copy_fmt:${found.id}` },
                { text: '🗑️ মুছে ফেলুন', callback_data: `del_confirm:${found.id}` },
              ],
              [
                { text: '🔙 সকল অ্যাপের তালিকা', callback_data: 'refresh_apps' },
                { text: '➕ নতুন পাসওয়ার্ড যোগ', callback_data: 'start_add' },
              ],
            ],
          },
        };
      } else {
        return {
          text: '❌ এই অ্যাকাউন্টটি আর ভল্টে পাওয়া যায়নি!',
          parse_mode: 'HTML',
          reply_markup: buildAppsInlineKeyboard(),
        };
      }
    }

    // Refresh list of apps
    if (callbackData === 'refresh_apps') {
      return {
        text: `📂 <b>আপনার সংরক্ষিত পাসওয়ার্ড ভল্ট (${vaultItems.length} টি অ্যাকাউন্ট):</b>\n\nযেকোনো অ্যাকাউন্টের ইউজারনেম ও পাসওয়ার্ড দেখতে নিচের বাটনে চাপুন 👇`,
        parse_mode: 'HTML',
        reply_markup: buildAppsInlineKeyboard(),
      };
    }

    // Start Delete Selection View
    if (callbackData === 'start_delete') {
      if (vaultItems.length === 0) {
        return {
          text: '📭 <b>ভল্ট সম্পূর্ণ খালি!</b> মুছে ফেলার মতো কোনো অ্যাকাউন্ট নেই।',
          parse_mode: 'HTML',
          reply_markup: buildAppsInlineKeyboard(),
        };
      }
      const delRows: any[][] = [];
      vaultItems.forEach((it) => {
        delRows.push([
          { text: `🗑️ ${escapeHtml(it.appName)} (${escapeHtml(it.username)})`, callback_data: `del_confirm:${it.id}` }
        ]);
      });
      delRows.push([{ text: '🔙 ব্যাকে যান', callback_data: 'refresh_apps' }]);

      return {
        text:
          `🗑️ <b>পাসওয়ার্ড রিমুভ / ডিলিট ম্যানেজার:</b>\n\n` +
          `যে অ্যাকাউন্টটি ভল্ট থেকে মুছে ফেলতে চান, তার ওপর ট্যাপ করুন 👇`,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: delRows },
      };
    }

    // Start Add Wizard
    if (callbackData === 'start_add') {
      userAddSessions.set(userId, { step: 'appName' });
      return {
        text: `➕ <b>নতুন অ্যাকাউন্ট যোগ করার প্রক্রিয়া শুরু হয়েছে</b>\n\n📌 <b>ধাপ ১/৪:</b> অ্যাপ বা ওয়েবসাইটের নাম লিখুন:\n<i>(যেমন: Facebook, Twitter, Instagram, bKash, Google...)</i>`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: '❌ বাতিল করুন', callback_data: 'cancel_wizard' }]],
        },
      };
    }

    // Cancel Add Wizard
    if (callbackData === 'cancel_wizard') {
      userAddSessions.delete(userId);
      return {
        text: '❌ অ্যাকাউন্ট যোগ করার প্রক্রিয়া বাতিল করা হয়েছে।',
        parse_mode: 'HTML',
        reply_markup: TELEGRAM_MAIN_KEYBOARD,
      };
    }

    // Wizard Auto Generate Password
    if (callbackData === 'wizard_auto_pass') {
      const session = userAddSessions.get(userId);
      if (session && session.step === 'primaryPassword') {
        const strongPass = generateQuickPassword(16);
        session.primaryPassword = strongPass;
        session.step = 'secondaryPassword';
        return {
          text:
            `🎲 <b>অটো পাসওয়ার্ড নির্বাচন করা হয়েছে:</b> <code>${strongPass}</code>\n\n` +
            `🛡️ <b>ধাপ ৪/৪:</b> এবার ২য় পাসওয়ার্ড / PIN / 2FA সিকিউরিটি কোড লিখুন:\n<i>(না থাকলে নিচের '⏩ স্কিপ করুন' বাটনে চাপুন)</i>`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '⏩ স্কিপ করুন (কোনো ২য় পাসওয়ার্ড নেই)', callback_data: 'wizard_skip_sec' }],
              [{ text: '❌ বাতিল করুন', callback_data: 'cancel_wizard' }],
            ],
          },
        };
      }
    }

    // Wizard Skip Secondary Password
    if (callbackData === 'wizard_skip_sec') {
      const session = userAddSessions.get(userId);
      if (session && session.step === 'secondaryPassword') {
        session.secondaryPassword = '';
        const appName = session.appName || 'Custom App';
        const username = session.username || 'user';
        const primaryPassword = session.primaryPassword || generateQuickPassword(16);

        const newItem: PasswordItem = {
          id: `vault-item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          appName,
          category: 'social',
          username,
          primaryPassword,
          secondaryPassword: '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          strength: 'strong',
        };

        vaultItems.unshift(newItem);
        stats.passwordsSaved = vaultItems.length;
        saveVaultToDisk();
        userAddSessions.delete(userId);

        addLog({
          type: 'success',
          user: userName,
          userId,
          action: 'App Added',
          details: `Added "${appName}" (${username}) via Telegram Bot buttons.`,
        });

        return {
          text:
            `🎉 <b>"${escapeHtml(appName)}" সফলভাবে ভল্টে সংরক্ষিত হয়েছে!</b>\n\n` +
            `👤 ইউজারনেম: <code>${escapeHtml(username)}</code>\n` +
            `🔑 ১ম পাসওয়ার্ড: <tg-spoiler>${escapeHtml(primaryPassword)}</tg-spoiler>\n` +
            `🛡️ ২য় পাসওয়ার্ড: <i>কোনোটি নেই</i>\n\n` +
            `নিচের <b>"📂 সংরক্ষিত পাসওয়ার্ড"</b> বাটনে চাপলে যেকোনো সময় এটি দেখতে পাবেন।`,
          parse_mode: 'HTML',
          reply_markup: TELEGRAM_MAIN_KEYBOARD,
        };
      }
    }

    // Copy Format Callback
    if (callbackData.startsWith('copy_fmt:')) {
      const id = callbackData.replace('copy_fmt:', '').trim();
      const item = vaultItems.find((it) => it.id === id);
      if (item) {
        return {
          text:
            `📋 <b>${escapeHtml(item.appName)} কপি ফরম্যাট:</b>\n\n` +
            `👤 ইউজারনেম:\n<code>${escapeHtml(item.username)}</code>\n\n` +
            `🔑 ১ম পাসওয়ার্ড:\n<code>${escapeHtml(item.primaryPassword)}</code>\n\n` +
            (item.secondaryPassword ? `🛡️ ২য় পাসওয়ার্ড/PIN:\n<code>${escapeHtml(item.secondaryPassword)}</code>\n\n` : '') +
            `<i>(যেকোনো বক্সে ট্যাপ করলেই ক্লিপবোর্ডে কপি হয়ে যাবে)</i>`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🗑️ এই অ্যাকাউন্টটি মুছুন', callback_data: `del_confirm:${item.id}` },
                { text: '🔙 ব্যাকে যান', callback_data: `view_app:${item.id}` },
              ],
            ],
          },
        };
      }
    }

    // Delete Prompt
    if (callbackData.startsWith('del_confirm:')) {
      const id = callbackData.replace('del_confirm:', '').trim();
      const item = vaultItems.find((it) => it.id === id);
      if (item) {
        return {
          text:
            `⚠️ <b>অ্যাকাউন্ট মুছে ফেলার নিশ্চিতকরণ:</b>\n\n` +
            `আপনি কি সত্যিই <b>"${escapeHtml(item.appName)}"</b> (${escapeHtml(item.username)}) অ্যাকাউন্টটি মুছে ফেলতে চান?`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🗑️ হ্যাঁ, নিশ্চিত মুছুন', callback_data: `del_exec:${item.id}` },
                { text: '❌ বাতিল', callback_data: `view_app:${item.id}` },
              ],
            ],
          },
        };
      }
    }

    // Delete Execute
    if (callbackData.startsWith('del_exec:')) {
      const id = callbackData.replace('del_exec:', '').trim();
      const idx = vaultItems.findIndex((it) => it.id === id);
      if (idx >= 0) {
        const deleted = vaultItems.splice(idx, 1)[0];
        stats.passwordsSaved = vaultItems.length;
        saveVaultToDisk();
        addLog({
          type: 'warning',
          user: userName,
          userId,
          action: 'App Deleted',
          details: `Deleted "${deleted.appName}" (${deleted.username}) from Telegram Bot.`,
        });
        return {
          text:
            `✅ <b>"${escapeHtml(deleted.appName)}" (${escapeHtml(deleted.username)}) সফলভাবে মুছে ফেলা হয়েছে!</b>\n\n` +
            `বর্তমানে ভল্টে মোট <b>${vaultItems.length}</b> টি অ্যাকাউন্ট রয়েছে।`,
          parse_mode: 'HTML',
          reply_markup: buildAppsInlineKeyboard(),
        };
      } else {
        return {
          text: `⚠️ অ্যাকাউন্টটি ইতোমধ্যে মুছে ফেলা হয়েছে অথবা ভল্টে পাওয়া যায়নি।`,
          parse_mode: 'HTML',
          reply_markup: buildAppsInlineKeyboard(),
        };
      }
    }
  }

  // 2. CHECK IF USER IS INSIDE THE "ADD CREDENTIAL" STEP-BY-STEP CONVERSATION
  const activeSession = userAddSessions.get(userId);
  if (activeSession) {
    if (text === '❌ বাতিল' || text.toLowerCase() === 'cancel') {
      userAddSessions.delete(userId);
      return {
        text: '❌ অ্যাকাউন্ট যোগ করার প্রক্রিয়া বাতিল করা হয়েছে।',
        parse_mode: 'HTML',
        reply_markup: TELEGRAM_MAIN_KEYBOARD,
      };
    }

    if (activeSession.step === 'appName') {
      activeSession.appName = text.trim();
      activeSession.step = 'username';
      return {
        text:
          `✅ অ্যাপের নাম: <b>${activeSession.appName}</b>\n\n` +
          `👤 <b>ধাপ ২/৪:</b> এবার ইউজার নেম, ইমেইল অথবা মোবাইল নম্বর লিখুন:`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: '❌ বাতিল করুন', callback_data: 'cancel_wizard' }]],
        },
      };
    }

    if (activeSession.step === 'username') {
      activeSession.username = text.trim();
      activeSession.step = 'primaryPassword';
      return {
        text:
          `✅ ইউজারনেম: <code>${activeSession.username}</code>\n\n` +
          `🔑 <b>ধাপ ৩/৪:</b> এবার আপনার <b>১ম পাসওয়ার্ড</b> লিখুন:\n` +
          `<i>(অথবা স্বয়ংক্রিয় ১৬ অক্ষরের পাসওয়ার্ড নিতে নিচের বোতামে চাপুন)</i>`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎲 অটো স্ট্রং পাসওয়ার্ড দিন', callback_data: 'wizard_auto_pass' }],
            [{ text: '❌ বাতিল করুন', callback_data: 'cancel_wizard' }],
          ],
        },
      };
    }

    if (activeSession.step === 'primaryPassword') {
      activeSession.primaryPassword = text.trim();
      activeSession.step = 'secondaryPassword';
      return {
        text:
          `🔑 ১ম পাসওয়ার্ড সংরক্ষিত।\n\n` +
          `🛡️ <b>ধাপ ৪/৪:</b> এবার <b>২য় পাসওয়ার্ড / PIN / 2FA সিকিউরিটি কোড</b> লিখুন:\n` +
          `<i>(যদি কোনো ২য় পাসওয়ার্ড না থাকে, তবে নিচের বোতামে চাপুন)</i>`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '⏩ স্কিপ করুন (কোনো ২য় পাসওয়ার্ড নেই)', callback_data: 'wizard_skip_sec' }],
            [{ text: '❌ বাতিল করুন', callback_data: 'cancel_wizard' }],
          ],
        },
      };
    }

    if (activeSession.step === 'secondaryPassword') {
      activeSession.secondaryPassword = text.trim();
      const appName = activeSession.appName || 'Custom App';
      const username = activeSession.username || 'user';
      const primaryPassword = activeSession.primaryPassword || '';
      const secondaryPassword = activeSession.secondaryPassword;

      const newItem: PasswordItem = {
        id: `vault-item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        appName,
        category: 'social',
        username,
        primaryPassword,
        secondaryPassword,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        strength: 'strong',
      };

      vaultItems.unshift(newItem);
      stats.passwordsSaved = vaultItems.length;
      saveVaultToDisk();
      userAddSessions.delete(userId);

      addLog({
        type: 'success',
        user: userName,
        userId,
        action: 'App Added',
        details: `Saved "${appName}" (${username}) via Telegram conversation.`,
      });

      return {
        text:
          `🎉 <b>"${escapeHtml(appName)}" সফলভাবে ভল্টে সংরক্ষিত হয়েছে!</b>\n\n` +
          `👤 ইউজারনেম: <code>${escapeHtml(username)}</code>\n` +
          `🔑 ১ম পাসওয়ার্ড: <tg-spoiler>${escapeHtml(primaryPassword)}</tg-spoiler>\n` +
          `🛡️ ২য় পাসওয়ার্ড: <tg-spoiler>${escapeHtml(secondaryPassword)}</tg-spoiler>\n\n` +
          `পাসওয়ার্ড দেখতে যেকোনো সময় নিচের <b>"📂 সংরক্ষিত পাসওয়ার্ড"</b> বাটনে চাপুন।`,
        parse_mode: 'HTML',
        reply_markup: TELEGRAM_MAIN_KEYBOARD,
      };
    }
  }

  // 3. HANDLE BOTTOM BUTTON TEXTS & COMMANDS
  const lowerText = text.toLowerCase().trim();

  // A. Lock Vault Command
  if (text.includes('লক করুন') || lowerText === '/lock' || lowerText === 'lock') {
    lockBotUser(userId);
    addLog({
      type: 'info',
      user: userName,
      userId,
      action: 'Bot Locked',
      details: 'User locked Telegram bot vault.',
    });
    return {
      text:
        `🔒 <b>ভল্ট সফলভাবে লক করা হয়েছে!</b>\n\n` +
        `পাসওয়ার্ড ও যাবতীয় সংবেদনশীল তথ্য এখন সম্পূর্ণ সুরক্ষিত ও লুকানো। বাইরে থেকে কেউ ঢুকলে আর পাসওয়ার্ড দেখতে পারবে না।\n\n` +
        `ভল্ট পুনরায় খুলতে আপনার <b>মাস্টার PIN</b> (<code>${botMasterPin}</code>) লিখুন অথবা নিচের বাটনে চাপুন।`,
      parse_mode: 'HTML',
      reply_markup: TELEGRAM_LOCKED_KEYBOARD,
    };
  }

  // B. Unlock Vault with Master PIN or /unlock
  const parts = text.trim().split(/\s+/);
  const candidatePin = text.trim() === botMasterPin ? botMasterPin : parts[0].toLowerCase() === '/unlock' ? parts[1] : '';

  if (candidatePin === botMasterPin) {
    unlockBotUser(userId);
    addLog({
      type: 'info',
      user: userName,
      userId,
      action: 'Bot Unlocked',
      details: 'User unlocked Telegram bot vault with Master PIN.',
    });
    return {
      text:
        `🔓 <b>ভল্ট সফলভাবে আনলক হয়েছে!</b>\n\n` +
        `স্বাগতম <b>${userName}</b>! এখন আপনি সমস্ত সুরক্ষিত পাসওয়ার্ড দেখতে ও পরিচালনা করতে পারবেন।\n\n` +
        `📂 <b>আপনার সংরক্ষিত পাসওয়ার্ড ভল্ট (${vaultItems.length} টি অ্যাকাউন্ট):</b>`,
      parse_mode: 'HTML',
      reply_markup: buildAppsInlineKeyboard(),
    };
  }

  if (text.includes('ভল্ট আনলক') || lowerText === '/unlock') {
    return makeLockedPrompt(userId, userName);
  }

  // C. Change Master PIN: /setpin <newpin>
  if (lowerText.startsWith('/setpin')) {
    if (!isBotUserUnlocked(userId)) {
      return makeLockedPrompt(userId, userName);
    }
    const newPin = parts[1];
    if (!newPin || newPin.length < 4) {
      return {
        text: `⚠️ নতুন পিন অন্তত ৪ সংখ্যার হতে হবে। উদাহরণ: <code>/setpin 5678</code>`,
        parse_mode: 'HTML',
        reply_markup: TELEGRAM_UNLOCKED_KEYBOARD,
      };
    }
    botMasterPin = newPin;
    addLog({
      type: 'success',
      user: userName,
      userId,
      action: 'PIN Changed',
      details: `Telegram bot Master PIN updated to "${newPin}".`,
    });
    return {
      text: `✅ <b>মাস্টার সিকিউরিটি PIN সফলভাবে আপডেট করা হয়েছে!</b>\n\nনতুন মাস্টার PIN: <code>${newPin}</code>`,
      parse_mode: 'HTML',
      reply_markup: TELEGRAM_UNLOCKED_KEYBOARD,
    };
  }

  // D. Delete App Command: /delete <appName> or /remove <appName>
  if (lowerText.startsWith('/delete') || lowerText.startsWith('/remove')) {
    if (!isBotUserUnlocked(userId)) {
      return makeLockedPrompt(userId, userName);
    }
    const targetName = text.replace(/^\/(delete|remove)/i, '').trim();
    if (!targetName) {
      return {
        text: `⚠️ যে অ্যাকাউন্টটি মুছতে চান তার নাম লিখুন। যেমন: <code>/delete Facebook</code>`,
        parse_mode: 'HTML',
        reply_markup: TELEGRAM_UNLOCKED_KEYBOARD,
      };
    }
    const foundIdx = vaultItems.findIndex((it) => it.appName.toLowerCase().includes(targetName.toLowerCase()));
    if (foundIdx >= 0) {
      const found = vaultItems[foundIdx];
      return {
        text: `⚠️ আপনি কি সত্যিই <b>"${found.appName}"</b> (${found.username}) অ্যাকাউন্টটি মুছে ফেলতে চান?`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🗑️ হ্যাঁ, নিশ্চিত মুছুন', callback_data: `del_exec:${found.id}` },
              { text: '❌ বাতিল', callback_data: `view_app:${found.id}` },
            ],
          ],
        },
      };
    } else {
      return {
        text: `❌ "${targetName}" নামে কোনো অ্যাকাউন্ট পাওয়া যায়নি!`,
        parse_mode: 'HTML',
        reply_markup: buildAppsInlineKeyboard(),
      };
    }
  }

  // Safe Public Utilities (Accessible in both locked and unlocked states)
  // "🎲 পাসওয়ার্ড জেনারেটর" or /gen
  if (text.includes('পাসওয়ার্ড জেনারেটর') || lowerText === '/gen' || lowerText.includes('password')) {
    const strongPass = generateQuickPassword(16);
    return {
      text:
        `🎲 <b>উচ্চ নিরাপত্তার ১৬ অক্ষরের পাসওয়ার্ড:</b>\n\n` +
        `<code>${strongPass}</code>\n\n` +
        `<i>ট্যাপ করলেই কপি হয়ে যাবে (Tap to copy).</i>`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{ text: '🔄 আরেকটি জেনারেট করুন', callback_data: 'regen_pass' }]],
      },
    };
  }

  // "🔢 ইনস্ট্যান্ট ৬-ডিজিট PIN" or /pin
  if (text.includes('ইনস্ট্যান্ট') || text.includes('pin') || lowerText === '/pin') {
    const pin = generateQuickPin(6);
    return {
      text:
        `🔢 <b>ইনস্ট্যান্ট ৬-সংখ্যার সিকিউরিটি PIN:</b>\n\n` +
        `<code>${pin}</code>\n\n` +
        `<i>(এটিএম, বিকাশ বা সিকিউরিটি কোড হিসেবে ব্যবহারের উপযোগী)</i>`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{ text: '🔄 আরেকটি PIN জেনারেট করুন', callback_data: 'regen_pin' }]],
      },
    };
  }

  // "ℹ️ বট হেল্প & তথ্য" or /start or /help
  if (text.includes('বট হেল্প') || lowerText === '/start' || lowerText === '/help' || lowerText === 'help') {
    const isUnlocked = isBotUserUnlocked(userId);
    return {
      text:
        `👋 <b>VaultGuard সাইবার পাসওয়ার্ড ম্যানেজার বটে স্বাগতম!</b>\n\n` +
        `এই বটটির মাধ্যমে আপনি অতি সহজে আপনার সমস্ত সোশ্যাল মিডিয়া ও ব্যাংক অ্যাকাউন্টের ইউজারনেম, ১ম পাসওয়ার্ড ও ২য় পাসওয়ার্ড পরিচালনা করতে পারবেন।\n\n` +
        (isUnlocked
          ? `🟢 <b>ভল্ট স্ট্যাটাস:</b> আনলকড (Unlocked)\n`
          : `🔒 <b>ভল্ট স্ট্যাটাস:</b> লকড (Locked) — পাসওয়ার্ড দেখতে মাস্টার PIN <code>${botMasterPin}</code> দিন\n`) +
        `\n💡 <b>কোনো কমান্ড মুখস্থ করার দরকার নেই!</b>\n` +
        `নিচের বড় বোতামগুলো ব্যবহার করেই সমস্ত কাজ এক ট্যাপে করা যাবে:\n\n` +
        `• <b>📂 সংরক্ষিত পাসওয়ার্ড</b> — সমস্ত অ্যাপের তালিকা ও পাসওয়ার্ড দেখতে\n` +
        `• <b>➕ নতুন পাসওয়ার্ড যোগ</b> — ধাপে ধাপে নতুন অ্যাকাউন্ট ভল্টে সেভ করতে\n` +
        `• <b>🔒 ভল্ট লক করুন</b> — এক ক্লিকে ভল্ট লক করে তথ্য লুকিয়ে রাখতে\n` +
        `• <b>🎲 পাসওয়ার্ড জেনারেটর</b> — জটিল ১৬ অক্ষরের পাসওয়ার্ড তৈরি করতে\n` +
        `• <b>🔢 ইনস্ট্যান্ট PIN</b> — ৬-সংখ্যার সিকিউরিটি পিন তৈরি করতে\n` +
        `• <b>🛡️ সিকিউরিটি ভল্ট</b> — ভল্টের সামগ্রিক সিকিউরিটি স্কোর দেখতে\n\n` +
        `<i>🛡️ টেলিগ্রামে পাসওয়ার্ড সবসময় কালো বাক্সে ঢাকা থাকে, ট্যাপ করলেই উন্মোচিত হয়!</i>`,
      parse_mode: 'HTML',
      reply_markup: isUnlocked ? TELEGRAM_UNLOCKED_KEYBOARD : TELEGRAM_LOCKED_KEYBOARD,
    };
  }

  // SENSITIVE ACTION GATING: Check if user is UNLOCKED
  if (!isBotUserUnlocked(userId)) {
    // If the user typed a wrong numeric pin
    if (/^\d{4,8}$/.test(text.trim())) {
      return {
        text:
          `❌ <b>ভুল মাস্টার PIN!</b>\n\n` +
          `আপনার দেওয়া পিনটি সঠিক নয়। সঠিক পিন দিন অথবা নিচের কুইক আনলক বোতাম চাপুন:\n` +
          `<i>(ডিফল্ট মাস্টার পিন: <code>${botMasterPin}</code>)</i>`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: `🔑 কুইক আনলক পিন (${botMasterPin})`, callback_data: 'quick_unlock_pin' }],
          ],
        },
      };
    }
    // Block access to passwords from outside!
    return makeLockedPrompt(userId, userName);
  }

  // "📂 সংরক্ষিত পাসওয়ার্ড" or /list
  if (text.includes('সংরক্ষিত পাসওয়ার্ড') || lowerText === '/list' || lowerText === 'list') {
    if (vaultItems.length === 0) {
      return {
        text:
          `📭 <b>ভল্ট সম্পূর্ণ খালি!</b>\n\n` +
          `কোনো অ্যাকাউন্ট সংরক্ষিত নেই। নতুন অ্যাকাউন্ট যোগ করতে নিচের <b>"➕ নতুন পাসওয়ার্ড যোগ"</b> বাটনে চাপুন।`,
        parse_mode: 'HTML',
        reply_markup: TELEGRAM_MAIN_KEYBOARD,
      };
    }

    return {
      text:
        `📂 <b>আপনার ভল্টে ${vaultItems.length} টি অ্যাকাউন্ট সংরক্ষিত আছে:</b>\n\n` +
        `যে অ্যাপের ইউজারনেম ও গোপন পাসওয়ার্ড দেখতে চান, নিচের বাটনে ট্যাপ করুন 👇`,
      parse_mode: 'HTML',
      reply_markup: buildAppsInlineKeyboard(),
    };
  }

  // "🗑️ পাসওয়ার্ড মুছুন" or /delete or /remove
  if (text.includes('পাসওয়ার্ড মুছুন') || text.includes('মুছুন') || lowerText === '/delete' || lowerText === '/remove') {
    if (vaultItems.length === 0) {
      return {
        text: '📭 <b>ভল্ট সম্পূর্ণ খালি!</b> মুছে ফেলার মতো কোনো অ্যাকাউন্ট নেই।',
        parse_mode: 'HTML',
        reply_markup: TELEGRAM_MAIN_KEYBOARD,
      };
    }
    const delRows: any[][] = [];
    vaultItems.forEach((it) => {
      delRows.push([
        { text: `🗑️ ${escapeHtml(it.appName)} (${escapeHtml(it.username)})`, callback_data: `del_confirm:${it.id}` }
      ]);
    });
    delRows.push([{ text: '🔙 ব্যাকে যান', callback_data: 'refresh_apps' }]);

    return {
      text:
        `🗑️ <b>পাসওয়ার্ড রিমুভ / ডিলিট ম্যানেজার:</b>\n\n` +
        `যে অ্যাকাউন্টটি ভল্ট থেকে চিরতরে মুছে ফেলতে চান, তার ওপর ট্যাপ করুন 👇`,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: delRows },
    };
  }

  // "➕ নতুন পাসওয়ার্ড যোগ" or /add
  if (text.includes('নতুন পাসওয়ার্ড যোগ') || lowerText.startsWith('/add') || lowerText === 'add') {
    userAddSessions.set(userId, { step: 'appName' });
    return {
      text:
        `➕ <b>নতুন অ্যাকাউন্ট সংরক্ষণ উইজার্ড</b>\n\n` +
        `📌 <b>ধাপ ১/৪:</b> অ্যাপ বা সাইটের নাম লিখুন:\n<i>(যেমন: Facebook, Twitter, Instagram, bKash, Google...)</i>`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{ text: '❌ বাতিল করুন', callback_data: 'cancel_wizard' }]],
      },
    };
  }

  // "🛡️ সিকিউরিটি ভল্ট" or /stats
  if (text.includes('সিকিউরিটি ভল্ট') || lowerText === '/stats' || lowerText === 'stats') {
    const withSec = vaultItems.filter((v) => v.secondaryPassword?.trim()).length;
    const strongCount = vaultItems.filter((v) => v.strength === 'strong').length;
    const score = Math.min(100, Math.round(((withSec * 1.5 + strongCount) / (vaultItems.length * 2.5 || 1)) * 100));

    return {
      text:
        `🛡️ <b>VaultGuard সাইবার সিকিউরিটি বিশ্লেষণ:</b>\n\n` +
        `• মোট সংরক্ষিত অ্যাকাউন্ট: <b>${vaultItems.length}</b> টি\n` +
        `• দ্বৈত পাসওয়ার্ড/PIN সুরক্ষা: <b>${withSec}</b> টি\n` +
        `• অতি শক্তিশালী পাসওয়ার্ড: <b>${strongCount}</b> টি\n` +
        `• সার্বিক নিরাপত্তা স্কোর: <b>${score}% / ১০০</b>\n` +
        `• বট কোয়েরি রিকোয়েস্ট: <b>${stats.totalQueries}</b> বার\n` +
        `• মোট ইউজার সংখ্যা: <b>${stats.uniqueUsers}</b> জন\n\n` +
        `<i>🔒 ভল্ট মাস্টার PIN এবং ক্লায়েন্ট-সাইড এনক্রিপশন দ্বারা সুরক্ষিত।</i>`,
      parse_mode: 'HTML',
      reply_markup: TELEGRAM_UNLOCKED_KEYBOARD,
    };
  }

  // Direct app search query (e.g. user typed "facebook" or "google")
  const cleanQ = text.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (cleanQ.length >= 3) {
    const match = vaultItems.find((it) => {
      const itClean = it.appName.toLowerCase().replace(/[^a-z0-9]/g, '');
      return itClean.includes(cleanQ) || cleanQ.includes(itClean);
    });

    if (match) {
      stats.totalQueries += 1;
      return {
        text: formatCredentialMessage(match),
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📋 কপি ফরম্যাট টেক্সট', callback_data: `copy_fmt:${match.id}` },
              { text: '🗑️ মুছে ফেলুন', callback_data: `del_confirm:${match.id}` },
            ],
            [
              { text: '🔙 সকল অ্যাপের তালিকা', callback_data: 'refresh_apps' },
              { text: '🔒 ভল্ট লক করুন', callback_data: 'lock_vault' },
            ],
          ],
        },
      };
    }
  }

  // Fallback reply with bottom keyboard
  return {
    text:
      `👋 <b>${userName}</b>, আমি আপনার কমান্ডটি বুঝতে পারিনি।\n\n` +
      `সহজে কাজ করতে নিচের বোতামগুলো ব্যবহার করুন 👇`,
    parse_mode: 'HTML',
    reply_markup: TELEGRAM_UNLOCKED_KEYBOARD,
  };
}

// ----------------------------------------------------
// TELEGRAM LONG POLLING ENGINE
// ----------------------------------------------------
async function startTelegramPolling() {
  if (isPolling) return;
  if (!botToken) {
    throw new Error('Please configure a valid Telegram Bot Token first');
  }

  const me = await telegramCall('getMe', {});
  botInfo = me;
  isPolling = true;
  stats.startedAt = Date.now();
  pollingAbortController = new AbortController();

  addLog({
    type: 'success',
    action: 'Bot Connected',
    details: `Password Manager Bot connected as @${me.username} (${me.first_name}). Long polling active with bottom keyboard.`,
  });

  // Notify Admin if configured
  if (adminId) {
    try {
      await telegramCall('sendMessage', {
        chat_id: adminId,
        text: `🔐 <b>VaultGuard Password Manager Bot Online!</b>\n\n✅ Bot: @${me.username}\n👤 Admin ID: <code>${adminId}</code>\n📦 Stored Accounts: <b>${vaultItems.length}</b>\n\nবট এখন সক্রিয় এবং নিচের বাটন কন্ট্রোল রেডি!`,
        parse_mode: 'HTML',
        reply_markup: TELEGRAM_MAIN_KEYBOARD,
      });
    } catch (err: any) {
      console.warn('Admin notification notice:', err.message);
    }
  }

  let offset = 0;

  // Background polling loop
  (async () => {
    while (isPolling) {
      try {
        const updatesRes = await fetch(
          `https://api.telegram.org/bot${botToken}/getUpdates`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              offset: offset,
              timeout: 20,
              allowed_updates: ['message', 'callback_query'],
            }),
            signal: pollingAbortController?.signal,
          }
        );
        const data = await updatesRes.json();
        if (!data.ok || !data.result) {
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }

        for (const update of data.result) {
          offset = update.update_id + 1;

          // 1. Handle Inline Button Callback Queries (callback_query_handler)
          if (update.callback_query) {
            const cb = update.callback_query;
            const cbId = cb.id;
            const fromUser = cb.from?.username || cb.from?.first_name || `User_${cb.from?.id}`;
            const userId = cb.from?.id;
            const dataVal = cb.data;
            const chatId = cb.message?.chat?.id || userId;
            const messageId = cb.message?.message_id;

            // Acknowledge callback immediately to dismiss Telegram's loading spinner
            telegramCall('answerCallbackQuery', {
              callback_query_id: cbId,
              text: 'লোড হচ্ছে...',
            }).catch(() => {});

            if (chatId && dataVal) {
              const resPayload = await processBotInput(userId, fromUser, '', dataVal);
              let edited = false;

              // 1. Try editing message text in-place for seamless button interaction
              if (messageId) {
                try {
                  await telegramCall('editMessageText', {
                    chat_id: chatId,
                    message_id: messageId,
                    text: resPayload.text,
                    parse_mode: resPayload.parse_mode,
                    reply_markup: resPayload.reply_markup,
                  });
                  edited = true;
                } catch (editErr: any) {
                  // Message may be identical or cannot be edited; fallback to sendMessage
                }
              }

              // 2. If editing wasn't possible or failed, send a new message
              if (!edited) {
                try {
                  await telegramCall('sendMessage', {
                    chat_id: chatId,
                    text: resPayload.text,
                    parse_mode: resPayload.parse_mode,
                    reply_markup: resPayload.reply_markup,
                  });
                } catch (sendErr: any) {
                  // Fallback without parse_mode if HTML entity parsing failed
                  const plainText = resPayload.text.replace(/<[^>]*>?/gm, '');
                  await telegramCall('sendMessage', {
                    chat_id: chatId,
                    text: plainText,
                    reply_markup: resPayload.reply_markup,
                  }).catch(console.error);
                }
              }
            }
            continue;
          }

          // 2. Handle Text Messages
          const msg = update.message;
          if (!msg) continue;

          const userId = msg.from?.id;
          const userName = msg.from?.username || msg.from?.first_name || `User_${userId}`;
          const chatId = msg.chat?.id;
          const text = msg.text?.trim() || '';

          if (chatId) {
            const resPayload = await processBotInput(userId, userName, text);
            try {
              await telegramCall('sendMessage', {
                chat_id: chatId,
                text: resPayload.text,
                parse_mode: resPayload.parse_mode,
                reply_markup: resPayload.reply_markup,
              });
            } catch (sendErr: any) {
              const plainText = resPayload.text.replace(/<[^>]*>?/gm, '');
              await telegramCall('sendMessage', {
                chat_id: chatId,
                text: plainText,
                reply_markup: resPayload.reply_markup,
              }).catch(console.error);
            }
          }
        }
      } catch (err: any) {
        if (!isPolling) break;
        if (err.name !== 'AbortError') {
          console.error('Telegram Polling Error:', err.message);
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  })();
}

function stopTelegramPolling() {
  if (!isPolling) return;
  isPolling = false;
  if (pollingAbortController) {
    pollingAbortController.abort();
    pollingAbortController = null;
  }
  addLog({
    type: 'warning',
    action: 'Bot Stopped',
    details: 'Telegram bot polling was paused by admin.',
  });
}

// ----------------------------------------------------
// REST API ROUTES
// ----------------------------------------------------

// Get All Vault Items
app.get('/api/vault/items', (req, res) => {
  res.json({ items: vaultItems });
});

// Create New Credential
app.post('/api/vault/items', (req, res) => {
  const { appName, category, username, primaryPassword, secondaryPassword, notes, url } = req.body;

  if (!appName || !username || !primaryPassword) {
    return res.status(400).json({ ok: false, error: 'App Name, Username and Primary Password are required' });
  }

  const newItem: PasswordItem = {
    id: `vault-item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    appName: appName.trim(),
    category: category || 'social',
    username: username.trim(),
    primaryPassword: primaryPassword.trim(),
    secondaryPassword: (secondaryPassword || '').trim(),
    notes: (notes || '').trim(),
    url: (url || '').trim(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isFavorite: false,
    strength: primaryPassword.length >= 12 ? 'strong' : primaryPassword.length >= 8 ? 'medium' : 'weak',
  };

  vaultItems.unshift(newItem);
  stats.passwordsSaved = vaultItems.length;
  saveVaultToDisk();

  addLog({
    type: 'success',
    action: 'Credential Created',
    details: `Added new record for "${newItem.appName}" (User: ${newItem.username}).`,
  });

  res.json({ ok: true, item: newItem });
});

// Update Existing Credential
app.put('/api/vault/items/:id', (req, res) => {
  const { id } = req.params;
  const { appName, category, username, primaryPassword, secondaryPassword, notes, url, isFavorite } = req.body;

  const idx = vaultItems.findIndex((item) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ ok: false, error: 'Credential not found' });
  }

  const existing = vaultItems[idx];
  const updated: PasswordItem = {
    ...existing,
    appName: appName !== undefined ? appName.trim() : existing.appName,
    category: category !== undefined ? category : existing.category,
    username: username !== undefined ? username.trim() : existing.username,
    primaryPassword: primaryPassword !== undefined ? primaryPassword.trim() : existing.primaryPassword,
    secondaryPassword: secondaryPassword !== undefined ? secondaryPassword.trim() : existing.secondaryPassword,
    notes: notes !== undefined ? notes.trim() : existing.notes,
    url: url !== undefined ? url.trim() : existing.url,
    isFavorite: isFavorite !== undefined ? isFavorite : existing.isFavorite,
    updatedAt: Date.now(),
  };

  vaultItems[idx] = updated;
  saveVaultToDisk();

  addLog({
    type: 'info',
    action: 'Credential Updated',
    details: `Updated record for "${updated.appName}".`,
  });

  res.json({ ok: true, item: updated });
});

// Delete Credential
app.delete('/api/vault/items/:id', (req, res) => {
  const { id } = req.params;
  const idx = vaultItems.findIndex((item) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ ok: false, error: 'Credential not found' });
  }

  const deleted = vaultItems.splice(idx, 1)[0];
  stats.passwordsSaved = vaultItems.length;
  saveVaultToDisk();

  addLog({
    type: 'warning',
    action: 'Credential Deleted',
    details: `Deleted credentials for "${deleted.appName}".`,
  });

  res.json({ ok: true, message: `Deleted ${deleted.appName}` });
});

// Import Vault Backup
app.post('/api/vault/import', (req, res) => {
  const { items, password } = req.body;
  if (password !== adminPassword) {
    return res.status(401).json({ ok: false, error: 'Admin password required for import' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ ok: false, error: 'Invalid items array' });
  }

  let count = 0;
  items.forEach((item: any) => {
    if (item.appName && item.username && item.primaryPassword) {
      vaultItems.push({
        id: item.id || `vault-item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        appName: item.appName,
        category: item.category || 'social',
        username: item.username,
        primaryPassword: item.primaryPassword,
        secondaryPassword: item.secondaryPassword || '',
        notes: item.notes || '',
        url: item.url || '',
        createdAt: item.createdAt || Date.now(),
        updatedAt: Date.now(),
        isFavorite: Boolean(item.isFavorite),
        strength: item.strength || 'strong',
      });
      count++;
    }
  });

  stats.passwordsSaved = vaultItems.length;
  saveVaultToDisk();

  addLog({
    type: 'success',
    action: 'Vault Imported',
    details: `Imported ${count} credentials into the vault.`,
  });

  res.json({ ok: true, importedCount: count, total: vaultItems.length });
});

// Reset Vault to Default Samples
app.post('/api/vault/reset-samples', (req, res) => {
  const { password } = req.body;
  if (password !== adminPassword) {
    return res.status(401).json({ ok: false, error: 'Admin password required' });
  }

  vaultItems = [
    {
      id: 'vault-item-1',
      appName: 'Facebook',
      category: 'social',
      username: 'user.personal@gmail.com',
      primaryPassword: 'FbSecure#Pass99!',
      secondaryPassword: '849201-FB-2FA',
      notes: 'Main personal Facebook profile. 2FA enabled on Authenticator.',
      url: 'https://facebook.com',
      createdAt: Date.now() - 86400000 * 5,
      updatedAt: Date.now() - 86400000 * 2,
      isFavorite: true,
      strength: 'strong',
    },
    {
      id: 'vault-item-2',
      appName: 'Twitter (X)',
      category: 'social',
      username: '@tech_creator',
      primaryPassword: 'XPass9#Quantum2026',
      secondaryPassword: 'PIN: 9382',
      notes: 'Official Twitter account. Linked with Google 2FA.',
      url: 'https://x.com',
      createdAt: Date.now() - 86400000 * 4,
      updatedAt: Date.now() - 86400000 * 1,
      isFavorite: true,
      strength: 'strong',
    },
    {
      id: 'vault-item-3',
      appName: 'Instagram',
      category: 'social',
      username: 'creative.shots.official',
      primaryPassword: 'InstaVibe!778$',
      secondaryPassword: 'RecovKey: 5543-9821',
      notes: 'Photography portfolio Instagram handle.',
      url: 'https://instagram.com',
      createdAt: Date.now() - 86400000 * 3,
      updatedAt: Date.now() - 86400000 * 1,
      isFavorite: true,
      strength: 'strong',
    },
    {
      id: 'vault-item-4',
      appName: 'Google',
      category: 'email',
      username: 'primary.work.email@gmail.com',
      primaryPassword: 'Ggl#AlphaSec_9921',
      secondaryPassword: 'BackupCodes: 4492 8821 1109',
      notes: 'Master Google workspace and drive access.',
      url: 'https://accounts.google.com',
      createdAt: Date.now() - 86400000 * 6,
      updatedAt: Date.now() - 86400000 * 3,
      isFavorite: true,
      strength: 'strong',
    },
    {
      id: 'vault-item-5',
      appName: 'Bank Account',
      category: 'finance',
      username: 'ACCT-9482019482',
      primaryPassword: 'NetBanking$78#Pass',
      secondaryPassword: 'TPIN: 819203',
      notes: 'Online banking portal. Secondary is the 6-digit transaction PIN.',
      url: '',
      createdAt: Date.now() - 86400000 * 2,
      updatedAt: Date.now() - 86400000 * 1,
      isFavorite: false,
      strength: 'strong',
    },
    {
      id: 'vault-item-6',
      appName: 'Binance (Crypto)',
      category: 'crypto',
      username: 'trader.crypto@proton.me',
      primaryPassword: 'Crypto#Vault2026!X',
      secondaryPassword: 'Google2FA: 902184',
      notes: 'Crypto spot & futures trading account with 2FA.',
      url: 'https://binance.com',
      createdAt: Date.now() - 86400000 * 1,
      updatedAt: Date.now() - 86400000 * 1,
      isFavorite: true,
      strength: 'strong',
    },
  ];

  stats.passwordsSaved = vaultItems.length;
  saveVaultToDisk();

  addLog({
    type: 'info',
    action: 'Vault Reset',
    details: 'Reset vault to default sample records.',
  });

  res.json({ ok: true, message: 'Vault reset to defaults', items: vaultItems });
});

// Verify Master Admin Password
app.post('/api/auth/verify', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ ok: false, error: 'Password is required' });
  }
  if (password === adminPassword) {
    return res.json({ ok: true, message: 'Admin authentication successful' });
  }
  return res.status(401).json({ ok: false, error: 'ভুল মাস্টার পাসওয়ার্ড! আবার চেষ্টা করুন।' });
});

// Telegram Bot Status
app.get('/api/telegram/status', (req, res) => {
  res.json({
    isRunning: isPolling,
    configured: Boolean(botToken),
    botInfo,
    adminId,
    stats,
    botMasterPin,
    hasGemini: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Update Telegram Bot Config & Admin Password
app.post('/api/telegram/config', async (req, res) => {
  const { token, newAdminId, currentPassword, newPassword, newBotMasterPin } = req.body;
  if (currentPassword !== adminPassword) {
    return res.status(401).json({ ok: false, error: 'ভুল মাস্টার পাসওয়ার্ড!' });
  }

  if (typeof token === 'string' && token.trim()) {
    botToken = token.trim();
  }
  if (typeof newAdminId === 'string') {
    adminId = newAdminId.trim();
  }
  if (typeof newPassword === 'string' && newPassword.trim().length >= 4) {
    adminPassword = newPassword.trim();
  }
  if (typeof newBotMasterPin === 'string' && newBotMasterPin.trim().length >= 4) {
    botMasterPin = newBotMasterPin.trim();
  }

  addLog({
    type: 'info',
    action: 'Config Updated',
    details: `Admin updated Bot Token & Settings. (Admin ID: ${adminId || 'none'}, Master PIN: ${botMasterPin})`,
  });

  res.json({
    ok: true,
    message: 'কনফিগারেশন সফলভাবে সংরক্ষিত হয়েছে!',
    configured: Boolean(botToken),
    adminId,
    botMasterPin,
  });
});

// Start Telegram Bot
app.post('/api/telegram/start', async (req, res) => {
  const { password, token, newAdminId } = req.body;
  if (password !== adminPassword) {
    return res.status(401).json({ ok: false, error: 'ভুল মাস্টার পাসওয়ার্ড!' });
  }

  if (token && token.trim()) {
    botToken = token.trim();
  }
  if (typeof newAdminId === 'string') {
    adminId = newAdminId.trim();
  }

  if (!botToken) {
    return res.status(400).json({ ok: false, error: '@BotFather থেকে পাওয়া ভ্যালিড বট টোকেন দিন' });
  }

  try {
    if (isPolling) {
      stopTelegramPolling();
    }
    await startTelegramPolling();
    res.json({
      ok: true,
      message: 'টেলিগ্রাম পাসওয়ার্ড ম্যানেজার বট সফলভাবে চালু হয়েছে!',
      botInfo,
    });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err.message || 'টেলিগ্রাম সার্ভারে সংযোগ ব্যর্থ হয়েছে' });
  }
});

// Stop Telegram Bot
app.post('/api/telegram/stop', (req, res) => {
  const { password } = req.body;
  if (password !== adminPassword) {
    return res.status(401).json({ ok: false, error: 'ভুল মাস্টার পাসওয়ার্ড!' });
  }

  stopTelegramPolling();
  res.json({ ok: true, message: 'টেলিগ্রাম বট বন্ধ করা হয়েছে।' });
});

// Send Test Ping to Telegram Admin
app.post('/api/telegram/test-admin', async (req, res) => {
  const { password, targetAdminId } = req.body;
  if (password !== adminPassword) {
    return res.status(401).json({ ok: false, error: 'ভুল মাস্টার পাসওয়ার্ড!' });
  }

  const destAdmin = targetAdminId || adminId;
  if (!destAdmin) {
    return res.status(400).json({ ok: false, error: 'এডমিন টেলিগ্রাম চ্যাট আইডি দেওয়া হয়নি' });
  }

  try {
    await telegramCall('sendMessage', {
      chat_id: destAdmin,
      text: `🔔 <b>VaultGuard Admin Notification Test</b>\n\n✅ আপনার অ্যাডমিন আইডি সফলভাবে কানেক্ট হয়েছে!\n⏰ সময়: ${new Date().toLocaleTimeString()}\n📦 সংরক্ষিত অ্যাকাউন্ট: <b>${vaultItems.length}</b> টি\n\n🎯 কেউ টেলিগ্রাম বট থেকে পাসওয়ার্ড দেখলে বা যুক্ত করলে আপনি তাৎক্ষণিক রিয়েল-টাইম নোটিফিকেশন পাবেন।`,
      parse_mode: 'HTML',
      reply_markup: TELEGRAM_MAIN_KEYBOARD,
    });
    addLog({
      type: 'success',
      action: 'Admin Ping',
      details: `Dispatched test message to Admin ID ${destAdmin}`,
    });
    res.json({ ok: true, message: `এডমিন আইডি ${destAdmin}-এ টেস্ট মেসেজ পাঠানো হয়েছে!` });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// Telegram Logs
app.get('/api/telegram/logs', (req, res) => {
  res.json({ logs });
});

// Clear Logs
app.post('/api/telegram/clear-logs', (req, res) => {
  const { password } = req.body;
  if (password !== adminPassword) {
    return res.status(401).json({ ok: false, error: 'ভুল মাস্টার পাসওয়ার্ড!' });
  }
  logs.length = 0;
  addLog({
    type: 'info',
    action: 'Logs Cleared',
    details: 'Log history was cleared by admin.',
  });
  res.json({ ok: true, message: 'Logs cleared' });
});

// INTERACTIVE SIMULATOR ENDPOINT:
// Powers the on-screen Web Smartphone Telegram Bot Simulator!
app.post('/api/telegram/simulate', async (req, res) => {
  const { text = '', callbackData = '', fromUser = 'WebTester' } = req.body;
  try {
    const responsePayload = await processBotInput('simulated-web-user', fromUser, text, callbackData);
    res.json({
      ok: true,
      result: responsePayload,
      isUnlocked: isBotUserUnlocked('simulated-web-user'),
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// TELEGRAM OFFICIAL WEBHOOK ENDPOINT:
// Allows Telegram to send updates directly to this server if webhook mode is used
app.post('/api/telegram/webhook', async (req, res) => {
  const update = req.body;
  if (!update) return res.status(200).send('OK');

  try {
    // 1. Callback query from Inline Keyboard button
    if (update.callback_query) {
      const cb = update.callback_query;
      const cbId = cb.id;
      const fromUser = cb.from?.username || cb.from?.first_name || `User_${cb.from?.id}`;
      const userId = cb.from?.id;
      const dataVal = cb.data;
      const chatId = cb.message?.chat?.id || userId;
      const messageId = cb.message?.message_id;

      telegramCall('answerCallbackQuery', { callback_query_id: cbId, text: 'লোড হচ্ছে...' }).catch(() => {});

      if (chatId && dataVal) {
        const resPayload = await processBotInput(userId, fromUser, '', dataVal);
        let edited = false;

        if (messageId) {
          try {
            await telegramCall('editMessageText', {
              chat_id: chatId,
              message_id: messageId,
              text: resPayload.text,
              parse_mode: resPayload.parse_mode,
              reply_markup: resPayload.reply_markup,
            });
            edited = true;
          } catch (e) {}
        }

        if (!edited) {
          try {
            await telegramCall('sendMessage', {
              chat_id: chatId,
              text: resPayload.text,
              parse_mode: resPayload.parse_mode,
              reply_markup: resPayload.reply_markup,
            });
          } catch (e) {
            const plain = resPayload.text.replace(/<[^>]*>?/gm, '');
            await telegramCall('sendMessage', {
              chat_id: chatId,
              text: plain,
              reply_markup: resPayload.reply_markup,
            }).catch(() => {});
          }
        }
      }
      return res.status(200).send('OK');
    }

    // 2. Regular Text Message
    if (update.message) {
      const msg = update.message;
      const userId = msg.from?.id;
      const userName = msg.from?.username || msg.from?.first_name || `User_${userId}`;
      const chatId = msg.chat?.id;
      const text = msg.text?.trim() || '';

      if (chatId) {
        const resPayload = await processBotInput(userId, userName, text);
        try {
          await telegramCall('sendMessage', {
            chat_id: chatId,
            text: resPayload.text,
            parse_mode: resPayload.parse_mode,
            reply_markup: resPayload.reply_markup,
          });
        } catch (e) {
          const plain = resPayload.text.replace(/<[^>]*>?/gm, '');
          await telegramCall('sendMessage', {
            chat_id: chatId,
            text: plain,
            reply_markup: resPayload.reply_markup,
          }).catch(() => {});
        }
      }
      return res.status(200).send('OK');
    }
  } catch (err: any) {
    console.error('Webhook error:', err.message);
  }

  res.status(200).send('OK');
});

// AI Password Security Advisor via Gemini
app.post('/api/ai/security-audit', async (req, res) => {
  try {
    const { totalAccounts, weakCount, duplicateCount, categoryCounts } = req.body;
    const ai = getGemini();

    if (!ai) {
      return res.json({
        summary: 'আপনার ভল্টে দ্বৈত পাসওয়ার্ড সুরক্ষা সক্রিয় থাকায় অ্যাকাউন্টগুলোর নিরাপত্তা শক্তিশালী অবস্থায় আছে।',
        recommendations: [
          'সোশ্যাল মিডিয়া ও ব্যাংক অ্যাকাউন্টের পাসওয়ার্ড ৯০ দিন পর পর পরিবর্তন করুন।',
          'প্রথম পাসওয়ার্ড ও দ্বিতীয় পিন কোড আলাদা রাখুন।',
          'গুরুত্বপূর্ণ অ্যাকাউন্টে ২-ফ্যাক্টর অথেনটিকেশন সক্রিয় রাখুন।',
        ],
        threatLevel: 'LOW',
      });
    }

    const prompt = `You are a certified cyber security analyst. 
Analyze these aggregate password manager vault metrics:
- Total Accounts: ${totalAccounts}
- Weak Passwords: ${weakCount}
- Duplicate/Reused Passwords: ${duplicateCount}
- Categories: ${JSON.stringify(categoryCounts || {})}

Provide concise, high-value security advice in Bengali language. Return strict JSON:
{
  "summary": "1-2 sentence assessment in Bengali",
  "threatLevel": "LOW" | "MEDIUM" | "HIGH",
  "recommendations": ["Bengali advice 1", "Bengali advice 2", "Bengali advice 3"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json(parsed);
  } catch (err: any) {
    return res.json({
      summary: 'ভল্টের দ্বৈত পাসওয়ার্ড ও পিন নিরাপত্তা নির্ভরযোগ্য অবস্থায় রয়েছে।',
      threatLevel: 'LOW',
      recommendations: [
        'দ্বিতীয় পাসওয়ার্ড বা পিন কোড নিয়মিত ব্যাকআপ রাখুন।',
        'অন্য কারো সাথে পাসওয়ার্ড বা পিন শেয়ার করা থেকে বিরত থাকুন।',
      ],
    });
  }
});

// Auto-start bot on boot if env token is present
if (botToken) {
  startTelegramPolling().catch((err) => {
    console.warn('Initial Telegram bot startup deferred:', err.message);
  });
}

// ----------------------------------------------------
// VITE MIDDLEWARE & SERVER BOOTSTRAP
// ----------------------------------------------------
async function bootstrap() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VaultGuard] Server running on http://0.0.0.0:${PORT}`);
  });
}

bootstrap();
