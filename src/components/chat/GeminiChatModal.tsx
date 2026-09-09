import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Trash2, Bot, User, Loader2 } from 'lucide-react';
import Markdown from 'react-markdown';
import { useCrm } from '../../context/CrmContext';
import { buildCrmContextSnapshot } from '../../utils/crmAiContext';

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'model';
  text: string;
  content: string;
  timestamp: string;
  isError?: boolean;
}

interface GeminiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Supported and verified Gemini model constants for Google AI Studio Build Mode
export const SUPPORTED_GEMINI_MODELS = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
] as const;

export type SupportedGeminiModel = (typeof SUPPORTED_GEMINI_MODELS)[number];

export const DEFAULT_GEMINI_MODEL: SupportedGeminiModel = 'gemini-3.8-flash';

/**
 * Dynamically validates a candidate model against officially supported Gemini models.
 * If invalid, unverified, or empty, safely falls back to the validated DEFAULT_GEMINI_MODEL constant.
 */
export function validateGeminiModel(candidate?: string | null): SupportedGeminiModel {
  if (!candidate || typeof candidate !== 'string') {
    return DEFAULT_GEMINI_MODEL;
  }
  const normalized = candidate.trim().toLowerCase();
  const matched = SUPPORTED_GEMINI_MODELS.find(
    (m) => m.toLowerCase() === normalized
  );
  return matched ?? DEFAULT_GEMINI_MODEL;
}

// Exponential backoff configuration for handling transient 503 / high demand spikes
const MAX_503_RETRIES = 3;
const BASE_BACKOFF_DELAY_MS = 1000;

/**
 * Computes exponential backoff with randomized jitter for 503 high-demand retries.
 * Formula: baseDelay * 2^(attempt - 1) + jitter (0 - 400ms)
 * - Attempt 1: ~1000ms - 1400ms
 * - Attempt 2: ~2000ms - 2400ms
 * - Attempt 3: ~4000ms - 4400ms
 */
function getExponentialBackoffDelay(attempt: number): number {
  const exponentialDelay = BASE_BACKOFF_DELAY_MS * Math.pow(2, attempt - 1);
  const jitter = Math.floor(Math.random() * 400);
  return exponentialDelay + jitter;
}

// Helper to sanitize any raw or technical error strings
function cleanErrorMessage(raw?: string): string {
  if (!raw) return 'Gemini is temporarily busy. Please try again in a moment.';
  const str = String(raw).trim();

  // Known transient, high demand, or rate-limit messages
  if (
    str.includes('503') ||
    str.includes('high demand') ||
    str.includes('UNAVAILABLE') ||
    str.includes('temporarily') ||
    str.includes('busy') ||
    str.includes('RESOURCE_EXHAUSTED') ||
    str.includes('Rate limit') ||
    str.includes('overloaded')
  ) {
    return 'Gemini is temporarily busy. Please try again in a moment.';
  }

  // Parse raw JSON strings if any were passed
  if (str.startsWith('{') || str.startsWith('[')) {
    try {
      const parsed = JSON.parse(str);
      if (parsed?.error?.message) {
        return cleanErrorMessage(parsed.error.message);
      }
      if (parsed?.error) {
        return cleanErrorMessage(String(parsed.error));
      }
    } catch {
      // ignore
    }
    return 'Gemini is temporarily busy. Please try again in a moment.';
  }

  // Mask stack traces, API keys, internal network errors
  if (
    str.includes('fetch') ||
    str.includes('API key') ||
    str.includes('GEMINI_API_KEY') ||
    str.includes('Internal') ||
    str.includes('Error:') ||
    str.includes('Failed to fetch')
  ) {
    return 'Gemini is temporarily busy. Please try again in a moment.';
  }

  return str;
}

