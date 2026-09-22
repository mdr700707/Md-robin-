import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Unlock,
  Bot,
  Play,
  Square,
  Send,
  Activity,
  Terminal,
  FileText,
  Key,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { TelegramBotLog, TelegramBotConfig, PasswordItem } from '../types';

interface TelegramAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVaultUpdated?: () => void;
  vaultItems: PasswordItem[];
  onImportItems: (items: PasswordItem[]) => void;
}

export const TelegramAdminModal: React.FC<TelegramAdminModalProps> = ({
  isOpen,
  onClose,
  onVaultUpdated,
  vaultItems,
  onImportItems,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('vault_admin_auth') === 'true';
  });
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<'bot' | 'guide' | 'logs' | 'data'>('bot');

  // Bot configuration state
  const [botToken, setBotToken] = useState('');
  const [adminId, setAdminId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [botMasterPin, setBotMasterPin] = useState('1234');
  const [isBotRunning, setIsBotRunning] = useState(false);
  const [botInfo, setBotInfo] = useState<{ username?: string; first_name?: string } | null>(null);
  const [logs, setLogs] = useState<TelegramBotLog[]>([]);

  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch status and logs
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/telegram/status');
      const data = await res.json();
      setIsBotRunning(data.isRunning);
      setBotInfo(data.botInfo);
      if (data.adminId) setAdminId(data.adminId);
      if (data.botMasterPin) setBotMasterPin(data.botMasterPin);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/telegram/logs');
      const data = await res.json();
      if (data.logs) setLogs(data.logs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchStatus();
      fetchLogs();
      const interval = setInterval(() => {
        fetchStatus();
        fetchLogs();
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen, isAuthenticated]);

  if (!isOpen) return null;

  // Master Password Authentication
  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPasswordInput }),
      });
      const data = await res.json();
      if (data.ok) {
        setIsAuthenticated(true);
        sessionStorage.setItem('vault_admin_auth', 'true');
        sessionStorage.setItem('vault_admin_pass', adminPasswordInput);
        fetchStatus();
        fetchLogs();
      } else {
        setAuthError(data.error || 'ভুল পাসওয়ার্ড! আবার চেষ্টা করুন।');
      }
    } catch (err) {
      setAuthError('সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি।');
    } finally {
      setIsLoading(false);
    }
  };

  const getStoredPassword = () => {
    return sessionStorage.getItem('vault_admin_pass') || adminPasswordInput || 'admin123';
  };

  // Save Bot Token and Admin ID
  const handleSaveConfig = async () => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/telegram/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: botToken,
          newAdminId: adminId,
          currentPassword: getStoredPassword(),
          newPassword: newPassword.trim() ? newPassword.trim() : undefined,
          newBotMasterPin: botMasterPin.trim() ? botMasterPin.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        if (newPassword.trim()) {
          sessionStorage.setItem('vault_admin_pass', newPassword.trim());
          setNewPassword('');
        }
        setStatusMsg({ text: '✅ টেলিগ্রাম বট কনফিগারেশন সংরক্ষিত হয়েছে!', type: 'success' });
        fetchStatus();
      } else {
        setStatusMsg({ text: `❌ ${data.error}`, type: 'error' });
      }
    } catch (err: any) {
      setStatusMsg({ text: `❌ ${err.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Start Telegram Bot
  const handleStartBot = async () => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/telegram/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: getStoredPassword(),
          token: botToken,
          newAdminId: adminId,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setIsBotRunning(true);
        setBotInfo(data.botInfo);
        setStatusMsg({
          text: `🚀 টেলিগ্রাম বট সফলভাবে চালু হয়েছে! (@${data.botInfo?.username || 'Bot'})`,
          type: 'success',
        });
        fetchLogs();
      } else {
        setStatusMsg({ text: `❌ ${data.error}`, type: 'error' });
      }
    } catch (err: any) {
      setStatusMsg({ text: `❌ ${err.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Stop Telegram Bot
  const handleStopBot = async () => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/telegram/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: getStoredPassword() }),
      });
      const data = await res.json();
      if (data.ok) {
        setIsBotRunning(false);
        setStatusMsg({ text: '⏹️ টেলিগ্রাম বট বন্ধ করা হয়েছে।', type: 'success' });
        fetchLogs();
      }
    } catch (err: any) {
      setStatusMsg({ text: `❌ ${err.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Test Ping to Telegram Admin
  const handleTestPing = async () => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/telegram/test-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: getStoredPassword(),
          targetAdminId: adminId,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatusMsg({ text: '🔔 অ্যাডমিনের টেলিগ্রামে টেস্ট ম্যাসেজ পাঠানো হয়েছে!', type: 'success' });
        fetchLogs();
      } else {
        setStatusMsg({ text: `❌ ${data.error}`, type: 'error' });
      }
    } catch (err: any) {
      setStatusMsg({ text: `❌ ${err.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Clear Logs
  const handleClearLogs = async () => {
    try {
      await fetch('/api/telegram/clear-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: getStoredPassword() }),
      });
      setLogs([]);
      setStatusMsg({ text: 'লগ ইতিহাস মুছে ফেলা হয়েছে।', type: 'success' });
    } catch (e) {}
  };

  // Reset to default sample credentials
  const handleResetDefaults = async () => {
    if (!window.confirm('আপনি কি ভল্ট ডিফল্ট স্যাম্পলে রিসেট করতে চান?')) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/vault/reset-samples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: getStoredPassword() }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatusMsg({ text: 'ভল্ট সফলভাবে ডিফল্ট অ্যাকাউন্টে রিসেট হয়েছে।', type: 'success' });
        if (onVaultUpdated) onVaultUpdated();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Import JSON file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const items = Array.isArray(json) ? json : json.items || [];
        if (items.length > 0) {
          const res = await fetch('/api/vault/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items,
              password: getStoredPassword(),
            }),
          });
          const resData = await res.json();
          if (resData.ok) {
            setStatusMsg({ text: `✅ ${resData.importedCount} টি অ্যাকাউন্ট সফলভাবে ইম্পোর্ট হয়েছে!`, type: 'success' });
            if (onVaultUpdated) onVaultUpdated();
          } else {
            setStatusMsg({ text: `❌ ${resData.error}`, type: 'error' });
          }
        }
      } catch (err: any) {
        setStatusMsg({ text: '❌ অবৈধ ব্যাকআপ ফাইল!', type: 'error' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-zinc-100 text-sm flex items-center gap-2">
                <span>টেলিগ্রাম বট ও মাস্টার এডমিন প্যানেল</span>
                {isAuthenticated && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                    Unlocked
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-400">
                Telegram Bot API Token, Admin Chat ID ও লাইভ কন্ট্রোল
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. PASSWORD AUTHENTICATION SCREEN IF LOCKED */}
        {!isAuthenticated ? (
          <div className="p-6">
            <div className="max-w-md mx-auto text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 mx-auto flex items-center justify-center text-zinc-300 shadow-inner">
                <Lock className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">
                  এডমিন প্যানেল পাসওয়ার্ড সুরক্ষিত
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  টেলিগ্রাম বট এপিআই কি ও অ্যাডমিন সেটিংস পরিবর্তন করতে মাস্টার পাসওয়ার্ড দিন।
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">
                  (Default Master Password: <code>admin123</code>)
                </p>
              </div>

              {authError && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {authError}
                </div>
              )}

              <form onSubmit={handleAuthenticate} className="space-y-3">
                <input
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="Master Admin Password"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-lg px-3 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none text-center font-mono"
                  autoFocus
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-zinc-950 shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>{isLoading ? 'যাচাই হচ্ছে...' : 'আনলক করুন (Unlock Admin)'}</span>
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* 2. AUTHENTICATED ADMIN DASHBOARD */
          <div className="flex flex-col">
            {/* Tab Navigation */}
            <div className="flex items-center gap-1 px-5 pt-3 border-b border-zinc-800 bg-zinc-900/60 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab('bot')}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'bot'
                    ? 'border-sky-500 text-sky-400 bg-sky-500/5'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>বট কন্ট্রোল &amp; সেটিংস</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('guide')}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'guide'
                    ? 'border-sky-500 text-sky-400 bg-sky-500/5'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>টেলিগ্রাম কমান্ড গাইড</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('logs')}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'logs'
                    ? 'border-sky-500 text-sky-400 bg-sky-500/5'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>লাইভ অ্যাক্টিভিটি লগ ({logs.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('data')}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'data'
                    ? 'border-sky-500 text-sky-400 bg-sky-500/5'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>ব্যাকআপ &amp; ডাটা</span>
              </button>
            </div>

            {/* Status Feedback Toast */}
            {statusMsg && (
              <div
                className={`mx-5 mt-3 p-2.5 rounded-lg text-xs flex items-center justify-between ${
                  statusMsg.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}
              >
                <span>{statusMsg.text}</span>
                <button
                  type="button"
                  onClick={() => setStatusMsg(null)}
                  className="text-zinc-400 hover:text-zinc-200 text-xs"
                >
                  ✕
                </button>
              </div>
            )}

            {/* TAB CONTENT: BOT CONTROLS */}
            {activeTab === 'bot' && (
              <div className="p-5 space-y-4">
                {/* Live Status Card */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isBotRunning
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                      }`}
                    >
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-200">
                          বট স্ট্যাটাস (Bot Status):
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            isBotRunning
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}
                        >
                          {isBotRunning ? '● Active & Polling' : '○ Offline'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                        {botInfo?.username ? `@${botInfo.username}` : 'বট টোকেন কনফিগার করা হয়নি'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isBotRunning ? (
                      <button
                        type="button"
                        onClick={handleStopBot}
                        disabled={isLoading}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-colors flex items-center gap-1.5"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>বট বন্ধ করুন (Stop)</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStartBot}
                        disabled={isLoading}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>বট চালু করুন (Start Bot)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleTestPing}
                      disabled={isLoading || !adminId}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors flex items-center gap-1.5"
                      title="অ্যাডমিন আইডি টেস্ট করুন"
                    >
                      <Send className="w-3 h-3 text-sky-400" />
                      <span>টেস্ট পিং</span>
                    </button>
                  </div>
                </div>

                {/* Settings Form */}
                <div className="space-y-3.5">
                  <div>
                    <label className="text-xs font-medium text-zinc-300 block mb-1 flex items-center justify-between">
                      <span>টেলিগ্রাম বট এপিআই টোকেন (Telegram Bot Token):</span>
                      <span className="text-[10px] text-zinc-500">
                        Telegram <b>@BotFather</b> থেকে পান
                      </span>
                    </label>
                    <input
                      type="text"
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      placeholder="e.g. 1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-300 block mb-1 flex items-center justify-between">
                      <span>অ্যাডমিন টেলিগ্রাম চ্যাট আইডি (Admin Chat ID):</span>
                      <span className="text-[10px] text-zinc-500">
                        Telegram <b>@userinfobot</b> এ /start দিলে আপনার ID পাবেন
                      </span>
                    </label>
                    <input
                      type="text"
                      value={adminId}
                      onChange={(e) => setAdminId(e.target.value)}
                      placeholder="e.g. 987654321"
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none font-mono"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">
                      কেউ টেলিগ্রাম থেকে পাসওয়ার্ড সার্চ বা পরিবর্তন করলে অ্যাডমিন আইডিতে তাৎক্ষণিক সিকিউরিটি অ্যালার্ট যাবে।
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-300 block mb-1 flex items-center justify-between">
                      <span>বট মাস্টার সিকিউরিটি PIN (Bot Master PIN):</span>
                      <span className="text-[10px] text-amber-400 font-semibold">লক ও আনলক সুরক্ষা</span>
                    </label>
                    <input
                      type="text"
                      value={botMasterPin}
                      onChange={(e) => setBotMasterPin(e.target.value)}
                      placeholder="e.g. 1234"
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none font-mono"
                    />
                    <p className="text-[10px] text-zinc-400 mt-1">
                      🔒 বটের বাইরে থেকে কেউ ঢুকলে পাসওয়ার্ড লুকানো থাকে। এই PIN দিয়ে ভল্ট আনলক করতে হবে। (ডিফল্ট: <code>1234</code>)
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-300 block mb-1">
                      ওয়েব অ্যাডমিন পাসওয়ার্ড পরিবর্তন করুন (Change Web Admin Password - Optional):
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="নতুন পাসওয়ার্ড দিন (নূন্যতম ৪ অক্ষর)"
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={handleSaveConfig}
                      disabled={isLoading}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-zinc-950 shadow-md transition-all"
                    >
                      {isLoading ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস সেভ করুন (Save Config)'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: COMMAND GUIDE */}
            {activeTab === 'guide' && (
              <div className="p-5 space-y-4">
                <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-xs text-sky-300">
                  💡 <b>বটটি যেভাবে কাজ করে:</b> আপনার তৈরি করা টেলিগ্রাম বট থেকে সরাসরি এই ভল্টের পাসওয়ার্ড অনুসন্ধান ও নতুন অ্যাকাউন্ট সংরক্ষণ করা যায়।
                </div>

                <div className="space-y-3">
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                      <code>/start</code> বা <code>/help</code>
                    </div>
                    <p className="text-xs text-zinc-300 mt-1">
                      বটের পরিচিতি ও সমস্ত কমান্ডের নির্দেশিকা প্রদান করে।
                    </p>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                      <code>/list</code>
                    </div>
                    <p className="text-xs text-zinc-300 mt-1">
                      সংরক্ষিত সকল অ্যাপের তালিকা দেখায় (যেমন: Facebook, Twitter, Instagram, Google...) এবং সহজে দেখার লিংক দেয়।
                    </p>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-teal-400">
                      <code>/get facebook</code> বা <code>/get twitter</code>
                    </div>
                    <p className="text-xs text-zinc-300 mt-1">
                      নির্দিষ্ট অ্যাপের ইউজারনেম, ১ম পাসওয়ার্ড ও ২য় পাসওয়ার্ড দেখায়।
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      🔒 <b>হিডেন পাসওয়ার্ড:</b> টেলিগ্রামের <code>&lt;tg-spoiler&gt;</code> ফিচারের কারণে পাসওয়ার্ড শুরুতে কালো বাক্সে লুকানো থাকে, ট্যাপ করলেই শুধু দেখা যায়!
                    </p>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                      <code>/add Instagram | my_handle | Pass123# | 849201</code>
                    </div>
                    <p className="text-xs text-zinc-300 mt-1">
                      টেলিগ্রাম থেকেই সরাসরি নতুন অ্যাপের নাম, ইউজারনেম, ১ম ও ২য় পাসওয়ার্ড যুক্ত করুন।
                    </p>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                      <code>/lock</code> বা বট বাটন "🔒 ভল্ট লক করুন"
                    </div>
                    <p className="text-xs text-zinc-300 mt-1">
                      তাৎক্ষণিকভাবে ভল্ট লক করে সমস্ত পাসওয়ার্ড লুকিয়ে রাখে। লক থাকা অবস্থায় বাইরে থেকে কেউ পাসওয়ার্ড দেখতে পারবে না।
                    </p>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                      <code>/unlock 1234</code> বা সরাসরি পিন টাইপ করুন
                    </div>
                    <p className="text-xs text-zinc-300 mt-1">
                      মাস্টার PIN দিয়ে ভল্ট আনলক করে সমস্ত অ্যাপের সংরক্ষিত পাসওয়ার্ড উন্মুক্ত করুন।
                    </p>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-red-400">
                      <code>/delete Facebook</code> বা ইনলাইন বাটন "🗑️ মুছে ফেলুন"
                    </div>
                    <p className="text-xs text-zinc-300 mt-1">
                      ভল্ট থেকে নির্দিষ্ট কোনো অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলতে ব্যবহৃত হয়।
                    </p>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                      <code>/setpin 9876</code>
                    </div>
                    <p className="text-xs text-zinc-300 mt-1">
                      টেলিগ্রাম বট থেকে সরাসরি মাস্টার সিকিউরিটি পিন পরিবর্তন করতে ব্যবহৃত হয়।
                    </p>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                      <code>/gen</code> ও <code>/pin</code>
                    </div>
                    <p className="text-xs text-zinc-300 mt-1">
                      তাৎক্ষণিক উচ্চ সিকিউরিটির ১৬ অক্ষরের পাসওয়ার্ড ও ৬ সংখ্যার পিন জেনারেট করে।
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: LIVE LOGS */}
            {activeTab === 'logs' && (
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">
                    সর্বশেষ টেলিগ্রাম এবং ভল্ট অ্যাকশন লগ ({logs.length} টি রেকর্ড)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={fetchLogs}
                      className="p-1 text-zinc-400 hover:text-zinc-200 text-xs flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> রিফ্রেশ
                    </button>
                    <button
                      type="button"
                      onClick={handleClearLogs}
                      className="px-2 py-0.5 rounded text-[11px] text-zinc-400 hover:text-rose-300 hover:bg-rose-500/10"
                    >
                      লগ মুছুন
                    </button>
                  </div>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 max-h-72 overflow-y-auto space-y-2 font-mono text-xs">
                  {logs.length === 0 ? (
                    <p className="text-zinc-600 text-center py-6">এখনো কোনো লগ নেই</p>
                  ) : (
                    logs.map((l) => (
                      <div
                        key={l.id}
                        className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60 flex items-start justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                l.type === 'alert'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : l.type === 'success'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : l.type === 'warning'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'bg-zinc-800 text-zinc-400'
                              }`}
                            >
                              {l.action}
                            </span>
                            {l.user && (
                              <span className="text-[11px] text-sky-400 font-sans">
                                @{l.user}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-300 font-sans">{l.details}</p>
                        </div>
                        <span className="text-[10px] text-zinc-600 shrink-0">
                          {new Date(l.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: DATA & BACKUP */}
            {activeTab === 'data' && (
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Export Backup */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <h4 className="font-semibold text-xs text-zinc-200 flex items-center gap-1.5">
                        <Download className="w-4 h-4 text-emerald-400" />
                        <span>ভল্ট ব্যাকআপ এক্সপোর্ট (Export Vault)</span>
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        আপনার সমস্ত পাসওয়ার্ড ও অ্যাকাউন্ট JSON ফাইলে ডাউনলোড করে নিরাপদে সংরক্ষণ করুন।
                      </p>
                    </div>
                    <div className="mt-3">
                      <a
                        href={`data:text/json;charset=utf-8,${encodeURIComponent(
                          JSON.stringify({ exportedAt: Date.now(), items: vaultItems }, null, 2)
                        )}`}
                        download={`vault-backup-${new Date().toISOString().split('T')[0]}.json`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>ব্যাকআপ ফাইল ডাউনলোড</span>
                      </a>
                    </div>
                  </div>

                  {/* Import Backup */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <h4 className="font-semibold text-xs text-zinc-200 flex items-center gap-1.5">
                        <Upload className="w-4 h-4 text-sky-400" />
                        <span>ব্যাকআপ ইম্পোর্ট (Import Backup)</span>
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        পূর্বে সংরক্ষিত JSON ব্যাকআপ ফাইল আপলোড করে ভল্টে রিস্টোর করুন।
                      </p>
                    </div>
                    <div className="mt-3">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>JSON ফাইল আপলোড</span>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Reset to Default Samples */}
                <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-xs text-rose-300">
                      ডিফল্ট স্যাম্পলে রিসেট (Reset to Demo Accounts)
                    </h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      ভল্টটিকে আবার ফেসবুক, টুইটার, ইনস্টাগ্রাম, গুগল এর ৫টি ডেমো অ্যাকাউন্টে ফিরিয়ে নিন।
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetDefaults}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition-colors"
                  >
                    রিসেট করুন
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-900 flex items-center justify-between text-xs text-zinc-500">
          <span>VaultGuard • AES &amp; Telegram Bot Architecture</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            বন্ধ করুন (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
