/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Search,
  Key,
  Bot,
  Lock,
  Unlock,
  Star,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
  Sliders,
  RefreshCw,
} from 'lucide-react';
import { PasswordItem, CredentialCategory, TelegramBotConfig } from './types';
import { INITIAL_VAULT_ITEMS } from './data/presetApps';
import { CredentialCard } from './components/CredentialCard';
import { AddEditCredentialModal } from './components/AddEditCredentialModal';
import { PasswordGeneratorModal } from './components/PasswordGeneratorModal';
import { SecurityAuditModal } from './components/SecurityAuditModal';
import { TelegramAdminModal } from './components/TelegramAdminModal';
import { MasterLockScreen } from './components/MasterLockScreen';
import { BottomNavDock, ActiveTab } from './components/BottomNavDock';
import { TelegramPhoneSimulator } from './components/TelegramPhoneSimulator';
import { calculateVaultAudit } from './utils/security';

const CATEGORIES: { id: CredentialCategory | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'সব অ্যাকাউন্ট', icon: '📁' },
  { id: 'social', label: 'সোশ্যাল মিডিয়া', icon: '💬' },
  { id: 'email', label: 'ইমেইল ও কাজ', icon: '✉️' },
  { id: 'finance', label: 'ব্যাংক ও পেমেন্ট', icon: '🏦' },
  { id: 'entertainment', label: 'বিনোদন', icon: '🎬' },
  { id: 'crypto', label: 'ক্রিপ্টো ও ট্রেড', icon: '🪙' },
  { id: 'other', label: 'অন্যান্য', icon: '🔒' },
];

