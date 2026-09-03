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
    // 1. Check URL query parameters
    const searchParams = new URLSearchParams(window.location.search);
    const searchPortal = searchParams.get('portal')?.toLowerCase();
    const searchToken = searchParams.get('token');

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

    // 2. Check URL hash parameters
    if (window.location.hash) {
      const rawHash = window.location.hash.replace(/^#\/?/, '');
      const hashParams = new URLSearchParams(rawHash.includes('?') ? rawHash.split('?')[1] : rawHash);
      const hashPortal = hashParams.get('portal')?.toLowerCase();
      const hashToken = hashParams.get('token');

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

    // 3. Direct URL Access Protection:
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
