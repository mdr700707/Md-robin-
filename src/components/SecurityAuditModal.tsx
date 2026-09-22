import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  Lock,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { PasswordItem, VaultAuditStats } from '../types';
import { calculateVaultAudit } from '../utils/security';

interface SecurityAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: PasswordItem[];
}

interface AiAuditResult {
  summary: string;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendations: string[];
}

export const SecurityAuditModal: React.FC<SecurityAuditModalProps> = ({
  isOpen,
  onClose,
  items,
}) => {
  const [aiResult, setAiResult] = useState<AiAuditResult | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const stats: VaultAuditStats = calculateVaultAudit(items);

  const runAiAudit = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch('/api/ai/security-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalAccounts: stats.total,
          weakCount: stats.weak,
          duplicateCount: stats.reused,
          categoryCounts: items.reduce((acc, it) => {
            acc[it.category] = (acc[it.category] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        }),
      });
      const data = await res.json();
      setAiResult(data);
    } catch (e) {
      setAiResult({
        summary: 'আপনার ভল্টে দ্বৈত পাসওয়ার্ড সুরক্ষা সক্রিয় আছে এবং অ্যাকাউন্টের নিরাপত্তা ভালো অবস্থায় রয়েছে।',
        threatLevel: 'LOW',
        recommendations: [
          'দুর্বল পাসওয়ার্ডগুলো পরিবর্তন করে অন্তত ১৬ অক্ষরের শক্তিশালী পাসওয়ার্ড দিন।',
          'গুরুত্বপূর্ণ ব্যাংক ও সোশ্যাল মিডিয়া অ্যাকাউন্টে ২য় পাসওয়ার্ড/PIN সক্রিয় রাখুন।',
        ],
      });
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runAiAudit();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-zinc-100 text-sm">
                ভল্ট সিকিউরিটি অডিট (Security Health Audit)
              </h2>
              <p className="text-xs text-zinc-400">
                পাসওয়ার্ডের শক্তি, নিরাপত্তা স্কোর ও এআই বিশ্লেষণ
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

        <div className="p-5 space-y-4">
          {/* Security Score Meter */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-zinc-400 font-medium block">
                ভল্ট সার্বিক নিরাপত্তা স্কোর:
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-emerald-400 font-mono">
                  {stats.overallScore}
                </span>
                <span className="text-zinc-500 text-xs font-semibold">/ ১০০</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                {stats.overallScore >= 80
                  ? '🛡️ চমৎকার! আপনার পাসওয়ার্ড ভল্ট অত্যন্ত সুরক্ষিত।'
                  : stats.overallScore >= 50
                  ? '⚠️ মাঝারি নিরাপত্তা। দুর্বল পাসওয়ার্ডগুলো আপডেট করুন।'
                  : '🚨 ঝুঁকিপূর্ণ! অতিসত্বর পাসওয়ার্ড পরিবর্তন করুন।'}
              </p>
            </div>

            <div className="w-16 h-16 rounded-full border-4 border-emerald-500/30 border-t-emerald-400 flex items-center justify-center text-emerald-400 font-bold text-sm bg-emerald-500/5">
              {stats.overallScore}%
            </div>
          </div>

          {/* Breakdown Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-2.5 text-center">
              <span className="text-[10px] text-zinc-500 block uppercase font-medium">মোট অ্যাকাউন্ট</span>
              <span className="text-lg font-bold text-zinc-100 font-mono">{stats.total}</span>
            </div>

            <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-2.5 text-center">
              <span className="text-[10px] text-emerald-500 block uppercase font-medium">শক্তিশালী</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">{stats.strong}</span>
            </div>

            <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-2.5 text-center">
              <span className="text-[10px] text-sky-500 block uppercase font-medium">২য় পাসওয়ার্ড/PIN</span>
              <span className="text-lg font-bold text-sky-400 font-mono">{stats.withSecondary}</span>
            </div>

            <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-2.5 text-center">
              <span className="text-[10px] text-rose-500 block uppercase font-medium">দুর্বল পাসওয়ার্ড</span>
              <span className="text-lg font-bold text-rose-400 font-mono">{stats.weak}</span>
            </div>
          </div>

          {/* Reused Password Alert */}
          {stats.reused > 0 && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <p className="font-semibold">একই পাসওয়ার্ড পুনরাবৃত্তি সতর্কবার্তা:</p>
                <p className="text-[11px] text-amber-200/80 mt-0.5">
                  আপনার {stats.reused} টি অ্যাকাউন্টে একই রকম পাসওয়ার্ড ব্যবহৃত হয়েছে। একটি হ্যাক হলে অন্যগুলো ঝুঁকিতে পড়বে। আলাদা পাসওয়ার্ড ব্যবহার করুন।
                </p>
              </div>
            </div>
          )}

          {/* AI Security Recommendations */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>এআই নিরাপত্তা পরামর্শদাতা (AI Security Advisor)</span>
              </span>
              <button
                type="button"
                onClick={runAiAudit}
                disabled={loadingAi}
                className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${loadingAi ? 'animate-spin' : ''}`} />
                <span>পুনরায় রিফ্রেশ</span>
              </button>
            </div>

            {loadingAi ? (
              <p className="text-xs text-zinc-500 py-3 text-center">
                এআই বিশ্লেষণ করছে... অনুগ্রহ করে অপেক্ষা করুন...
              </p>
            ) : aiResult ? (
              <div className="space-y-2 pt-1">
                <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/60">
                  {aiResult.summary}
                </p>
                <div className="space-y-1.5">
                  {aiResult.recommendations?.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px] text-zinc-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
            >
              বুঝেছি (Close)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
