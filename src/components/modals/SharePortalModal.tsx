import React, { useState } from 'react';
import { X, Share2, Copy, Check, MessageSquare, ExternalLink, ShieldCheck } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

interface SharePortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'client' | 'editor';
  entityId: string | null;
}

export const SharePortalModal: React.FC<SharePortalModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entityId,
}) => {
  const { clients, editors, setActivePortalUser } = useCrm();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !entityId) return null;

  const target =
    entityType === 'client'
      ? clients.find((c) => c.id === entityId)
      : editors.find((e) => e.id === entityId);

  if (!target) return null;

  // Build the permanent private portal link
  const origin = window.location.origin + window.location.pathname;
  const portalUrl = `${origin}?portal=${entityType}&token=${target.portalToken}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const rawPhone = entityType === 'client' ? (target as any).whatsapp || (target as any).phone : (target as any).contact;
    const cleanPhone = (rawPhone || '').replace(/[^0-9]/g, '');
    const message = `Hello ${target.name},\nHere is your private, permanent ${entityType === 'client' ? 'Client' : 'Editor'} Portal link with Vidzyra:\n${portalUrl}\n\nYou can track work progress, upload/download files, and submit updates anytime.`;
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Vidzyra ${entityType === 'client' ? 'Client' : 'Editor'} Portal — ${target.name}`,
          text: `Access your private portal with Vidzyra:`,
          url: portalUrl,
        });
      } catch (err) {
        console.log('Share canceled or failed', err);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div
        id="share-portal-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">
                Share {entityType === 'client' ? 'Client' : 'Editor'} Portal Link
              </h3>
              <p className="text-xs text-slate-500">{target.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Security Banner */}
          <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-start space-x-3 text-xs text-indigo-900">
            <ShieldCheck className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Permanent Token Protected</p>
              <p className="mt-0.5 text-indigo-700">
                This link connects securely to {target.name}&apos;s isolated dashboard. Internal agency financials
                and other parties&apos; data are completely hidden.
              </p>
            </div>
          </div>

          {/* Link Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Permanent Portal URL
            </label>
            <div className="flex items-center space-x-2">
              <input
                id="portal-link-input-display"
                type="text"
                readOnly
                value={portalUrl}
                className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-800 focus:outline-none select-all"
              />
              <button
                id="btn-copy-portal-link"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <button
              id="btn-share-copy"
              onClick={handleCopy}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition group text-center"
            >
              <Copy className="w-5 h-5 text-indigo-600 mb-1.5 group-hover:scale-110 transition" />
              <span className="text-xs font-semibold text-slate-800">Copy Link</span>
              <span className="text-[10px] text-slate-400">To clipboard</span>
            </button>

            <button
              id="btn-share-whatsapp"
              onClick={handleWhatsApp}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition group text-center"
            >
              <MessageSquare className="w-5 h-5 text-emerald-600 mb-1.5 group-hover:scale-110 transition" />
              <span className="text-xs font-semibold text-slate-800">WhatsApp</span>
              <span className="text-[10px] text-slate-400">Direct message</span>
            </button>

            <button
              id="btn-share-native"
              onClick={handleWebShare}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/40 transition group text-center"
            >
              <Share2 className="w-5 h-5 text-cyan-600 mb-1.5 group-hover:scale-110 transition" />
              <span className="text-xs font-semibold text-slate-800">Share</span>
              <span className="text-[10px] text-slate-400">System dialog</span>
            </button>
          </div>

          {/* Test View Switcher */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Preview as this user:</span>
            <button
              id="btn-open-preview-from-share"
              onClick={() => {
                setActivePortalUser({ type: entityType, id: target.id });
                onClose();
              }}
              className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Portal View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