export default function App() {
  const [items, setItems] = useState<PasswordItem[]>(INITIAL_VAULT_ITEMS);
  const [activeTab, setActiveTab] = useState<ActiveTab>('vault');
  const [isVaultLocked, setIsVaultLocked] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CredentialCategory | 'all'>('all');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [globalReveal, setGlobalReveal] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PasswordItem | null>(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Telegram bot state
  const [isBotRunning, setIsBotRunning] = useState(false);
  const [botConfig, setBotConfig] = useState<TelegramBotConfig | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Fetch Vault Items from API
  const fetchVault = async () => {
    try {
      const res = await fetch('/api/vault/items');
      const data = await res.json();
      if (data.items && Array.isArray(data.items)) {
        setItems(data.items);
      }
    } catch (e) {
      console.warn('Using local vault state fallback');
    }
  };

  // Fetch Bot Status
  const fetchBotStatus = async () => {
    try {
      const res = await fetch('/api/telegram/status');
      const data = await res.json();
      setIsBotRunning(Boolean(data.isRunning));
      setBotConfig(data);
    } catch (e) {
      console.warn('Bot status check:', e);
    }
  };

  useEffect(() => {
    fetchVault();
    fetchBotStatus();
    const interval = setInterval(fetchBotStatus, 6000);
    return () => clearInterval(interval);
  }, []);

  // Save (Add or Edit) Credential
  const handleSaveCredential = async (partialItem: Partial<PasswordItem>) => {
    try {
      if (partialItem.id) {
        // Edit existing
        const res = await fetch(`/api/vault/items/${partialItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(partialItem),
        });
        const data = await res.json();
        if (data.ok && data.item) {
          setItems((prev) => prev.map((it) => (it.id === data.item.id ? data.item : it)));
          showToast(`✅ "${data.item.appName}" অ্যাকাউন্ট সফলভাবে আপডেট হয়েছে!`);
        }
      } else {
        // Add new
        const res = await fetch('/api/vault/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(partialItem),
        });
        const data = await res.json();
        if (data.ok && data.item) {
          setItems((prev) => [data.item, ...prev]);
          showToast(`✅ "${data.item.appName}" ভল্টে সংরক্ষিত হয়েছে!`);
        }
      }
    } catch (err: any) {
      // Local fallback
      if (partialItem.id) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === partialItem.id
              ? ({ ...it, ...partialItem, updatedAt: Date.now() } as PasswordItem)
              : it
          )
        );
        showToast(`✅ অ্যাকাউন্ট আপডেট করা হয়েছে।`);
      } else {
        const newItem: PasswordItem = {
          id: `vault-item-${Date.now()}`,
          appName: partialItem.appName || 'Custom App',
          category: partialItem.category || 'social',
          username: partialItem.username || '',
          primaryPassword: partialItem.primaryPassword || '',
          secondaryPassword: partialItem.secondaryPassword || '',
          notes: partialItem.notes,
          url: partialItem.url,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isFavorite: false,
          strength: 'strong',
        };
        setItems((prev) => [newItem, ...prev]);
        showToast(`✅ নতুন অ্যাকাউন্ট ভল্টে যোগ করা হয়েছে।`);
      }
    }
  };

  // Delete Credential
  const handleDeleteCredential = async (id: string) => {
    const itemToDelete = items.find((it) => it.id === id);
    const confirmName = itemToDelete?.appName || 'এই অ্যাকাউন্ট';
    if (!window.confirm(`আপনি কি সত্যিই "${confirmName}" অ্যাকাউন্টটি মুছে ফেলতে চান?`)) {
      return;
    }

    try {
      await fetch(`/api/vault/items/${id}`, { method: 'DELETE' });
    } catch (e) {}

    setItems((prev) => prev.filter((it) => it.id !== id));
    showToast(`🗑️ "${confirmName}" মুছে ফেলা হয়েছে।`);
  };

  // Toggle Favorite
  const handleToggleFavorite = async (id: string) => {
    const item = items.find((it) => it.id === id);
    if (!item) return;
    const newFav = !item.isFavorite;

    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, isFavorite: newFav } : it))
    );

    try {
      await fetch(`/api/vault/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: newFav }),
      });
    } catch (e) {}
  };

  // Copy text handler with Toast
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`📋 ${label} কপি করা হয়েছে!`);
  };

  // Export Vault Backup
  const handleExportVault = () => {
    const dataStr = JSON.stringify(
      {
        appName: 'VaultGuard Dual Password Manager',
        exportedAt: Date.now(),
        date: new Date().toISOString(),
        items,
      },
      null,
      2
    );
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vaultguard-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('💾 ভল্ট ব্যাকআপ JSON ফাইল ডাউনলোড হয়েছে!');
  };

  // Filter and Sort Items
  const filteredItems = items.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }
    if (showOnlyFavorites && !item.isFavorite) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchApp = item.appName.toLowerCase().includes(q);
      const matchUser = item.username.toLowerCase().includes(q);
      const matchNotes = (item.notes || '').toLowerCase().includes(q);
      return matchApp || matchUser || matchNotes;
    }
    return true;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return b.updatedAt - a.updatedAt;
  });

  const favoritesCount = items.filter((it) => it.isFavorite).length;
  const auditStats = calculateVaultAudit(items);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-zinc-950 pb-28">
      {/* Master Security Lock Screen Overlay */}
      {isVaultLocked && (
        <MasterLockScreen onUnlock={() => setIsVaultLocked(false)} />
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="px-4 py-2 rounded-xl bg-zinc-900 border border-emerald-500/50 text-emerald-300 text-xs font-semibold shadow-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Application Header */}
      <header className="w-full bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Logo and Brand Title */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-zinc-950 shadow-md shadow-emerald-500/20">
                  <Shield className="w-5 h-5 text-zinc-950 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base sm:text-lg font-bold text-zinc-100 tracking-tight flex items-center gap-1.5">
                      <span>VaultGuard</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold uppercase">
                        Dual Pass
                      </span>
                    </h1>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    পাসওয়ার্ড ম্যানেজার ও টেলিগ্রাম বট • {items.length} টি অ্যাকাউন্ট
                  </p>
                </div>
              </div>

              {/* Mobile Quick Lock Button */}
              <button
                type="button"
                onClick={() => setIsVaultLocked(true)}
                className="sm:hidden p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-rose-400"
                title="ভল্ট লক করুন"
              >
                <Lock className="w-4 h-4" />
              </button>
            </div>

            {/* Top Quick Tools: Search, Reveal All, Lock */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search input */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="অ্যাকাউন্ট বা ইউজারনেম খুঁজুন..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Reveal / Hide Passwords */}
              <button
                type="button"
                onClick={() => setGlobalReveal(!globalReveal)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  globalReveal
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                }`}
                title="সব পাসওয়ার্ড এক ক্লিকে দেখান বা লুকান"
              >
                {globalReveal ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                <span className="hidden md:inline">{globalReveal ? 'লুকান' : 'পাসওয়ার্ড দেখুন'}</span>
              </button>

              {/* Lock Vault button */}
              <button
                type="button"
                onClick={() => setIsVaultLocked(true)}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 transition-colors"
                title="ভল্ট লক করুন"
              >
                <Lock className="w-3.5 h-3.5 text-zinc-400" />
                <span>লক ভল্ট</span>
              </button>
            </div>
          </div>

          {/* Category Filter Pills (when on Vault tab) */}
          {activeTab === 'vault' && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-2 mt-2 scrollbar-none border-t border-zinc-800/60">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm'
                      : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/80'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB 1: VAULT CREDENTIALS VIEW */}
        {activeTab === 'vault' && (
          <div>
            {/* Top Info Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-zinc-900">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span>
                  প্রদর্শিত হচ্ছে: <b className="text-zinc-200">{sortedItems.length}</b> / {items.length} টি অ্যাকাউন্ট
                </span>
                {selectedCategory !== 'all' && (
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[11px] capitalize">
                    {selectedCategory}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Favorites filter */}
                <button
                  type="button"
                  onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    showOnlyFavorites
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  <Star className={`w-3 h-3 ${showOnlyFavorites ? 'fill-amber-400 text-amber-400' : ''}`} />
                  <span>পছন্দের তালিকা ({favoritesCount})</span>
                </button>

                {/* Quick Add Button */}
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setIsAddModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold shadow transition-all"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>নতুন যোগ</span>
                </button>
              </div>
            </div>

            {/* Credentials Grid */}
            {sortedItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedItems.map((item) => (
                  <CredentialCard
                    key={item.id}
                    item={item}
                    globalReveal={globalReveal}
                    onEdit={(selected) => {
                      setEditingItem(selected);
                      setIsAddModalOpen(true);
                    }}
                    onDelete={handleDeleteCredential}
                    onToggleFavorite={handleToggleFavorite}
                    onCopyText={handleCopyText}
                  />
                ))}
              </div>
            ) : (
              /* Empty state */
              <div className="py-16 px-4 text-center max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-zinc-500 shadow-inner mb-4">
                  <Search className="w-6 h-6 text-zinc-600" />
                </div>
                <h3 className="text-base font-semibold text-zinc-200">
                  কোনো অ্যাকাউন্ট পাওয়া যায়নি
                </h3>
                <p className="text-xs text-zinc-400 mt-1 mb-5">
                  {searchQuery
                    ? `"${searchQuery}" এর সাথে মিলে এমন কোনো অ্যাকাউন্ট ভল্টে নেই।`
                    : 'এই ক্যাটাগরিতে কোনো অ্যাকাউন্ট সংরক্ষিত নেই। নতুন অ্যাকাউন্ট যোগ করুন।'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setShowOnlyFavorites(false);
                    setEditingItem(null);
                    setIsAddModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-md transition-all"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>নতুন অ্যাকাউন্ট যোগ করুন</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TELEGRAM BOT & SMARTPHONE SIMULATOR */}
        {activeTab === 'telegram' && (
          <div className="flex flex-col items-center">
            <TelegramPhoneSimulator
              vaultItems={items}
              onOpenAdminModal={() => setIsAdminModalOpen(true)}
              isRealBotRunning={isBotRunning}
              onRefreshVault={fetchVault}
            />
          </div>
        )}

        {/* TAB 3: SECURITY AUDIT VIEW */}
        {activeTab === 'audit' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner">
                  <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-100">ভল্ট সিকিউরিটি অডিট রিপোর্ট</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    মোট {items.length} টি অ্যাকাউন্টের নিরাপত্তা এবং দ্বৈত পাসওয়ার্ড বিশ্লেষণ
                  </p>
                </div>
              </div>

              <div className="text-center md:text-right bg-zinc-950/80 px-5 py-3 rounded-2xl border border-zinc-800">
                <span className="text-[11px] text-zinc-400 block font-medium">সামগ্রিক স্কোর</span>
                <span className="text-3xl font-extrabold text-emerald-400">
                  {auditStats.overallScore}%
                </span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-[11px] text-zinc-400 block">মোট অ্যাকাউন্ট</span>
                <span className="text-2xl font-bold text-zinc-100 mt-1 block">{auditStats.total}</span>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-[11px] text-zinc-400 block">২য় পাসওয়ার্ড/PIN যুক্ত</span>
                <span className="text-2xl font-bold text-emerald-400 mt-1 block">{auditStats.withSecondary}</span>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-[11px] text-zinc-400 block">অতি শক্তিশালী পাসওয়ার্ড</span>
                <span className="text-2xl font-bold text-teal-400 mt-1 block">{auditStats.strong}</span>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-[11px] text-zinc-400 block">পুনরাবৃত্ত পাসওয়ার্ড</span>
                <span className="text-2xl font-bold text-amber-400 mt-1 block">{auditStats.reused}</span>
              </div>
            </div>

            {/* AI Advisor Button */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-zinc-900 to-emerald-950/30 border border-purple-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-zinc-100">AI সাইবার সিকিউরিটি অ্যাডভাইজার</h4>
                  <p className="text-xs text-zinc-400">Gemini মডেল দিয়ে সম্পূর্ণ ভল্টের বিস্তারিত মূল্যায়ন নিন</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-zinc-950 text-xs font-bold transition-all shadow"
              >
                অডিট ওপেন করুন →
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: SETTINGS & MASTER ADMIN */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-5">
            <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl">
              <h3 className="text-base font-bold text-zinc-100 mb-1 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>মাস্টার ভল্ট ও টেলিগ্রাম কনফিগারেশন</span>
              </h3>
              <p className="text-xs text-zinc-400 mb-6">
                টেলিগ্রাম বট টোকেন, মাস্টার পাসওয়ার্ড ও ডাটা ব্যাকআপ নিয়ন্ত্রণ করুন
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-200">টেলিগ্রাম বট এপিআই</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {isBotRunning ? 'বট সক্রিয় এবং মেসেজ প্রসেস করছে' : 'বট বর্তমানে অফলাইনে আছে'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAdminModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-xs font-medium"
                  >
                    বট কন্ট্রোল প্যানেল
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-200">ভল্ট ব্যাকআপ এক্সপোর্ট</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">সব অ্যাকাউন্ট JSON ফাইলে ডাউনলোড করুন</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportVault}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium"
                  >
                    JSON ব্যাকআপ
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-200">মাস্টার সিকিউরিটি লক</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">পিন: 1234 বা মাস্টার পাসওয়ার্ড</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsVaultLocked(true)}
                    className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-xs font-medium"
                  >
                    ভল্ট লক করুন
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* PERSISTENT BOTTOM NAVIGATION DOCK ("নিচ দিয়ে বাটন দিয়ে উপরে সরাসরি বাটন গুলো নিচে যেন থাকে") */}
      <BottomNavDock
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAddModal={() => {
          setEditingItem(null);
          setIsAddModalOpen(true);
        }}
        onOpenGeneratorModal={() => setIsGeneratorOpen(true)}
        onLockVault={() => setIsVaultLocked(true)}
        totalItems={items.length}
        isBotRunning={isBotRunning}
      />

      {/* MODALS */}
      {/* 1. Add / Edit Credential Modal */}
      <AddEditCredentialModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveCredential}
        editingItem={editingItem}
      />

      {/* 2. Standalone Password & PIN Generator Modal */}
      <PasswordGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onUsePassword={(pass) => {
          handleCopyText(pass, 'পাসওয়ার্ড');
          setIsGeneratorOpen(false);
        }}
      />

      {/* 3. Security Health Audit Modal */}
      <SecurityAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        items={items}
      />

      {/* 4. Telegram Admin & API Manager Modal */}
      <TelegramAdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onVaultUpdated={fetchVault}
        vaultItems={items}
        onImportItems={(imported) => {
          setItems(imported);
          showToast(`✅ ${imported.length} টি অ্যাকাউন্ট রিস্টোর হয়েছে!`);
        }}
      />
    </div>
  );
}
