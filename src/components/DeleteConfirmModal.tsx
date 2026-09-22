import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { PasswordItem } from '../types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  item: PasswordItem | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  item,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning Icon Badge */}
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 shadow-inner">
          <Trash2 className="w-7 h-7 stroke-[2.2]" />
        </div>

        <h3 className="text-lg font-bold text-zinc-100">
          অ্যাকাউন্ট মুছে ফেলা নিশ্চিত করুন
        </h3>

        <div className="mt-2 text-xs text-zinc-400 leading-relaxed">
          আপনি কি নিশ্চিত যে আপনি ভল্ট থেকে নিচের অ্যাকাউন্টটি মুছে ফেলতে চান?
        </div>

        {/* Targeted Item Preview Box */}
        <div className="mt-3.5 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/90 flex items-center justify-between">
          <div className="overflow-hidden">
            <span className="text-sm font-semibold text-zinc-100 block truncate">
              {item.appName}
            </span>
            <span className="text-xs text-zinc-400 font-mono block truncate mt-0.5">
              {item.username}
            </span>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-rose-950/50 border border-rose-500/30 text-rose-300 font-medium">
            স্থায়ী রিমুভ
          </span>
        </div>

        <p className="mt-3 text-[11px] text-zinc-500">
          ⚠️ একবার মুছে ফেললে ১ম ও ২য় পাসওয়ার্ড এবং নোট আর ফেরত পাওয়া যাবে না।
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            বাতিল করুন
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{isDeleting ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, মুছে ফেলুন'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
