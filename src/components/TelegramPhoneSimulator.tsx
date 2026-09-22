import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  Lock,
  Unlock,
  Eye,
  Key,
  Smartphone,
  ChevronLeft,
  MoreVertical,
  Radio,
} from 'lucide-react';
import { PasswordItem } from '../types';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  reply_markup?: {
    inline_keyboard?: Array<Array<{ text: string; callback_data: string }>>;
  };
}

interface TelegramPhoneSimulatorProps {
  vaultItems: PasswordItem[];
  onOpenAdminModal: () => void;
  isRealBotRunning: boolean;
  onRefreshVault: () => void;
}

export const TelegramPhoneSimulator: React.FC<TelegramPhoneSimulatorProps> = ({
  vaultItems,
  onOpenAdminModal,
  isRealBotRunning,
  onRefreshVault,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-init-1',
      sender: 'bot',
      text:
        `👋 <b>VaultGuard সাইবার পাসওয়ার্ড ম্যানেজার বটে স্বাগতম!</b>\n\n` +
        `বটের সমস্ত কাজ করার জন্য নিচে <b>বড় বাটনগুলো</b> দেওয়া হয়েছে। কোনো কমান্ড মুখস্থ বা টাইপ করার দরকার নেই!\n\n` +
        `• <b>📂 সংরক্ষিত পাসওয়ার্ড</b> — সমস্ত অ্যাপ ও লুকানো পাসওয়ার্ড দেখতে\n` +
        `• <b>➕ নতুন পাসওয়ার্ড যোগ</b> — ধাপে ধাপে পাসওয়ার্ড সেভ করতে\n` +
        `• <b>🎲 পাসওয়ার্ড জেনারেটর</b> — জটিল ১৬ অক্ষরের পাসওয়ার্ড তৈরি করতে\n` +
        `• <b>🔢 ইনস্ট্যান্ট PIN</b> — ৬-সংখ্যার সিকিউরিটি পিন পেতে\n\n` +
        `<i>👇 নিচের বাটনগুলোতে ট্যাপ করে এখনি পরীক্ষা করুন:</i>`,
      timestamp: '১২:০০ PM',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📂 সংরক্ষিত পাসওয়ার্ড দেখুন', callback_data: 'refresh_apps' },
            { text: '➕ নতুন পাসওয়ার্ড যোগ', callback_data: 'start_add' },
          ],
        ],
      },
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isBotUnlocked, setIsBotUnlocked] = useState(true);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({});
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendText = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/telegram/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSend,
          fromUser: 'TesterUser',
        }),
      });
      const data = await res.json();
      setIsTyping(false);

      if (data.isUnlocked !== undefined) {
        setIsBotUnlocked(data.isUnlocked);
      }

      if (data.ok && data.result) {
        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: data.result.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          reply_markup: data.result.reply_markup,
        };
        setMessages((prev) => [...prev, botMsg]);
        onRefreshVault();
      }
    } catch (e) {
      setIsTyping(false);
    }
  };

  const handleInlineCallback = async (callbackData: string) => {
    setIsTyping(true);

    try {
      const res = await fetch('/api/telegram/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callbackData,
          fromUser: 'TesterUser',
        }),
      });
      const data = await res.json();
      setIsTyping(false);

      if (data.isUnlocked !== undefined) {
        setIsBotUnlocked(data.isUnlocked);
      }

      if (data.ok && data.result) {
        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: data.result.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          reply_markup: data.result.reply_markup,
        };
        setMessages((prev) => [...prev, botMsg]);
        onRefreshVault();
      }
    } catch (e) {
      setIsTyping(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `msg-reset-${Date.now()}`,
        sender: 'bot',
        text: `🔄 চ্যাট রিসেট করা হয়েছে। শুরু করতে নিচের বাটন চাপুন 👇`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const copyToClipboard = (txt: string, label: string) => {
    navigator.clipboard.writeText(txt);
    setCopiedNotice(`${label} কপি করা হয়েছে!`);
    setTimeout(() => setCopiedNotice(null), 2000);
  };

  // Render HTML content safely with spoiler tap logic
  const renderMessageContent = (htmlText: string, msgId: string) => {
    // Check if contains spoiler
    const spoilerRegex = /<tg-spoiler>(.*?)<\/tg-spoiler>/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    let indexCount = 0;
    while ((match = spoilerRegex.exec(htmlText)) !== null) {
      const textBefore = htmlText.substring(lastIndex, match.index);
      if (textBefore) {
        parts.push(
          <span
            key={`tb-${indexCount}`}
            dangerouslySetInnerHTML={{ __html: textBefore }}
          />
        );
      }

      const spoilerContent = match[1];
      const spoilerKey = `${msgId}-${indexCount}`;
      const isRevealed = Boolean(revealedSpoilers[spoilerKey]);

      parts.push(
        <span
          key={`sp-${indexCount}`}
          onClick={() => {
            setRevealedSpoilers((prev) => ({
              ...prev,
              [spoilerKey]: !prev[spoilerKey],
            }));
          }}
          className={`cursor-pointer inline-block px-2.5 py-0.5 my-0.5 rounded font-mono text-xs select-none transition-all ${
            isRevealed
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
              : 'bg-zinc-800 text-transparent hover:bg-zinc-700 border border-zinc-700'
          }`}
          title="পাসওয়ার্ড দেখতে ট্যাপ করুন (Tap to reveal)"
        >
          {isRevealed ? spoilerContent : '••••••••••••'}
        </span>
      );

      lastIndex = spoilerRegex.lastIndex;
      indexCount++;
    }

    const remaining = htmlText.substring(lastIndex);
    if (remaining) {
      parts.push(
        <span
          key={`rem-${indexCount}`}
          dangerouslySetInnerHTML={{ __html: remaining }}
        />
      );
    }

    return parts;
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Copied Notice Banner */}
      {copiedNotice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-zinc-900 border border-emerald-500 text-emerald-300 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{copiedNotice}</span>
        </div>
      )}

      {/* Intro info bar */}
      <div className="w-full max-w-md mb-4 p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-xs flex items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2 text-zinc-300">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-semibold text-zinc-200">লাইভ টেলিগ্রাম বট সিমুলেটর</span>
        </div>

        <button
          type="button"
          onClick={onOpenAdminModal}
          className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-[11px] font-medium flex items-center gap-1 transition-colors"
        >
          <Bot className="w-3.5 h-3.5" />
          <span>{isRealBotRunning ? 'আসল বট চলছে' : 'আসল বটে কানেক্ট'}</span>
        </button>
      </div>

      {/* SMARTPHONE FRAME CONTAINER */}
      <div className="w-full max-w-md h-[680px] bg-zinc-950 rounded-[40px] border-4 border-zinc-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col relative">
        {/* Dynamic Island / Speaker notch */}
        <div className="w-full bg-zinc-900 pt-2 pb-1.5 flex justify-center items-center z-20">
          <div className="w-24 h-4 bg-zinc-950 rounded-full flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-800 mr-2" />
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
          </div>
        </div>

        {/* Telegram Chat Header */}
        <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleResetChat}
              className="text-zinc-400 hover:text-zinc-200 p-1 rounded-lg"
              title="রিসেট"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center text-zinc-950 shadow">
                <Bot className="w-5 h-5" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-zinc-900" />
            </div>

            <div>
              <div className="flex items-center gap-1">
                <h4 className="text-xs font-bold text-zinc-100">VaultGuard Bot</h4>
                <span className="w-3.5 h-3.5 rounded-full bg-sky-500 flex items-center justify-center text-[9px] text-zinc-950 font-bold">
                  ✓
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                  <span>bot • অনলাইন</span>
                </p>
                {isBotUnlocked ? (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5 font-medium">
                    <Unlock className="w-2.5 h-2.5 text-emerald-400" />
                    <span>আনলকড</span>
                  </span>
                ) : (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5 font-medium">
                    <Lock className="w-2.5 h-2.5 text-amber-400" />
                    <span>লকড (PIN প্রয়োজন)</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onOpenAdminModal}
              className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg text-xs"
              title="বট সেটিংস"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Telegram Message Thread Area */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#0d141b] bg-opacity-95 scrollbar-thin">
          <div className="text-center my-1">
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-[10px] text-zinc-400">
              আজ, টেলিগ্রাম সিকিউর এনক্রিপশন
            </span>
          </div>

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-sky-600 text-white rounded-br-none'
                    : 'bg-zinc-800/90 border border-zinc-700/60 text-zinc-200 rounded-bl-none'
                }`}
              >
                {/* Message Body */}
                <div className="space-y-1.5 leading-relaxed font-sans">
                  {renderMessageContent(msg.text, msg.id)}
                </div>

                <div className="text-[9px] text-right mt-1.5 opacity-60">
                  {msg.timestamp}
                </div>
              </div>

              {/* INLINE BUTTONS (if attached to message) */}
              {msg.reply_markup?.inline_keyboard && (
                <div className="w-[85%] mt-1.5 space-y-1">
                  {msg.reply_markup.inline_keyboard.map((row, rIdx) => (
                    <div key={rIdx} className="grid grid-cols-2 gap-1">
                      {row.map((btn, bIdx) => (
                        <button
                          key={bIdx}
                          type="button"
                          onClick={() => handleInlineCallback(btn.callback_data)}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-medium border text-center transition-all active:scale-95 shadow-sm truncate ${
                            row.length === 1 ? 'col-span-2' : ''
                          } ${
                            btn.callback_data.includes('del')
                              ? 'bg-rose-950/40 border-rose-500/40 text-rose-300 hover:bg-rose-900/60'
                              : 'bg-zinc-800/95 border-zinc-700 text-sky-300 hover:bg-zinc-700 hover:border-sky-500/50'
                          }`}
                        >
                          {btn.text}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 bg-zinc-800/60 px-3 py-1.5 rounded-full w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1 text-[10px] text-zinc-400">VaultGuard টাইপ করছে...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT FIELD BAR */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendText(inputVal);
          }}
          className="bg-zinc-900/95 border-t border-zinc-800/80 px-3 py-2 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="মেসেজ লিখুন বা নিচের বাটন চাপুন..."
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-sky-500"
          />
          <button
            type="submit"
            disabled={!inputVal.trim()}
            className="w-8 h-8 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-zinc-950 flex items-center justify-center transition-all shrink-0 shadow"
          >
            <Send className="w-3.5 h-3.5 fill-current" />
          </button>
        </form>

        {/* PERSISTENT BOTTOM KEYBOARD BUTTONS ("নিচ দিয়ে বাটন দিয়ে উপরে সরাসরি বাটন গুলো নিচে যেন থাকে") */}
        <div className="bg-zinc-900 border-t-2 border-zinc-800/90 p-2 shrink-0 shadow-2xl">
          <div className="text-[10px] text-center font-medium text-zinc-400 mb-1.5 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>টেলিগ্রাম বট কুইক বাটন (এক ট্যাপে কাজ করুন)</span>
          </div>

          {isBotUnlocked ? (
            /* UNLOCKED KEYBOARD */
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleSendText('📂 সংরক্ষিত পাসওয়ার্ড')}
                className="py-2.5 px-3 rounded-xl bg-sky-950/40 hover:bg-sky-900/60 active:scale-95 border border-sky-500/40 text-xs font-semibold text-sky-200 flex items-center justify-center gap-1.5 shadow-sm transition-all text-left"
              >
                <span>📂</span>
                <span className="truncate">সংরক্ষিত পাসওয়ার্ড</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendText('➕ নতুন পাসওয়ার্ড যোগ')}
                className="py-2.5 px-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 active:scale-95 border border-emerald-500/40 text-xs font-semibold text-emerald-300 flex items-center justify-center gap-1.5 shadow-sm transition-all text-left"
              >
                <span>➕</span>
                <span className="truncate">নতুন যোগ করুন</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendText('🗑️ পাসওয়ার্ড মুছুন')}
                className="py-2 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 active:scale-95 border border-rose-500/40 text-xs font-semibold text-rose-300 flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <span>🗑️</span>
                <span className="truncate">পাসওয়ার্ড মুছুন</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendText('🎲 পাসওয়ার্ড জেনারেটর')}
                className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 border border-zinc-700/80 text-xs font-medium text-zinc-200 flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <span>🎲</span>
                <span className="truncate">পাসওয়ার্ড জেনারেট</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendText('🔢 ইনস্ট্যান্ট ৬-ডিজিট PIN')}
                className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 border border-zinc-700/80 text-xs font-medium text-zinc-200 flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <span>🔢</span>
                <span className="truncate">৬-ডিজিট PIN</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendText('🛡️ সিকিউরিটি ভল্ট')}
                className="py-2 px-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 active:scale-95 border border-zinc-700/80 text-[11px] font-medium text-zinc-300 flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <span>🛡️</span>
                <span className="truncate">সিকিউরিটি ভল্ট</span>
              </button>
            </div>
          ) : (
            /* LOCKED KEYBOARD */
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleSendText('1234')}
                className="py-2.5 px-3 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/70 active:scale-95 border border-emerald-500/60 text-xs font-semibold text-emerald-300 flex items-center justify-center gap-1.5 shadow-sm transition-all text-left"
              >
                <span>🔑</span>
                <span className="truncate">আনলক করুন (PIN: 1234)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendText('📂 সংরক্ষিত পাসওয়ার্ড')}
                className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 border border-zinc-700/80 text-xs font-semibold text-zinc-400 flex items-center justify-center gap-1.5 shadow-sm transition-all text-left"
              >
                <span>📂</span>
                <span className="truncate">পাসওয়ার্ড তালিকা (🔒)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendText('🗑️ পাসওয়ার্ড মুছুন')}
                className="py-2 px-3 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 active:scale-95 border border-rose-500/30 text-xs font-medium text-rose-300 flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <span>🗑️</span>
                <span className="truncate">পাসওয়ার্ড মুছুন</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendText('🎲 পাসওয়ার্ড জেনারেটর')}
                className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 border border-zinc-700/80 text-xs font-medium text-zinc-200 flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <span>🎲</span>
                <span className="truncate">পাসওয়ার্ড জেনারেট</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendText('🔢 ইনস্ট্যান্ট ৬-ডিজিট PIN')}
                className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 border border-zinc-700/80 text-xs font-medium text-zinc-200 flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <span>🔢</span>
                <span className="truncate">৬-ডিজিট PIN</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendText('ℹ️ বট হেল্প & তথ্য')}
                className="py-2 px-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 active:scale-95 border border-zinc-700/80 text-[11px] font-medium text-zinc-300 flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <span>ℹ️</span>
                <span className="truncate">বট হেল্প & তথ্য</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