export const GeminiChatModal: React.FC<GeminiChatModalProps> = ({ isOpen, onClose }) => {
  const crm = useCrm();

  // Load and deduplicate initial conversation history
  const [messages, setMessages] = useState<ChatMessageItem[]>(() => {
    try {
      const saved = sessionStorage.getItem('vidzyra_gemini_chat_history');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const seen = new Set<string>();
        return parsed.filter((m: any) => {
          if (!m || !m.id || seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });
      }
      return [];
    } catch {
      return [];
    }
  });

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Synchronous submission lock to prevent duplicate submits from Enter + click or rapid clicks
  const isSubmittingRef = useRef<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Deduplicate and persist conversation to sessionStorage
  useEffect(() => {
    try {
      const seen = new Set<string>();
      const deduplicated = messages.filter((m) => {
        if (!m || !m.id || seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });
      sessionStorage.setItem('vidzyra_gemini_chat_history', JSON.stringify(deduplicated));
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

  const handleSendMessage = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // STRICT LOCK: if already submitting or loading, abort immediately
    if (isSubmittingRef.current || isLoading) {
      return;
    }

    const trimmed = inputQuery.trim();
    if (!trimmed) {
      return;
    }

    // Set synchronous lock BEFORE any state or async task
    isSubmittingRef.current = true;
    setIsLoading(true);
    setErrorNotice(null);

    // Clear input immediately so rapid clicks/Enter have no text to submit
    setInputQuery('');

    // Generate ONE unique client message ID
    const userMessageId = `msg-user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMessage: ChatMessageItem = {
      id: userMessageId,
      role: 'user',
      text: trimmed,
      content: trimmed,
      timestamp: nowTime,
    };

    // Add ONE user message to UI state with deduplication guarantee
    let currentHistoryForApi: { role: 'user' | 'model'; text: string }[] = [];
    setMessages((prev) => {
      if (prev.some((m) => m.id === userMessageId)) {
        return prev;
      }
      currentHistoryForApi = prev
        .filter((m) => !m.isError)
        .map((m) => ({
          role: m.role,
          text: m.text || m.content || '',
        }));
      return [...prev, userMessage];
    });

    try {
      // Capture live CRM context snapshot
      const crmSnapshot = buildCrmContextSnapshot(crm);

      // Dynamically validated, supported model constant
      const validatedModel = validateGeminiModel(DEFAULT_GEMINI_MODEL);

      // Controlled internal retry loop with exponential backoff for 503 / high-demand errors
      let responseData: { reply?: string; error?: string } | null = null;
      let lastErrorStr = '';

      for (let attempt = 1; attempt <= MAX_503_RETRIES; attempt++) {
        try {
          const res = await fetch('/api/gemini/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: trimmed,
              history: currentHistoryForApi,
              crmContext: crmSnapshot,
              model: validatedModel,
            }),
          });

          const data = await res.json().catch(() => ({}));

          if (res.ok && data && data.reply) {
            responseData = data;
            break;
          }

          const is503OrBusy =
            res.status === 503 ||
            (data?.error &&
              (String(data.error).includes('busy') ||
                String(data.error).includes('503') ||
                String(data.error).includes('high demand') ||
                String(data.error).includes('UNAVAILABLE')));

          if (is503OrBusy && attempt < MAX_503_RETRIES) {
            // Apply exponential backoff with randomized jitter
            const backoffMs = getExponentialBackoffDelay(attempt);
            console.warn(
              `[Gemini 503] Model busy. Exponential backoff retry ${attempt}/${MAX_503_RETRIES} in ${backoffMs}ms...`
            );
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
            continue;
          }

          lastErrorStr = cleanErrorMessage(data?.error || res.statusText);
          break;
        } catch (fetchErr: any) {
          if (attempt < MAX_503_RETRIES) {
            const backoffMs = getExponentialBackoffDelay(attempt);
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
            continue;
          }
          lastErrorStr = 'Gemini is temporarily busy. Please try again in a moment.';
          break;
        }
      }

      if (responseData && responseData.reply) {
        // Add ONE assistant response
        const assistantId = `msg-model-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const assistantMessage: ChatMessageItem = {
          id: assistantId,
          role: 'model',
          text: responseData.reply,
          content: responseData.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => {
          if (prev.some((m) => m.id === assistantId)) return prev;
          return [...prev, assistantMessage];
        });
      } else {
        // Final failure: show clean message and add ONE assistant error message
        const finalMsg = lastErrorStr || 'Gemini is temporarily busy. Please try again in a moment.';
        setErrorNotice(finalMsg);

        const errorId = `msg-err-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const errorAssistantMessage: ChatMessageItem = {
          id: errorId,
          role: 'model',
          text: finalMsg,
          content: finalMsg,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        };

        setMessages((prev) => {
          if (prev.some((m) => m.id === errorId)) return prev;
          return [...prev, errorAssistantMessage];
        });
      }
    } catch (err: any) {
      console.error('Gemini chat error:', err);
      const cleanMsg = cleanErrorMessage(err?.message);
      setErrorNotice(cleanMsg);

      const errorId = `msg-err-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const errorAssistantMessage: ChatMessageItem = {
        id: errorId,
        role: 'model',
        text: cleanMsg,
        content: cleanMsg,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };

      setMessages((prev) => {
        if (prev.some((m) => m.id === errorId)) return prev;
        return [...prev, errorAssistantMessage];
      });
    } finally {
      // Unlock submit controls
      isSubmittingRef.current = false;
      setIsLoading(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter creates a new line
        return;
      }
      // Enter alone sends exactly once
      e.preventDefault();
      e.stopPropagation();
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
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              id="gemini-chat-close-btn"
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
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
          {/* Clean Open-Ended Empty State */}
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

          {/* Conversation History with Deduplicated Rendering */}
          {(() => {
            const seenIds = new Set<string>();
            return messages
              .filter((msg) => {
                if (!msg || !msg.id || seenIds.has(msg.id)) return false;
                seenIds.add(msg.id);
                return true;
              })
              .map((msg) => {
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
                          : msg.isError
                          ? 'bg-rose-600 text-white'
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
                          : msg.isError
                          ? 'bg-rose-50 border border-rose-200 text-rose-800 rounded-tl-xs'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                      }`}
                    >
                      {isUser ? (
                        <div className="whitespace-pre-wrap font-medium">
                          {msg.text || msg.content}
                        </div>
                      ) : (
                        <div className="markdown-body space-y-2 prose-xs prose-slate">
                          <Markdown>{msg.text || msg.content}</Markdown>
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
              });
          })()}

          {/* Loading State */}
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

          {/* Clean user-facing error notification */}
          {errorNotice && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {errorNotice}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input & Send Button */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSendMessage();
            }}
            className="flex items-center gap-2.5"
          >
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                id="gemini-chat-input"
                rows={1}
                value={inputQuery}
                disabled={isLoading}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your CRM..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none transition disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <button
              id="gemini-chat-send-btn"
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              className="h-11 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition shrink-0 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending...</span>
                </>
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
