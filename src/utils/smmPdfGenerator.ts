import { jsPDF } from 'jspdf';
import { SocialMediaClient, SmmMonthlyCycle, BusinessSettings } from '../types';

export interface SmmMonthlyReportPdfParams {
  client: SocialMediaClient;
  cycle: SmmMonthlyCycle;
  settings?: BusinessSettings;
}

export function generateSmmMonthlyReportPdf({ client, cycle, settings }: SmmMonthlyReportPdfParams): void {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const primaryColor: [number, number, number] = [15, 23, 42]; // slate-900
  const brandIndigo: [number, number, number] = [79, 70, 229]; // indigo-600
  const mutedText: [number, number, number] = [100, 116, 139]; // slate-500
  const emeraldColor: [number, number, number] = [16, 185, 129]; // emerald-600
  const roseColor: [number, number, number] = [225, 29, 72]; // rose-600

  let y = 40;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, contentWidth, 75, 'F');

  // Title inside banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(settings?.businessName || 'VIDZYRA CREATIVE AGENCY', margin + 20, y + 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('MONTHLY SOCIAL MEDIA MANAGEMENT REPORT', margin + 20, y + 50);

  // Cycle badge on the right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(199, 210, 254); // indigo-200
  doc.text(cycle.cycleLabel.toUpperCase(), pageWidth - margin - 20, y + 42, { align: 'right' });

  y += 90;

  // Client Information Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(margin, y, contentWidth, 90, 4, 4, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.75);
  doc.roundedRect(margin, y, contentWidth, 90, 4, 4, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(brandIndigo[0], brandIndigo[1], brandIndigo[2]);
  doc.text('CLIENT & PACKAGE INFORMATION', margin + 14, y + 18);

  const col1X = margin + 14;
  const col2X = margin + contentWidth / 2;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);

  doc.text('Client / Business:', col1X, y + 36);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(client.name, col1X + 85, y + 36);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('Contact Person:', col1X, y + 52);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(client.contactPerson || 'N/A', col1X + 85, y + 52);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('Phone / WhatsApp:', col1X, y + 68);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(client.whatsapp || client.phone || 'N/A', col1X + 85, y + 68);

  // Column 2
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('Package Name:', col2X, y + 36);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(client.packageName || 'Social Media Management', col2X + 80, y + 36);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('Monthly Price:', col2X, y + 52);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(brandIndigo[0], brandIndigo[1], brandIndigo[2]);
  doc.text(`₹${(cycle.packagePrice || client.monthlyPackagePrice || 0).toLocaleString('en-IN')}`, col2X + 80, y + 52);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('Renewal Date:', col2X, y + 68);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(client.packageRenewalDate || 'N/A', col2X + 80, y + 68);

  y += 105;

  // Connected Social Media Accounts (if any)
  if (client.accounts && client.accounts.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
    doc.text('MANAGED ACCOUNTS:', margin, y);

    const accountsStr = client.accounts.map((a) => `${a.platform}: ${a.profileName || 'Active'}`).join('  |  ');
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(accountsStr.substring(0, 110), margin + 115, y);

    y += 18;
  }

  // 1. MONTHLY DELIVERABLES TABLE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('1. MONTHLY DELIVERABLES', margin, y + 10);
  y += 16;

  // Table Header
  const tableHeaderHeight = 22;
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(margin, y, contentWidth, tableHeaderHeight, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.rect(margin, y, contentWidth, tableHeaderHeight, 'D');

  const dColSno = 40;
  const dColService = contentWidth - 40 - 70 - 70 - 80;
  const dColPlanned = 70;
  const dColCompleted = 70;
  const dColRemaining = 80;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

  let curX = margin;
  doc.text('#', curX + dColSno / 2, y + 15, { align: 'center' });
  curX += dColSno;
  doc.text('Service / Deliverable', curX + 10, y + 15);
  curX += dColService;
  doc.text('Planned', curX + dColPlanned / 2, y + 15, { align: 'center' });
  curX += dColPlanned;
  doc.text('Completed', curX + dColCompleted / 2, y + 15, { align: 'center' });
  curX += dColCompleted;
  doc.text('Remaining', curX + dColRemaining / 2, y + 15, { align: 'center' });

  y += tableHeaderHeight;

  // Table Rows
  const deliverables = cycle.deliverables || [];
  if (deliverables.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
    doc.text('No planned deliverables configured for this monthly cycle.', margin + 15, y + 18);
    y += 28;
  } else {
    deliverables.forEach((item, idx) => {
      const rowHeight = 20;
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, rowHeight, 'F');
      }

      const remaining = Math.max(0, item.planned - item.completed);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);

      let rx = margin;
      doc.text(String(idx + 1), rx + dColSno / 2, y + 14, { align: 'center' });
      rx += dColSno;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(item.service, rx + 10, y + 14);
      rx += dColService;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(String(item.planned), rx + dColPlanned / 2, y + 14, { align: 'center' });
      rx += dColPlanned;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
      doc.text(String(item.completed), rx + dColCompleted / 2, y + 14, { align: 'center' });
      rx += dColCompleted;

      if (remaining === 0) {
        doc.setTextColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
        doc.text('Done', rx + dColRemaining / 2, y + 14, { align: 'center' });
      } else {
        doc.setTextColor(roseColor[0], roseColor[1], roseColor[2]);
        doc.text(String(remaining), rx + dColRemaining / 2, y + 14, { align: 'center' });
      }

      y += rowHeight;
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y, margin + contentWidth, y);
    });
  }

  y += 18;

  // 2. EXTRA WORK TABLE (Work Outside Package)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('2. EXTRA WORK (OUTSIDE PACKAGE)', margin, y + 10);
  y += 16;

  const extraWorkList = cycle.extraWork || [];
  const extraWorkTotal = extraWorkList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  // Extra Work Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, tableHeaderHeight, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.rect(margin, y, contentWidth, tableHeaderHeight, 'D');

  const eColSno = 40;
  const eColDate = 85;
  const eColWork = contentWidth - 40 - 85 - 100;
  const eColAmount = 100;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

  let exX = margin;
  doc.text('#', exX + eColSno / 2, y + 15, { align: 'center' });
  exX += eColSno;
  doc.text('Date', exX + 10, y + 15);
  exX += eColDate;
  doc.text('Work / Description', exX + 10, y + 15);
  exX += eColWork;
  doc.text('Amount', exX + eColAmount - 15, y + 15, { align: 'right' });

  y += tableHeaderHeight;

  if (extraWorkList.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
    doc.text('No extra work recorded for this month (all work covered inside monthly package).', margin + 15, y + 18);
    y += 28;
  } else {
    extraWorkList.forEach((item, idx) => {
      const rowHeight = 20;
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, rowHeight, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);

      let exRowX = margin;
      doc.text(String(idx + 1), exRowX + eColSno / 2, y + 14, { align: 'center' });
      exRowX += eColSno;

      doc.text(item.date || 'N/A', exRowX + 10, y + 14);
      exRowX += eColDate;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(item.workName, exRowX + 10, y + 14);
      exRowX += eColWork;

      doc.text(`₹${(Number(item.amount) || 0).toLocaleString('en-IN')}`, exRowX + eColAmount - 15, y + 14, { align: 'right' });

      y += rowHeight;
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y, margin + contentWidth, y);
    });

    // Subtotal Row for Extra Work
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, contentWidth, 20, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Total Extra Work:', margin + eColSno + eColDate + 10, y + 14);
    doc.text(`₹${extraWorkTotal.toLocaleString('en-IN')}`, margin + contentWidth - 15, y + 14, { align: 'right' });
    y += 20;
  }

  y += 20;

  // 3. PAYMENT SUMMARY (Reconciled Box)
  const packagePrice = Number(cycle.packagePrice) || Number(client.monthlyPackagePrice) || 0;
  const totalBilling = packagePrice + extraWorkTotal;
  const paymentsList = cycle.payments || [];
  const totalReceived = paymentsList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const remainingBalance = Math.max(0, totalBilling - totalReceived);

  // Check if summary box fits, otherwise add page
  if (y + 115 > pageHeight - 40) {
    doc.addPage();
    y = 40;
  }

  const summaryWidth = 260;
  const summaryX = pageWidth - margin - summaryWidth;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(summaryX, y, summaryWidth, 105, 4, 4, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.75);
  doc.roundedRect(summaryX, y, summaryWidth, 105, 4, 4, 'D');

  let sy = y + 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('MONTHLY FINANCIAL SUMMARY', summaryX + 14, sy);

  sy += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Monthly Package Amount:', summaryX + 14, sy);
  doc.setFont('helvetica', 'bold');
  doc.text(`₹${packagePrice.toLocaleString('en-IN')}`, summaryX + summaryWidth - 14, sy, { align: 'right' });

  sy += 15;
  doc.setFont('helvetica', 'normal');
  doc.text('Extra Work Amount:', summaryX + 14, sy);
  doc.setFont('helvetica', 'bold');
  doc.text(`₹${extraWorkTotal.toLocaleString('en-IN')}`, summaryX + summaryWidth - 14, sy, { align: 'right' });

  sy += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('Total Billing:', summaryX + 14, sy);
  doc.text(`₹${totalBilling.toLocaleString('en-IN')}`, summaryX + summaryWidth - 14, sy, { align: 'right' });

  sy += 15;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
  doc.text('Total Received:', summaryX + 14, sy);
  doc.setFont('helvetica', 'bold');
  doc.text(`₹${totalReceived.toLocaleString('en-IN')}`, summaryX + summaryWidth - 14, sy, { align: 'right' });

  sy += 15;
  doc.setFont('helvetica', 'bold');
  if (remainingBalance > 0) {
    doc.setTextColor(roseColor[0], roseColor[1], roseColor[2]);
    doc.text('Remaining Balance:', summaryX + 14, sy);
    doc.text(`₹${remainingBalance.toLocaleString('en-IN')}`, summaryX + summaryWidth - 14, sy, { align: 'right' });
  } else {
    doc.setTextColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
    doc.text('Status:', summaryX + 14, sy);
    doc.text('Fully Paid', summaryX + summaryWidth - 14, sy, { align: 'right' });
  }

  // Footer on each page
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `Generated by ${settings?.businessName || 'Vidzyra CRM'} • ${new Date().toLocaleDateString('en-GB')}`,
      margin,
      pageHeight - 20
    );
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 20, { align: 'right' });
  }

  const cleanFileName = `${client.name.replace(/[^a-zA-Z0-9]/g, '_')}_SMM_Report_${cycle.yearMonth}.pdf`;
  doc.save(cleanFileName);
}
