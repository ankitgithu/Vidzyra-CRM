import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  PowerOff,
  Power,
  Eye,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { SocialMediaClient } from '../../types/socialMedia';

interface SmmSharePortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: SocialMediaClient | null;
}

export const SmmSharePortalModal: React.FC<SmmSharePortalModalProps> = ({
  isOpen,
  onClose,
  client,
}) => {
  const { regenerateSmmPortalToken, setSmmPortalStatus, setActivePortalUser } = useCrm();
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);

  if (!isOpen || !client) return null;

  // Build the live permanent private portal link directly from root origin
  const baseOrigin = window.location.origin;
  const token = client.portalToken || client.id;
  const portalUrl = `${baseOrigin}/?portal=smm&token=${token}`;
  const cleanPathUrl = `${baseOrigin}/client/${token}`;

  const isActive = client.portalStatus !== 'Disabled';

  const handleCopy = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenInNewTab = () => {
    window.open(portalUrl, '_blank');
  };

  const handleInAppPreview = () => {
    onClose();
    setActivePortalUser({ type: 'smm', id: client.id });
  };

  const handleWhatsApp = () => {
    const rawPhone = client.whatsapp || client.phone || '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const message = `Hello ${client.contactPerson || client.name},\nHere is your private, live Social Media Management client portal link with Vidzyra:\n\n${portalUrl}\n\nYou can view real-time monthly deliverable progress, approved & published content, extra work, and payment receipts anytime!`;
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await regenerateSmmPortalToken(client.id);
      setConfirmRegenerate(false);
    } catch (err) {
      console.error('Failed to regenerate portal token:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleToggleStatus = async () => {
    setIsUpdatingStatus(true);
    try {
      const newStatus = isActive ? 'Disabled' : 'Active';
      await setSmmPortalStatus(client.id, newStatus);
    } catch (err) {
      console.error('Failed to toggle portal status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div
        id="smm-share-portal-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Social Media Client Portal
              </h3>
              <p className="text-xs text-slate-500">{client.name} • {client.businessCategory}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status & Security Badge */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center space-x-2.5">
              <div
                className={`w-3 h-3 rounded-full ${
                  isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'
                }`}
              />
              <div>
                <span className="text-xs font-bold text-slate-800">
                  Client Portal Status:{' '}
                  <span className={isActive ? 'text-emerald-700' : 'text-rose-600'}>
                    {isActive ? 'Active (Live)' : 'Disabled (Inactive)'}
                  </span>
                </span>
                <p className="text-[11px] text-slate-500">
                  {isActive
                    ? 'Client can access real-time deliverables and progress'
                    : 'Client access is paused. Link shows an inactive screen'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={isUpdatingStatus}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isActive ? (
                <>
                  <PowerOff className="w-3.5 h-3.5" />
                  <span>Disable Portal</span>
                </>
              ) : (
                <>
                  <Power className="w-3.5 h-3.5" />
                  <span>Enable Portal</span>
                </>
              )}
            </button>
          </div>

          {/* Secure Access & Privacy Banner */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-start space-x-2.5 text-xs text-indigo-950">
            <ShieldCheck className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
            <div className="leading-relaxed">
              <span className="font-bold text-indigo-900">Protected Client Access:</span>{' '}
              The client views only their connected social accounts, monthly deliverables, published work, extra work, and payment receipts.
              <strong className="block text-[11px] text-indigo-800 font-semibold mt-0.5">
                Internal editor costs, assigned editor names, and profit margins are strictly hidden.
              </strong>
            </div>
          </div>

          {/* Shareable Link Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-700 flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Live Shareable Portal Link</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                Token: {client.portalToken || 'Standard'}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={portalUrl}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 select-all focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleOpenInNewTab}
              className="px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Portal</span>
            </button>

            <button
              type="button"
              onClick={handleInAppPreview}
              className="px-3 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>In-App Preview</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsApp}
              className="px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Share</span>
            </button>
          </div>

          {/* Regenerate Token Section */}
          <div className="pt-2 border-t border-slate-100">
            {confirmRegenerate ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <div className="flex items-start gap-2 text-xs text-rose-800 font-medium">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>
                    Regenerating will invalidate the existing link. The client will need the new link to access the portal. Are you sure?
                  </span>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setConfirmRegenerate(false)}
                    className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition"
                  >
                    {isRegenerating ? 'Generating...' : 'Yes, Regenerate Token'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Need to revoke old access?</span>
                <button
                  type="button"
                  onClick={() => setConfirmRegenerate(true)}
                  className="text-slate-600 hover:text-indigo-600 font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Regenerate Link</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
