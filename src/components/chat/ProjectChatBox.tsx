import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Lock,
  Trash2,
  Eye,
  MessageSquare,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { ChatMessage, ChatSenderRole } from '../../types';
import { evaluateMessageModeration } from '../../utils/chatModeration';

interface ProjectChatBoxProps {
  projectId: string;
  viewerRole: 'admin' | 'client' | 'editor';
  currentUserId: string;
  currentUserName: string;
  onClose?: () => void;
  compact?: boolean;
}

export const ProjectChatBox: React.FC<ProjectChatBoxProps> = ({
  projectId,
  viewerRole,
  currentUserId,
  currentUserName,
  onClose,
  compact = false,
}) => {
  const {
    projects,
    clients,
    editors,
    chatMessages,
    sendChatMessage,
    approveChatMessage,
    rejectChatMessage,
    deleteChatMessage,
    toggleProjectChat,
    clearProjectChat,
    settings,
  } = useCrm();

  const [inputMessage, setInputMessage] = useState('');
  const [filterWarning, setFilterWarning] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [adminRecipientRole, setAdminRecipientRole] = useState<'all' | 'client' | 'editor'>('all');
  const [rejectingMessageId, setRejectingMessageId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const project = projects.find((p) => p.id === projectId);
  const client = project ? clients.find((c) => c.id === project.clientId) : null;
  const editor = project?.assignedTo ? editors.find((e) => e.id === project.assignedTo) : null;

  // Filter messages for this project
  const projectMessages = chatMessages.filter(
    (m) => m.projectId === projectId || m.workId === projectId
  );

  // For Client / Editor:
  // - Show APPROVED messages
  // - Show their own messages (even if PENDING_ADMIN_REVIEW or REJECTED)
  // - Recipient NEVER sees the other party's PENDING or REJECTED messages!
  const visibleMessages = projectMessages.filter((m) => {
    if (viewerRole === 'admin') return true;
    if (m.status === 'APPROVED') return true;
    // Sender can see their own pending or rejected message status
    if (m.senderId === currentUserId) return true;
    return false;
  });

  const pendingMessages = projectMessages.filter((m) => m.status === 'PENDING_ADMIN_REVIEW');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages.length]);

  if (!project) {
    return (
      <div className="p-6 text-center text-slate-400 text-xs italic">
        Project deliverable details not found.
      </div>
    );
  }

  const isApproved = project.status === 'Approved' || project.reviewStatus === 'Approved';
  const hasAssignedEditor = Boolean(project.assignedTo);
  const isChatEnabled = project.chatEnabled !== false && !isApproved;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    setFilterWarning(null);
    setStatusNotice(null);

    const text = inputMessage.trim();
    if (!text) return;

    if (viewerRole !== 'admin') {
      if (isApproved) {
        setFilterWarning('Project has been approved. Chat is closed.');
        return;
      }
      if (!hasAssignedEditor) {
        setFilterWarning('Chat will become available after an Editor is assigned.');
        return;
      }
      if (!isChatEnabled) {
        setFilterWarning('Chat is currently disabled by Admin.');
        return;
      }

      // LEVEL 1: Automatic restriction filter
      const check = evaluateMessageModeration(text);
      if (check.isRestricted) {
        setFilterWarning(
          check.reason ||
            'Message blocked: Prohibited content detected. External contacts, payment talks, and personal topics are strictly forbidden in project chat.'
        );
        return;
      }
    }

    const res = sendChatMessage({
      projectId: project.id,
      senderId: currentUserId,
      senderRole: viewerRole as ChatSenderRole,
      senderName: currentUserName,
      message: text,
      recipientRole: viewerRole === 'admin' ? adminRecipientRole : undefined,
    });

    if (!res.success) {
      setFilterWarning(res.error || 'Failed to send message.');
    } else {
      setInputMessage('');
      if (res.pending) {
        setStatusNotice('Message submitted. Awaiting Admin review before delivery.');
        setTimeout(() => setStatusNotice(null), 5000);
      } else {
        setStatusNotice('Message sent.');
        setTimeout(() => setStatusNotice(null), 3000);
      }
    }
  };

  const handleApprove = async (msgId: string) => {
    await approveChatMessage(msgId);
  };

  const handleReject = async (msgId: string) => {
    await rejectChatMessage(msgId, rejectReason.trim() || undefined);
    setRejectingMessageId(null);
    setRejectReason('');
  };

  return (
    <div
      id={`project-chatbox-${projectId}`}
      className={`relative flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden select-none ${
        compact ? 'h-[480px]' : 'h-[620px]'
      }`}
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
    >
      {/* Background Security Watermark (Screenshot Deterrence) */}
      <div
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center opacity-[0.035] select-none transform -rotate-12"
        aria-hidden="true"
      >
        <div className="text-center font-black text-3xl tracking-widest text-slate-900 uppercase space-y-4">
          <div>{settings.businessName || 'VIDZYRA MEDIA'}</div>
          <div>CONFIDENTIAL PROJECT CHAT</div>
          <div>{currentUserName} • {new Date().toLocaleDateString()}</div>
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10 px-5 py-3.5 bg-slate-50/90 backdrop-blur-xs border-b border-slate-200 flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-900 text-xs truncate">{project.name}</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Live Chat
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              Client: <strong className="text-slate-800">{client?.name || 'Client'}</strong> • Assigned Editor:{' '}
              <strong className="text-purple-700">{editor?.name || 'Unassigned'}</strong>
            </p>
          </div>
        </div>

        {/* Admin Controls */}
        <div className="flex items-center space-x-2">
          {viewerRole === 'admin' && (
            <>
              <button
                type="button"
                onClick={() => toggleProjectChat(project.id, !isChatEnabled)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer border ${
                  isChatEnabled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                }`}
                title={isChatEnabled ? 'Disable project chat' : 'Enable project chat'}
              >
                {isChatEnabled ? (
                  <>
                    <ToggleRight className="w-4 h-4 text-emerald-600" />
                    <span>Chat Active</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4 text-slate-400" />
                    <span>Chat Disabled</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                title="Clear project chat history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Moderation Banner for Client/Editor */}
      <div className="relative z-10 px-4 py-2 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between text-[11px] text-indigo-900">
        <div className="flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
          <span>
            {viewerRole === 'admin'
              ? 'Admin Moderation Active — Review pending messages before delivery'
              : 'Admin Moderated — Messages are verified before delivery to prevent spam'}
          </span>
        </div>
        <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-medium">
          <Lock className="w-3 h-3" />
          <span>Screenshot protected</span>
        </div>
      </div>

      {/* Admin Moderation Queue (If admin has pending messages) */}
      {viewerRole === 'admin' && pendingMessages.length > 0 && (
        <div className="relative z-10 bg-amber-50/90 border-b border-amber-200 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              Pending Moderation Queue ({pendingMessages.length})
            </span>
            <span className="text-[10px] text-amber-700">Messages will NOT reach recipient until approved</span>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {pendingMessages.map((msg) => (
              <div
                key={msg.id}
                className="p-2.5 bg-white rounded-xl border border-amber-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        msg.senderRole === 'client'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {msg.senderRole === 'client' ? 'Client' : 'Editor'}: {msg.senderName}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Target: {msg.recipientRole === 'client' ? 'Client' : 'Editor'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-800 break-words">{msg.message}</p>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleApprove(msg.id)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejectingMessageId(msg.id)}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Rejection Modal for specific message */}
          {rejectingMessageId && (
            <div className="p-3 bg-white rounded-xl border border-rose-200 space-y-2">
              <span className="text-xs font-bold text-rose-800">Specify Rejection Reason (Optional):</span>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Please discuss payment only through official billing invoice."
                className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-rose-500"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingMessageId(null);
                    setRejectReason('');
                  }}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(rejectingMessageId)}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="relative z-10 flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40">
        {visibleMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
            <MessageSquare className="w-8 h-8 opacity-40" />
            <p className="text-xs font-medium">No messages yet in this project chat.</p>
            <p className="text-[11px] text-slate-400 max-w-xs">
              {viewerRole === 'admin'
                ? 'Directly send instructions to Client or Editor, or moderate incoming project messages.'
                : 'Send project editing instructions and feedback directly to your assigned counterpart.'}
            </p>
          </div>
        ) : (
          visibleMessages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            const isAdmin = msg.senderRole === 'admin';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {/* Sender badge */}
                <div className="flex items-center space-x-1 text-[10px] text-slate-400 mb-0.5 px-1">
                  <span className="font-semibold text-slate-600">
                    {isMe ? 'You' : msg.senderName}
                  </span>
                  {isAdmin && (
                    <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-bold">
                      Admin
                    </span>
                  )}
                  <span>•</span>
                  <span>
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Message bubble */}
                <div
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed break-words shadow-2xs ${
                    isAdmin
                      ? 'bg-gradient-to-r from-indigo-700 to-indigo-800 text-white rounded-tl-xs'
                      : isMe
                      ? 'bg-slate-900 text-white rounded-tr-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                  }`}
                >
                  <p>{msg.message}</p>
                </div>

                {/* Status indicator badge */}
                <div className="mt-0.5 flex items-center space-x-1.5 text-[10px] px-1">
                  {msg.status === 'PENDING_ADMIN_REVIEW' && (
                    <span className="text-amber-600 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Awaiting Admin approval
                    </span>
                  )}

                  {msg.status === 'REJECTED' && (
                    <span className="text-rose-600 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Not approved by Admin{msg.rejectionReason ? `: ${msg.rejectionReason}` : ''}
                    </span>
                  )}

                  {msg.status === 'APPROVED' && isMe && (
                    <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      Delivered
                    </span>
                  )}

                  {viewerRole === 'admin' && (
                    <button
                      type="button"
                      onClick={() => deleteChatMessage(msg.id)}
                      className="text-slate-300 hover:text-rose-600 transition"
                      title="Delete message"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Warning / Error Bar */}
      {filterWarning && (
        <div className="relative z-10 px-4 py-2 bg-rose-50 border-t border-rose-200 text-rose-800 text-xs flex items-start space-x-2 animate-in fade-in">
          <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Restriction Notice: </span>
            <span>{filterWarning}</span>
          </div>
          <button
            onClick={() => setFilterWarning(null)}
            className="text-rose-500 hover:text-rose-700 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {statusNotice && (
        <div className="relative z-10 px-4 py-1.5 bg-emerald-50 border-t border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Project Status Banner if Disabled or Closed */}
      {isApproved ? (
        <div className="relative z-10 p-4 bg-slate-100 border-t border-slate-200 text-center text-xs text-slate-600 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
          This project has been approved. The live chat is closed and chat history has been securely cleared.
        </div>
      ) : !hasAssignedEditor ? (
        <div className="relative z-10 p-4 bg-amber-50/70 border-t border-amber-200 text-center text-xs text-amber-800 font-medium">
          <Clock className="w-4 h-4 text-amber-600 mx-auto mb-1" />
          Chat will become available after an Editor is assigned to this project.
        </div>
      ) : !isChatEnabled ? (
        <div className="relative z-10 p-4 bg-slate-100 border-t border-slate-200 text-center text-xs text-slate-600 font-medium">
          <Lock className="w-4 h-4 text-slate-500 mx-auto mb-1" />
          Live chat is currently disabled for this project by Admin.
        </div>
      ) : (
        /* Message Input Form */
        <form
          onSubmit={handleSendMessage}
          className="relative z-10 p-3 bg-white border-t border-slate-200 flex flex-col gap-2"
        >
          {viewerRole === 'admin' && (
            <div className="flex items-center space-x-3 text-xs text-slate-600">
              <span className="font-semibold text-slate-500">Send as Admin to:</span>
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="radio"
                  name="adminRecipient"
                  value="all"
                  checked={adminRecipientRole === 'all'}
                  onChange={() => setAdminRecipientRole('all')}
                  className="text-indigo-600"
                />
                <span>Both (All)</span>
              </label>
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="radio"
                  name="adminRecipient"
                  value="client"
                  checked={adminRecipientRole === 'client'}
                  onChange={() => setAdminRecipientRole('client')}
                  className="text-indigo-600"
                />
                <span>Client Only</span>
              </label>
              {hasAssignedEditor && (
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name="adminRecipient"
                    value="editor"
                    checked={adminRecipientRole === 'editor'}
                    onChange={() => setAdminRecipientRole('editor')}
                    className="text-indigo-600"
                  />
                  <span>Editor Only</span>
                </label>
              )}
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input
              id={`chat-input-${projectId}`}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                viewerRole === 'admin'
                  ? 'Type direct admin message (no review needed)...'
                  : 'Type editing instruction or feedback...'
              }
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
            <button
              id={`chat-send-btn-${projectId}`}
              type="submit"
              disabled={!inputMessage.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
            <span>Text-only project communication</span>
            <span>Use Google Drive folder for raw/render files</span>
          </div>
        </form>
      )}

      {/* Clear Chat Confirmation Modal (Admin only) */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4"
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-2.5 text-rose-600">
              <Trash2 className="w-5 h-5" />
              <h4 className="font-bold text-sm text-slate-900">Clear Project Chat?</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will permanently delete all chat messages for "{project.name}".
              Deliverable files, project status, and client/editor records will remain unaffected.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await clearProjectChat(project.id);
                  setShowClearConfirm(false);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
