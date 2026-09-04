export interface ReceiptData {
  receiptNumber: string;
  recipientType: 'Client' | 'Editor';
  recipientName: string;
  payerName?: string;
  payeeName?: string;
  amount: number;
  date: string;
  paymentType: string;
  paymentMethod: string;
  referenceNumber: string;
  projectName: string;
  totalAmount: number; // Total Billing for client or Total Cost for editor
  totalPaid: number;
  remainingAmount: number;
  paymentStatus: 'Paid' | 'Partial' | 'Pending';
  notes?: string;
  businessName?: string;
  tagline?: string;
  authorizedSignatory?: string;
}

export function generatePaymentReceiptJpg(data: ReceiptData): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const width = 1200;
    const height = 850;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      resolve('');
      return;
    }

    // High quality background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Decorative top brand bar
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#4f46e5');
    gradient.addColorStop(0.5, '#6366f1');
    gradient.addColorStop(1, '#06b6d4');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, 14);

    // Border container
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // Header Area
    const agencyName = data.businessName || 'VIDZYRA VIDEO AGENCY';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(agencyName, 60, 95);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 15px sans-serif';
    ctx.fillText(data.tagline || 'Your Dedicated Social Media & Video Growth Partner', 60, 122);

    // Document Title on Right
    ctx.fillStyle = '#4f46e5';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('OFFICIAL PAYMENT RECEIPT', width - 60, 90);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`RECEIPT #: ${data.receiptNumber}`, width - 60, 118);

    ctx.fillStyle = '#64748b';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Issue Date: ${data.date}`, width - 60, 140);
    ctx.textAlign = 'left';

    // Divider
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(60, 160);
    ctx.lineTo(width - 60, 160);
    ctx.stroke();

    // Parties Box: Payer & Payee
    const isClient = data.recipientType === 'Client';
    const payer = data.payerName || (isClient ? data.recipientName : (data.businessName || 'Vidzyra Video Agency'));
    const payee = data.payeeName || (isClient ? (data.businessName || 'Vidzyra Video Agency') : data.recipientName);

    // Left Box: Recipient & Party Info
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(60, 185, 500, 175);
    ctx.strokeStyle = '#e2e8f0';
    ctx.strokeRect(60, 185, 500, 175);

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('TRANSACTION PARTIES', 85, 212);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`Payer:  ${payer}`, 85, 238);
    ctx.fillText(`Payee:  ${payee}`, 85, 264);

    ctx.fillStyle = '#475569';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Work / Project: ${data.projectName || 'All Associated Deliverables'}`, 85, 294);
    ctx.fillText(`Method: ${data.paymentMethod}  |  Ref/UTR: ${data.referenceNumber || 'N/A'}`, 85, 322);

    // Right Box: Amount Paid Highlight
    ctx.fillStyle = isClient ? '#f0fdf4' : '#faf5ff';
    ctx.fillRect(width - 560, 185, 500, 175);
    ctx.strokeStyle = isClient ? '#bbf7d0' : '#e9d5ff';
    ctx.strokeRect(width - 560, 185, 500, 175);

    ctx.fillStyle = isClient ? '#166534' : '#6b21a8';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(isClient ? 'CLIENT PAYMENT RECEIVED' : 'EDITOR DISBURSEMENT PAID', width - 535, 215);

    ctx.fillStyle = isClient ? '#15803d' : '#7e22ce';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText(`₹${(data.amount || 0).toLocaleString('en-IN')}`, width - 535, 268);

    ctx.fillStyle = isClient ? '#166534' : '#6b21a8';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`Stage: ${data.paymentType.toUpperCase()}   •   Status: ${data.paymentStatus.toUpperCase()}`, width - 535, 312);

    // Financial Breakdown Table
    const tableTop = 390;
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(60, tableTop, width - 120, 42);

    ctx.fillStyle = '#334155';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('ACCOUNT LEDGER BREAKDOWN', 80, tableTop + 26);
    ctx.textAlign = 'right';
    ctx.fillText('AMOUNT (INR)', width - 80, tableTop + 26);
    ctx.textAlign = 'left';

    // Row 1: Total Project Billing / Cost
    let rowY = tableTop + 78;
    ctx.fillStyle = '#475569';
    ctx.font = '15px sans-serif';
    ctx.fillText(`Total ${isClient ? 'Project Billing / Invoiced' : 'Editor Project Cost'}`, 80, rowY);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`₹${(data.totalAmount || 0).toLocaleString('en-IN')}`, width - 80, rowY);
    ctx.textAlign = 'left';

    // Divider
    ctx.strokeStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(60, rowY + 14);
    ctx.lineTo(width - 60, rowY + 14);
    ctx.stroke();

    // Row 2: Total Paid to Date
    rowY += 42;
    ctx.fillStyle = '#475569';
    ctx.font = '15px sans-serif';
    ctx.fillText('Total Accumulated Payments to Date', 80, rowY);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#16a34a';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`₹${(data.totalPaid || 0).toLocaleString('en-IN')}`, width - 80, rowY);
    ctx.textAlign = 'left';

    // Divider
    ctx.strokeStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(60, rowY + 14);
    ctx.lineTo(width - 60, rowY + 14);
    ctx.stroke();

    // Row 3: Remaining Balance
    rowY += 42;
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`Remaining Balance Outstanding`, 80, rowY);
    ctx.textAlign = 'right';
    ctx.fillStyle = (data.remainingAmount || 0) > 0 ? '#dc2626' : '#16a34a';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText((data.remainingAmount || 0) > 0 ? `₹${(data.remainingAmount || 0).toLocaleString('en-IN')}` : '₹0 (Fully Cleared)', width - 80, rowY);
    ctx.textAlign = 'left';

    // Notes if any
    if (data.notes) {
      ctx.fillStyle = '#64748b';
      ctx.font = 'italic 13px sans-serif';
      ctx.fillText(`Remarks: ${data.notes}`, 80, rowY + 36);
    }

    // Signature Area & Seal
    const sigTop = height - 175;
    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(60, sigTop);
    ctx.lineTo(width - 60, sigTop);
    ctx.stroke();

    // Left info
    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.fillText('This is an official computer-generated receipt issued by Vidzyra CRM.', 60, sigTop + 35);
    ctx.fillText('All transactions are logged with audit timestamps and verified.', 60, sigTop + 55);
    ctx.fillText('Official Support: contact@vidzyra.com | Accounts: billing@vidzyra.com', 60, sigTop + 75);

    // Verified Seal Box
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(width - 550, sigTop + 20, 180, 55);
    ctx.fillStyle = '#16a34a';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✓ AUDITED & VERIFIED', width - 460, sigTop + 45);
    ctx.font = '10px monospace';
    ctx.fillText('VIDZYRA FINANCE', width - 460, sigTop + 62);

    // Authorized Signature Area
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width - 270, sigTop + 60);
    ctx.lineTo(width - 80, sigTop + 60);
    ctx.stroke();

    ctx.fillStyle = '#334155';
    ctx.font = 'italic bold 16px serif';
    ctx.fillText(data.authorizedSignatory || 'Vidzyra Auth Sign', width - 175, sigTop + 48);

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('AUTHORIZED SIGNATORY', width - 175, sigTop + 80);
    ctx.textAlign = 'left';

    const jpgUrl = canvas.toDataURL('image/jpeg', 0.95);
    resolve(jpgUrl);
  });
}

export async function downloadReceiptJpg(data: ReceiptData) {
  const dataUrl = await generatePaymentReceiptJpg(data);
  if (!dataUrl) return;

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `Vidzyra-Payment-Slip-${data.receiptNumber}.jpg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
