import { WorkProject } from '../types';

export const DRIVE_FOLDER_VALIDATION_ERROR = 'Please enter a valid Google Drive folder link.';

export const PROJECT_DRIVE_SUBFOLDERS = [
  'Client Raw Files',
  'References',
  'Edited Videos',
  'Revisions',
  'Final Deliverables',
] as const;

/**
 * Validates whether a string is a valid Google Drive folder link.
 */
export function isValidGoogleDriveFolderUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();

    // Must be a Google Drive host
    const isDriveHost =
      host === 'drive.google.com' ||
      host.endsWith('.drive.google.com') ||
      (host.endsWith('google.com') && parsed.pathname.includes('/drive/'));

    if (!isDriveHost) {
      return false;
    }

    // Check for folder indicators: /folders/, open?id=, /folderview, or /drive/
    const pathname = parsed.pathname.toLowerCase();
    const hasFolderInPath =
      pathname.includes('/folders/') ||
      pathname.includes('/folderview') ||
      pathname.includes('/drive/u/') ||
      pathname.includes('/drive/mobile/');
    const hasIdParam = parsed.searchParams.has('id');
    const isDrivePath = pathname.startsWith('/drive') || pathname.startsWith('/open');

    return hasFolderInPath || hasIdParam || isDrivePath;
  } catch {
    return false;
  }
}

/**
 * Gets the canonical Google Drive folder URL for a project.
 * Preserves backwards compatibility with existing projects that only had legacy link fields.
 */
export function getProjectDriveFolderUrl(
  project: Partial<WorkProject> | null | undefined
): string {
  if (!project) return '';

  // 1. New canonical single shared folder field
  if (project.driveFolderUrl && project.driveFolderUrl.trim()) {
    return project.driveFolderUrl.trim();
  }

  // 2. For existing projects: detect valid existing primary Drive folder link safely
  const candidateFields = [
    project.userDownloadLink,
    project.clientUploadLink,
    project.userUploadLink,
    project.clientDownloadLink,
  ];

  for (const candidate of candidateFields) {
    if (candidate && isValidGoogleDriveFolderUrl(candidate)) {
      return candidate.trim();
    }
  }

  // Fallback to any non-empty candidate starting with http/https
  for (const candidate of candidateFields) {
    if (candidate && typeof candidate === 'string' && candidate.trim().startsWith('http')) {
      return candidate.trim();
    }
  }

  return '';
}
