import jsPDF from 'jspdf';
import {
  Invoice,
  Receipt,
  BusinessSettings,
  WorkProject,
  Client,
  Editor,
  ClientPayment,
  EditorPayment,
  Expense,
  Activity,
  NotificationItem,
} from '../types';

/**
 * Generates and downloads a clean, professional PDF Invoice.
 */
export function generateInvoicePdf(invoice: Invoice, settings: BusinessSettings): void {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = 45;

  const primaryColor = [15, 23, 42]; // slate-900
  const accentColor = [79, 70, 229]; // indigo-600
  const mutedColor = [100, 116, 139]; // slate-500
  const lightBg = [248, 250, 252]; // slate-50

  // 1. Header & Branding
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(settings.businessName || 'VIDZYRA MEDIA', margin, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text('INVOICE', pageWidth - margin, y, { align: 'right' });

  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  if (settings.tagline) {
    doc.text(settings.tagline, margin, y);
    y += 12;
  }
  doc.text(`Email: ${settings.contactEmail || 'contact@vidzyra.com'} | Tel: ${settings.contactPhone || '+91 98765 43210'}`, margin, y);

  // Invoice Number & Date block on right
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, pageWidth - margin, y - 10, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Date: ${invoice.date || new Date().toISOString().split('T')[0]}`, pageWidth - margin, y + 2, { align: 'right' });
  if (invoice.dueDate) {
    doc.text(`Due Date: ${invoice.dueDate}`, pageWidth - margin, y + 14, { align: 'right' });
  }

  // Divider
  y += 26;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);

  // 2. Bill To & Project Info
  y += 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('BILLED TO:', margin, y);

  if (invoice.projectName) {
    doc.text('PROJECT DETAILS:', pageWidth / 2 + 20, y);
  }

  y += 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(invoice.clientName, margin, y);

  if (invoice.projectName) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Project: ${invoice.projectName}`, pageWidth / 2 + 20, y);
  }

  y += 13;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  if (invoice.clientEmail) {
    doc.text(`Email: ${invoice.clientEmail}`, margin, y);
  }
  if (invoice.workId) {
    doc.text(`Project ID: ${invoice.workId}`, pageWidth / 2 + 20, y);
  }

  y += 13;
  if (invoice.clientPhone) {
    doc.text(`Contact: ${invoice.clientPhone}`, margin, y);
  }

  // Payment Status Badge
  const statusX = pageWidth - margin;
  const statusText = (invoice.paymentStatus || 'Pending').toUpperCase();
  let statusBg = [254, 243, 199]; // amber
  let statusColor = [180, 83, 9];
  if (invoice.paymentStatus === 'Paid') {
    statusBg = [209, 250, 229]; // emerald
    statusColor = [4, 120, 87];
  } else if ((invoice.paymentStatus as string) === 'Cancelled') {
    statusBg = [254, 226, 226]; // rose
    statusColor = [185, 28, 28];
  }

  doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
  doc.roundedRect(statusX - 70, y - 24, 70, 20, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(statusText, statusX - 35, y - 11, { align: 'center' });

  // 3. Line Items Table
  y += 28;
  const tableTop = y;
  const tableWidth = pageWidth - margin * 2;

  // Header row
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.rect(margin, y, tableWidth, 22, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y + 22, margin + tableWidth, y + 22);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('DESCRIPTION', margin + 10, y + 14);
  doc.text('QTY', margin + 290, y + 14, { align: 'center' });
  doc.text('RATE', margin + 370, y + 14, { align: 'right' });
  doc.text('AMOUNT', margin + tableWidth - 10, y + 14, { align: 'right' });

  y += 22;

  // Items
  const currency = settings.currencySymbol || '₹';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

  const items = invoice.items && invoice.items.length > 0
    ? invoice.items
    : [
        {
          id: 'item-1',
          description: invoice.projectName || 'Media Production / Editing Services',
          quantity: 1,
          rate: invoice.total,
          amount: invoice.total,
        },
      ];

  items.forEach((item, index) => {
    const rowY = y + 16;
    doc.text(item.description, margin + 10, rowY);
    doc.text(String(item.quantity), margin + 290, rowY, { align: 'center' });
    doc.text(`${currency} ${(Number(item.rate) || 0).toLocaleString()}`, margin + 370, rowY, { align: 'right' });
    doc.text(`${currency} ${(Number(item.amount) || 0).toLocaleString()}`, margin + tableWidth - 10, rowY, { align: 'right' });

    y += 24;
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y, margin + tableWidth, y);
  });

  // 4. Totals & Balance Breakdown
  y += 15;
  const totalsLeft = margin + tableWidth - 200;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text('Subtotal:', totalsLeft, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`${currency} ${(Number(invoice.subtotal) || 0).toLocaleString()}`, margin + tableWidth - 10, y, { align: 'right' });

  if (invoice.tax && invoice.tax > 0) {
    y += 16;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text('Tax / GST:', totalsLeft, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`${currency} ${(Number(invoice.tax) || 0).toLocaleString()}`, margin + tableWidth - 10, y, { align: 'right' });
  }

  y += 16;
  doc.setDrawColor(226, 232, 240);
  doc.line(totalsLeft, y, margin + tableWidth, y);
  y += 14;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text('Total:', totalsLeft, y);
  doc.text(`${currency} ${(Number(invoice.total) || 0).toLocaleString()}`, margin + tableWidth - 10, y, { align: 'right' });

  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text('Paid to Date:', totalsLeft, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // emerald
  doc.text(`${currency} ${(Number(invoice.paidAmount) || 0).toLocaleString()}`, margin + tableWidth - 10, y, { align: 'right' });

  y += 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(225, 29, 72); // rose
  doc.text('Balance Due:', totalsLeft, y);
  doc.text(`${currency} ${(Number(invoice.dueAmount) || 0).toLocaleString()}`, margin + tableWidth - 10, y, { align: 'right' });

  // 5. Payment Details / Bank Info
  const bankDetailsY = tableTop + 30 + items.length * 24;
  if (settings.bankDetails || settings.upiId) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('PAYMENT INSTRUCTIONS:', margin, bankDetailsY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);

    let by = bankDetailsY + 12;
    if (settings.upiId) {
      doc.text(`UPI ID: ${settings.upiId}`, margin, by);
      by += 11;
    }
    if (settings.bankDetails?.bankName) {
      doc.text(`Bank: ${settings.bankDetails.bankName}`, margin, by);
      by += 11;
    }
    if (settings.bankDetails?.accountNumber) {
      doc.text(`A/C: ${settings.bankDetails.accountNumber}`, margin, by);
      by += 11;
    }
    if (settings.bankDetails?.ifsc) {
      doc.text(`IFSC: ${settings.bankDetails.ifsc}`, margin, by);
    }
  }

  // 6. Notes & Footer
  const footerY = doc.internal.pageSize.getHeight() - 55;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  const notesText = invoice.notes || settings.receiptNotes || 'Thank you for your business. All deliverables are protected under master agreement.';
  doc.text(notesText, margin, footerY + 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Generated by ${settings.businessName || 'Vidzyra CRM'} on ${new Date().toLocaleDateString()}`, pageWidth - margin, footerY + 12, { align: 'right' });

  // Save / Download
  const filename = `Invoice-${invoice.invoiceNumber || 'draft'}.pdf`;
  doc.save(filename);
}

/**
 * Generates and downloads a clean, professional Payment Receipt.
 */
export function generateReceiptPdf(receipt: Receipt, settings: BusinessSettings): void {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = 45;

  const primaryColor = [15, 23, 42];
  const emeraldColor = [16, 185, 129];
  const mutedColor = [100, 116, 139];

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(settings.businessName || 'VIDZYRA MEDIA', margin, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
  doc.text('PAYMENT RECEIPT', pageWidth - margin, y, { align: 'right' });

  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  if (settings.tagline) {
    doc.text(settings.tagline, margin, y);
    y += 12;
  }
  doc.text(`Email: ${settings.contactEmail || 'contact@vidzyra.com'} | Tel: ${settings.contactPhone || '+91 98765 43210'}`, margin, y);

  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`Receipt #: ${receipt.receiptNumber}`, pageWidth - margin, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Date: ${receipt.paymentDate || new Date().toISOString().split('T')[0]}`, pageWidth - margin, y + 14, { align: 'right' });

  y += 26;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);

  // Received From
  y += 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('RECEIVED FROM:', margin, y);

  y += 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(receipt.clientName, margin, y);

  if (receipt.projectName) {
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text(`Applied to Project: ${receipt.projectName}`, margin, y);
  }

  // Payment Badge Box
  y += 25;
  const currency = settings.currencySymbol || '₹';
  doc.setFillColor(240, 253, 244); // light emerald
  doc.roundedRect(margin, y, pageWidth - margin * 2, 60, 6, 6, 'F');
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 60, 6, 6, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(6, 95, 70);
  doc.text('AMOUNT RECEIVED', margin + 20, y + 22);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(4, 120, 87);
  doc.text(`${currency} ${(Number(receipt.amountReceived) || 0).toLocaleString()}`, margin + 20, y + 48);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(6, 95, 70);
  doc.text(`Method: ${receipt.paymentMethod}`, pageWidth - margin - 20, y + 25, { align: 'right' });
  doc.text(`Status: CLEARED / VERIFIED`, pageWidth - margin - 20, y + 42, { align: 'right' });

  // Details
  y += 85;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('TRANSACTION PARTICULARS', margin, y);

  y += 14;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);

  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text('Payment Channel / Method:', margin, y);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(receipt.paymentMethod, margin + 180, y);

  y += 16;
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text('Remaining Client Balance:', margin, y);
  doc.setFont('helvetica', 'bold');
  const safeRemBalance = Number(receipt.remainingBalance) || 0;
  doc.setTextColor(safeRemBalance > 0 ? 225 : 16, safeRemBalance > 0 ? 29 : 185, safeRemBalance > 0 ? 72 : 129);
  doc.text(`${currency} ${safeRemBalance.toLocaleString()}`, margin + 180, y);

  if (receipt.notes) {
    y += 16;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text('Notes / Remarks:', margin, y);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(receipt.notes, margin + 180, y);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 50;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text('This is a computer-generated receipt and requires no physical signature.', margin, footerY);

  const filename = `Receipt-${receipt.receiptNumber || 'payment'}.pdf`;
  doc.save(filename);
}

