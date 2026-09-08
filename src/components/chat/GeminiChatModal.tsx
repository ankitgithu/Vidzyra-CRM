import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Trash2, Bot, User, Loader2 } from 'lucide-react';
import Markdown from 'react-markdown';
import { useCrm } from '../../context/CrmContext';
import { buildCrmContextSnapshot } from '../../utils/crmAiContext';

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

interface GeminiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GeminiChatModal: React.FC<GeminiChatModalProps> = ({ isOpen, onClose }) => {
  const crm = useCrm();
  const [messages, setMessages] = useState<ChatMessageItem[]>(() => {
    // Optionally restore recent session from session storage
    try {
      const saved = sessionStorage.getItem('vidzyra_gemini_chat_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Save conversation in session
  useEffect(() => {
    try {
      sessionStorage.setItem('vidzyra_gemini_chat_history', JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClearHistory = () => {
    setMessages([]);
    setErrorNotice(null);
    try {
      sessionStorage.removeItem('vidzyra_gemini_chat_history');
    } catch {
      // ignore
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputQuery.trim();
    if (!trimmed || isLoading) return;

    setErrorNotice(null);

    const userMessage: ChatMessageItem = {
      id: 'msg-' + Date.now() + '-user',
      role: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputQuery('');
    setIsLoading(true);

    try {
      // Prepare real-time CRM context snapshot
      const crmSnapshot = buildCrmContextSnapshot(crm);

      // Prepare history for API
      const apiHistory = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmed,
          history: apiHistory,
          crmContext: crmSnapshot,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to fetch response from Gemini');
      }

      const modelMessage: ChatMessageItem = {
        id: 'msg-' + Date.now() + '-model',
        role: 'model',
        text: data.reply || 'No response generated.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages([...newMessages, modelMessage]);
    } catch (err: any) {
      console.error('Gemini chat error:', err);
      setErrorNotice(err?.message || 'Failed to contact Gemini AI. Please check server logs.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div
      id="gemini-chat-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="gemini-chat-modal"
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl h-[85vh] max-h-[720px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Chat Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 leading-none">
                  Gemini CRM AI
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live CRM Context
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Dynamic CRM intelligence & message generator
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {messages.length > 0 && (
              <button
                id="gemini-chat-clear-btn"
                type="button"
                onClick={handleClearHistory}
                title="Clear Chat History"
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              id="gemini-chat-close-btn"
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Messages Body */}
        <div
          id="gemini-chat-messages"
          className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50"
        >
          {/* Empty Message Area When New */}
          {messages.length === 0 && (
            <div
              id="gemini-chat-empty-state"
              className="h-full flex flex-col items-center justify-center text-center p-6"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3 shadow-xs">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">
                Gemini CRM Assistant
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
                Ask any question or request a message draft. Gemini analyzes your live CRM data dynamically.
              </p>
            </div>
          )}

          {/* Conversation History */}
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 items-start ${
                  isUser ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-1 shadow-xs ${
                    isUser
                      ? 'bg-slate-800 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {isUser ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>

                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-slate-900 text-white rounded-tr-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                  }`}
                >
                  {isUser ? (
                    <div className="whitespace-pre-wrap font-medium">{msg.text}</div>
                  ) : (
                    <div className="markdown-body space-y-2 prose-xs prose-slate">
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  )}

                  <div
                    className={`mt-1.5 text-[10px] ${
                      isUser ? 'text-slate-400 text-right' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-3 text-xs text-slate-600 shadow-xs flex items-center gap-2.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>Gemini is analyzing live CRM data...</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorNotice && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {errorNotice}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input & Send Button */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2.5">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                id="gemini-chat-input"
                rows={1}
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your CRM..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none transition"
              />
            </div>

            <button
              id="gemini-chat-send-btn"
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              className="h-11 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition shrink-0 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
