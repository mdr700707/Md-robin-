import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Copy,
  Check,
  Edit3,
  Trash2,
  ExternalLink,
  Star,
  Shield,
  Key,
  Lock,
} from 'lucide-react';
import { PasswordItem } from '../types';

interface CredentialCardProps {
  item: PasswordItem;
  globalReveal: boolean;
  onEdit: (item: PasswordItem) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onCopyText: (text: string, label: string) => void;
}

// Brand color generator helper
function getBrandColor(appName: string): { bg: string; text: string; border: string } {
  const name = appName.toLowerCase();
  if (name.includes('face') || name.includes('fb')) {
    return { bg: 'bg-[#1877F2]/15', text: 'text-[#1877F2]', border: 'border-[#1877F2]/30' };
  }
  if (name.includes('twit') || name.includes('x.com') || name === 'x') {
    return { bg: 'bg-zinc-800', text: 'text-zinc-100', border: 'border-zinc-700' };
  }
  if (name.includes('insta')) {
    return { bg: 'bg-[#E1306C]/15', text: 'text-[#E1306C]', border: 'border-[#E1306C]/30' };
  }
  if (name.includes('goog') || name.includes('gmail')) {
    return { bg: 'bg-[#4285F4]/15', text: 'text-[#4285F4]', border: 'border-[#4285F4]/30' };
  }
  if (name.includes('tele')) {
    return { bg: 'bg-[#229ED9]/15', text: 'text-[#229ED9]', border: 'border-[#229ED9]/30' };
  }
  if (name.includes('whats')) {
    return { bg: 'bg-[#25D366]/15', text: 'text-[#25D366]', border: 'border-[#25D366]/30' };
  }
  if (name.includes('git')) {
    return { bg: 'bg-zinc-700/20', text: 'text-zinc-200', border: 'border-zinc-600/40' };
  }
  if (name.includes('netfl')) {
    return { bg: 'bg-[#E50914]/15', text: 'text-[#E50914]', border: 'border-[#E50914]/30' };
  }
  if (name.includes('spot')) {
    return { bg: 'bg-[#1DB954]/15', text: 'text-[#1DB954]', border: 'border-[#1DB954]/30' };
  }
  if (name.includes('bank') || name.includes('pay') || name.includes('bkash') || name.includes('nagad')) {
    return { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' };
  }
  return { bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30' };
}

export const CredentialCard: React.FC<CredentialCardProps> = ({
  item,
  globalReveal,
  onEdit,
  onDelete,
  onToggleFavorite,
  onCopyText,
}) => {
  const [showPrimary, setShowPrimary] = useState(false);
  const [showSecondary, setShowSecondary] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const brand = getBrandColor(item.appName);
  const isPrimaryRevealed = globalReveal || showPrimary;
  const isSecondaryRevealed = globalReveal || showSecondary;

  const handleCopy = (text: string, fieldName: string, labelBengali: string) => {
    if (!text) return;
    onCopyText(text, `${item.appName} ${labelBengali}`);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  return (
    <div className="group bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4.5 transition-all shadow-sm hover:shadow-md flex flex-col justify-between">
      <div>
        {/* Card Header: App Name, Category, Favorite, Actions */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            {/* Brand Logo Avatar */}
            <div
              className={`w-10 h-10 rounded-xl ${brand.bg} border ${brand.border} flex items-center justify-center font-bold text-sm ${brand.text} shadow-inner shrink-0`}
            >
              {item.appName.substring(0, 2).toUpperCase()}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-zinc-100 text-sm tracking-tight flex items-center gap-1.5">
                  <span>{item.appName}</span>
                  {item.url && (
                    <a
                      href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-500 hover:text-zinc-300 transition-colors"
                      title="ওয়েবসাইটে যান (Open Website)"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </h3>
              </div>
              <span className="text-[11px] font-medium text-zinc-400 capitalize">
                {item.category}
              </span>
            </div>
          </div>

          {/* Quick Buttons: Favorite, Edit, Delete */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onToggleFavorite(item.id)}
              className={`p-1.5 rounded-md transition-colors ${
                item.isFavorite
                  ? 'text-amber-400 hover:text-amber-300'
                  : 'text-zinc-600 hover:text-zinc-400'
              }`}
              title={item.isFavorite ? 'পছন্দ তালিকা থেকে সরান' : 'পছন্দে যোগ করুন'}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
            </button>

            <button
              type="button"
              onClick={() => onEdit(item)}
              className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="এডিট করুন (Edit)"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="p-1.5 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="মুছে ফেলুন (Delete)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Credential Details List */}
        <div className="mt-3.5 space-y-2.5">
          {/* 1. Username / Email */}
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-2.5 flex items-center justify-between">
            <div className="overflow-hidden pr-2">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                ইউজার নেম (Username / Email)
              </span>
              <p className="text-xs font-mono text-zinc-200 truncate mt-0.5" title={item.username}>
                {item.username}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(item.username, 'username', 'ইউজারনেম')}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors shrink-0"
              title="ইউজারনেম কপি করুন"
            >
              {copiedField === 'username' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* 2. Primary Password (প্রথম পাসওয়ার্ড) */}
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-2.5 flex items-center justify-between">
            <div className="overflow-hidden pr-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                  ১ম পাসওয়ার্ড (Primary Password)
                </span>
                {item.strength && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      item.strength === 'strong'
                        ? 'bg-emerald-400'
                        : item.strength === 'medium'
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                    title={`Strength: ${item.strength}`}
                  />
                )}
              </div>
              <p className="text-xs font-mono text-zinc-100 mt-0.5 select-all">
                {isPrimaryRevealed ? item.primaryPassword : '••••••••••••••••'}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Show/Hide Button */}
              <button
                type="button"
                onClick={() => setShowPrimary(!showPrimary)}
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                title={isPrimaryRevealed ? 'লুকিয়ে রাখুন (Hide)' : 'পাসওয়ার্ড দেখুন (Reveal)'}
              >
                {isPrimaryRevealed ? (
                  <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Copy Button */}
              <button
                type="button"
                onClick={() => handleCopy(item.primaryPassword, 'primary', '১ম পাসওয়ার্ড')}
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                title="১ম পাসওয়ার্ড কপি করুন"
              >
                {copiedField === 'primary' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* 3. Secondary Password (দ্বিতীয় পাসওয়ার্ড - PIN / 2FA / Recovery) */}
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-2.5 flex items-center justify-between">
            <div className="overflow-hidden pr-2">
              <span className="text-[10px] font-semibold text-sky-400 uppercase tracking-wider block">
                ২য় পাসওয়ার্ড (Secondary / PIN / 2FA)
              </span>
              <p className="text-xs font-mono text-zinc-200 mt-0.5 select-all">
                {item.secondaryPassword ? (
                  isSecondaryRevealed ? (
                    item.secondaryPassword
                  ) : (
                    '••••••••••••'
                  )
                ) : (
                  <span className="text-zinc-500 italic font-sans text-[11px]">নেই (Not set)</span>
                )}
              </p>
            </div>

            {item.secondaryPassword && (
              <div className="flex items-center gap-1 shrink-0">
                {/* Show/Hide Button */}
                <button
                  type="button"
                  onClick={() => setShowSecondary(!showSecondary)}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                  title={isSecondaryRevealed ? 'লুকিয়ে রাখুন (Hide)' : '২য় পাসওয়ার্ড দেখুন (Reveal)'}
                >
                  {isSecondaryRevealed ? (
                    <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Copy Button */}
                <button
                  type="button"
                  onClick={() => handleCopy(item.secondaryPassword, 'secondary', '২য় পাসওয়ার্ড')}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                  title="২য় পাসওয়ার্ড কপি করুন"
                >
                  {copiedField === 'secondary' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Notes (if any) */}
        {item.notes && (
          <div className="mt-2.5 px-2.5 py-1.5 bg-zinc-950/40 rounded-md border border-zinc-800/40">
            <p className="text-[11px] text-zinc-400 italic line-clamp-2">
              📝 {item.notes}
            </p>
          </div>
        )}
      </div>

      {/* Footer Timestamp & Status */}
      <div className="mt-3 pt-2.5 border-t border-zinc-800/50 flex items-center justify-between text-[10px] text-zinc-500">
        <span>আপডেট: {new Date(item.updatedAt).toLocaleDateString()}</span>
        <span className="flex items-center gap-1 text-emerald-500/80">
          <Shield className="w-2.5 h-2.5" /> সুরক্ষিত
        </span>
      </div>
    </div>
  );
};
