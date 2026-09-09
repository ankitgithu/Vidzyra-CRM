import React, { useState, useRef, useEffect } from 'react';
import {
  Database,
  Download,
  Upload,
  FileText,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  X,
  ShieldCheck,
  Clock,
  HardDrive,
  Users,
  Briefcase,
  CreditCard,
  Layers,
  History,
  ArrowRight,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import * as firestoreService from '../../services/firestoreService';
import { generateDatabaseSnapshotPdf, getBackupTimestamp } from '../../utils/pdfGenerator';
import {
  downloadHistoricalBackupJson,
  downloadHistoricalBackupPdf,
  clearAllBackupHistoryAndArtifacts,
  saveHistoricalBackupArtifact,
  formatBytes,
} from '../../services/backupStorageService';
import { BackupHistoryRecord } from '../../types';

interface StagedBackupInfo {
  fileName: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  data: any;
  metadata: {
    app?: string;
    version?: string;
    exportedAt?: string;
  };
  counts: {
    clients: number;
    editors: number;
    projects: number;
    payments: number;
    expenses: number;
    invoices: number;
    receipts: number;
    notifications: number;
    activities: number;
    revisions: number;
    sharedLinks: number;
  };
}

function validateVidzyraBackup(data: any): { isValid: boolean; error?: string } {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {
      isValid: false,
      error: 'The uploaded file is not a valid JSON object. Please upload a valid JSON backup file.',
    };
  }

  // Check for Vidzyra CRM signature or recognizable entity datasets
  const hasAppSignature =
    data._app === 'Vidzyra Work Management CRM' ||
    (typeof data.version === 'string' && data.version.includes('firestore')) ||
    (typeof data.version === 'string' && data.version.includes('vidzyra')) ||
    (typeof data.app === 'string' && data.app.toLowerCase().includes('vidzyra'));

  const hasClients = Array.isArray(data.clients);
  const hasProjects = Array.isArray(data.projects);
  const hasEditors = Array.isArray(data.editors);
  const hasPayments = Array.isArray(data.payments) || Array.isArray(data.clientPayments);
  const hasSettings = data.settings && typeof data.settings === 'object';
  const hasInvoices = Array.isArray(data.invoices);
  const hasExpenses = Array.isArray(data.expenses);

  const coreEntitiesCount = [
    hasClients,
    hasProjects,
    hasEditors,
    hasPayments,
    hasSettings,
    hasInvoices,
    hasExpenses,
  ].filter(Boolean).length;

  if (!hasAppSignature && coreEntitiesCount < 2) {
    return {
      isValid: false,
      error:
        'Invalid backup file: The selected file does not appear to contain recognized Vidzyra CRM database collections (clients, projects, editors, payments, etc.). No data was modified.',
    };
  }

  // Collection array checks
  if (data.clients && !Array.isArray(data.clients)) {
    return { isValid: false, error: 'Backup error: "clients" collection must be a valid array.' };
  }
  if (data.projects && !Array.isArray(data.projects)) {
    return { isValid: false, error: 'Backup error: "projects" collection must be a valid array.' };
  }
  if (data.editors && !Array.isArray(data.editors)) {
    return { isValid: false, error: 'Backup error: "editors" collection must be a valid array.' };
  }
  if (data.invoices && !Array.isArray(data.invoices)) {
    return { isValid: false, error: 'Backup error: "invoices" collection must be a valid array.' };
  }

  return { isValid: true };
}

