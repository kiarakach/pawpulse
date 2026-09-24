import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState(null);

  const loadFromSession = async (session) => {
    try {
      if (session?.user) {
        const me = await base44.auth.me();
        setUser(me);
        setIsAuthenticated(true);
        setAuthError(null);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Auth load failed:', err);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await loadFromSession(session);
      } else {
        // No login screen: give every visitor a silent anonymous session so
        // RLS (auth.uid()) keeps working and they land straight on Home.
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.error('Anonymous sign-in failed (enable it in Supabase → Auth):', error);
          if (mounted) { setIsLoadingAuth(false); setAuthChecked(true); }
        } else {
          await loadFromSession(data.session);
        }
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) loadFromSession(session);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  const checkUserAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await loadFromSession(session);
  };

  // Kept for components that still reference it (e.g. a menu button).
  const logout = async () => {
    await supabase.auth.signOut();
    // Immediately re-establish an anonymous session so the app stays usable.
    await supabase.auth.signInAnonymously();
  };

  const navigateToLogin = () => { /* no-op: app has no login gate */ };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError,
      appPublicSettings: null,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState: checkUserAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
