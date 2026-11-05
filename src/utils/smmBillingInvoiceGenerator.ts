import { jsPDF } from 'jspdf';
import { SocialMediaClient, SmmMonthlyCycle, BusinessSettings } from '../types';

export interface SmmBillingInvoiceParams {
  client: SocialMediaClient;
  cycle: SmmMonthlyCycle;
  settings?: BusinessSettings;
}

/**
 * Computes cycle metrics with strict financial isolation:
 * Total Payment = Monthly Package Amount + Extra Work Amount
 * Received Payment = Sum of all valid payments received for that client/month
 * Remaining Payment = Math.max(0, Total Payment - Received Payment)
 */
export function getCyclePaymentMetrics(client: SocialMediaClient, cycle: SmmMonthlyCycle) {
  const packagePrice = Number(cycle.packagePrice) || Number(client.monthlyPackagePrice) || 0;
  const extraWorkList = cycle.extraWork || [];
  const extraWorkTotal = extraWorkList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalPayment = packagePrice + extraWorkTotal;

  const paymentsList = cycle.payments || [];
  const receivedPayment = paymentsList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const remainingPayment = Math.max(0, totalPayment - receivedPayment);

  let paymentStatus: 'Paid' | 'Partially Paid' | 'Pending' = 'Pending';
  if (remainingPayment === 0 && totalPayment > 0) {
    paymentStatus = 'Paid';
  } else if (receivedPayment > 0 && remainingPayment > 0) {
    paymentStatus = 'Partially Paid';
  } else if (receivedPayment === 0) {
    paymentStatus = 'Pending';
  }

  return {
    packagePrice,
    extraWorkList,
    extraWorkTotal,
    totalPayment,
    paymentsList,
    receivedPayment,
    remainingPayment,
    paymentStatus,
  };
}

export function formatINR(val: number): string {
  return `Rs. ${(val || 0).toLocaleString('en-IN')}`;
}

export function formatINRWithSymbol(val: number): string {
  return `₹${(val || 0).toLocaleString('en-IN')}`;
}

/**
 * Downloads a high-quality PDF billing statement / invoice for the selected SMM client & cycle.
 */
