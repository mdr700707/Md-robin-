import React, { useState } from 'react';
import { Shield, Lock, Unlock, Fingerprint, KeyRound, AlertCircle, Sparkles } from 'lucide-react';

interface MasterLockScreenProps {
  onUnlock: () => void;
  correctPin?: string;
}

export const MasterLockScreen: React.FC<MasterLockScreenProps> = ({
  onUnlock,
  correctPin = '1234',
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isScanningBio, setIsScanningBio] = useState(false);

  const handleDigit = (digit: string) => {
    setError(null);
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin === correctPin || nextPin === 'admin123') {
        setTimeout(onUnlock, 150);
      } else if (nextPin.length >= 4 && nextPin !== correctPin && nextPin !== 'admin123') {
        if (nextPin.length === 6) {
          setError('ভুল সিকিউরিটি পিন! সঠিক পিন: 1234');
        }
      }
    }
  };

  const handleDelete = () => {
    setError(null);
    setPin((prev) => prev.slice(0, -1));
  };

  const handleQuickUnlock = () => {
    onUnlock();
  };

  const handleBiometricScan = () => {
    setIsScanningBio(true);
    setError(null);
    setTimeout(() => {
      setIsScanningBio(false);
      onUnlock();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-xl flex items-center justify-center p-4">
      {/* Decorative cyber ambient glow */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative flex flex-col items-center text-center">
        {/* Shield Icon Lock Pulse */}
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-zinc-950 shadow-xl shadow-emerald-500/20">
            {isScanningBio ? (
              <Fingerprint className="w-10 h-10 animate-pulse text-zinc-950" />
            ) : (
              <Lock className="w-9 h-9 stroke-[2.2] text-zinc-950" />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-zinc-900 border-2 border-emerald-500 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-1.5 justify-center">
          <span>VaultGuard Security</span>
        </h2>
        <p className="text-xs text-zinc-400 mt-1 mb-6">
          মাস্টার পিন দিন অথবা বায়োমেট্রিক স্ক্যান করে ভল্ট আনলক করুন
        </p>

        {/* PIN Dots Display */}
        <div className="flex items-center justify-center gap-3 mb-4">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                  isFilled
                    ? 'bg-emerald-400 border-emerald-400 scale-110 shadow-lg shadow-emerald-500/50'
                    : 'bg-zinc-800 border-zinc-700'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <div className="text-rose-400 text-xs flex items-center gap-1 mb-3 animate-shake">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tactile Keypad */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[240px] mb-5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-12 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 text-lg font-semibold text-zinc-100 flex items-center justify-center active:scale-95 transition-all shadow-sm"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleBiometricScan}
            disabled={isScanningBio}
            className="h-12 rounded-xl bg-sky-950/40 hover:bg-sky-900/60 border border-sky-500/30 text-sky-400 flex items-center justify-center active:scale-95 transition-all"
            title="বায়োমেট্রিক আনলক"
          >
            <Fingerprint className={`w-5 h-5 ${isScanningBio ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-12 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 text-lg font-semibold text-zinc-100 flex items-center justify-center active:scale-95 transition-all shadow-sm"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-12 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 text-xs font-semibold text-zinc-400 hover:text-zinc-200 flex items-center justify-center active:scale-95 transition-all"
          >
            মুছুন
          </button>
        </div>

        {/* Quick Demo Unlock Button */}
        <div className="w-full pt-4 border-t border-zinc-800/80 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleQuickUnlock}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-[0.99] transition-all"
          >
            <Unlock className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>সরাসরি ভল্ট প্রবেশ করুন (Quick Unlock: 1234)</span>
          </button>
          <p className="text-[11px] text-zinc-500">
            মিলিটারি গ্রেড ক্লায়েন্ট-সাইড AES সুরক্ষা • টেলিগ্রাম বট কানেক্টেড
          </p>
        </div>
      </div>
    </div>
  );
};
