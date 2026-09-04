import React, { useState, useMemo } from 'react';
import {
  X,
  Bell,
  CheckCheck,
  Briefcase,
  FolderSync,
  CreditCard,
  Globe,
  RotateCcw,
  CheckCircle2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { NotificationType } from '../../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWork?: (workId: string) => void;
  onOpenClient?: (clientId: string) => void;
  onOpenEditor?: (editorId: string) => void;
  filterRole?: 'admin' | 'editor' | 'client';
  currentEntityId?: string;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onOpenWork,
  onOpenClient,
  onOpenEditor,
  filterRole = 'admin',
  currentEntityId,
}) => {
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
    setActiveTab,
    setSelectedClientId,
    setSelectedEditorId,
    setSelectedWorkId,
  } = useCrm();

  const [showClearModal, setShowClearModal] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 2800);
  };

  const displayedNotifications = useMemo(() => {
    if (filterRole === 'editor') {
      if (!currentEntityId) return [];
      return notifications.filter((n) => {
        // Direct recipient match
        if (n.recipientId === currentEntityId) return true;
        // Role match
        if (n.targetRole === 'editor' && n.relatedEditorId === currentEntityId) return true;
        if (n.recipientRole === 'editor' && n.relatedEditorId === currentEntityId) return true;
        return false;
      });
    }

    if (filterRole === 'client') {
      if (!currentEntityId) return [];
      return notifications.filter((n) => {
        // Direct recipient match
        if (n.recipientId === currentEntityId) return true;
        // Role match
        if (n.targetRole === 'client' && n.relatedClientId === currentEntityId) return true;
        if (n.recipientRole === 'client' && n.relatedClientId === currentEntityId) return true;
        return false;
      });
    }

    // Admin mode
    return notifications.filter((n) => {
      // Must not belong to a client or editor exclusively
      if (n.recipientId && n.recipientId !== 'admin') {
        if (
          n.recipientRole === 'client' ||
          n.recipientRole === 'editor' ||
          n.targetRole === 'client' ||
          n.targetRole === 'editor'
        ) {
          return false;
        }
      }
      if (n.targetRole === 'client' || n.targetRole === 'editor') {
        return false;
      }
      return true;
    });
  }, [notifications, filterRole, currentEntityId]);

  if (!isOpen) return null;

  const unreadCount = displayedNotifications.filter((n) => !n.read).length;

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'work':
        return <Briefcase className="w-4 h-4 text-indigo-500" />;
      case 'confirmation':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'file':
        return <FolderSync className="w-4 h-4 text-cyan-500" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'portal':
        return <Globe className="w-4 h-4 text-amber-500" />;
      case 'revision':
        return <RotateCcw className="w-4 h-4 text-rose-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const handleNotificationClick = (n: typeof notifications[0]) => {
    markNotificationAsRead(n.id);

    if (filterRole === 'editor' || filterRole === 'client') {
      onClose();
      return;
    }

    if (n.relatedWorkId) {
      setSelectedWorkId(n.relatedWorkId);
      setActiveTab('work');
      if (onOpenWork) onOpenWork(n.relatedWorkId);
      onClose();
    } else if (n.relatedClientId) {
      setSelectedClientId(n.relatedClientId);
      setActiveTab('clients');
      if (onOpenClient) onOpenClient(n.relatedClientId);
      onClose();
    } else if (n.relatedEditorId) {
      setSelectedEditorId(n.relatedEditorId);
      setActiveTab('editors');
      if (onOpenEditor) onOpenEditor(n.relatedEditorId);
      onClose();
    } else if (n.relatedPaymentId) {
      setActiveTab('payments');
      onClose();
    }
  };

  const handleConfirmClearAll = () => {
    clearAllNotifications({ role: filterRole, id: currentEntityId });
    setShowClearModal(false);
    showToast('Notifications cleared.');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
      <div
        id="notification-drawer"
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 relative"
      >
        {/* Success Toast Notice */}
        {successToast && (
          <div className="absolute top-16 left-4 right-4 z-20 bg-emerald-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              {successToast}
            </span>
            <button onClick={() => setSuccessToast(null)} className="text-white/80 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold text-slate-900 text-base">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {displayedNotifications.length > 0 && (
              <button
                id="btn-clear-all-notifications"
                onClick={() => setShowClearModal(true)}
                className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-rose-50 transition"
                title="Clear all notifications"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All
              </button>
            )}
            {unreadCount > 0 && (
              <button
                id="notif-mark-all-read"
                onClick={() => markAllNotificationsAsRead({ role: filterRole, id: currentEntityId })}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-indigo-50 transition"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {displayedNotifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Bell className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">No notifications</p>
              <p className="text-xs text-slate-400 mt-1">
                Your notifications list is clean. New updates will appear here automatically.
              </p>
            </div>
          ) : (
            displayedNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-4 hover:bg-slate-50 cursor-pointer transition flex items-start space-x-3 group relative ${
                  !n.read ? 'bg-indigo-50/40' : ''
                }`}
              >
                <div className="mt-0.5 p-2 rounded-lg bg-white border border-slate-200 shadow-xs flex-shrink-0">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {n.type}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {n.date} • {n.time}
                    </span>
                  </div>
                  <p
                    className={`text-sm leading-snug ${
                      !n.read ? 'font-semibold text-slate-900' : 'text-slate-700'
                    }`}
                  >
                    {n.message}
                  </p>
                  <p className="text-[11px] text-indigo-600 font-medium mt-1 flex items-center gap-0.5">
                    Click to view details →
                  </p>
                </div>
                {!n.read && (
                  <span className="w-2 h-2 rounded-full bg-indigo-600 mt-2 flex-shrink-0 mr-1" />
                )}
                {/* Individual notification clear button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(n.id);
                    showToast('Notification cleared.');
                  }}
                  className="absolute right-3 top-3 p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition opacity-80 group-hover:opacity-100"
                  title="Clear this notification"
                  aria-label="Clear notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-center text-xs text-slate-500">
          Notifications are updated in real-time as team and clients interact.
        </div>
      </div>

      {/* Clear All Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Clear Notifications?</h3>
                <p className="text-xs text-slate-500">This action clears notification history</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Are you sure you want to clear all notifications? This will reset the notification list
              and badge count to 0. Real CRM client, editor, project, and financial data will remain intact.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-clear-notifications"
                onClick={handleConfirmClearAll}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