export function generateSmmBillingInvoicePdf({ client, cycle, settings }: SmmBillingInvoiceParams): void {
  const metrics = getCyclePaymentMetrics(client, cycle);
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;

  const invoiceNumber = `INV-SMM-${cycle.yearMonth.replace('-', '')}-${client.id.slice(-4).toUpperCase()}`;
  const today = new Date().toISOString().split('T')[0];

  let y = 36;

  // Header Bar (Dark Slate)
  doc.setFillColor(15, 23, 42); // #0f172a
  doc.rect(margin, y, contentWidth, 70, 'F');

  // Business Name / CRM
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(settings?.businessName || 'VIDZYRA CREATIVE AGENCY', margin + 16, y + 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('SOCIAL MEDIA MANAGEMENT • BILLING STATEMENT & INVOICE', margin + 16, y + 46);

  // Invoice Number & Billing Month on right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(199, 210, 254); // indigo-200
  doc.text(`Invoice: #${invoiceNumber}`, pageWidth - margin - 16, y + 28, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(226, 232, 240);
  doc.text(`Month: ${cycle.cycleLabel || cycle.yearMonth} | Date: ${today}`, pageWidth - margin - 16, y + 46, { align: 'right' });

  y += 82;

  // Client Details Card & Package Summary (2 columns)
  const cardHeight = 88;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, contentWidth, cardHeight, 4, 4, 'FD');

  const col1X = margin + 14;
  const col2X = margin + contentWidth / 2 + 10;

  // Left Column: Client Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text('BILLED TO (CLIENT DETAILS)', col1X, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Client / Business:', col1X, y + 36);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(client.name || 'N/A', col1X + 85, y + 36);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Contact Person:', col1X, y + 52);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(client.contactPerson || client.phone || 'N/A', col1X + 85, y + 52);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Phone / WhatsApp:', col1X, y + 68);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(client.whatsapp || client.phone || 'N/A', col1X + 85, y + 68);

  if (client.email) {
    doc.text(`Email: ${client.email}`, col1X, y + 80);
  }

  // Right Column: Package Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(79, 70, 229);
  doc.text('PACKAGE & BILLING PERIOD', col2X, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Package Name:', col2X, y + 36);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(client.packageName || 'Social Media Management', col2X + 80, y + 36);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Monthly Package:', col2X, y + 52);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(79, 70, 229);
  doc.text(formatINR(metrics.packagePrice), col2X + 80, y + 52);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Billing Period:', col2X, y + 68);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${cycle.cycleLabel || cycle.yearMonth} (${client.billingCycle || 'Monthly'})`, col2X + 80, y + 68);

  y += cardHeight + 14;

  // Financial Summary Cards (4 Cards across content width)
  const statBoxW = (contentWidth - 18) / 4;
  const statBoxH = 50;

  // 1. Total Payment
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, statBoxW, statBoxH, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL PAYMENT', margin + 8, y + 16);
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(formatINR(metrics.totalPayment), margin + 8, y + 36);

  // 2. Received Payment
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(margin + statBoxW + 6, y, statBoxW, statBoxH, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(16, 185, 129);
  doc.text('RECEIVED PAYMENT', margin + statBoxW + 14, y + 16);
  doc.setFontSize(12);
  doc.setTextColor(4, 120, 87);
  doc.text(formatINR(metrics.receivedPayment), margin + statBoxW + 14, y + 36);

  // 3. Remaining Payment
  doc.setFillColor(metrics.remainingPayment === 0 ? 236 : 255, metrics.remainingPayment === 0 ? 253 : 241, metrics.remainingPayment === 0 ? 245 : 242);
  doc.roundedRect(margin + (statBoxW + 6) * 2, y, statBoxW, statBoxH, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(metrics.remainingPayment === 0 ? 16 : 225, metrics.remainingPayment === 0 ? 185 : 29, metrics.remainingPayment === 0 ? 129 : 72);
  doc.text('REMAINING PAYMENT', margin + (statBoxW + 6) * 2 + 8, y + 16);
  doc.setFontSize(12);
  doc.setTextColor(metrics.remainingPayment === 0 ? 4 : 190, metrics.remainingPayment === 0 ? 120 : 18, metrics.remainingPayment === 0 ? 87 : 60);
  doc.text(formatINR(metrics.remainingPayment), margin + (statBoxW + 6) * 2 + 8, y + 36);

  // 4. Payment Status
  doc.setFillColor(238, 242, 255);
  doc.roundedRect(margin + (statBoxW + 6) * 3, y, statBoxW, statBoxH, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(79, 70, 229);
  doc.text('PAYMENT STATUS', margin + (statBoxW + 6) * 3 + 8, y + 16);
  doc.setFontSize(11);
  doc.setTextColor(67, 56, 202);
  doc.text(metrics.paymentStatus.toUpperCase(), margin + (statBoxW + 6) * 3 + 8, y + 36);

  y += statBoxH + 16;

  // Section: Extra Work Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('EXTRA WORK DETAILS (OUTSIDE PACKAGE)', margin, y);
  y += 8;

  // Extra Work Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('S.No', margin + 6, y + 13);
  doc.text('Date', margin + 35, y + 13);
  doc.text('Work Description / Service', margin + 110, y + 13);
  doc.text('Amount', pageWidth - margin - 8, y + 13, { align: 'right' });
  y += 20;

  if (metrics.extraWorkList.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('No extra work recorded for this month. All deliverables are covered in the monthly package.', margin + 8, y + 14);
    y += 24;
  } else {
    metrics.extraWorkList.forEach((item, idx) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);

      const rowBg = idx % 2 === 0 ? 255 : 248;
      doc.setFillColor(rowBg, rowBg, rowBg);
      doc.rect(margin, y, contentWidth, 18, 'F');

      doc.text(String(idx + 1), margin + 6, y + 12);
      doc.text(item.date || '-', margin + 35, y + 12);
      const desc = `${item.workName}${item.serviceType ? ` (${item.serviceType})` : ''}`;
      doc.text(desc.slice(0, 50), margin + 110, y + 12);
      doc.setFont('helvetica', 'bold');
      doc.text(formatINR(Number(item.amount) || 0), pageWidth - margin - 8, y + 12, { align: 'right' });

      y += 18;
    });

    // Subtotal row for extra work
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('Total Extra Work:', margin + 110, y + 12);
    doc.setTextColor(15, 23, 42);
    doc.text(formatINR(metrics.extraWorkTotal), pageWidth - margin - 8, y + 12, { align: 'right' });
    y += 24;
  }

  y += 6;

  // Section: Payment History
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('PAYMENT TRANSACTIONS & HISTORY', margin, y);
  y += 8;

  // Payment Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('S.No', margin + 6, y + 13);
  doc.text('Date', margin + 35, y + 13);
  doc.text('Payment Mode', margin + 110, y + 13);
  doc.text('Transaction Ref / ID', margin + 210, y + 13);
  doc.text('Notes', margin + 340, y + 13);
  doc.text('Amount', pageWidth - margin - 8, y + 13, { align: 'right' });
  y += 20;

  if (metrics.paymentsList.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('No payment transactions recorded for this monthly cycle yet.', margin + 8, y + 14);
    y += 24;
  } else {
    metrics.paymentsList.forEach((pay, idx) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);

      const rowBg = idx % 2 === 0 ? 255 : 248;
      doc.setFillColor(rowBg, rowBg, rowBg);
      doc.rect(margin, y, contentWidth, 18, 'F');

      doc.text(String(idx + 1), margin + 6, y + 12);
      doc.text(pay.date || '-', margin + 35, y + 12);
      doc.text(pay.paymentMode || 'Payment', margin + 110, y + 12);
      doc.text(pay.referenceNumber || '-', margin + 210, y + 12);
      doc.text((pay.notes || '-').slice(0, 30), margin + 340, y + 12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text(formatINR(Number(pay.amount) || 0), pageWidth - margin - 8, y + 12, { align: 'right' });

      y += 18;
    });

    // Total received row
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('Total Payments Received:', margin + 210, y + 12);
    doc.setTextColor(16, 185, 129);
    doc.text(formatINR(metrics.receivedPayment), pageWidth - margin - 8, y + 12, { align: 'right' });
    y += 24;
  }

  y += 10;

  // Payment Breakdown Summary Box
  const summaryBoxH = 75;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, summaryBoxH, 4, 4, 'FD');

  const sumLeftX = margin + 16;
  const sumRightX = margin + contentWidth / 2 + 20;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Monthly Package Amount:', sumLeftX, y + 20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatINR(metrics.packagePrice), sumLeftX + 130, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Extra Work Amount:', sumLeftX, y + 38);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatINR(metrics.extraWorkTotal), sumLeftX + 130, y + 38);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL BILLING / PAYMENT:', sumLeftX, y + 58);
  doc.setFontSize(10);
  doc.setTextColor(79, 70, 229);
  doc.text(formatINR(metrics.totalPayment), sumLeftX + 130, y + 58);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Total Amount Received:', sumRightX, y + 20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(formatINR(metrics.receivedPayment), sumRightX + 130, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Remaining Balance Due:', sumRightX, y + 38);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(metrics.remainingPayment === 0 ? 16 : 225, metrics.remainingPayment === 0 ? 185 : 29, metrics.remainingPayment === 0 ? 129 : 72);
  doc.text(formatINR(metrics.remainingPayment), sumRightX + 130, y + 38);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Final Payment Status:', sumRightX, y + 58);
  doc.setFontSize(10);
  doc.setTextColor(metrics.paymentStatus === 'Paid' ? 16 : metrics.paymentStatus === 'Partially Paid' ? 217 : 225, metrics.paymentStatus === 'Paid' ? 185 : metrics.paymentStatus === 'Partially Paid' ? 119 : 29, metrics.paymentStatus === 'Paid' ? 129 : metrics.paymentStatus === 'Partially Paid' ? 6 : 72);
  doc.text(metrics.paymentStatus.toUpperCase(), sumRightX + 130, y + 58);

  // Footer (Bottom of page)
  const footerY = pageHeight - 48;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Thank you for choosing Vidzyra for your social media growth and digital content management!', margin, footerY + 14);

  const contactText = `${settings?.contactPhone || settings?.phone || '+91 79 7009 6589'} • ${settings?.contactEmail || settings?.email || 'contact@vidzyra.com'}`;
  doc.text(contactText, pageWidth - margin, footerY + 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('This is a computer-generated billing statement and verified payment receipt.', margin, footerY + 28);

  // Save PDF
  const cleanClientName = (client.name || 'Client').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${cleanClientName}_Billing_Statement_${cycle.yearMonth}.pdf`);
}

/**
 * Downloads a high-resolution JPG image of the billing statement / invoice.
 * Renders via an in-memory 2x retina canvas with crisp typography, Rupee symbols, and identical layout.
 */
export function generateSmmBillingInvoiceJpg({ client, cycle, settings }: SmmBillingInvoiceParams): void {
  const metrics = getCyclePaymentMetrics(client, cycle);
  const invoiceNumber = `INV-SMM-${cycle.yearMonth.replace('-', '')}-${client.id.slice(-4).toUpperCase()}`;
  const today = new Date().toISOString().split('T')[0];

  const canvasWidth = 1400;
  const canvasHeight = 1980;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const margin = 60;
  const contentWidth = canvasWidth - margin * 2;
  let y = 60;

  // Header Banner
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.roundRect(margin, y, contentWidth, 140, 12);
  ctx.fill();

  // Header Texts
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(settings?.businessName || 'VIDZYRA CREATIVE AGENCY', margin + 35, y + 55);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('SOCIAL MEDIA MANAGEMENT • OFFICIAL BILLING STATEMENT & INVOICE', margin + 35, y + 95);

  ctx.fillStyle = '#c7d2fe';
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`Invoice: #${invoiceNumber}`, canvasWidth - margin - 35, y + 55);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '500 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`Month: ${cycle.cycleLabel || cycle.yearMonth}  |  Date: ${today}`, canvasWidth - margin - 35, y + 95);
  ctx.textAlign = 'left';

  y += 170;

  // Billed To & Package Details Card (2 columns)
  const cardHeight = 160;
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(margin, y, contentWidth, cardHeight, 10);
  ctx.fill();
  ctx.stroke();

  const col1X = margin + 30;
  const col2X = margin + contentWidth / 2 + 20;

  // Column 1
  ctx.fillStyle = '#4f46e5';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('BILLED TO (CLIENT DETAILS)', col1X, y + 36);

  ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Client / Business:', col1X, y + 70);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(client.name || 'N/A', col1X + 140, y + 70);

  ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Contact Person:', col1X, y + 102);
  ctx.fillStyle = '#0f172a';
  ctx.fillText(client.contactPerson || client.phone || 'N/A', col1X + 140, y + 102);

  ctx.fillStyle = '#64748b';
  ctx.fillText('Phone / WhatsApp:', col1X, y + 134);
  ctx.fillStyle = '#0f172a';
  ctx.fillText(client.whatsapp || client.phone || 'N/A', col1X + 140, y + 134);

  // Column 2
  ctx.fillStyle = '#4f46e5';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('PACKAGE & BILLING PERIOD', col2X, y + 36);

  ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Package Name:', col2X, y + 70);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(client.packageName || 'Social Media Management', col2X + 140, y + 70);

  ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Monthly Package:', col2X, y + 102);
  ctx.fillStyle = '#4f46e5';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(formatINRWithSymbol(metrics.packagePrice), col2X + 140, y + 102);

  ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Billing Period:', col2X, y + 134);
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`${cycle.cycleLabel || cycle.yearMonth} (${client.billingCycle || 'Monthly'})`, col2X + 140, y + 134);

  y += cardHeight + 25;

  // 4 Financial Summary Stat Cards
  const statBoxW = (contentWidth - 45) / 4;
  const statBoxH = 100;

  // Card 1: Total Payment
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.roundRect(margin, y, statBoxW, statBoxH, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('TOTAL PAYMENT', margin + 20, y + 34);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(formatINRWithSymbol(metrics.totalPayment), margin + 20, y + 75);

  // Card 2: Received Payment
  const c2X = margin + statBoxW + 15;
  ctx.fillStyle = '#ecfdf5';
  ctx.strokeStyle = '#a7f3d0';
  ctx.beginPath();
  ctx.roundRect(c2X, y, statBoxW, statBoxH, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#059669';
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('RECEIVED PAYMENT', c2X + 20, y + 34);
  ctx.fillStyle = '#047857';
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(formatINRWithSymbol(metrics.receivedPayment), c2X + 20, y + 75);

  // Card 3: Remaining Payment
  const c3X = margin + (statBoxW + 15) * 2;
  const isZeroRemaining = metrics.remainingPayment === 0;
  ctx.fillStyle = isZeroRemaining ? '#ecfdf5' : '#fff1f2';
  ctx.strokeStyle = isZeroRemaining ? '#a7f3d0' : '#fecdd3';
  ctx.beginPath();
  ctx.roundRect(c3X, y, statBoxW, statBoxH, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = isZeroRemaining ? '#059669' : '#e11d48';
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('REMAINING PAYMENT', c3X + 20, y + 34);
  ctx.fillStyle = isZeroRemaining ? '#047857' : '#be123c';
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(formatINRWithSymbol(metrics.remainingPayment), c3X + 20, y + 75);

  // Card 4: Payment Status
  const c4X = margin + (statBoxW + 15) * 3;
  ctx.fillStyle = '#eef2ff';
  ctx.strokeStyle = '#c7d2fe';
  ctx.beginPath();
  ctx.roundRect(c4X, y, statBoxW, statBoxH, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#4f46e5';
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('PAYMENT STATUS', c4X + 20, y + 34);
  ctx.fillStyle = '#3730a3';
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(metrics.paymentStatus.toUpperCase(), c4X + 20, y + 75);

  y += statBoxH + 30;

  // Section: Extra Work Details
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('EXTRA WORK DETAILS (OUTSIDE PACKAGE)', margin, y);
  y += 14;

  // Extra work table header
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(margin, y, contentWidth, 36);
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('S.No', margin + 15, y + 24);
  ctx.fillText('Date', margin + 80, y + 24);
  ctx.fillText('Work Description / Service', margin + 240, y + 24);
  ctx.textAlign = 'right';
  ctx.fillText('Amount', canvasWidth - margin - 20, y + 24);
  ctx.textAlign = 'left';
  y += 36;

  if (metrics.extraWorkList.length === 0) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(margin, y, contentWidth, 36);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('No extra work recorded for this month. All deliverables are covered in the monthly package.', margin + 20, y + 24);
    y += 42;
  } else {
    metrics.extraWorkList.forEach((item, idx) => {
      ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      ctx.fillRect(margin, y, contentWidth, 32);

      ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText(String(idx + 1), margin + 15, y + 22);
      ctx.fillText(item.date || '-', margin + 80, y + 22);
      ctx.fillText(`${item.workName} (${item.serviceType || 'Extra Work'})`, margin + 240, y + 22);

      ctx.textAlign = 'right';
      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(formatINRWithSymbol(Number(item.amount) || 0), canvasWidth - margin - 20, y + 22);
      ctx.textAlign = 'left';

      y += 32;
    });

    // Subtotal row
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(margin, y, contentWidth, 32);
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('Total Extra Work:', margin + 240, y + 22);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(formatINRWithSymbol(metrics.extraWorkTotal), canvasWidth - margin - 20, y + 22);
    ctx.textAlign = 'left';
    y += 40;
  }

  y += 10;

  // Section: Payment History
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('PAYMENT TRANSACTIONS & HISTORY', margin, y);
  y += 14;

  // Payment table header
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(margin, y, contentWidth, 36);
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('S.No', margin + 15, y + 24);
  ctx.fillText('Date', margin + 80, y + 24);
  ctx.fillText('Payment Mode', margin + 240, y + 24);
  ctx.fillText('Transaction Ref / ID', margin + 450, y + 24);
  ctx.fillText('Notes', margin + 740, y + 24);
  ctx.textAlign = 'right';
  ctx.fillText('Amount', canvasWidth - margin - 20, y + 24);
  ctx.textAlign = 'left';
  y += 36;

  if (metrics.paymentsList.length === 0) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(margin, y, contentWidth, 36);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('No payment transactions recorded for this monthly cycle yet.', margin + 20, y + 24);
    y += 42;
  } else {
    metrics.paymentsList.forEach((pay, idx) => {
      ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      ctx.fillRect(margin, y, contentWidth, 32);

      ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText(String(idx + 1), margin + 15, y + 22);
      ctx.fillText(pay.date || '-', margin + 80, y + 22);
      ctx.fillText(pay.paymentMode || 'Payment', margin + 240, y + 22);
      ctx.fillText(pay.referenceNumber || '-', margin + 450, y + 22);
      ctx.fillText(pay.notes || '-', margin + 740, y + 22);

      ctx.textAlign = 'right';
      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#059669';
      ctx.fillText(formatINRWithSymbol(Number(pay.amount) || 0), canvasWidth - margin - 20, y + 22);
      ctx.textAlign = 'left';

      y += 32;
    });

    // Total payments received row
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(margin, y, contentWidth, 32);
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('Total Payments Received:', margin + 450, y + 22);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#059669';
    ctx.fillText(formatINRWithSymbol(metrics.receivedPayment), canvasWidth - margin - 20, y + 22);
    ctx.textAlign = 'left';
    y += 40;
  }

  y += 15;

  // Final Summary Box (Full Billing Ledger breakdown)
  const finalBoxH = 130;
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(margin, y, contentWidth, finalBoxH, 10);
  ctx.fill();
  ctx.stroke();

  const fCol1 = margin + 30;
  const fCol2 = margin + contentWidth / 2 + 20;

  ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Monthly Package Amount:', fCol1, y + 36);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(formatINRWithSymbol(metrics.packagePrice), fCol1 + 220, y + 36);

  ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Extra Work Amount:', fCol1, y + 72);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(formatINRWithSymbol(metrics.extraWorkTotal), fCol1 + 220, y + 72);

  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('TOTAL BILLING / PAYMENT:', fCol1, y + 108);
  ctx.fillStyle = '#4f46e5';
  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(formatINRWithSymbol(metrics.totalPayment), fCol1 + 220, y + 108);

  ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Total Amount Received:', fCol2, y + 36);
  ctx.fillStyle = '#059669';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(formatINRWithSymbol(metrics.receivedPayment), fCol2 + 220, y + 36);

  ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Remaining Balance Due:', fCol2, y + 72);
  ctx.fillStyle = isZeroRemaining ? '#059669' : '#e11d48';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(formatINRWithSymbol(metrics.remainingPayment), fCol2 + 220, y + 72);

  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('Final Payment Status:', fCol2, y + 108);
  ctx.fillStyle = isZeroRemaining ? '#059669' : metrics.paymentStatus === 'Partially Paid' ? '#d97706' : '#e11d48';
  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(metrics.paymentStatus.toUpperCase(), fCol2 + 220, y + 108);

  // Footer Divider & Information
  const footerY = canvasHeight - 110;
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(margin, footerY);
  ctx.lineTo(canvasWidth - margin, footerY);
  ctx.stroke();

  ctx.font = 'italic 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Thank you for choosing Vidzyra for your social media growth and digital content management!', margin, footerY + 36);

  ctx.textAlign = 'right';
  ctx.font = '500 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`${settings?.contactPhone || settings?.phone || '+91 79 7009 6589'} • ${settings?.contactEmail || settings?.email || 'contact@vidzyra.com'}`, canvasWidth - margin, footerY + 36);

  ctx.textAlign = 'left';
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('This is a verified computer-generated billing statement and payment receipt.', margin, footerY + 68);

  // Trigger JPG Download
  const cleanClientName = (client.name || 'Client').replace(/[^a-zA-Z0-9_-]/g, '_');
  const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
  const link = document.createElement('a');
  link.download = `${cleanClientName}_Billing_Statement_${cycle.yearMonth}.jpg`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