export const DataCenter: React.FC = () => {
  const {
    clients,
    editors,
    projects,
    clientPayments,
    editorPayments,
    expenses,
    activities,
    notifications,
    settings,
    chatMessages,
    ratings,
    invoices,
    receipts,
    calendarTasks,
    isLoading,
    restoreDatabase,
  } = useCrm();

  const [isExportingJson, setIsExportingJson] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Backup Preview & Confirmation Modal State
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [stagedBackup, setStagedBackup] = useState<StagedBackupInfo | null>(null);

  // User Notification Messages
  const [importError, setImportError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Backup History State
  const [backupHistory, setBackupHistory] = useState<BackupHistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem('vidzyra_backup_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [downloadingAction, setDownloadingAction] = useState<string | null>(null);
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to real-time Backup History from Firestore
  useEffect(() => {
    const unsub = firestoreService.subscribeBackupHistory(
      (records) => {
        if (Array.isArray(records)) {
          setBackupHistory(records);
          try {
            localStorage.setItem('vidzyra_backup_history', JSON.stringify(records));
          } catch (e) {
            console.warn('Could not cache backup history in localStorage', e);
          }
        }
      },
      (err) => {
        console.warn('Backup history subscription fallback to localStorage:', err);
      }
    );
    return () => unsub();
  }, []);

  /**
   * Records a backup entry into both Firestore and LocalStorage and stores the historical artifact
   */
  const logBackupAction = async (
    type: 'Full JSON Backup' | 'Pre-Restore Safety Backup' | 'PDF Snapshot' | 'System Snapshot',
    fileName: string,
    fileSizeBytes?: number,
    customCounts?: BackupHistoryRecord['counts'],
    snapshotPayload?: any,
    pdfBase64?: string,
    pdfBlobSize?: number
  ) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const defaultCounts = {
      clients: clients.length,
      editors: editors.length,
      projects: projects.length,
      payments: clientPayments.length + editorPayments.length,
      expenses: expenses.length,
      invoices: (invoices || []).length,
      receipts: (receipts || []).length,
      notifications: (notifications || []).length,
      activities: (activities || []).length,
      chatMessages: (chatMessages || []).length,
    };

    const recordId = `backup-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const formattedTimestamp = getBackupTimestamp(now);
    const jsonFileName = fileName.endsWith('.json')
      ? fileName
      : `Vidzyra-Database-Backup-${formattedTimestamp}.json`;
    const pdfFileName = fileName.endsWith('.pdf')
      ? fileName
      : `Vidzyra-Database-Snapshot-${formattedTimestamp}.pdf`;

    let jsonStoragePath = `backupArtifacts/${recordId}/json`;
    let pdfStoragePath = `backupArtifacts/${recordId}/pdf`;
    let actualJsonSize = fileSizeBytes || 0;
    let actualPdfSize = pdfBlobSize || 0;

    if (snapshotPayload) {
      try {
        const jsonString = JSON.stringify(snapshotPayload, null, 2);
        const artResult = await saveHistoricalBackupArtifact({
          backupId: recordId,
          createdAt: now.toISOString(),
          snapshotData: snapshotPayload,
          jsonFileName,
          pdfFileName,
          jsonString,
          pdfBase64,
          pdfSize: pdfBlobSize,
        });
        jsonStoragePath = artResult.jsonStoragePath;
        pdfStoragePath = artResult.pdfStoragePath;
        actualJsonSize = artResult.jsonSize;
        if (artResult.pdfSize) actualPdfSize = artResult.pdfSize;
      } catch (err) {
        console.warn('Could not persist historical backup artifact:', err);
      }
    }

    const newRecord: BackupHistoryRecord = {
      id: recordId,
      timestamp: now.toISOString(),
      date: dateStr,
      time: timeStr,
      type,
      backupType: type,
      fileName,
      jsonFileName,
      pdfFileName,
      jsonStoragePath,
      pdfStoragePath,
      fileSizeBytes: actualJsonSize || fileSizeBytes,
      fileSizeFormatted: formatBytes(actualJsonSize || fileSizeBytes),
      jsonSize: actualJsonSize,
      jsonSizeFormatted: formatBytes(actualJsonSize),
      pdfSize: actualPdfSize,
      pdfSizeFormatted: formatBytes(actualPdfSize),
      status: 'Ready',
      counts: customCounts || defaultCounts,
      createdAt: now.toISOString(),
    };

    setBackupHistory((prev) => {
      const updated = [newRecord, ...prev.filter((r) => r.id !== newRecord.id)];
      try {
        localStorage.setItem('vidzyra_backup_history', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not cache backup history in localStorage', e);
      }
      return updated;
    });

    try {
      await firestoreService.saveBackupHistoryDoc(newRecord);
    } catch (err) {
      console.warn('Could not save backup record to Firestore:', err);
    }
  };

  const handleDownloadRecordJson = async (record: BackupHistoryRecord) => {
    try {
      setDownloadingAction(`${record.id}-json`);
      setImportError(null);
      await downloadHistoricalBackupJson(record);
      setSuccessMessage(`JSON backup (${record.jsonFileName || record.fileName}) downloaded successfully.`);
    } catch (err: any) {
      console.error('Download historical JSON error:', err);
      setImportError(
        err?.message ||
          'Backup file is unavailable. This backup record may have been created before persistent backup storage was enabled.'
      );
    } finally {
      setDownloadingAction(null);
    }
  };

  const handleDownloadRecordPdf = async (record: BackupHistoryRecord) => {
    try {
      setDownloadingAction(`${record.id}-pdf`);
      setImportError(null);
      await downloadHistoricalBackupPdf(record);
      setSuccessMessage(`PDF snapshot (${record.pdfFileName || record.fileName}) downloaded successfully.`);
    } catch (err: any) {
      console.error('Download historical PDF error:', err);
      setImportError(
        err?.message ||
          'Backup file is unavailable. This backup record may have been created before persistent backup storage was enabled.'
      );
    } finally {
      setDownloadingAction(null);
    }
  };

  const handleConfirmClearHistory = async () => {
    try {
      setIsClearingHistory(true);
      setImportError(null);
      await clearAllBackupHistoryAndArtifacts();
      setBackupHistory([]);
      setShowClearHistoryModal(false);
      setSuccessMessage('Backup history cleared successfully. Your live CRM database data remains completely intact.');
    } catch (err: any) {
      console.error('Clear backup history error:', err);
      setImportError('Failed to clear backup history. Please try again.');
    } finally {
      setIsClearingHistory(false);
    }
  };

  /**
   * Builds and returns a complete CRM backup JSON object from all persistent collections.
   */
  const buildFullBackupObject = async () => {
    const [firestoreRevisions, firestoreSharedLinks, firestoreAdminUsers] = await Promise.all([
      firestoreService.fetchAllDocumentsInCollection('revisions'),
      firestoreService.fetchAllDocumentsInCollection('sharedLinks'),
      firestoreService.fetchAllDocumentsInCollection('adminUsers'),
    ]);

    // Derive sharedLinks from current clients & editors if not already stored
    const derivedSharedLinks = [...firestoreSharedLinks];
    clients.forEach((c) => {
      if (
        c.portalToken &&
        !derivedSharedLinks.some((l) => l.token === c.portalToken || l.id === c.portalToken)
      ) {
        derivedSharedLinks.push({
          id: c.portalToken,
          token: c.portalToken,
          type: 'client',
          targetId: c.id,
          isActive: c.portalStatus === 'Active',
          createdAt: c.createdAt || new Date().toISOString(),
        });
      }
    });
    editors.forEach((e) => {
      if (
        e.portalToken &&
        !derivedSharedLinks.some((l) => l.token === e.portalToken || l.id === e.portalToken)
      ) {
        derivedSharedLinks.push({
          id: e.portalToken,
          token: e.portalToken,
          type: 'editor',
          targetId: e.id,
          isActive: e.portalStatus === 'Active',
          createdAt: e.createdAt || new Date().toISOString(),
        });
      }
    });

    const combinedPayments = [
      ...clientPayments.map((p) => ({ ...p, paymentCategory: 'client' })),
      ...editorPayments.map((p) => ({ ...p, paymentCategory: 'editor' })),
    ];

    const adminUsersList =
      firestoreAdminUsers.length > 0
        ? firestoreAdminUsers
        : [
            {
              id: 'admin-primary',
              name: settings.adminName || 'Ankit',
              email: settings.adminEmail || 'admin@vidzyra.com',
              role: settings.adminRole || 'Super Admin',
              updatedAt: new Date().toISOString(),
            },
          ];

    return {
      _app: 'Vidzyra Work Management CRM',
      _version: '3.0',
      _exportedAt: new Date().toISOString(),
      settings,
      adminUsers: adminUsersList,
      clients,
      editors,
      projects,
      payments: combinedPayments,
      clientPayments,
      editorPayments,
      expenses,
      activities,
      notifications: notifications || [],
      chatMessages: chatMessages || [],
      ratings: ratings || [],
      invoices: invoices || [],
      receipts: receipts || [],
      calendarTasks: calendarTasks || [],
      revisions: firestoreRevisions,
      sharedLinks: derivedSharedLinks,
    };
  };

  /**
   * EXPORT JSON: Complete CRM Backup
   */
  const handleExportJson = async () => {
    try {
      setIsExportingJson(true);
      setImportError(null);
      const fullDb = await buildFullBackupObject();

      const jsonStr = JSON.stringify(fullDb, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const fileName = `Vidzyra-CRM-Backup-${getBackupTimestamp()}.json`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      // Log in Backup History
      const pdfSnapshot = generateDatabaseSnapshotPdf(fullDb, { autoSave: false });
      await logBackupAction(
        'Full JSON Backup',
        fileName,
        blob.size,
        {
          clients: clients.length,
          editors: editors.length,
          projects: projects.length,
          payments: clientPayments.length + editorPayments.length,
          expenses: expenses.length,
          invoices: (invoices || []).length,
          receipts: (receipts || []).length,
          notifications: (notifications || []).length,
          activities: (activities || []).length,
          chatMessages: (chatMessages || []).length,
          calendarTasks: (calendarTasks || []).length,
        },
        fullDb,
        pdfSnapshot.base64,
        pdfSnapshot.size
      );

      setSuccessMessage(`JSON backup exported successfully (${formatBytes(blob.size)})! Saved to your downloads.`);
    } catch (err) {
      console.error('Export JSON error:', err);
      setImportError('Failed to generate JSON backup.');
    } finally {
      setIsExportingJson(false);
    }
  };

  /**
   * Trigger the hidden file input
   */
  const handleImportClick = () => {
    setImportError(null);
    setSuccessMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  /**
   * Read and validate the chosen JSON file, then stage for preview
   */
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);

        const validation = validateVidzyraBackup(parsed);
        if (!validation.isValid) {
          setImportError(validation.error || 'Invalid backup file structure.');
          return;
        }

        // Calculate counts in staged backup
        const stagedClients = Array.isArray(parsed.clients) ? parsed.clients.length : 0;
        const stagedEditors = Array.isArray(parsed.editors) ? parsed.editors.length : 0;
        const stagedProjects = Array.isArray(parsed.projects) ? parsed.projects.length : 0;
        const stagedPayments = Array.isArray(parsed.payments)
          ? parsed.payments.length
          : (Array.isArray(parsed.clientPayments) ? parsed.clientPayments.length : 0) +
            (Array.isArray(parsed.editorPayments) ? parsed.editorPayments.length : 0);
        const stagedExpenses = Array.isArray(parsed.expenses) ? parsed.expenses.length : 0;
        const stagedInvoices = Array.isArray(parsed.invoices) ? parsed.invoices.length : 0;
        const stagedReceipts = Array.isArray(parsed.receipts) ? parsed.receipts.length : 0;
        const stagedNotifications = Array.isArray(parsed.notifications) ? parsed.notifications.length : 0;
        const stagedActivities = Array.isArray(parsed.activities) ? parsed.activities.length : 0;
        const stagedRevisions = Array.isArray(parsed.revisions) ? parsed.revisions.length : 0;
        const stagedSharedLinks = Array.isArray(parsed.sharedLinks) ? parsed.sharedLinks.length : 0;

        const info: StagedBackupInfo = {
          fileName: file.name,
          fileSizeBytes: file.size,
          fileSizeFormatted: formatBytes(file.size),
          data: parsed,
          metadata: {
            app: parsed._app || parsed.app || 'Vidzyra CRM',
            version: parsed._version || parsed.version || '1.0',
            exportedAt: parsed._exportedAt || parsed.exportedAt || parsed.date || 'Unknown',
          },
          counts: {
            clients: stagedClients,
            editors: stagedEditors,
            projects: stagedProjects,
            payments: stagedPayments,
            expenses: stagedExpenses,
            invoices: stagedInvoices,
            receipts: stagedReceipts,
            notifications: stagedNotifications,
            activities: stagedActivities,
            revisions: stagedRevisions,
            sharedLinks: stagedSharedLinks,
          },
        };

        setStagedBackup(info);
        setShowPreviewModal(true);
      } catch (err: any) {
        console.error('File parsing error:', err);
        setImportError(
          'Failed to parse JSON file: The file does not contain valid JSON syntax. No changes were made to your database.'
        );
      }
    };
    reader.readAsText(file);
  };

  /**
   * Cancel modal
   */
  const handleCancelRestore = () => {
    setShowPreviewModal(false);
    setStagedBackup(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Execute Replace & Restore:
   * 1. Downloads automatic emergency safety backup of current state first
   * 2. Replaces Firestore records and updates React context state
   */
  const handleConfirmRestore = async () => {
    if (!stagedBackup || isRestoring) return;

    try {
      setIsRestoring(true);
      setImportError(null);

      // STEP 1: AUTOMATIC SAFETY BACKUP (Download safety backup BEFORE touching current data)
      const currentBackup = await buildFullBackupObject();
      const safetyBlob = new Blob([JSON.stringify(currentBackup, null, 2)], {
        type: 'application/json',
      });
      const safetyFileName = `Vidzyra-Safety-Backup-Before-Restore-${getBackupTimestamp()}.json`;

      const safetyUrl = URL.createObjectURL(safetyBlob);
      const safetyLink = document.createElement('a');
      safetyLink.href = safetyUrl;
      safetyLink.download = safetyFileName;
      safetyLink.click();
      URL.revokeObjectURL(safetyUrl);

      // Log safety backup to history with persistent snapshot artifacts
      const safetyPdf = generateDatabaseSnapshotPdf(currentBackup, { autoSave: false });
      await logBackupAction(
        'Pre-Restore Safety Backup',
        safetyFileName,
        safetyBlob.size,
        {
          clients: clients.length,
          editors: editors.length,
          projects: projects.length,
          payments: clientPayments.length + editorPayments.length,
          expenses: expenses.length,
          invoices: (invoices || []).length,
          receipts: (receipts || []).length,
          notifications: (notifications || []).length,
          activities: (activities || []).length,
          chatMessages: (chatMessages || []).length,
          calendarTasks: (calendarTasks || []).length,
        },
        currentBackup,
        safetyPdf.base64,
        safetyPdf.size
      );

      // STEP 2: Restore into Firestore and React state
      const result = await restoreDatabase(stagedBackup.data);

      if (result.success) {
        setShowPreviewModal(false);
        setStagedBackup(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setSuccessMessage(
          `Database restored successfully! All CRM collections have been synchronized with your backup file (${Number(result.count || 0).toLocaleString()} documents loaded). A safety backup was saved to your computer before the restore.`
        );
      } else {
        setImportError(
          `Restoration failed: ${result.error || 'Unknown error'}. An automatic safety backup of your previous database was saved to your downloads before proceeding.`
        );
      }
    } catch (err: any) {
      console.error('Error during restore process:', err);
      setImportError(
        `Restoration encountered an error: ${err?.message || 'Database update failed'}. An automatic safety backup of your previous data was saved to your downloads before proceeding.`
      );
    } finally {
      setIsRestoring(false);
    }
  };

  /**
   * EXPORT AS PDF: Database Snapshot Report (for reference/viewing/printing only)
   */
  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      setImportError(null);

      const fullDb = await buildFullBackupObject();
      const pdfFileName = `Vidzyra-Database-Snapshot-${getBackupTimestamp()}.pdf`;

      const pdfResult = generateDatabaseSnapshotPdf(fullDb, {
        autoSave: true,
        customFileName: pdfFileName,
      });

      // Log PDF export in history with persistent snapshot artifacts
      await logBackupAction(
        'PDF Snapshot',
        pdfFileName,
        pdfResult.size,
        {
          clients: clients.length,
          editors: editors.length,
          projects: projects.length,
          payments: clientPayments.length + editorPayments.length,
          expenses: expenses.length,
          invoices: (invoices || []).length,
          receipts: (receipts || []).length,
          notifications: (notifications || []).length,
          activities: (activities || []).length,
          chatMessages: (chatMessages || []).length,
          calendarTasks: (calendarTasks || []).length,
        },
        fullDb,
        pdfResult.base64,
        pdfResult.size
      );

      setSuccessMessage('Database Snapshot PDF generated successfully! Ready for printing or offline archival.');
    } catch (err) {
      console.error('Export PDF error:', err);
      setImportError('Failed to generate Database Snapshot PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Compute live database metrics
  const activeClientsCount = clients.filter((c) => c.portalStatus === 'Active').length;
  const activeEditorsCount = editors.filter((e) => e.portalStatus === 'Active').length;
  const totalTransactionsCount = clientPayments.length + editorPayments.length + expenses.length;
  const totalInvoicesCount = (invoices || []).length;
  const totalReceiptsCount = (receipts || []).length;
  const activeProjectsCount = projects.filter((p) => p.status !== 'Completed').length;

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data Center &amp; Storage</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Cloud Firestore database synchronization, snapshots, safety backups, and backup history logs.
        </p>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-start justify-between gap-3 shadow-xs transition animate-in fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-sm font-medium">{successMessage}</div>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-700 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Notification Banner */}
      {importError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-start justify-between gap-3 shadow-xs transition animate-in fade-in">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-sm font-medium">{importError}</div>
          </div>
          <button
            onClick={() => setImportError(null)}
            className="text-rose-500 hover:text-rose-700 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* PART 4: DATABASE SUMMARY (LIVE COUNTS & REPOSITORY HEALTH) */}
      {/* ======================================================== */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 text-sm">Database Summary &amp; Live Collection Counts</h2>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {isLoading ? 'Connecting...' : 'Live Connected'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time count of active collections stored securely in Firebase Firestore.
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Cloud className="w-4 h-4 text-emerald-600" />
            <span>Single Source: <strong className="text-slate-700">Firestore Cloud</strong></span>
          </div>
        </div>

        {/* Live Collection Count Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Clients</span>
              <Users className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-xl font-bold text-slate-900">
              {Number(clients.length || 0).toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500">{activeClientsCount} with active portal</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Editors</span>
              <Users className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <div className="text-xl font-bold text-purple-700">
              {Number(editors.length || 0).toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500">{activeEditorsCount} available/active</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Projects</span>
              <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="text-xl font-bold text-indigo-700">
              {Number(projects.length || 0).toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500">{activeProjectsCount} active / in-progress</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Transactions</span>
              <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-xl font-bold text-emerald-700">
              {Number(totalTransactionsCount || 0).toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500">
              {clientPayments.length} in • {editorPayments.length + expenses.length} out
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Billing Docs</span>
              <FileText className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl font-bold text-amber-700">
              {Number(totalInvoicesCount + totalReceiptsCount || 0).toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500">
              {totalInvoicesCount} invoices • {totalReceiptsCount} receipts
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Audit Logs</span>
              <Layers className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-xl font-bold text-slate-800">
              {Number((activities?.length || 0) + (notifications?.length || 0)).toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500">Activities &amp; Notifications</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* DATABASE BACKUP ACTIONS (JSON / PDF / RESTORE)           */}
      {/* ======================================================== */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Backup &amp; Restoration Operations</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                JSON is used for backup and restore. PDF is for viewing and record keeping.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Export JSON Button */}
          <button
            id="btn-export-json"
            onClick={handleExportJson}
            disabled={isExportingJson || isRestoring}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            {isExportingJson ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export JSON
          </button>

          {/* Import JSON Button */}
          <button
            id="btn-import-json"
            onClick={handleImportClick}
            disabled={isRestoring}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Import JSON
          </button>

          {/* Export as PDF Button */}
          <button
            id="btn-export-pdf"
            onClick={handleExportPdf}
            disabled={isExportingPdf || isRestoring}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            {isExportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
            ) : (
              <FileText className="w-4 h-4 text-rose-600" />
            )}
            Export as PDF
          </button>

          {/* Hidden JSON file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelected}
            className="hidden"
          />
        </div>

        <div className="pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Automatic Safety Guard:</strong> Vidzyra CRM automatically generates and downloads an emergency safety backup of your live data before executing any database restoration.
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* PART 1: BACKUP HISTORY LIST                             */}
      {/* ======================================================== */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Backup History</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit trail and downloadable archive of all generated JSON backups, PDF snapshots, and automated safety backups.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              {backupHistory.length} Recorded
            </span>
            {backupHistory.length > 0 && (
              <button
                type="button"
                id="btn-clear-backup-history"
                onClick={() => setShowClearHistoryModal(true)}
                className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition cursor-pointer"
                title="Clear backup history without touching live CRM data"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            )}
          </div>
        </div>

        {backupHistory.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
            <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-700">No backup history recorded yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              When you export JSON, download a PDF snapshot, or restore data, persistent archive records will appear here with instant Download JSON and Download PDF actions.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px]">
                  <th className="py-2.5 px-3">Date &amp; Time</th>
                  <th className="py-2.5 px-3">Backup Type</th>
                  <th className="py-2.5 px-3">File Name</th>
                  <th className="py-2.5 px-3 text-right">File Size</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Entity Counts Summary</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {backupHistory.map((item) => {
                  const isSafety = item.type === 'Pre-Restore Safety Backup';
                  const isPdf = item.type === 'PDF Snapshot';

                  const badgeClass = isSafety
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : isPdf
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200';

                  const displaySize =
                    item.fileSizeFormatted && item.fileSizeFormatted !== '0 B'
                      ? item.fileSizeFormatted
                      : item.fileSizeBytes && item.fileSizeBytes > 0
                      ? formatBytes(item.fileSizeBytes)
                      : item.jsonSize && item.jsonSize > 0
                      ? formatBytes(item.jsonSize)
                      : item.pdfSize && item.pdfSize > 0
                      ? formatBytes(item.pdfSize)
                      : 'Size unavailable';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{item.date}</div>
                        <div className="text-[10px] text-slate-400">{item.time}</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeClass}`}>
                          {item.type}
                        </span>
                      </td>
                      <td
                        className="py-3 px-3 font-mono text-[11px] text-slate-800 max-w-xs truncate"
                        title={item.fileName}
                      >
                        {item.fileName}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-slate-600 whitespace-nowrap">
                        {displaySize}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {item.status || 'Ready'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-medium">
                            {item.counts?.clients ?? 0} Clients
                          </span>
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-medium">
                            {item.counts?.editors ?? 0} Editors
                          </span>
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-medium">
                            {item.counts?.projects ?? 0} Projects
                          </span>
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-medium">
                            {item.counts?.payments ?? 0} Payments
                          </span>
                          {(item.counts?.invoices ?? 0) > 0 && (
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-medium">
                              {item.counts?.invoices} Invoices
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDownloadRecordJson(item)}
                            disabled={downloadingAction !== null}
                            title="Download historical JSON snapshot"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold text-[11px] bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 transition disabled:opacity-50 cursor-pointer shadow-2xs"
                          >
                            {downloadingAction === `${item.id}-json` ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                            ) : (
                              <Download className="w-3.5 h-3.5 text-slate-500 hover:text-indigo-600" />
                            )}
                            <span>JSON</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadRecordPdf(item)}
                            disabled={downloadingAction !== null}
                            title="Download historical PDF snapshot"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold text-[11px] bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 transition disabled:opacity-50 cursor-pointer shadow-2xs"
                          >
                            {downloadingAction === `${item.id}-pdf` ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 text-slate-500 hover:text-rose-600" />
                            )}
                            <span>PDF</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Clear History Confirmation Modal */}
      {showClearHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Clear Backup History?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  This will remove all {backupHistory.length} backup history records and their archived snapshot files from storage.
                </p>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-start gap-2 text-xs text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Safe Action:</strong> Your live CRM database data (clients, editors, projects, payments, expenses, etc.) will <strong>NOT</strong> be deleted.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowClearHistoryModal(false)}
                disabled={isClearingHistory}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-clear-history"
                onClick={handleConfirmClearHistory}
                disabled={isClearingHistory}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isClearingHistory ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Clearing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear History</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PART 2 & 3: BACKUP PREVIEW MODAL + AUTOMATIC SAFETY BACKUP */}
      {/* ======================================================== */}
      {showPreviewModal && stagedBackup && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    Backup Preview &amp; Verification
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Inspect the contents and entity counts before restoring to the live database.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCancelRestore}
                disabled={isRestoring}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* File Details Summary Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">File Name</span>
                  <span className="font-mono font-medium text-slate-800 break-all">{stagedBackup.fileName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">File Size</span>
                  <span className="font-semibold text-slate-800">{stagedBackup.fileSizeFormatted}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">Exported Date</span>
                  <span className="font-medium text-slate-800">
                    {stagedBackup.metadata.exportedAt ? new Date(stagedBackup.metadata.exportedAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Comparison Table: Live Database vs. Backup Contents */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Entity Comparison Breakdown
              </h4>

              <div className="overflow-hidden border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-500 font-semibold text-[10px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Collection / Entity</th>
                      <th className="py-2.5 px-3 text-center">Current Live Count</th>
                      <th className="py-2.5 px-3 text-center">Backup File Count</th>
                      <th className="py-2.5 px-3 text-right">Net Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {[
                      { name: 'Clients', live: clients.length, backup: stagedBackup.counts.clients },
                      { name: 'Editors', live: editors.length, backup: stagedBackup.counts.editors },
                      { name: 'Deliverable Projects', live: projects.length, backup: stagedBackup.counts.projects },
                      {
                        name: 'Payments (Client & Editor)',
                        live: clientPayments.length + editorPayments.length,
                        backup: stagedBackup.counts.payments,
                      },
                      { name: 'Expenses', live: expenses.length, backup: stagedBackup.counts.expenses },
                      { name: 'Invoices', live: (invoices || []).length, backup: stagedBackup.counts.invoices },
                      { name: 'Receipts', live: (receipts || []).length, backup: stagedBackup.counts.receipts },
                    ].map((row, idx) => {
                      const diff = row.backup - row.live;
                      const diffText = diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : 'Equal';
                      const diffColor =
                        diff > 0
                          ? 'text-emerald-600 font-semibold'
                          : diff < 0
                          ? 'text-amber-600 font-semibold'
                          : 'text-slate-400 font-normal';

                      return (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 font-medium text-slate-800">{row.name}</td>
                          <td className="py-2 px-3 text-center text-slate-600">{Number(row.live).toLocaleString()}</td>
                          <td className="py-2 px-3 text-center font-bold text-slate-900">
                            {Number(row.backup).toLocaleString()}
                          </td>
                          <td className={`py-2 px-3 text-right ${diffColor}`}>{diffText}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PART 2: Automatic Safety Backup Assurance Box */}
            <div className="bg-amber-50/80 border border-amber-200/90 p-4 rounded-xl flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-amber-950 block mb-0.5">
                  Automatic Safety Backup Active
                </strong>
                Before restoring these records, Vidzyra CRM will automatically generate and download an emergency JSON backup of your current database state to your computer. Never risk losing active projects or client payments.
              </div>
            </div>

            {isRestoring && (
              <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3 text-xs text-indigo-900">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600 shrink-0" />
                <span>
                  1. Generating safety backup download... 2. Restoring database records into Firestore... Please do not close this window.
                </span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                id="btn-cancel-restore"
                onClick={handleCancelRestore}
                disabled={isRestoring}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                id="btn-confirm-safety-and-restore"
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isRestoring ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Backing Up &amp; Restoring...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Safety Backup &amp; Replace Database
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
