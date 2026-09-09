import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { BackupHistoryRecord } from '../types';
import {
  DatabaseSnapshotData,
  generateDatabaseSnapshotPdf,
  getBackupTimestamp,
} from '../utils/pdfGenerator';

const BACKUP_HISTORY_COLLECTION = 'backupHistory';
const BACKUP_ARTIFACTS_COLLECTION = 'backupArtifacts';

export interface BackupArtifactDoc {
  id: string; // matches backupId
  backupId: string;
  createdAt: string;
  jsonFileName: string;
  pdfFileName: string;
  jsonSize: number;
  pdfSize: number;
  status: 'Ready' | 'Available' | 'Failed';
  jsonData: any; // complete historical CRM database snapshot
  pdfBase64?: string; // base64 string of PDF snapshot if available
}

export function formatBytes(bytes?: number | null): string {
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes <= 0) {
    return 'Size unavailable';
  }
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const LOCAL_STORAGE_ARTIFACT_PREFIX = 'vidzyra_backup_artifact_';

/**
 * Saves the exact historical database snapshot (JSON payload and PDF base64) to persistent Firestore
 * and local cache.
 */
export async function saveHistoricalBackupArtifact(payload: {
  backupId: string;
  createdAt: string;
  snapshotData: DatabaseSnapshotData;
  jsonFileName: string;
  pdfFileName: string;
  jsonString: string;
  pdfBase64?: string;
  pdfSize?: number;
}): Promise<{ jsonStoragePath: string; pdfStoragePath: string; jsonSize: number; pdfSize: number }> {
  const jsonBlob = new Blob([payload.jsonString], { type: 'application/json' });
  const jsonSize = jsonBlob.size;
  const pdfSize = payload.pdfSize || (payload.pdfBase64 ? Math.round((payload.pdfBase64.length * 3) / 4) : 0);

  const jsonStoragePath = `backupArtifacts/${payload.backupId}/json`;
  const pdfStoragePath = `backupArtifacts/${payload.backupId}/pdf`;

  // Sanitize snapshot data for Firestore (remove undefined values)
  const sanitizedJsonData = JSON.parse(JSON.stringify(payload.snapshotData));

  // Determine if pdfBase64 fits within Firestore document size limit (1MB max, keep below 750KB)
  const approxSize = payload.jsonString.length + (payload.pdfBase64 ? payload.pdfBase64.length : 0);
  const includePdfBase64 = payload.pdfBase64 && approxSize < 750000 ? payload.pdfBase64 : '';

  const artifactDoc: BackupArtifactDoc = {
    id: payload.backupId,
    backupId: payload.backupId,
    createdAt: payload.createdAt,
    jsonFileName: payload.jsonFileName,
    pdfFileName: payload.pdfFileName,
    jsonSize,
    pdfSize,
    status: 'Ready',
    jsonData: sanitizedJsonData,
    pdfBase64: includePdfBase64,
  };

  // 1. Cache locally first for fast retrieval
  try {
    localStorage.setItem(
      `${LOCAL_STORAGE_ARTIFACT_PREFIX}${payload.backupId}`,
      JSON.stringify(artifactDoc)
    );
  } catch (err) {
    console.warn('[BackupStorage] LocalStorage quota exceeded or unavailable:', err);
  }

  // 2. Persist to Firestore backupArtifacts collection
  try {
    const artRef = doc(db, 'backupArtifacts', payload.backupId);
    await setDoc(artRef, artifactDoc);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `backupArtifacts/${payload.backupId}`);
    console.error('[BackupStorage] Failed to persist artifact in Firestore:', err);
    // Even if Firestore write failed due to network, local cache is preserved
  }

  return {
    jsonStoragePath,
    pdfStoragePath,
    jsonSize,
    pdfSize,
  };
}

/**
 * Retrieves the historical artifact for a given backup history record.
 */
