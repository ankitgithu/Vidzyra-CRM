import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  MessageSquare,
  AlertCircle,
  Trash2,
  Lock,
  CheckCircle2,
  ShieldAlert,
  User,
  Film,
  Sparkles,
  Ban,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { ChatMessage, ChatSenderRole } from '../../types';
import * as firestoreService from '../../services/firestoreService';
import { validateChatMessage } from '../../utils/chatFilter';

interface ProjectChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  currentRole: ChatSenderRole;
  currentUserId: string;
  currentUserName: string;
}

export const ProjectChatModal: React.FC<ProjectChatModalProps> = ({
  isOpen,
  onClose,
  projectId,
  currentRole,
  currentUserId,
  currentUserName,
}) => {
  const {
    projects,
    clients,
    editors,
    sendProjectChatMessage,
    deleteChatMessage,
    clearProjectChat,
    toggleProjectChatDisabled,
  } = useCrm();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [filterError, setFilterError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const project = projects.find((p) => p.id === projectId);
  const client = clients.find((c) => c.id === project?.clientId);
  const editor = project?.assignedTo ? editors.find((e) => e.id === project.assignedTo) : null;

  // Real-time Firestore subscription to project chat messages
  useEffect(() => {
    if (!isOpen || !projectId) return;

    const unsubscribe = firestoreService.subscribeProjectChatMessages(
      projectId,
      (fetchedMessages) => {
        setMessages(fetchedMessages);
      },
      (err) => {
        console.error('Failed to subscribe to chat messages:', err);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isOpen, projectId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Clear filter error when user modifies input
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (filterError) {
      setFilterError(null);
    }
  };

  if (!isOpen || !project) return null;

  // Status & Availability computations
  const isApproved = project.status === 'Approved' || project.reviewStatus === 'Approved';
  const isNoEditor = !project.assignedTo || project.workDoneBy === 'Self';
  const isDisabled = Boolean(project.chatDisabled);
  const isClosed = isApproved || isDisabled || isNoEditor;

  let closedNotice = '';
  if (isApproved) {
    closedNotice = 'Chat closed — this project has been approved.';
  } else if (isDisabled) {
    closedNotice = 'Chat closed — disabled by administrator.';
  } else if (isNoEditor) {
    closedNotice = 'Chat unavailable — an editor has not been assigned yet.';
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isClosed || isSending) return;

    const trimmed = inputText.trim();
    if (!trimmed) return;

    // Strict local content validation first
    const validation = validateChatMessage(trimmed);
    if (!validation.allowed) {
      setFilterError(validation.reason || 'Message blocked by moderation filter.');
      return;
    }

    setIsSending(true);
    setFilterError(null);

    try {
      const result = await sendProjectChatMessage({
        projectId,
        senderId: currentUserId,
        senderRole: currentRole,
        senderName: currentUserName,
        message: trimmed,
      });

      if (!result.success) {
        setFilterError(result.error || 'Failed to send message.');
      } else {
        setInputText('');
      }
    } catch (err: any) {
      setFilterError(err?.message || 'An unexpected error occurred while sending message.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (deletingId) return;
    setDeletingId(msgId);
    try {
      await deleteChatMessage(msgId);
    } catch (err) {
      console.error('Failed to delete message:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      await clearProjectChat(projectId);
      setShowClearConfirm(false);
    } catch (err) {
      console.error('Failed to clear project chat:', err);
    } finally {
      setIsClearing(false);
    }
  };

  const handleToggleDisabled = async () => {
    await toggleProjectChatDisabled(projectId, !project.chatDisabled);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
      <div
        id={`project-chat-modal-${projectId}`}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col h-[85vh] sm:h-[80vh]"
      >
        {/* Chat Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  {project.name}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                  {project.workType}
                </span>
                {isApproved ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1 shrink-0">
                    <Lock className="w-3 h-3" />
                    Chat Closed (Approved)
                  </span>
                ) : isDisabled ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 shrink-0">
                    <Ban className="w-3 h-3" />
                    Chat Disabled (Admin)
                  </span>
                ) : isNoEditor ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1 shrink-0">
                    No Editor Assigned
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Chat Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                Client: <strong className="text-slate-700">{client?.name || 'Client'}</strong> • Editor:{' '}
                <strong className="text-slate-700">{editor?.name || 'Unassigned'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            {/* Admin Controls */}
            {currentRole === 'admin' && (
              <div className="flex items-center space-x-1.5 mr-2">
                <button
                  id="btn-admin-toggle-chat-disabled"
                  onClick={handleToggleDisabled}
                  className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                    project.chatDisabled
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  }`}
                  title={project.chatDisabled ? 'Re-enable chat for client and editor' : 'Temporarily disable chat'}
                >
                  {project.chatDisabled ? 'Enable Chat' : 'Disable Chat'}
                </button>
                <button
                  id="btn-admin-clear-chat"
                  onClick={() => setShowClearConfirm(true)}
                  disabled={messages.length === 0}
                  className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  title="Clear all messages in this project"
                >
                  Clear Chat
                </button>
              </div>
            )}

            <button
              id="btn-close-project-chat-modal"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
              title="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Clear Confirmation Prompt (Admin only) */}
        {showClearConfirm && (
          <div className="bg-rose-50 border-b border-rose-200 px-5 py-3 flex items-center justify-between gap-3 text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Are you sure you want to delete all {messages.length} messages for this project? This cannot be undone.</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleClearAll}
                disabled={isClearing}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition cursor-pointer disabled:opacity-50"
              >
                {isClearing ? 'Clearing...' : 'Confirm Clear'}
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-2.5 py-1 bg-white border border-rose-200 text-rose-700 hover:bg-rose-100 font-semibold rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Closed Banner */}
        {isClosed && (
          <div className="bg-slate-100 border-b border-slate-200 px-5 py-2.5 flex items-center gap-2 text-xs text-slate-700 font-medium">
            <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>{closedNotice}</span>
          </div>
        )}

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  {isClosed ? 'No chat history available.' : 'No messages yet'}
                </p>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  {isClosed
                    ? closedNotice
                    : 'This chat is strictly for video deliverable feedback, timestamps, and edit requests between client and assigned editor.'}
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              const isClient = msg.senderRole === 'client';
              const isEditor = msg.senderRole === 'editor';
              const isAdmin = msg.senderRole === 'admin';

              return (
                <div
                  key={msg.id}
                  id={`chat-msg-${msg.id}`}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                >
                  <div className="flex items-center space-x-1.5 mb-1 px-1">
                    <span className="text-[11px] font-semibold text-slate-700">
                      {msg.senderName}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                        isClient
                          ? 'bg-indigo-100 text-indigo-800'
                          : isEditor
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {msg.senderRole}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>

                    {/* Admin delete button */}
                    {currentRole === 'admin' && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        disabled={deletingId === msg.id}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Delete message"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-2xs leading-relaxed break-words whitespace-pre-wrap ${
                      isMe
                        ? isClient
                          ? 'bg-indigo-600 text-white rounded-tr-xs'
                          : isEditor
                          ? 'bg-purple-600 text-white rounded-tr-xs'
                          : 'bg-slate-900 text-white rounded-tr-xs'
                        : isClient
                        ? 'bg-indigo-50/80 text-slate-800 border border-indigo-100 rounded-tl-xs'
                        : isEditor
                        ? 'bg-purple-50/80 text-slate-800 border border-purple-100 rounded-tl-xs'
                        : 'bg-amber-50 text-slate-800 border border-amber-200 rounded-tl-xs'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Filter Warning Banner */}
        {filterError && (
          <div
            id="chat-filter-warning-banner"
            className="bg-rose-50 border-t border-rose-200 px-4 py-2.5 flex items-start gap-2.5 text-xs text-rose-800 animate-in slide-in-from-bottom-2"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{filterError}</p>
              <p className="text-[11px] text-rose-600 mt-0.5">
                Your message has been retained in the composer below. Please edit to remove restricted content.
              </p>
            </div>
            <button
              onClick={() => setFilterError(null)}
              className="text-rose-400 hover:text-rose-700 cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Chat Input / Composer */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
          {isClosed ? (
            <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-center text-xs text-slate-500 font-medium">
              <Lock className="w-4 h-4 inline-block mr-1 text-slate-400 -mt-0.5" />
              {closedNotice}
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="space-y-2">
              <div className="relative flex items-center">
                <textarea
                  id="chat-message-input"
                  ref={textareaRef}
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a video feedback message... (Press Enter to send, Shift+Enter for newline)"
                  rows={2}
                  maxLength={2000}
                  disabled={isSending}
                  className="w-full resize-none px-3.5 py-2.5 pr-20 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />

                <div className="absolute right-2.5 bottom-2.5 flex items-center space-x-1.5">
                  <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                    {inputText.length}/2000
                  </span>
                  <button
                    type="submit"
                    id="btn-send-chat-message"
                    disabled={!inputText.trim() || isSending}
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg transition shadow-2xs cursor-pointer disabled:cursor-not-allowed"
                    title="Send message"
                  >
                    {isSending ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span>
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                <span>Text only • Video &amp; deliverable discussions only</span>
                <span>Financial terms &amp; personal inquiries blocked</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
