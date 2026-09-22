import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Key,
  Eye,
  EyeOff,
  RefreshCw,
  Globe,
  Sparkles,
  Check,
} from 'lucide-react';
import { PasswordItem, CredentialCategory } from '../types';
import { PRESET_APPS, PresetAppDefinition } from '../data/presetApps';
import { calculatePasswordStrength, generateSecurePassword } from '../utils/security';

interface AddEditCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<PasswordItem>) => void;
  editingItem?: PasswordItem | null;
}

export const AddEditCredentialModal: React.FC<AddEditCredentialModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
}) => {
  const [appName, setAppName] = useState('');
  const [category, setCategory] = useState<CredentialCategory>('social');
  const [username, setUsername] = useState('');
  const [primaryPassword, setPrimaryPassword] = useState('');
  const [secondaryPassword, setSecondaryPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [url, setUrl] = useState('');

  const [showPrimary, setShowPrimary] = useState(false);
  const [showSecondary, setShowSecondary] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // When editingItem changes, populate state
  useEffect(() => {
    if (editingItem) {
      setAppName(editingItem.appName || '');
      setCategory(editingItem.category || 'social');
      setUsername(editingItem.username || '');
      setPrimaryPassword(editingItem.primaryPassword || '');
      setSecondaryPassword(editingItem.secondaryPassword || '');
      setNotes(editingItem.notes || '');
      setUrl(editingItem.url || '');
    } else {
      setAppName('');
      setCategory('social');
      setUsername('');
      setPrimaryPassword('');
      setSecondaryPassword('');
      setNotes('');
      setUrl('');
    }
    setErrorMsg('');
    setShowPrimary(false);
    setShowSecondary(false);
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const strength = calculatePasswordStrength(primaryPassword);

  const handleSelectPreset = (preset: PresetAppDefinition) => {
    setAppName(preset.name);
    setCategory(preset.category);
    if (preset.defaultUrl && !url) {
      setUrl(preset.defaultUrl);
    }
  };

  const handleGeneratePrimary = () => {
    const newPass = generateSecurePassword({
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
    });
    setPrimaryPassword(newPass);
    setShowPrimary(true);
  };

  const handleGenerateSecondary = () => {
    // Generate a 6 to 8 char PIN or alphanumeric key
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    setSecondaryPassword(pin);
    setShowSecondary(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim()) {
      setErrorMsg('অনুগ্রহ করে অ্যাপের নাম দিন (App Name is required)');
      return;
    }
    if (!username.trim()) {
      setErrorMsg('অনুগ্রহ করে ইউজার নেম বা ইমেইল দিন (Username is required)');
      return;
    }
    if (!primaryPassword.trim()) {
      setErrorMsg('অনুগ্রহ করে ১ম পাসওয়ার্ড দিন (Primary password is required)');
      return;
    }

    onSave({
      id: editingItem ? editingItem.id : undefined,
      appName: appName.trim(),
      category,
      username: username.trim(),
      primaryPassword: primaryPassword.trim(),
      secondaryPassword: secondaryPassword.trim(),
      notes: notes.trim(),
      url: url.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-zinc-100 text-sm">
                {editingItem ? 'অ্যাকাউন্ট এডিট করুন (Edit Account)' : 'নতুন অ্যাকাউন্ট যোগ করুন (Add Account)'}
              </h2>
              <p className="text-xs text-zinc-400">
                অ্যাপ নাম, ইউজারনেম, ১ম ও ২য় পাসওয়ার্ড তথ্য সংরক্ষণ করুন
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Preset Selector for Popular Apps */}
          <div>
            <label className="text-xs font-medium text-zinc-400 block mb-1.5">
              জনপ্রিয় অ্যাপ সিলেক্ট করুন (Quick Select Popular App):
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
              {PRESET_APPS.slice(0, 8).map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium border whitespace-nowrap transition-colors ${
                    appName === preset.name
                      ? 'bg-zinc-100 text-zinc-950 border-zinc-100'
                      : 'bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 border-zinc-700'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* 1. App Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">
                অ্যাপের নাম (App / Service Name) <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="যেমন: Facebook, Twitter, Instagram"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">
                ক্যাটাগরি (Category)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CredentialCategory)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none"
              >
                <option value="social">সোশ্যাল মিডিয়া (Social Media)</option>
                <option value="email">ইমেইল ও ওয়ার্ক (Email / Work)</option>
                <option value="finance">ব্যাংক ও পেমেন্ট (Finance / Banking)</option>
                <option value="entertainment">বিনোদন (Entertainment / Streaming)</option>
                <option value="crypto">ক্রিপ্টো ওয়ালেট (Crypto)</option>
                <option value="shopping">শপিং (Shopping)</option>
                <option value="other">অন্যান্য (Other)</option>
              </select>
            </div>
          </div>

          {/* 2. Username / Email */}
          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1">
              ইউজার নেম বা ইমেইল (Username / Email) <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. user@gmail.com বা @handle"
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none font-mono"
              required
            />
          </div>

          {/* 3. Primary Password (প্রথম পাসওয়ার্ড) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                <span>প্রথম পাসওয়ার্ড (Password 1)</span>
                <span className="text-emerald-400">*</span>
              </label>
              <button
                type="button"
                onClick={handleGeneratePrimary}
                className="text-[11px] text-teal-400 hover:text-teal-300 flex items-center gap-1 font-medium transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                <span>শক্তিশালী পাসওয়ার্ড তৈরি করুন (Generate)</span>
              </button>
            </div>

            <div className="relative">
              <input
                type={showPrimary ? 'text' : 'password'}
                value={primaryPassword}
                onChange={(e) => setPrimaryPassword(e.target.value)}
                placeholder="প্রধান লগইন পাসওয়ার্ড দিন"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg pl-3 pr-10 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowPrimary(!showPrimary)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                title={showPrimary ? 'লুকিয়ে রাখুন' : 'পাসওয়ার্ড দেখুন'}
              >
                {showPrimary ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Strength Meter Bar */}
            {primaryPassword && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden flex gap-1">
                  <div
                    className={`h-full flex-1 rounded-full ${
                      strength === 'weak'
                        ? 'bg-rose-500'
                        : strength === 'medium'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <div
                    className={`h-full flex-1 rounded-full ${
                      strength === 'medium'
                        ? 'bg-amber-500'
                        : strength === 'strong'
                        ? 'bg-emerald-500'
                        : 'bg-zinc-800'
                    }`}
                  />
                  <div
                    className={`h-full flex-1 rounded-full ${
                      strength === 'strong' ? 'bg-emerald-500' : 'bg-zinc-800'
                    }`}
                  />
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase ${
                    strength === 'strong'
                      ? 'text-emerald-400'
                      : strength === 'medium'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {strength === 'strong' ? 'Strong' : strength === 'medium' ? 'Medium' : 'Weak'}
                </span>
              </div>
            )}
          </div>

          {/* 4. Secondary Password (দ্বিতীয় পাসওয়ার্ড) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-sky-400 flex items-center gap-1.5">
                <span>দ্বিতীয় পাসওয়ার্ড (Password 2 / Security PIN / 2FA Backup)</span>
                <span className="text-zinc-500 text-[10px]">(ঐচ্ছিক)</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateSecondary}
                className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>৬-ডিজিট PIN জেনারেট</span>
              </button>
            </div>

            <div className="relative">
              <input
                type={showSecondary ? 'text' : 'password'}
                value={secondaryPassword}
                onChange={(e) => setSecondaryPassword(e.target.value)}
                placeholder="যেমন: ট্রানজেকশন পিন, ২য় পাসওয়ার্ড, 2FA ব্যাকআপ কোড"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-lg pl-3 pr-10 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowSecondary(!showSecondary)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                title={showSecondary ? 'লুকিয়ে রাখুন' : 'পাসওয়ার্ড দেখুন'}
              >
                {showSecondary ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">
              এটি ব্যাংক ATM PIN, দ্বিতীয় সিকিউরিটি পাসওয়ার্ড বা 2FA রিকভারি কোড হিসেবে ব্যবহৃত হতে পারে।
            </p>
          </div>

          {/* 5. Website URL & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1">
                ওয়েবসাইট লিঙ্ক (URL)
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1">
                নোট / অতিরিক্ত তথ্য (Notes)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="সিকিউরিটি প্রশ্ন বা অন্য তথ্য"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              বাতিল (Cancel)
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-md transition-all flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>{editingItem ? 'আপডেট করুন (Save Changes)' : 'সংরক্ষণ করুন (Save Account)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
