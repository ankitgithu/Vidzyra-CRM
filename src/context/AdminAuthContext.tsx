import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, AUTHORIZED_ADMIN_EMAIL, isAuthorizedAdminEmail } from '../supabase';

export interface AdminAuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isAuthInitializing: boolean;
  isLoggingIn: boolean;
  authError: string | null;
  isPasswordRecovery: boolean;
  setIsPasswordRecovery: (value: boolean) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  clearAuthError: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAuthInitializing, setIsAuthInitializing] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(false);

  const clearAuthError = () => {
    setAuthError(null);
  };

  useEffect(() => {
    let isMounted = true;

    // Detect if user landed on a password recovery URL (hash or query param)
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (
        hash.includes('type=recovery') ||
        search.includes('type=recovery') ||
        hash.includes('access_token=')
      ) {
        setIsPasswordRecovery(true);
      }
    }

    const initializeSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (error) {
          console.warn('[Supabase Auth] Session fetch error:', error.message);
        }

        const activeSession = data?.session;
        if (activeSession?.user) {
          if (isAuthorizedAdminEmail(activeSession.user.email)) {
            setUser(activeSession.user);
            setSession(activeSession);
            setIsAdmin(true);
            setAuthError(null);
          } else {
            // Unauthorized account: immediately sign out and reject
            await supabase.auth.signOut();
            if (isMounted) {
              setUser(null);
              setSession(null);
              setIsAdmin(false);
              setAuthError('This account is not authorized to access Vidzyra CRM.');
            }
          }
        } else {
          setUser(null);
          setSession(null);
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('[Supabase Auth] Initialization exception:', err);
        if (isMounted) {
          setUser(null);
          setSession(null);
          setIsAdmin(false);
        }
      } finally {
        if (isMounted) {
          setIsAuthInitializing(false);
        }
      }
    };

    initializeSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        if (newSession?.user) {
          setUser(newSession.user);
          setSession(newSession);
        }
        setIsAuthInitializing(false);
        return;
      }

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setIsAdmin(false);
        setIsAuthInitializing(false);
        return;
      }

      if (newSession?.user) {
        if (isAuthorizedAdminEmail(newSession.user.email)) {
          setUser(newSession.user);
          setSession(newSession);
          setIsAdmin(true);
          setAuthError(null);
        } else {
          // If a non-authorized user logged in, immediately sign out
          await supabase.auth.signOut();
          if (isMounted) {
            setUser(null);
            setSession(null);
            setIsAdmin(false);
            setAuthError('This account is not authorized to access Vidzyra CRM.');
          }
        }
      } else {
        setUser(null);
        setSession(null);
        setIsAdmin(false);
      }

      setIsAuthInitializing(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (
    emailInput: string,
    passwordInput: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (isLoggingIn) return { success: false };

    setIsLoggingIn(true);
    setAuthError(null);

    const cleanEmail = emailInput.trim();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: passwordInput,
      });

      if (error) {
        let friendlyMessage = 'Invalid email or password.';
        const msg = (error.message || '').toLowerCase();
        if (
          msg.includes('network') ||
          msg.includes('fetch') ||
          msg.includes('failed to fetch') ||
          msg.includes('connection')
        ) {
          friendlyMessage = 'Unable to sign in right now. Please try again.';
        } else if (
          msg.includes('invalid') ||
          msg.includes('credential') ||
          msg.includes('password') ||
          msg.includes('email') ||
          error.status === 400
        ) {
          friendlyMessage = 'Invalid email or password.';
        } else {
          friendlyMessage = 'Invalid email or password.';
        }

        setAuthError(friendlyMessage);
        setIsLoggingIn(false);
        return { success: false, error: friendlyMessage };
      }

      if (!data.user) {
        const friendlyMessage = 'Invalid email or password.';
        setAuthError(friendlyMessage);
        setIsLoggingIn(false);
        return { success: false, error: friendlyMessage };
      }

      // Step 2 & 3: Verify the user's email exactly matches: akrp1432@gmail.com
      if (!isAuthorizedAdminEmail(data.user.email)) {
        await supabase.auth.signOut();
        const unauthorizedMsg = 'This account is not authorized to access Vidzyra CRM.';
        setUser(null);
        setSession(null);
        setIsAdmin(false);
        setAuthError(unauthorizedMsg);
        setIsLoggingIn(false);
        return { success: false, error: unauthorizedMsg };
      }

      setUser(data.user);
      setSession(data.session);
      setIsAdmin(true);
      setAuthError(null);
      setIsLoggingIn(false);
      return { success: true };
    } catch (err: any) {
      console.error('[Supabase Auth] Login caught exception:', err);
      const friendlyMessage = 'Unable to sign in right now. Please try again.';
      setAuthError(friendlyMessage);
      setIsLoggingIn(false);
      return { success: false, error: friendlyMessage };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[Supabase Auth] Logout error:', err);
    } finally {
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setAuthError(null);
    }
  };

  const requestPasswordReset = async (
    emailInput: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanEmail = emailInput.trim();
      const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo,
      });

      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('network') || msg.includes('fetch')) {
          return { success: false, error: 'Unable to sign in right now. Please try again.' };
        }
        return {
          success: false,
          error: 'Unable to send password reset email. Please verify your email and try again.',
        };
      }

      return { success: true };
    } catch (err) {
      console.error('[Supabase Auth] Password reset request error:', err);
      return { success: false, error: 'Unable to sign in right now. Please try again.' };
    }
  };

  const updatePassword = async (
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return {
          success: false,
          error: 'Unable to update password. Please make sure your password is at least 6 characters.',
        };
      }

      setIsPasswordRecovery(false);
      return { success: true };
    } catch (err) {
      console.error('[Supabase Auth] Update password error:', err);
      return { success: false, error: 'Unable to update password right now. Please try again.' };
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        session,
        isAdmin,
        isAuthInitializing,
        isLoggingIn,
        authError,
        isPasswordRecovery,
        setIsPasswordRecovery,
        login,
        logout,
        requestPasswordReset,
        updatePassword,
        clearAuthError,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