/**
 * Feature 12: PDF Data Export
 * Generates an Executive CRM Snapshot / Audit Report from Data Center.
 */
export function generateCrmSnapshotPdf(params: {
  settings: BusinessSettings;
  projects: WorkProject[];
  clients: Client[];
  editors: Editor[];
  financialPulse: {
    totalRevenue: number;
    totalClientBilling: number;
    totalPaymentsReceived: number;
    totalEditorCost: number;
    totalEditorPaid: number;
    totalExpenses: number;
    netProfit: number;
  };
}): void {
  const { settings, projects, clients, editors, financialPulse } = params;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = 45;

  const currency = settings.currencySymbol || '₹';

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.text(`${settings.businessName || 'VIDZYRA'} - CRM AUDIT & DATA SNAPSHOT`, margin, y);

  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleString()} | Cloud Firestore Backup Snapshot`, margin, y);

  y += 18;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);

  // Financial Metrics Summary Box
  y += 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('1. FINANCIAL HEALTH & PROFIT OVERVIEW', margin, y);

  y += 14;
  const boxWidth = (pageWidth - margin * 2 - 20) / 3;

  // Box 1: Total Revenue
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, boxWidth, 48, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, boxWidth, 48, 'S');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL REVENUE RECEIVED', margin + 10, y + 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(16, 185, 129);
  doc.text(`${currency} ${financialPulse.totalPaymentsReceived.toLocaleString()}`, margin + 10, y + 36);

  // Box 2: Total Editor Costs
  const box2X = margin + boxWidth + 10;
  doc.setFillColor(248, 250, 252);
  doc.rect(box2X, y, boxWidth, 48, 'F');
  doc.rect(box2X, y, boxWidth, 48, 'S');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL EDITOR EXPENSES', box2X + 10, y + 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(225, 29, 72);
  doc.text(`${currency} ${financialPulse.totalEditorCost.toLocaleString()}`, box2X + 10, y + 36);

  // Box 3: Net Profit
  const box3X = box2X + boxWidth + 10;
  doc.setFillColor(248, 250, 252);
  doc.rect(box3X, y, boxWidth, 48, 'F');
  doc.rect(box3X, y, boxWidth, 48, 'S');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('NET AGENCY PROFIT', box3X + 10, y + 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(79, 70, 229);
  doc.text(`${currency} ${financialPulse.netProfit.toLocaleString()}`, box3X + 10, y + 36);

  // Project Summary Table
  y += 70;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`2. RECENT PROJECTS & DELIVERABLES (${projects.length} Total)`, margin, y);

  y += 12;
  const tableWidth = pageWidth - margin * 2;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, tableWidth, 18, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('PROJECT NAME', margin + 8, y + 12);
  doc.text('CLIENT', margin + 180, y + 12);
  doc.text('STATUS', margin + 300, y + 12);
  doc.text('DEADLINE', margin + 400, y + 12);
  doc.text('AMOUNT', margin + tableWidth - 8, y + 12, { align: 'right' });

  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);

  const displayedProjects = projects.slice(0, 15);
  displayedProjects.forEach((proj) => {
    const client = clients.find((c) => c.id === proj.clientId);
    const clientName = client ? client.name : 'Unknown';

    doc.text(proj.name.substring(0, 28), margin + 8, y + 12);
    doc.text(clientName.substring(0, 20), margin + 180, y + 12);
    doc.text(proj.status, margin + 300, y + 12);
    doc.text(proj.dueDate || 'No date', margin + 400, y + 12);
    doc.text(`${currency} ${proj.totalBilling.toLocaleString()}`, margin + tableWidth - 8, y + 12, { align: 'right' });

    y += 16;
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y, margin + tableWidth, y);
  });

  // Client & Team Stats
  y += 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('3. WORKFORCE & CLIENT ROSTER STATS', margin, y);

  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Total Active Clients: ${clients.length}`, margin, y);
  doc.text(`Total Active Editors: ${editors.length}`, margin + 180, y);
  doc.text(`Total Projects: ${projects.length}`, margin + 340, y);

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 35;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Confidential - For Internal Vidzyra Management Use Only. Exported on ${new Date().toLocaleDateString()}`, margin, footerY);

  doc.save(`Vidzyra-CRM-Audit-Snapshot-${new Date().toISOString().split('T')[0]}.pdf`);
}

// ==========================================
// FULL DATABASE SNAPSHOT & EXPORT REPORT (PDF)
// ==========================================

export function getBackupTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  return `${year}-${month}-${day}-${hours}-${minutes}`;
}

export interface DatabaseSnapshotData {
  settings: BusinessSettings;
  clients: Client[];
  editors: Editor[];
  projects: WorkProject[];
  clientPayments: ClientPayment[];
  editorPayments: EditorPayment[];
  expenses: Expense[];
  invoices?: Invoice[];
  receipts?: Receipt[];
  notifications?: NotificationItem[];
  activities?: Activity[];
  revisions?: any[];
  sharedLinks?: any[];
  ratings?: any[];
  chatMessages?: any[];
}

interface ColumnDef {
  header: string;
  width: number; // percentage of tableWidth (sum ~ 100)
  align?: 'left' | 'right' | 'center';
  accessor: (item: any) => string;
}

function renderSectionTable(
  doc: jsPDF,
  title: string,
  columns: ColumnDef[],
  data: any[],
  startY: number,
  pageWidth: number,
  margin: number,
  pageHeight: number
): number {
  let y = startY;

  const checkNewPage = (neededHeight: number): number => {
    if (y + neededHeight > pageHeight - 50) {
      doc.addPage();
      return 45;
    }
    return y;
  };

  // Section Header
  y = checkNewPage(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(title, margin, y);
  y += 5;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.75);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  const tableWidth = pageWidth - margin * 2;

  // Header row drawer
  const drawTableHeader = () => {
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(margin, y, tableWidth, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);

    let curX = margin + 6;
    for (const col of columns) {
      const colW = (col.width / 100) * tableWidth;
      const textX =
        col.align === 'right' ? curX + colW - 12 : col.align === 'center' ? curX + colW / 2 : curX;
      doc.text(col.header, textX, y + 12, { align: col.align || 'left' });
      curX += colW;
    }
    y += 18;
  };

  drawTableHeader();

  if (data.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('(No records in database)', margin + 8, y + 14);
    y += 24;
    return y;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);

  let rowIndex = 0;
  for (const item of data) {
    if (y + 18 > pageHeight - 50) {
      doc.addPage();
      y = 45;
      drawTableHeader();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
    }

    if (rowIndex % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, tableWidth, 16, 'F');
    }

    let curX = margin + 6;
    for (const col of columns) {
      const colW = (col.width / 100) * tableWidth;
      const val = String(col.accessor(item) ?? '');
      const maxChars = Math.max(6, Math.floor(colW / 4.8));
      const displayVal = val.length > maxChars ? val.substring(0, maxChars - 2) + '…' : val;
      const textX =
        col.align === 'right' ? curX + colW - 12 : col.align === 'center' ? curX + colW / 2 : curX;
      doc.text(displayVal, textX, y + 11, { align: col.align || 'left' });
      curX += colW;
    }

    y += 16;
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y, margin + tableWidth, y);
    rowIndex++;
  }

  y += 16;
  return y;
}

/**
 * Generates and downloads a complete, professional Vidzyra CRM Database Snapshot PDF report.
 * This document is formatted strictly for viewing, printing, record keeping, and auditing.
 * It does NOT restore database data.
 */
export function generateDatabaseSnapshotPdf(data: DatabaseSnapshotData): void {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36;
  let y = 42;

  const currency = data.settings.currency || 'INR';
  const now = new Date();
  const formattedExportDate = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

  // ==========================================
  // 1. COVER / MAIN HEADER BLOCK
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('VIDZYRA WORK MANAGEMENT', margin, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text('DATABASE SNAPSHOT & AUDIT REPORT', pageWidth - margin, y - 4, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Export Date: ${formattedExportDate}`, pageWidth - margin, y + 10, { align: 'right' });

  y += 24;

  // Important Distinction Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 34, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('DOCUMENT CLASSIFICATION: CONFIDENTIAL CRM SNAPSHOT (READ-ONLY)', margin + 10, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Notice: This report is generated strictly for human review, offline archiving, and auditing. It cannot be used to restore database records.',
    margin + 10,
    y + 26
  );

  y += 44;

  // Key Totals Overview Strip
  const totalBilled = data.projects.reduce((acc, p) => acc + (Number(p.totalBilling) || 0), 0);
  const totalCollected = data.clientPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const totalPayouts = data.editorPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const totalExpenses = data.expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

  const statCols = [
    { label: 'CLIENTS', val: `${data.clients.length}` },
    { label: 'EDITORS', val: `${data.editors.length}` },
    { label: 'PROJECTS', val: `${data.projects.length}` },
    { label: 'BILLED', val: `${currency} ${totalBilled.toLocaleString()}` },
    { label: 'COLLECTED', val: `${currency} ${totalCollected.toLocaleString()}` },
    { label: 'PAYOUTS', val: `${currency} ${totalPayouts.toLocaleString()}` },
    { label: 'EXPENSES', val: `${currency} ${totalExpenses.toLocaleString()}` },
  ];

  const statWidth = (pageWidth - margin * 2) / statCols.length;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 36, 4, 4, 'F');

  let statX = margin;
  statCols.forEach((stat) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(stat.label, statX + statWidth / 2, y + 13, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(stat.val, statX + statWidth / 2, y + 27, { align: 'center' });
    statX += statWidth;
  });

  y += 48;

  // ==========================================
  // SECTION: BUSINESS & CRM SETTINGS
  // (Never expose sensitive credentials or keys)
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. BUSINESS & CRM SETTINGS', margin, y);
  y += 5;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.75);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Agency Name: ${data.settings.businessName || 'Vidzyra Media'}`, margin + 6, y);
  doc.text(`Tagline: ${data.settings.tagline || 'N/A'}`, margin + 200, y);
  doc.text(`Currency: ${currency}`, margin + 380, y);
  y += 13;
  doc.text(`Contact Email: ${data.settings.contactEmail || 'N/A'}`, margin + 6, y);
  doc.text(`Contact Phone: ${data.settings.contactPhone || 'N/A'}`, margin + 200, y);
  doc.text(`WhatsApp: ${data.settings.whatsappNumber || 'N/A'}`, margin + 380, y);
  y += 13;
  doc.text(`Admin Contact: ${data.settings.adminName || 'Admin'} (${data.settings.adminEmail || 'admin@vidzyra.com'})`, margin + 6, y);
  doc.text(`Invoice Prefix: ${data.settings.invoicePrefix || 'INV-'}`, margin + 200, y);
  doc.text(`Payment Terms: ${data.settings.defaultPaymentTerms || 'Due on Receipt'}`, margin + 380, y);

  y += 24;

  // ==========================================
  // SECTION: CLIENTS
  // ==========================================
  y = renderSectionTable(
    doc,
    `2. CLIENTS DIRECTORY (${data.clients.length} Total Records)`,
    [
      { header: 'NAME', width: 22, accessor: (c) => c.name },
      { header: 'EMAIL', width: 25, accessor: (c) => c.email || '—' },
      { header: 'PHONE / WHATSAPP', width: 18, accessor: (c) => c.whatsapp || c.phone || '—' },
      { header: 'TYPE', width: 12, accessor: (c) => c.type },
      { header: 'PORTAL STATUS', width: 13, accessor: (c) => c.portalStatus || 'Active' },
      {
        header: 'BILLED',
        width: 10,
        align: 'right',
        accessor: (c) => {
          const clientBilled = data.projects
            .filter((p) => p.clientId === c.id)
            .reduce((acc, p) => acc + (Number(p.totalBilling) || 0), 0);
          return `${clientBilled}`;
        },
      },
    ],
    data.clients,
    y,
    pageWidth,
    margin,
    pageHeight
  );

  // ==========================================
  // SECTION: EDITORS
  // ==========================================
  y = renderSectionTable(
    doc,
    `3. EDITORS & PRODUCTION WORKFORCE (${data.editors.length} Total Records)`,
    [
      { header: 'NAME', width: 22, accessor: (e) => e.name },
      { header: 'EMAIL', width: 26, accessor: (e) => e.email || '—' },
      { header: 'PHONE / CONTACT', width: 18, accessor: (e) => e.whatsapp || e.phone || '—' },
      { header: 'AVAILABILITY', width: 12, accessor: (e) => e.availability || 'Available' },
      { header: 'PORTAL STATUS', width: 12, accessor: (e) => e.portalStatus || 'Active' },
      { header: 'RATE / CHARGE', width: 10, align: 'right', accessor: (e) => `${currency} ${e.costPerVideo || 0}` },
    ],
    data.editors,
    y,
    pageWidth,
    margin,
    pageHeight
  );

  // ==========================================
  // SECTION: PROJECTS / WORK DELIVERABLES
  // ==========================================
  y = renderSectionTable(
    doc,
    `4. PROJECTS & WORK DELIVERABLES (${data.projects.length} Total Records)`,
    [
      { header: 'PROJECT NAME', width: 24, accessor: (p) => p.name },
      {
        header: 'CLIENT',
        width: 16,
        accessor: (p) => {
          const c = data.clients.find((cl) => cl.id === p.clientId);
          return c ? c.name : 'Unknown';
        },
      },
      {
        header: 'EDITOR',
        width: 15,
        accessor: (p) => {
          const ed = data.editors.find((e) => e.id === p.editorId);
          return ed ? ed.name : 'Unassigned';
        },
      },
      { header: 'STATUS', width: 13, accessor: (p) => p.status },
      { header: 'DUE DATE', width: 11, accessor: (p) => p.dueDate || '—' },
      { header: 'DRIVE FOLDER', width: 11, accessor: (p) => p.driveFolderLink || '—' },
      {
        header: 'BILLING',
        width: 10,
        align: 'right',
        accessor: (p) => `${currency} ${Number(p.totalBilling || 0).toLocaleString()}`,
      },
    ],
    data.projects,
    y,
    pageWidth,
    margin,
    pageHeight
  );

  // ==========================================
  // SECTION: CLIENT PAYMENTS
  // ==========================================
  y = renderSectionTable(
    doc,
    `5. CLIENT BILLING PAYMENTS (${data.clientPayments.length} Total Records)`,
    [
      { header: 'ID / REF', width: 15, accessor: (p) => p.id },
      {
        header: 'CLIENT',
        width: 25,
        accessor: (p) => {
          const c = data.clients.find((cl) => cl.id === p.clientId);
          return c ? c.name : p.clientName || 'Unknown';
        },
      },
      { header: 'DATE', width: 15, accessor: (p) => p.date },
      { header: 'METHOD', width: 15, accessor: (p) => p.method || 'Bank Transfer' },
      { header: 'NOTES / REFERENCE', width: 18, accessor: (p) => p.notes || p.refNumber || '—' },
      {
        header: 'AMOUNT',
        width: 12,
        align: 'right',
        accessor: (p) => `${currency} ${Number(p.amount || 0).toLocaleString()}`,
      },
    ],
    data.clientPayments,
    y,
    pageWidth,
    margin,
    pageHeight
  );

  // ==========================================
  // SECTION: EDITOR PAYOUTS
  // ==========================================
  y = renderSectionTable(
    doc,
    `6. EDITOR PAYOUTS (${data.editorPayments.length} Total Records)`,
    [
      { header: 'ID / REF', width: 15, accessor: (p) => p.id },
      {
        header: 'EDITOR',
        width: 25,
        accessor: (p) => {
          const ed = data.editors.find((e) => e.id === p.editorId);
          return ed ? ed.name : p.editorName || 'Unknown';
        },
      },
      { header: 'DATE', width: 15, accessor: (p) => p.date },
      { header: 'METHOD', width: 15, accessor: (p) => p.method || 'UPI / Bank' },
      { header: 'NOTES / REFERENCE', width: 18, accessor: (p) => p.notes || p.refNumber || '—' },
      {
        header: 'AMOUNT',
        width: 12,
        align: 'right',
        accessor: (p) => `${currency} ${Number(p.amount || 0).toLocaleString()}`,
      },
    ],
    data.editorPayments,
    y,
    pageWidth,
    margin,
    pageHeight
  );

  // ==========================================
  // SECTION: EXPENSES
  // ==========================================
  y = renderSectionTable(
    doc,
    `7. OPERATIONAL EXPENSES (${data.expenses.length} Total Records)`,
    [
      { header: 'EXPENSE TITLE', width: 28, accessor: (e) => e.name || e.title || 'Expense' },
      { header: 'CATEGORY', width: 24, accessor: (e) => e.category },
      { header: 'DATE', width: 16, accessor: (e) => e.date },
      { header: 'PAYMENT METHOD', width: 18, accessor: (e) => e.paymentMethod || 'Online' },
      {
        header: 'AMOUNT',
        width: 14,
        align: 'right',
        accessor: (e) => `${currency} ${Number(e.amount || 0).toLocaleString()}`,
      },
    ],
    data.expenses,
    y,
    pageWidth,
    margin,
    pageHeight
  );

  // ==========================================
  // SECTION: INVOICES
  // ==========================================
  const invoices = data.invoices || [];
  y = renderSectionTable(
    doc,
    `8. INVOICES & BILLING DOCUMENTS (${invoices.length} Total Records)`,
    [
      { header: 'INVOICE #', width: 18, accessor: (inv) => inv.invoiceNumber },
      { header: 'CLIENT NAME', width: 25, accessor: (inv) => inv.clientName },
      { header: 'DATE', width: 13, accessor: (inv) => inv.date },
      { header: 'DUE DATE', width: 13, accessor: (inv) => inv.dueDate || '—' },
      { header: 'STATUS', width: 11, accessor: (inv) => inv.status },
      {
        header: 'TOTAL',
        width: 10,
        align: 'right',
        accessor: (inv) => `${currency} ${Number(inv.total || 0).toLocaleString()}`,
      },
      {
        header: 'BALANCE',
        width: 10,
        align: 'right',
        accessor: (inv) => `${currency} ${Number(inv.balance || 0).toLocaleString()}`,
      },
    ],
    invoices,
    y,
    pageWidth,
    margin,
    pageHeight
  );

  // ==========================================
  // SECTION: RECEIPTS
  // ==========================================
  const receipts = data.receipts || [];
  y = renderSectionTable(
    doc,
    `9. RECEIPTS ISSUED (${receipts.length} Total Records)`,
    [
      { header: 'RECEIPT #', width: 18, accessor: (r) => r.receiptNumber },
      { header: 'PAYEE / CLIENT', width: 25, accessor: (r) => r.clientName },
      { header: 'DATE', width: 15, accessor: (r) => r.paymentDate },
      { header: 'METHOD', width: 15, accessor: (r) => r.paymentMethod || 'Bank' },
      {
        header: 'AMOUNT RECEIVED',
        width: 14,
        align: 'right',
        accessor: (r) => `${currency} ${Number(r.amountReceived || 0).toLocaleString()}`,
      },
      {
        header: 'BALANCE DUE',
        width: 13,
        align: 'right',
        accessor: (r) => `${currency} ${Number(r.balanceDue || 0).toLocaleString()}`,
      },
    ],
    receipts,
    y,
    pageWidth,
    margin,
    pageHeight
  );

  // ==========================================
  // SECTION: REVISIONS & CHANGE REQUESTS
  // ==========================================
  const revisions = data.revisions || [];
  y = renderSectionTable(
    doc,
    `10. REVISIONS & CHANGE REQUESTS (${revisions.length} Total Records)`,
    [
      { header: 'PROJECT', width: 25, accessor: (r) => r.projectName || r.projectId || 'Project' },
      { header: 'TIMECODE', width: 15, accessor: (r) => r.timecode || 'All' },
      { header: 'STATUS', width: 15, accessor: (r) => r.status || 'Pending' },
      { header: 'REQUESTED ON', width: 15, accessor: (r) => r.createdAt || r.date || '—' },
      { header: 'FEEDBACK / NOTES', width: 30, accessor: (r) => r.notes || r.feedback || '—' },
    ],
    revisions,
    y,
    pageWidth,
    margin,
    pageHeight
  );

  // ==========================================
  // SECTION: RATINGS & REVIEWS
  // ==========================================
  const ratings = data.ratings || [];
  y = renderSectionTable(
    doc,
    `11. RATINGS & REVIEWS (${ratings.length} Total Records)`,
    [
      { header: 'TARGET ID / ENTITY', width: 22, accessor: (r) => r.targetId || r.targetName || 'Entity' },
      { header: 'ROLE / TYPE', width: 15, accessor: (r) => r.role || r.type || 'Review' },
      { header: 'SCORE (1-5)', width: 12, align: 'center', accessor: (r) => `${r.score || r.rating || 5} ★` },
      { header: 'DATE', width: 15, accessor: (r) => r.createdAt || r.date || '—' },
      { header: 'FEEDBACK / COMMENT', width: 36, accessor: (r) => r.comment || r.feedback || '—' },
    ],
    ratings,
    y,
    pageWidth,
    margin,
    pageHeight
  );

  // ==========================================
  // SECTION: SHARED PORTAL LINKS
  // ==========================================
  const sharedLinks = data.sharedLinks || [];
  y = renderSectionTable(
    doc,
    `12. SHARED PORTAL LINKS (${sharedLinks.length} Total Records)`,
    [
      { header: 'PORTAL TYPE', width: 18, accessor: (l) => (l.type || 'portal').toUpperCase() },
      { header: 'TARGET ID', width: 25, accessor: (l) => l.targetId || '—' },
      { header: 'PORTAL TOKEN', width: 32, accessor: (l) => l.token || l.id || '—' },
      { header: 'STATUS', width: 12, accessor: (l) => (l.isActive ? 'Active' : 'Inactive') },
      { header: 'CREATED AT', width: 13, accessor: (l) => l.createdAt ? String(l.createdAt).split('T')[0] : '—' },
    ],
    sharedLinks,
    y,
    pageWidth,
    margin,
    pageHeight
  );

  // ==========================================
  // SECTION: NOTIFICATIONS
  // ==========================================
  const notifications = data.notifications || [];
  y = renderSectionTable(
    doc,
    `13. NOTIFICATIONS AUDIT (${notifications.length} Total Records)`,
    [
      { header: 'DATE / TIME', width: 20, accessor: (n) => n.date || '—' },
      { header: 'ROLE / AUDIENCE', width: 15, accessor: (n) => n.role || 'Admin' },
      { header: 'STATUS', width: 12, accessor: (n) => (n.read ? 'Read' : 'Unread') },
      { header: 'NOTIFICATION MESSAGE', width: 53, accessor: (n) => n.message },
    ],
    notifications,
    y,
    pageWidth,
    margin,
    pageHeight
  );

  // ==========================================
  // SECTION: RECENT AUDIT ACTIVITIES
  // ==========================================
  const activities = data.activities || [];
  y = renderSectionTable(
    doc,
    `14. RECENT AUDIT ACTIVITIES (${activities.length} Total Records)`,
    [
      { header: 'TIMESTAMP', width: 18, accessor: (a) => a.timestamp || a.date || '—' },
      { header: 'OPERATOR', width: 15, accessor: (a) => a.who || 'System' },
      { header: 'ACTION', width: 20, accessor: (a) => a.action },
      { header: 'ENTITY', width: 12, accessor: (a) => a.entityType || '—' },
      { header: 'DETAILS', width: 35, accessor: (a) => a.what },
    ],
    activities,
    y,
    pageWidth,
    margin,
    pageHeight
  );

  // ==========================================
  // RUNNING HEADERS & FOOTERS (Page X of Y)
  // ==========================================
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Header for pages 2+
    if (i > 1) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('VIDZYRA WORK MANAGEMENT — Database Snapshot', margin, 24);
      doc.text(`Generated: ${formattedExportDate}`, pageWidth - margin, 24, { align: 'right' });
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.5);
      doc.line(margin, 28, pageWidth - margin, 28);
    }

    // Running Footer
    const footerY = pageHeight - 20;
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 8, pageWidth - margin, footerY - 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'CONFIDENTIAL — For Internal Vidzyra Management & Record Keeping (Not for database restore)',
      margin,
      footerY
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
  }

  // Save the PDF
  const filename = `Vidzyra-CRM-Database-Snapshot-${getBackupTimestamp()}.pdf`;
  doc.save(filename);
}