export async function getHistoricalBackupArtifact(
  backupId: string
): Promise<BackupArtifactDoc | null> {
  // 1. Check local persistent storage
  try {
    const cached = localStorage.getItem(`${LOCAL_STORAGE_ARTIFACT_PREFIX}${backupId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.jsonData) {
        return parsed as BackupArtifactDoc;
      }
    }
  } catch (err) {
    console.warn('[BackupStorage] Error reading local cache:', err);
  }

  // 2. Query Firestore backupArtifacts
  try {
    const artRef = doc(db, 'backupArtifacts', backupId);
    const snap = await getDoc(artRef);
    if (snap.exists()) {
      const data = snap.data() as BackupArtifactDoc;
      // Populate local cache
      try {
        localStorage.setItem(`${LOCAL_STORAGE_ARTIFACT_PREFIX}${backupId}`, JSON.stringify(data));
      } catch {}
      return data;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `backupArtifacts/${backupId}`);
    console.error('[BackupStorage] Error reading from Firestore backupArtifacts:', err);
  }

  return null;
}

/**
 * Downloads the exact historical JSON database snapshot for a specific Backup History record.
 */
export async function downloadHistoricalBackupJson(record: BackupHistoryRecord): Promise<void> {
  const artifact = await getHistoricalBackupArtifact(record.id);

  if (!artifact || !artifact.jsonData) {
    throw new Error(
      'Backup file is unavailable. This backup record may have been created before persistent backup storage was enabled.'
    );
  }

  // Use the exact snapshot data captured at backup time
  const jsonString = JSON.stringify(artifact.jsonData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  // Filename formatting based on original backup timestamp
  const rawTimestamp = record.timestamp || record.createdAt || `${record.date} ${record.time}`;
  const formattedTimestamp = getBackupTimestamp(rawTimestamp);
  const fileName =
    record.jsonFileName ||
    record.fileName?.replace(/\.pdf$/i, '.json') ||
    `Vidzyra-Database-Backup-${formattedTimestamp}.json`;

  const finalFileName = fileName.endsWith('.json') ? fileName : `${fileName}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = finalFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads the exact historical PDF report snapshot for a specific Backup History record.
 */
export async function downloadHistoricalBackupPdf(record: BackupHistoryRecord): Promise<void> {
  const artifact = await getHistoricalBackupArtifact(record.id);

  if (!artifact || !artifact.jsonData) {
    throw new Error(
      'Backup file is unavailable. This backup record may have been created before persistent backup storage was enabled.'
    );
  }

  const rawTimestamp = record.timestamp || record.createdAt || `${record.date} ${record.time}`;
  const formattedTimestamp = getBackupTimestamp(rawTimestamp);
  const defaultPdfFileName = `Vidzyra-Database-Snapshot-${formattedTimestamp}.pdf`;
  const fileName = record.pdfFileName || defaultPdfFileName;
  const finalFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;

  // If pdfBase64 is stored in the artifact, use it directly
  if (artifact.pdfBase64 && artifact.pdfBase64.startsWith('data:application/pdf')) {
    try {
      const parts = artifact.pdfBase64.split(',');
      const byteString = atob(parts[1]);
      const mimeString = parts[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = finalFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    } catch (err) {
      console.warn('[BackupStorage] Could not decode stored pdfBase64, falling back to generator:', err);
    }
  }

  // Re-render the exact PDF using the historical snapshot data and original backup timestamp
  generateDatabaseSnapshotPdf(artifact.jsonData, {
    autoSave: true,
    customFileName: finalFileName,
    backupTimestamp: formattedTimestamp,
    backupDateStr: `${record.date} ${record.time}`,
  });
}

/**
 * Clears all backup history records and persistent backup artifacts.
 * STRICT SAFETY RULE: NEVER touches clients, projects, editors, payments, expenses, etc.
 */
export async function clearAllBackupHistoryAndArtifacts(): Promise<void> {
  // 1. Fetch all docs from backupHistory
  const historyDocs: string[] = [];
  try {
    const snap = await getDocs(collection(db, BACKUP_HISTORY_COLLECTION));
    snap.forEach((d) => historyDocs.push(d.id));
  } catch (err) {
    console.warn('[BackupStorage] Could not list backupHistory:', err);
  }

  // 2. Fetch all docs from backupArtifacts
  const artifactDocs: string[] = [];
  try {
    const snap = await getDocs(collection(db, BACKUP_ARTIFACTS_COLLECTION));
    snap.forEach((d) => artifactDocs.push(d.id));
  } catch (err) {
    console.warn('[BackupStorage] Could not list backupArtifacts:', err);
  }

  // 3. Batch delete only history and artifact records
  if (historyDocs.length > 0 || artifactDocs.length > 0) {
    const batch = writeBatch(db);
    historyDocs.forEach((id) => {
      batch.delete(doc(db, BACKUP_HISTORY_COLLECTION, id));
    });
    artifactDocs.forEach((id) => {
      batch.delete(doc(db, BACKUP_ARTIFACTS_COLLECTION, id));
    });
    await batch.commit();
  }

  // 4. Purge local artifact cache
  try {
    localStorage.removeItem('vidzyra_backup_history');
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(LOCAL_STORAGE_ARTIFACT_PREFIX) || key === 'vidzyra_backup_history')) {
        localStorage.removeItem(key);
      }
    }
  } catch (err) {
    console.warn('[BackupStorage] Error clearing local cache:', err);
  }
}
