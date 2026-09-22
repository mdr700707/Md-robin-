import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  Copy,
  Check,
  RefreshCw,
  Shield,
  Sparkles,
} from 'lucide-react';
import { generateSecurePassword, calculatePasswordStrength } from '../utils/security';

interface PasswordGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUsePassword?: (pass: string) => void;
}

export const PasswordGeneratorModal: React.FC<PasswordGeneratorModalProps> = ({
  isOpen,
  onClose,
  onUsePassword,
}) => {
  const [length, setLength] = useState(16);
  const [includeUpper, setIncludeUpper] = useState(true);
  const [includeLower, setIncludeLower] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const regenerate = () => {
    const pass = generateSecurePassword({
      length,
      includeUppercase: includeUpper,
      includeLowercase: includeLower,
      includeNumbers: includeNumbers,
      includeSymbols: includeSymbols,
    });
    setGeneratedPassword(pass);
    setCopied(false);
  };

  useEffect(() => {
    if (isOpen) {
      regenerate();
    }
  }, [isOpen, length, includeUpper, includeLower, includeNumbers, includeSymbols]);

  if (!isOpen) return null;

  const strength = calculatePasswordStrength(generatedPassword);

  const handleCopy = () => {
    if (!generatedPassword) return;
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGeneratePin = () => {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedPassword(pin);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-zinc-100 text-sm">
                পাসওয়ার্ড জেনারেটর (Password Generator)
              </h2>
              <p className="text-xs text-zinc-400">
                উচ্চ নিরাপত্তা বিশিষ্ট এনক্রিপ্টেড পাসওয়ার্ড তৈরি করুন
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

        <div className="p-5 space-y-5">
          {/* Output Display Box */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-base font-bold text-zinc-100 tracking-wider break-all select-all">
                {generatedPassword}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={regenerate}
                  className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                  title="নতুন পাসওয়ার্ড তৈরি করুন"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-2 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 transition-colors flex items-center gap-1 text-xs font-semibold"
                  title="কপি করুন"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'কপি হয়েছে' : 'কপি'}</span>
                </button>
              </div>
            </div>

            {/* Strength indicator */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-xs">
              <span className="text-zinc-500 text-[11px]">নিরাপত্তা স্তর:</span>
              <span
                className={`font-semibold uppercase text-[11px] ${
                  strength === 'strong'
                    ? 'text-emerald-400'
                    : strength === 'medium'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {strength === 'strong' ? '🛡️ Strong Security' : strength === 'medium' ? '⚠️ Medium' : 'Weak'}
              </span>
            </div>
          </div>

          {/* Sliders & Settings */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium text-zinc-300 mb-1.5">
                <span>দৈর্ঘ্য (Password Length):</span>
                <span className="font-mono font-bold text-teal-400">{length} অক্ষর</span>
              </div>
              <input
                type="range"
                min="8"
                max="32"
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
              <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                <span>8 chars</span>
                <span>16 chars</span>
                <span>32 chars</span>
              </div>
            </div>

            {/* Character types checkboxes */}
            <div className="grid grid-cols-2 gap-2.5">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800 cursor-pointer text-xs text-zinc-300 hover:bg-zinc-800/50">
                <input
                  type="checkbox"
                  checked={includeUpper}
                  onChange={(e) => setIncludeUpper(e.target.checked)}
                  className="rounded border-zinc-700 text-teal-500 focus:ring-teal-500/20 bg-zinc-900"
                />
                <span>বড় হাতের (A-Z)</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800 cursor-pointer text-xs text-zinc-300 hover:bg-zinc-800/50">
                <input
                  type="checkbox"
                  checked={includeLower}
                  onChange={(e) => setIncludeLower(e.target.checked)}
                  className="rounded border-zinc-700 text-teal-500 focus:ring-teal-500/20 bg-zinc-900"
                />
                <span>ছোট হাতের (a-z)</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800 cursor-pointer text-xs text-zinc-300 hover:bg-zinc-800/50">
                <input
                  type="checkbox"
                  checked={includeNumbers}
                  onChange={(e) => setIncludeNumbers(e.target.checked)}
                  className="rounded border-zinc-700 text-teal-500 focus:ring-teal-500/20 bg-zinc-900"
                />
                <span>সংখ্যা (0-9)</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800 cursor-pointer text-xs text-zinc-300 hover:bg-zinc-800/50">
                <input
                  type="checkbox"
                  checked={includeSymbols}
                  onChange={(e) => setIncludeSymbols(e.target.checked)}
                  className="rounded border-zinc-700 text-teal-500 focus:ring-teal-500/20 bg-zinc-900"
                />
                <span>চিহ্ন (!@#$%)</span>
              </label>
            </div>

            {/* Quick PIN Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleGeneratePin}
                className="w-full py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 border border-zinc-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>🔢 দ্রুত ৬-ডিজিট PIN তৈরি করুন (Generate 6-digit PIN)</span>
              </button>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              বন্ধ করুন (Close)
            </button>
            {onUsePassword && (
              <button
                type="button"
                onClick={() => {
                  onUsePassword(generatedPassword);
                  onClose();
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-zinc-950 shadow-md transition-all"
              >
                পাসওয়ার্ডটি ব্যবহার করুন
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
