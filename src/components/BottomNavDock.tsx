import React from 'react';
import {
  FolderLock,
  Plus,
  Bot,
  Key,
  ShieldCheck,
  Settings,
  Lock,
  Sparkles,
} from 'lucide-react';

export type ActiveTab = 'vault' | 'telegram' | 'audit' | 'settings';

interface BottomNavDockProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenAddModal: () => void;
  onOpenGeneratorModal: () => void;
  onLockVault: () => void;
  totalItems: number;
  isBotRunning: boolean;
}

export const BottomNavDock: React.FC<BottomNavDockProps> = ({
  activeTab,
  onTabChange,
  onOpenAddModal,
  onOpenGeneratorModal,
  onLockVault,
  totalItems,
  isBotRunning,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-2 sm:p-3 pointer-events-none flex justify-center">
      <nav
        aria-label="Bottom Navigation Controls"
        className="pointer-events-auto bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/90 rounded-2xl sm:rounded-full px-3 py-2 shadow-2xl shadow-black/80 flex items-center gap-1 sm:gap-2 max-w-2xl w-full justify-between sm:justify-center"
      >
        {/* Tab 1: Vault items */}
        <button
          type="button"
          onClick={() => onTabChange('vault')}
          className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 px-3 py-1.5 rounded-xl sm:rounded-full text-xs font-semibold transition-all ${
            activeTab === 'vault'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <FolderLock className="w-4 h-4 shrink-0" />
          <span className="text-[11px] sm:text-xs">ভল্ট ({totalItems})</span>
        </button>

        {/* Tab 2: Telegram Bot Simulator & Live */}
        <button
          type="button"
          onClick={() => onTabChange('telegram')}
          className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 px-3 py-1.5 rounded-xl sm:rounded-full text-xs font-semibold transition-all relative ${
            activeTab === 'telegram'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Bot className="w-4 h-4 shrink-0 text-sky-400" />
          <span className="text-[11px] sm:text-xs">টেলিগ্রাম বট</span>
          {isBotRunning && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 border border-zinc-900 absolute top-1 right-1 sm:static sm:ml-0.5 animate-pulse" />
          )}
        </button>

        {/* Center Primary Action: Add Credential (High contrast) */}
        <button
          type="button"
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl sm:rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 text-xs font-bold shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span className="hidden xs:inline">নতুন যোগ</span>
        </button>

        {/* Action: Key Generator Modal */}
        <button
          type="button"
          onClick={onOpenGeneratorModal}
          className="flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 px-3 py-1.5 rounded-xl sm:rounded-full text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-all"
        >
          <Key className="w-4 h-4 shrink-0 text-amber-400" />
          <span className="text-[11px] sm:text-xs">পাসওয়ার্ড জেন</span>
        </button>

        {/* Tab 3: Security Health Audit */}
        <button
          type="button"
          onClick={() => onTabChange('audit')}
          className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 px-3 py-1.5 rounded-xl sm:rounded-full text-xs font-semibold transition-all ${
            activeTab === 'audit'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4 shrink-0 text-purple-400" />
          <span className="text-[11px] sm:text-xs">অডিট</span>
        </button>

        {/* Tab 4: Settings & Master Admin */}
        <button
          type="button"
          onClick={() => onTabChange('settings')}
          className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 px-3 py-1.5 rounded-xl sm:rounded-full text-xs font-semibold transition-all ${
            activeTab === 'settings'
              ? 'bg-zinc-800 text-zinc-200 border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span className="text-[11px] sm:text-xs">এডমিন</span>
        </button>

        {/* Quick Lock Now button */}
        <button
          type="button"
          onClick={onLockVault}
          className="p-2 rounded-xl sm:rounded-full text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition-all"
          title="ভল্ট লক করুন (Lock Security Vault)"
        >
          <Lock className="w-4 h-4" />
        </button>
      </nav>
    </div>
  );
};
