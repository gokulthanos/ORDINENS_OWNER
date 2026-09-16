import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { OwnerSession } from '@/types';
import {
  restoreOwnerSession,
  signInOwner,
  signOutOwner,
  signUpOwner,
  SignInResult,
  SignUpResult,
} from '@/services/authService';

interface AuthContextValue {
  session: OwnerSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (email: string, password: string, name: string, phone?: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  loading: true,
  signIn: async () => ({ session: null, error: 'Not ready' }),
  signUp: async () => ({ session: null, error: 'Not ready' }),
  signOut: async () => undefined,
  refresh: async () => undefined,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<OwnerSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const s = await restoreOwnerSession();
    setSession(s);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signIn = useCallback(async (email: string, password: string): Promise<SignInResult> => {
    const result = await signInOwner(email, password);
    if (result.session) setSession(result.session);
    return result;
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string, phone?: string): Promise<SignUpResult> => {
    const result = await signUpOwner(email, password, name, phone);
    if (result.session) setSession(result.session);
    return result;
  }, []);

  const signOut = useCallback(async () => {
    await signOutOwner();
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signUp, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}