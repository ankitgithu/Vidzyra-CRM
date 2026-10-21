export interface SharedPortalSession {
  type: 'client' | 'editor' | 'smm';
  token: string;
}

export const PORTAL_SESSION_KEY = 'vidzyra_shared_portal_session';

export const RESERVED_CRM_ROUTES = new Set([
  'dashboard',
  'clients',
  'editors',
  'work',
  'payments',
  'expenses',
  'personal-expense',
  'social-media',
  'socialmedia',
  'smm',
  'calendar',
  'reports',
  'datacenter',
  'settings',
  'admin',
  'api',
  'portal',
  'client',
  'editor',
]);

export function clearSharedPortalSession(): void {
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(PORTAL_SESSION_KEY);
    }
  } catch {
    // ignore
  }
}

function isValidPortalToken(token: unknown): token is string {
  if (!token || typeof token !== 'string') return false;
  const trimmed = token.trim().toLowerCase();
  if (!trimmed || trimmed.length < 3) return false;
  if (RESERVED_CRM_ROUTES.has(trimmed)) return false;
  return true;
}

/**
 * Resolves whether the current browser environment is running as a standalone
 * shared Client, Editor, or Social Media Management portal.
 *
 * Rules:
 * 1. Checks URL query parameters (?portal=smm&token=... or ?token=... or ?smm=...)
 * 2. Checks URL pathname patterns (/portal/smm/:token, /portal/:token, /client/:token, /smm/:token)
 * 3. Checks URL hash parameters (#/portal/smm/:token or #portal=smm&token=...)
 * 4. Checks isolated tab session storage (sessionStorage) with strict reserved route guard.
 */
