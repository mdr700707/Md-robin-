import React from 'react';
import {
  Key,
  Shield,
  Plus,
  Search,
  Eye,
  EyeOff,
  Sliders,
  Bot,
  Sparkles,
  Download,
} from 'lucide-react';
import { CredentialCategory } from '../types';

interface VaultHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: CredentialCategory | 'all';
  onSelectCategory: (cat: CredentialCategory | 'all') => void;
  isAllRevealed: boolean;
  onToggleRevealAll: () => void;
  onOpenAddModal: () => void;
  onOpenGeneratorModal: () => void;
  onOpenAuditModal: () => void;
  onOpenAdminModal: () => void;
  onExportVault: () => void;
  isBotRunning: boolean;
  totalCount: number;
}

const CATEGORIES: { id: CredentialCategory | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'সব অ্যাকাউন্ট (All)', icon: '📁' },
  { id: 'social', label: 'সোশ্যাল মিডিয়া (Social)', icon: '💬' },
  { id: 'email', label: 'ইমেইল ও ওয়ার্ক (Email/Work)', icon: '✉️' },
  { id: 'finance', label: 'ব্যাংক ও ফিন্যান্স (Finance)', icon: '🏦' },
  { id: 'entertainment', label: 'বিনোদন (Entertainment)', icon: '🎬' },
  { id: 'crypto', label: 'ক্রিপ্টো (Crypto)', icon: '🪙' },
  { id: 'other', label: 'অন্যান্য (Other)', icon: '🔒' },
];

export const VaultHeader: React.FC<VaultHeaderProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  isAllRevealed,
  onToggleRevealAll,
  onOpenAddModal,
  onOpenGeneratorModal,
  onOpenAuditModal,
  onOpenAdminModal,
  onExportVault,
  isBotRunning,
  totalCount,
}) => {
  return (
    <header className="w-full bg-zinc-900 border-b border-zinc-800 sticky top-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        {/* Top bar: Brand, Status, Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Brand Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-zinc-950 shadow-md shadow-emerald-500/20">
              <Shield className="w-5 h-5 text-zinc-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-zinc-100 tracking-tight flex items-center gap-2">
                  <span>VaultGuard</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                    Dual Pass Vault
                  </span>
                </h1>
              </div>
              <p className="text-xs text-zinc-400">
                পাসওয়ার্ড ম্যানেজার ও টেলিগ্রাম বট • {totalCount} টি সুরক্ষিত অ্যাকাউন্ট
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Reveal/Hide All Passwords Toggle */}
            <button
              type="button"
              onClick={onToggleRevealAll}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isAllRevealed
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
              }`}
              title={isAllRevealed ? 'সব পাসওয়ার্ড লুকিয়ে রাখুন (Hide All)' : 'সব পাসওয়ার্ড দৃশ্যমান করুন (Show All)'}
            >
              {isAllRevealed ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{isAllRevealed ? 'হিডেন করুন (Hide All)' : 'দেখান (Show All)'}</span>
            </button>

            {/* Password Generator */}
            <button
              type="button"
              onClick={onOpenGeneratorModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 transition-colors"
            >
              <Key className="w-3.5 h-3.5 text-teal-400" />
              <span>জেনারেটর</span>
            </button>

            {/* Security Audit */}
            <button
              type="button"
              onClick={onOpenAuditModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>অডিট স্কোর</span>
            </button>

            {/* Export Vault Backup */}
            <button
              type="button"
              onClick={onExportVault}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 transition-colors"
              title="ভল্ট ব্যাকআপ ডাউনলোড করুন (Export Vault JSON)"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* Telegram Bot & Admin Panel Button */}
            <button
              type="button"
              onClick={onOpenAdminModal}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 transition-colors relative"
            >
              <Bot className="w-3.5 h-3.5 text-sky-400" />
              <span>টেলিগ্রাম বট &amp; এডমিন</span>
              <span className="flex h-2 w-2 relative">
                {isBotRunning && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isBotRunning ? 'bg-emerald-400' : 'bg-zinc-500'
                  }`}
                ></span>
              </span>
            </button>

            {/* Add New Credential Button */}
            <button
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>নতুন অ্যাকাউন্ট</span>
            </button>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="mt-3.5 pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="অ্যাপের নাম খুঁজুন (যেমন: Facebook, Twitter, Instagram...)"
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg pl-9 pr-4 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.id)}
                  className={`whitespace-nowrap px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                    isActive
                      ? 'bg-zinc-100 text-zinc-950'
                      : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
