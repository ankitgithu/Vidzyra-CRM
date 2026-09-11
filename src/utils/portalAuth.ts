export interface SharedPortalSession {
  type: 'client' | 'editor';
  token: string;
}

const PORTAL_SESSION_KEY = 'vidzyra_shared_portal_session';

/**
 * Resolves whether the current browser environment is running as a standalone
 * shared Client or Editor portal.
 *
 * Rules:
 * 1. Checks URL query parameters (?portal=client&token=...)
 * 2. Checks URL hash parameters (#portal=client&token=...)
 * 3. Checks isolated tab session storage (sessionStorage) to enforce DIRECT URL ACCESS protection,
 *    preventing clients or editors from manually navigating to admin routes.
 */
export function getSharedPortalSession(): SharedPortalSession | null {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Check URL query parameters (?portal=client&token=... or ?type=client&token=...)
    const searchParams = new URLSearchParams(window.location.search);
    let searchPortal = (searchParams.get('portal') || searchParams.get('type'))?.toLowerCase();
    let searchToken = searchParams.get('token');

    // If token is provided without explicit portal parameter, infer from token prefix
    if (searchToken && !searchPortal) {
      if (searchToken.startsWith('portal-client-')) {
        searchPortal = 'client';
      } else if (searchToken.startsWith('portal-editor-')) {
        searchPortal = 'editor';
      }
    }

    if ((searchPortal === 'client' || searchPortal === 'editor') && searchToken) {
      const session: SharedPortalSession = {
        type: searchPortal,
        token: searchToken,
      };
      try {
        sessionStorage.setItem(PORTAL_SESSION_KEY, JSON.stringify(session));
      } catch {
        // ignore
      }
      return session;
    }

    // 2. Check URL pathname patterns (/portal/client, /portal/editor, /client-portal, /editor-portal)
    const rawPath = window.location.pathname.toLowerCase();
    if (rawPath.includes('portal')) {
      let pathType: 'client' | 'editor' | null = null;
      if (rawPath.includes('client')) pathType = 'client';
      else if (rawPath.includes('editor')) pathType = 'editor';

      const tokenFromQuery = searchParams.get('token');
      if (pathType && tokenFromQuery) {
        const session: SharedPortalSession = {
          type: pathType,
          token: tokenFromQuery,
        };
        try {
          sessionStorage.setItem(PORTAL_SESSION_KEY, JSON.stringify(session));
        } catch {
          // ignore
        }
        return session;
      }

      // Check path segments for embedded token (e.g. /portal/client/:token or /client-portal/:token)
      const segments = window.location.pathname.split('/').filter(Boolean);
      const lastSegment = segments[segments.length - 1];
      if (pathType && lastSegment && lastSegment !== 'client' && lastSegment !== 'editor' && lastSegment !== 'portal') {
        const session: SharedPortalSession = {
          type: pathType,
          token: lastSegment,
        };
        try {
          sessionStorage.setItem(PORTAL_SESSION_KEY, JSON.stringify(session));
        } catch {
          // ignore
        }
        return session;
      }
    }

    // 3. Check URL hash parameters
    if (window.location.hash) {
      const rawHash = window.location.hash.replace(/^#\/?/, '');
      const hashParams = new URLSearchParams(rawHash.includes('?') ? rawHash.split('?')[1] : rawHash);
      let hashPortal = (hashParams.get('portal') || hashParams.get('type'))?.toLowerCase();
      let hashToken = hashParams.get('token');

      if (hashToken && !hashPortal) {
        if (hashToken.startsWith('portal-client-')) hashPortal = 'client';
        else if (hashToken.startsWith('portal-editor-')) hashPortal = 'editor';
      }

      if ((hashPortal === 'client' || hashPortal === 'editor') && hashToken) {
        const session: SharedPortalSession = {
          type: hashPortal,
          token: hashToken,
        };
        try {
          sessionStorage.setItem(PORTAL_SESSION_KEY, JSON.stringify(session));
        } catch {
          // ignore
        }
        return session;
      }
    }

    // 4. Direct URL Access Protection:
    // If this tab was accessed via a shared portal link, prevent the user
    // from gaining access to the Admin Panel by manually editing the URL.
    const stored = sessionStorage.getItem(PORTAL_SESSION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if ((parsed.type === 'client' || parsed.type === 'editor') && parsed.token) {
        const session: SharedPortalSession = {
          type: parsed.type,
          token: parsed.token,
        };

        // Restore URL to preserve isolated portal routing
        try {
          const currentUrl = new URL(window.location.href);
          if (
            currentUrl.searchParams.get('portal') !== session.type ||
            currentUrl.searchParams.get('token') !== session.token
          ) {
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
    }
  } catch (err) {
    console.error('Error resolving portal session:', err);
  }

  return null;
}