export function getSharedPortalSession(): SharedPortalSession | null {
  if (typeof window === 'undefined') return null;

  try {
    // 0. If current URL is explicitly an internal CRM tab route without portal query params,
    // this is 100% an internal CRM navigation by the admin.
    // Clean up any stale portal session and return null immediately.
    const searchParams = new URLSearchParams(window.location.search);
    const hasPortalQuery =
      searchParams.has('portal') ||
      searchParams.has('token') ||
      searchParams.has('smm') ||
      searchParams.has('portalToken');
    const path = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
    const isExplicitCrmRoute =
      path === '/social-media' ||
      path === '/socialmedia' ||
      path === '/dashboard' ||
      path === '/clients' ||
      path === '/editors' ||
      path === '/work' ||
      path === '/projects' ||
      path === '/payments' ||
      path === '/reports' ||
      path === '/calendar' ||
      path === '/datacenter' ||
      path === '/data' ||
      path === '/settings' ||
      path === '/personal-expenses' ||
      path === '/personal-expense';

    if (isExplicitCrmRoute && !hasPortalQuery) {
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          window.sessionStorage.removeItem(PORTAL_SESSION_KEY);
        }
      } catch {
        // ignore
      }
      return null;
    }

    // 1. Check URL query parameters (?portal=smm&token=... or ?token=... or ?smm=...)
    let searchPortal = (searchParams.get('portal') || searchParams.get('type'))?.toLowerCase();
    let searchToken =
      searchParams.get('token') ||
      searchParams.get('portalToken') ||
      searchParams.get('smm') ||
      searchParams.get('client') ||
      searchParams.get('editor');

    // Handle shortcut query parameters like ?smm=token123
    if (!searchPortal) {
      if (searchParams.has('smm')) searchPortal = 'smm';
      else if (searchParams.has('client')) searchPortal = 'client';
      else if (searchParams.has('editor')) searchPortal = 'editor';
    }

    // Normalize SMM alias
    if (searchPortal === 'social-media' || searchPortal === 'socialmedia') {
      searchPortal = 'smm';
    }

    // If token is provided without explicit portal parameter, infer from token prefix or default
    if (searchToken && isValidPortalToken(searchToken) && !searchPortal) {
      if (searchToken.startsWith('portal-client-')) {
        searchPortal = 'client';
      } else if (searchToken.startsWith('portal-editor-')) {
        searchPortal = 'editor';
      } else {
        searchPortal = 'smm';
      }
    }

    if (
      (searchPortal === 'client' || searchPortal === 'editor' || searchPortal === 'smm') &&
      isValidPortalToken(searchToken)
    ) {
      const session: SharedPortalSession = {
        type: searchPortal,
        token: searchToken.trim(),
      };
      try {
        sessionStorage.setItem(PORTAL_SESSION_KEY, JSON.stringify(session));
      } catch {
        // ignore
      }
      return session;
    }

    // 2. Check URL pathname patterns (/portal/smm/:token, /portal/client/:token, /portal/:token, /client/:token, /smm/:token)
    const segments = window.location.pathname.split('/').filter(Boolean);

    if (segments.length >= 2) {
      const firstSegment = segments[0]?.toLowerCase();
      let pathType: 'client' | 'editor' | 'smm' | null = null;
      let pathToken: string | null = null;

      if (firstSegment === 'portal') {
        const secondSegment = segments[1]?.toLowerCase();
        if (secondSegment === 'smm' && segments[2]) {
          pathType = 'smm';
          pathToken = segments[2];
        } else if (secondSegment === 'editor' && segments[2]) {
          pathType = 'editor';
          pathToken = segments[2];
        } else if (secondSegment === 'client' && segments[2]) {
          pathType = 'client';
          pathToken = segments[2];
        } else if (isValidPortalToken(segments[1])) {
          // /portal/:token
          pathToken = segments[1];
          if (pathToken.startsWith('portal-editor-')) pathType = 'editor';
          else if (pathToken.startsWith('portal-client-')) pathType = 'client';
          else pathType = 'smm';
        }
      } else if (firstSegment === 'smm' && isValidPortalToken(segments[1])) {
        // /smm/:token
        pathType = 'smm';
        pathToken = segments[1];
      } else if (firstSegment === 'client' && isValidPortalToken(segments[1])) {
        // /client/:token
        pathToken = segments[1];
        if (pathToken.startsWith('smm_') || pathToken.startsWith('smm-') || pathToken.startsWith('portal-smm-')) {
          pathType = 'smm';
        } else {
          pathType = 'client';
        }
      } else if (firstSegment === 'editor' && isValidPortalToken(segments[1])) {
        // /editor/:token
        pathType = 'editor';
        pathToken = segments[1];
      }

      if (pathType && isValidPortalToken(pathToken)) {
        const session: SharedPortalSession = {
          type: pathType,
          token: pathToken.trim(),
        };
        try {
          sessionStorage.setItem(PORTAL_SESSION_KEY, JSON.stringify(session));
        } catch {
          // ignore
        }
        return session;
      }
    }

    // 3. Check URL hash parameters (#/portal/smm/:token or #portal=smm&token=...)
    if (window.location.hash) {
      const rawHash = window.location.hash.replace(/^#\/?/, '');
      const hashParams = new URLSearchParams(rawHash.includes('?') ? rawHash.split('?')[1] : rawHash);
      let hashPortal = (hashParams.get('portal') || hashParams.get('type'))?.toLowerCase();
      let hashToken =
        hashParams.get('token') ||
        hashParams.get('portalToken') ||
        hashParams.get('smm') ||
        hashParams.get('client') ||
        hashParams.get('editor');

      if (hashPortal === 'social-media' || hashPortal === 'socialmedia') hashPortal = 'smm';

      if (hashToken && isValidPortalToken(hashToken) && !hashPortal) {
        if (hashToken.startsWith('portal-client-')) hashPortal = 'client';
        else if (hashToken.startsWith('portal-editor-')) hashPortal = 'editor';
        else hashPortal = 'smm';
      }

      // Check hash path segments e.g. #/portal/smm/smm_123 or #/client/abc
      if (!hashToken && rawHash.includes('/')) {
        const hashSegments = rawHash.split('?')[0].split('/').filter(Boolean);
        const lastHashSegment = hashSegments[hashSegments.length - 1];
        if (isValidPortalToken(lastHashSegment)) {
          hashToken = lastHashSegment;
          if (rawHash.includes('smm') || hashToken.startsWith('smm')) hashPortal = 'smm';
          else if (rawHash.includes('editor') || hashToken.startsWith('portal-editor-')) hashPortal = 'editor';
          else hashPortal = 'client';
        }
      }

      if (
        (hashPortal === 'client' || hashPortal === 'editor' || hashPortal === 'smm') &&
        isValidPortalToken(hashToken)
      ) {
        const session: SharedPortalSession = {
          type: hashPortal,
          token: hashToken.trim(),
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
    // If this tab was legitimately accessed via a shared portal link previously
    const stored = sessionStorage.getItem(PORTAL_SESSION_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (
          (parsed.type === 'client' || parsed.type === 'editor' || parsed.type === 'smm') &&
          isValidPortalToken(parsed.token)
        ) {
          const session: SharedPortalSession = {
            type: parsed.type,
            token: parsed.token.trim(),
          };
          return session;
        } else {
          // Clean up any corrupted or legacy invalid tokens (e.g. 'social-media')
          sessionStorage.removeItem(PORTAL_SESSION_KEY);
        }
      } catch {
        sessionStorage.removeItem(PORTAL_SESSION_KEY);
      }
    }
  } catch (err) {
    console.error('Error resolving portal session:', err);
  }

  return null;
}
