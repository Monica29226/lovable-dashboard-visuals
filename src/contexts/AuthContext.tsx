import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const RECOVERY_SESSION_MARKER = 'passwordRecoverySessionReady';
const RECOVERY_TRACE_ID = 'passwordRecoveryTraceId';

const getRecoveryTraceId = () => {
  const existing = sessionStorage.getItem(RECOVERY_TRACE_ID);
  if (existing) return existing;

  const generated = crypto.randomUUID?.() ?? `trace-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  sessionStorage.setItem(RECOVERY_TRACE_ID, generated);
  return generated;
};

const maskEmail = (email?: string | null) => {
  if (!email) return null;
  const [name, domain] = email.split('@');
  return domain ? `${name.slice(0, 2)}***@${domain}` : 'correo-sin-formato';
};

const traceRecoveryAuth = (step: string, details: Record<string, unknown> = {}) => {
  console.info(`[password-recovery:${getRecoveryTraceId()}] ${step}`, {
    timestamp: new Date().toISOString(),
    ...details,
  });
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.info('Auth state changed:', event, maskEmail(session?.user?.email));
        if (window.location.pathname === '/reset-password' && session && ['PASSWORD_RECOVERY', 'SIGNED_IN', 'INITIAL_SESSION'].includes(event)) {
          sessionStorage.setItem(RECOVERY_SESSION_MARKER, 'true');
          traceRecoveryAuth('evento_auth_sesion_recuperacion', {
            event,
            email: maskEmail(session.user?.email),
            expiresAt: session.expires_at,
          });
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (window.location.pathname === '/reset-password') {
        traceRecoveryAuth('auth_context_get_session_inicial', {
          hasSession: Boolean(session),
          email: maskEmail(session?.user?.email),
          hasRecoveryMarker: sessionStorage.getItem(RECOVERY_SESSION_MARKER) === 'true',
        });
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, signUp, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
