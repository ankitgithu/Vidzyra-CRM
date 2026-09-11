export interface SharedPortalSession {
  type: 'client' | 'editor';
  token: string;
}

const PORTAL_SESSION_KEY = 'vidzyra_shared_portal_session';
const PORTAL_STORAGE_BACKUP_KEY = 'vidzyra_portal_session_backup';

/**
 * Resolves whether the current browser environment is running as a standalone
 * shared Client or Editor portal.
 *
 * Rules:
 * 1. Checks URL query parameters (?portal=client&token=..., ?type=client&token=..., etc.)
 * 2. Checks URL pathnames (/portal/client/:token, /portal/editor/:token, /client-portal, etc.)
 * 3. Checks URL hash parameters and hash paths
 * 4. Checks sessionStorage (and fallback localStorage) for direct navigation and refresh protection
 */
export function getSharedPortalSession(): SharedPortalSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const searchParams = new URLSearchParams(window.location.search);
    const searchPortal = (
      searchParams.get('portal') ||
      searchParams.get('type') ||
      searchParams.get('role') ||
      searchParams.get('view')
    )?.toLowerCase();
    const searchToken = searchParams.get('token') || searchParams.get('t') || searchParams.get('id');

    // 1. Check URL query parameters: (?portal=client&token=...)
    if ((searchPortal === 'client' || searchPortal === 'editor') && searchToken) {
      const session: SharedPortalSession = {
        type: searchPortal,
        token: searchToken.trim(),
      };
      persistPortalSession(session);
      return session;
    }

    // 2. Check URL pathname: (/portal/client/:token, /portal/editor/:token, /client-portal/:token, etc.)
    const pathname = window.location.pathname.toLowerCase().replace(/\/+$/, '');
    
    // Exact or parameter matches for client portal paths
    const clientPathMatch = pathname.match(/^\/(?:portal\/client|client-portal)(?:\/([a-zA-Z0-9_-]+))?$/i);
    if (clientPathMatch) {
      const token = clientPathMatch[1] || searchToken || getStoredPortalToken('client') || '';
      const session: SharedPortalSession = {
        type: 'client',
        token: token.trim(),
      };
      if (session.token) {
        persistPortalSession(session);
      }
      return session;
    }

    // Exact or parameter matches for editor portal paths
    const editorPathMatch = pathname.match(/^\/(?:portal\/editor|editor-portal)(?:\/([a-zA-Z0-9_-]+))?$/i);
    if (editorPathMatch) {
      const token = editorPathMatch[1] || searchToken || getStoredPortalToken('editor') || '';
      const session: SharedPortalSession = {
        type: 'editor',
        token: token.trim(),
      };
      if (session.token) {
        persistPortalSession(session);
      }
      return session;
    }

    // Generic portal token path: /portal/:token
    const genericPortalMatch = pathname.match(/^\/portal\/([a-zA-Z0-9_-]+)$/i);
    if (genericPortalMatch && genericPortalMatch[1]) {
      const candidateToken = genericPortalMatch[1].trim();
      const type: 'client' | 'editor' = candidateToken.includes('editor') ? 'editor' : 'client';
      const session: SharedPortalSession = {
        type,
        token: candidateToken,
      };
      persistPortalSession(session);
      return session;
    }

    // Query parameter without explicit token if path or search matches portal
    if (searchPortal === 'client' || searchPortal === 'editor') {
      const token = searchToken || getStoredPortalToken(searchPortal) || '';
      const session: SharedPortalSession = {
        type: searchPortal,
        token: token.trim(),
      };
      if (session.token) {
        persistPortalSession(session);
      }
      return session;
    }

    // 3. Check URL hash parameters & hash paths
    if (window.location.hash) {
      const rawHash = window.location.hash.replace(/^#\/?/, '');
      const hashPath = rawHash.includes('?') ? rawHash.split('?')[0] : rawHash;
      const hashQuery = rawHash.includes('?') ? rawHash.split('?')[1] : '';
      const hashParams = new URLSearchParams(hashQuery);

      const hashPortal = (
        hashParams.get('portal') ||
        hashParams.get('type') ||
        hashParams.get('role')
      )?.toLowerCase();
      const hashToken = hashParams.get('token') || hashParams.get('t') || hashParams.get('id');

      if ((hashPortal === 'client' || hashPortal === 'editor') && hashToken) {
        const session: SharedPortalSession = {
          type: hashPortal,
          token: hashToken.trim(),
        };
        persistPortalSession(session);
        return session;
      }

      // Hash path matching (#/portal/client/:token)
      const hashClientMatch = hashPath.match(/^(?:portal\/client|client-portal)(?:\/([a-zA-Z0-9_-]+))?$/i);
      if (hashClientMatch) {
        const token = hashClientMatch[1] || hashToken || searchToken || getStoredPortalToken('client') || '';
        const session: SharedPortalSession = {
          type: 'client',
          token: token.trim(),
        };
        if (session.token) {
          persistPortalSession(session);
        }
        return session;
      }

      const hashEditorMatch = hashPath.match(/^(?:portal\/editor|editor-portal)(?:\/([a-zA-Z0-9_-]+))?$/i);
      if (hashEditorMatch) {
        const token = hashEditorMatch[1] || hashToken || searchToken || getStoredPortalToken('editor') || '';
        const session: SharedPortalSession = {
          type: 'editor',
          token: token.trim(),
        };
        if (session.token) {
          persistPortalSession(session);
        }
        return session;
      }
    }

    // 4. Direct URL Access & Refresh Protection:
    // If this tab was opened or refreshed with an active shared portal session,
    // preserve the session and prevent falling back to admin login.
    const stored = getStoredSession();
    if (stored && (stored.type === 'client' || stored.type === 'editor') && stored.token) {
      const session: SharedPortalSession = {
        type: stored.type,
        token: stored.token.trim(),
      };

      // Ensure URL state stays aligned with portal session without breaking
      try {
        const currentUrl = new URL(window.location.href);
        const hasPortalParam = currentUrl.searchParams.get('portal') === session.type;
        const hasTokenParam = currentUrl.searchParams.get('token') === session.token;
        const isPortalPath =
          window.location.pathname.includes('/portal') ||
          window.location.pathname.includes('/client-portal') ||
          window.location.pathname.includes('/editor-portal');

        if (!hasPortalParam && !hasTokenParam && !isPortalPath) {
          window.history.replaceState(
            null,
            '',
            `${window.location.pathname}?portal=${session.type}&token=${session.token}`
          );
        }
      } catch {
        // ignore
      }

      return session;
    }
  } catch (err) {
    console.error('Error resolving portal session:', err);
  }

  return null;
}

function persistPortalSession(session: SharedPortalSession) {
  try {
    sessionStorage.setItem(PORTAL_SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
  try {
    localStorage.setItem(PORTAL_STORAGE_BACKUP_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

function getStoredSession(): SharedPortalSession | null {
  try {
    const fromSession = sessionStorage.getItem(PORTAL_SESSION_KEY);
    if (fromSession) {
      const parsed = JSON.parse(fromSession);
      if (parsed?.type && parsed?.token) return parsed;
    }
  } catch {
    // ignore
  }

  try {
    const fromLocal = localStorage.getItem(PORTAL_STORAGE_BACKUP_KEY);
    if (fromLocal) {
      const parsed = JSON.parse(fromLocal);
      if (parsed?.type && parsed?.token) return parsed;
    }
  } catch {
    // ignore
  }

  return null;
}

function getStoredPortalToken(type: 'client' | 'editor'): string | null {
  const session = getStoredSession();
  if (session && session.type === type && session.token) {
    return session.token;
  }
  return null;
}

