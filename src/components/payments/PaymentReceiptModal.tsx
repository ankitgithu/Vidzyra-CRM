import React, { useState } from 'react';
import { X, Download, Printer, CheckCircle2, ShieldCheck } from 'lucide-react';
import { ReceiptData, downloadReceiptJpg } from '../../utils/receiptGenerator';

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: ReceiptData | null;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  isOpen,
  onClose,
  receiptData,
}) => {
  const [downloading, setDownloading] = useState(false);

  if (!isOpen || !receiptData) return null;

  const handleDownloadJpg = async () => {
    setDownloading(true);
    await downloadReceiptJpg(receiptData);
    setDownloading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
      <div
        id="payment-receipt-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col my-auto"
      >
        {/* Modal Controls Top Bar */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              Receipt Preview
            </span>
            <span className="text-xs text-slate-500 font-mono">{receiptData.receiptNumber}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              id="btn-download-slip-jpg"
              onClick={handleDownloadJpg}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5" />
              {downloading ? 'Generating JPG...' : 'Download Payment Slip (JPG)'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Official Receipt Canvas / Card */}
        <div className="p-8 bg-white space-y-6 print:p-0">
          {/* Top Brand Banner */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-xl shadow-md">
                  V
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">VIDZYRA</h2>
                  <p className="text-xs text-indigo-600 font-medium">Your Social Media Partner</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 block">
                Official Payment Receipt
              </span>
              <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                {receiptData.receiptNumber}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Date: {receiptData.date}</div>
            </div>
          </div>

          {/* Recipient & Amount Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Transaction Parties
              </span>
              <div className="text-xs text-slate-800">
                <span className="font-semibold text-slate-500">Payer:</span>{' '}
                <span className="font-bold text-slate-900">
                  {receiptData.payerName ||
                    (receiptData.recipientType === 'Client'
                      ? receiptData.recipientName
                      : receiptData.businessName || 'Vidzyra Video Agency')}
                </span>
              </div>
              <div className="text-xs text-slate-800">
                <span className="font-semibold text-slate-500">Payee:</span>{' '}
                <span className="font-bold text-slate-900">
                  {receiptData.payeeName ||
                    (receiptData.recipientType === 'Client'
                      ? receiptData.businessName || 'Vidzyra Video Agency'
                      : receiptData.recipientName)}
                </span>
              </div>
              <div className="text-xs text-slate-600 pt-1 border-t border-slate-200">
                <span className="font-medium text-slate-500">Work / Project:</span>{' '}
                {receiptData.projectName || 'All Associated Deliverables'}
              </div>
              <div className="text-xs text-slate-600">
                <span className="font-medium text-slate-500">Method:</span> {receiptData.paymentMethod}
                {receiptData.referenceNumber && (
                  <span className="font-mono text-slate-500"> ({receiptData.referenceNumber})</span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                  Amount Received / Paid
                </span>
                <div className="text-3xl font-black text-emerald-800 tracking-tight">
                  ₹{receiptData.amount.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Type: {receiptData.paymentType}
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {receiptData.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Financial Ledger */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Description</th>
                  <th className="px-4 py-2.5 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="px-4 py-3">
                    Total {receiptData.recipientType === 'Client' ? 'Project Billing' : 'Editor Assignment Cost'}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    ₹{receiptData.totalAmount.toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Total Accumulated Paid to Date</td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                    ₹{receiptData.totalPaid.toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr className="bg-slate-50 font-bold">
                  <td className="px-4 py-3 text-slate-900">Remaining Balance Outstanding</td>
                  <td className={`px-4 py-3 text-right ${receiptData.remainingAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {receiptData.remainingAmount > 0
                      ? `₹${receiptData.remainingAmount.toLocaleString('en-IN')}`
                      : '₹0 (Fully Cleared)'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {receiptData.notes && (
            <div className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              Note: {receiptData.notes}
            </div>
          )}

          {/* Verification Seal and Authorized Signature */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2 rounded-lg text-emerald-800 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold block text-[11px] leading-tight">AUDITED &amp; VERIFIED</span>
                <span className="text-[10px] text-emerald-600 font-mono">VIDZYRA DIGITAL FINANCE</span>
              </div>
            </div>

            <div className="text-center sm:text-right min-w-[180px]">
              <div className="font-serif italic font-bold text-slate-800 text-sm tracking-wide">
                {receiptData.authorizedSignatory || 'Vidzyra Auth Sign'}
              </div>
              <div className="w-40 border-b border-slate-300 mx-auto sm:ml-auto sm:mr-0 my-1"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Authorized Signatory
              </span>
            </div>
          </div>

          {/* Receipt Footer */}
          <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-[11px] text-slate-400">
            <div>
              <p>Generated by Vidzyra CRM • Your Social Media Partner</p>
              <p>Support: contact@vidzyra.com</p>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 font-semibold border border-emerald-200 bg-emerald-50 px-2.5 py-1 rounded-md">
              <ShieldCheck className="w-3.5 h-3.5" />
              Official Verification
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-2 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg"
          >
            Close
          </button>
          <button
            onClick={handleDownloadJpg}
            disabled={downloading}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Download Slip (.JPG)
          </button>
        </div>
      </div>
    </div>
  );
};
