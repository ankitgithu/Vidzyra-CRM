import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Copy,
  Check,
  Send,
  X,
  CreditCard,
  Video,
  CheckCircle2,
  Phone,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Client } from '../../types';
import { formatINR } from '../../utils/currencyUtils';

interface QuickMessageModalProps {
  client: Client;
  stats: {
    totalWork: number;
    completed: number;
    pending: number;
    totalBilling: number;
    totalPaid: number;
    remaining: number;
    paymentStatus: 'Paid' | 'Partial' | 'Pending';
  };
  onClose: () => void;
}

interface QuickMessageItem {
  id: string;
  category: 'video' | 'payment';
  iconEmoji: string;
  title: string;
  messageText: string;
  badge?: string;
  badgeColor?: string;
}

export const QuickMessageModal: React.FC<QuickMessageModalProps> = ({
  client,
  stats,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'video' | 'payment'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<string>('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Dynamic calculations from existing client payment stats
  const totalPayment = stats.totalBilling ?? 0;
  const receivedPayment = stats.totalPaid ?? 0;
  const remainingPayment = stats.remaining ?? Math.max(0, totalPayment - receivedPayment);
  const isFullyPaid = remainingPayment <= 0;

  // Build the 10 standard messages
  const messageItems: QuickMessageItem[] = [
    // Video Messages
    {
      id: 'vid-final-upload',
      category: 'video',
      iconEmoji: '🎬',
      title: 'Final Videos Uploaded on Drive — Please Check',
      messageText: '🎬 Final Videos Uploaded on Drive — Please Check',
    },
    {
      id: 'vid-feedback',
      category: 'video',
      iconEmoji: '💬',
      title: 'Please Check the Video and Share Your Feedback',
      messageText: '💬 Please Check the Video and Share Your Feedback',
    },
    {
      id: 'vid-confirm',
      category: 'video',
      iconEmoji: '✓',
      title: 'Please Confirm the Video',
      messageText: '✓ Please Confirm the Video',
    },
    {
      id: 'vid-revision',
      category: 'video',
      iconEmoji: '🔄',
      title: 'Revision Completed — Please Check',
      messageText: '🔄 Revision Completed — Please Check',
    },

    // Payment Messages
    {
      id: 'pay-complete-remaining',
      category: 'payment',
      iconEmoji: '💰',
      title: isFullyPaid
        ? 'Payment Fully Received'
        : `Please Complete the Remaining Payment of ${formatINR(remainingPayment)}.`,
      messageText: isFullyPaid
        ? '💰 Payment Fully Received'
        : `💰 Please Complete the Remaining Payment of ${formatINR(remainingPayment)}.`,
      badge: isFullyPaid ? 'Settled' : 'Pending Due',
      badgeColor: isFullyPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800',
    },
    {
      id: 'pay-received',
      category: 'payment',
      iconEmoji: '💰',
      title: 'Payment Received',
      messageText: '💰 Payment Received',
      badge: 'Receipt',
      badgeColor: 'bg-emerald-50 text-emerald-700',
    },
    {
      id: 'pay-screenshot',
      category: 'payment',
      iconEmoji: '📸',
      title: 'Please Share the Payment Screenshot',
      messageText: '📸 Please Share the Payment Screenshot',
      badge: 'Verification',
      badgeColor: 'bg-amber-50 text-amber-700',
    },
    {
      id: 'pay-total',
      category: 'payment',
      iconEmoji: '💵',
      title: `Total Payment: ${formatINR(totalPayment)}`,
      messageText: `💵 Total Payment: ${formatINR(totalPayment)}`,
    },
    {
      id: 'pay-received-amt',
      category: 'payment',
      iconEmoji: '💵',
      title: `Received Payment: ${formatINR(receivedPayment)}`,
      messageText: `💵 Received Payment: ${formatINR(receivedPayment)}`,
    },
    {
      id: 'pay-remaining-amt',
      category: 'payment',
      iconEmoji: '💵',
      title: isFullyPaid ? 'Payment Fully Received' : `Remaining Payment: ${formatINR(remainingPayment)}`,
      messageText: isFullyPaid ? '💵 Payment Fully Received' : `💵 Remaining Payment: ${formatINR(remainingPayment)}`,
      badge: isFullyPaid ? 'Paid' : 'Due',
      badgeColor: isFullyPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800',
    },
  ];

  // Set default selected message
  useEffect(() => {
    if (!selectedMessage && messageItems.length > 0) {
      setSelectedMessage(messageItems[0].messageText);
    }
  }, []);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Clean phone number for WhatsApp
  const rawPhone = (client.whatsapp || client.phone || '').trim();
  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
  const phoneWithCountryCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  // Copy handler
  const handleCopy = (text: string, id?: string) => {
    navigator.clipboard.writeText(text);
    if (id) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2200);
    }
    setCopyFeedback(`Copied to clipboard!`);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  // WhatsApp sender
  const handleSendWhatsApp = (text: string) => {
    const waUrl = phoneWithCountryCode
      ? `https://wa.me/${phoneWithCountryCode}?text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  // Filter items by category
  const filteredItems = messageItems.filter((item) => {
    if (activeTab === 'all') return true;
    return item.category === activeTab;
  });

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-linear-to-r from-slate-50 to-white flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900">
                  Quick Message — <span className="text-indigo-600">{client.name}</span>
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                {rawPhone ? (
                  <span className="flex items-center gap-1 font-medium text-slate-600">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {rawPhone}
                  </span>
                ) : (
                  <span>No phone recorded</span>
                )}
                <span>•</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                    stats.paymentStatus === 'Paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : stats.paymentStatus === 'Partial'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {stats.paymentStatus}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Client Ledger Summary Bar */}
        <div className="px-5 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs gap-2 flex-wrap">
          <div className="flex items-center gap-4 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">Total Payment</span>
              <span className="font-bold text-slate-800">{formatINR(totalPayment)}</span>
            </div>
            <div className="h-5 w-px bg-slate-200" />
            <div>
              <span className="text-slate-400 block text-[10px]">Received</span>
              <span className="font-bold text-emerald-600">{formatINR(receivedPayment)}</span>
            </div>
            <div className="h-5 w-px bg-slate-200" />
            <div>
              <span className="text-slate-400 block text-[10px]">Remaining</span>
              <span className={`font-bold ${isFullyPaid ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isFullyPaid ? '₹0 (Paid)' : formatINR(remainingPayment)}
              </span>
            </div>
          </div>

          {/* Toast alert indicator */}
          {copyFeedback && (
            <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md text-[11px] font-semibold border border-emerald-200 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {copyFeedback}
            </div>
          )}
        </div>

        {/* Category Tabs */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-100 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Messages ({messageItems.length})
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'video'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🎬 Video (4)
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'payment'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            💰 Payment (6)
          </button>
        </div>

        {/* Message Options List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredItems.map((item) => {
            const isSelected = selectedMessage === item.messageText;
            const isItemCopied = copiedId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedMessage(item.messageText);
                  handleCopy(item.messageText, item.id);
                }}
                className={`group flex items-center justify-between gap-3 p-3 rounded-xl border text-xs cursor-pointer transition select-none ${
                  isSelected
                    ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {/* Left: Emoji + Message Text */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="text-base shrink-0 leading-none">{item.iconEmoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 group-hover:text-indigo-950 truncate">
                        {item.title}
                      </span>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                            item.badgeColor || 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Actions: Quick Copy + WhatsApp Direct */}
                <div
                  className="flex items-center gap-1 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Copy Button */}
                  <button
                    onClick={() => {
                      setSelectedMessage(item.messageText);
                      handleCopy(item.messageText, item.id);
                    }}
                    title="Copy message"
                    className={`p-1.5 rounded-lg border transition ${
                      isItemCopied
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 hover:text-indigo-600 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50'
                    }`}
                  >
                    {isItemCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  {/* Send to WhatsApp */}
                  <button
                    onClick={() => {
                      setSelectedMessage(item.messageText);
                      handleSendWhatsApp(item.messageText);
                    }}
                    title={rawPhone ? `Send to ${rawPhone} via WhatsApp` : 'Open WhatsApp'}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-emerald-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Message Composer & Action Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Selected Message (tap any option above or customize below):</span>
            <span className="text-[10px] text-slate-400">Ready to copy or send</span>
          </div>

          <textarea
            value={selectedMessage}
            onChange={(e) => setSelectedMessage(e.target.value)}
            rows={2}
            className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none font-medium leading-relaxed"
            placeholder="Type or select a quick message..."
          />

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-xl transition"
            >
              Close
            </button>

            <div className="flex items-center gap-2">
              {/* Copy Selected Button */}
              <button
                type="button"
                onClick={() => handleCopy(selectedMessage)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition shadow-2xs"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy
              </button>

              {/* WhatsApp Button */}
              <button
                type="button"
                onClick={() => handleSendWhatsApp(selectedMessage)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                Send via WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
