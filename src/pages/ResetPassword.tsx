import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import dashboardHero from '@/assets/dashboard-hero.png';
import horizonteLogo from '@/assets/horizonte-logo.png';

const getRecoveryParam = (name: string) => {
  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
  return url.searchParams.get(name) || hashParams.get(name);
};

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
  if (!domain) return 'correo-sin-formato';
  return `${name.slice(0, 2)}***@${domain}`;
};

const getSafeRecoverySnapshot = () => ({
  path: window.location.pathname,
  hasCode: Boolean(getRecoveryParam('code')),
  hasTokenHash: Boolean(getRecoveryParam('token_hash')),
  hasAccessToken: Boolean(getRecoveryParam('access_token')),
  hasRefreshToken: Boolean(getRecoveryParam('refresh_token')),
  type: getRecoveryParam('type'),
  hasProviderError: Boolean(getRecoveryParam('error')),
  storedMarker: sessionStorage.getItem(RECOVERY_SESSION_MARKER) === 'true',
});

const traceRecovery = (step: string, details: Record<string, unknown> = {}) => {
  console.info(`[password-recovery:${getRecoveryTraceId()}] ${step}`, {
    timestamp: new Date().toISOString(),
    ...details,
    snapshot: getSafeRecoverySnapshot(),
  });
};

const cleanRecoveryUrl = () => {
  traceRecovery('limpieza_url_inicio');
  window.history.replaceState(window.history.state, '', window.location.pathname);
  traceRecovery('limpieza_url_completada', { cleanPath: window.location.pathname });
};

const hasStoredRecoverySession = () => sessionStorage.getItem(RECOVERY_SESSION_MARKER) === 'true';

const markStoredRecoverySession = () => {
  sessionStorage.setItem(RECOVERY_SESSION_MARKER, 'true');
  traceRecovery('marcador_sesion_guardado');
};

const clearStoredRecoverySession = () => {
  sessionStorage.removeItem(RECOVERY_SESSION_MARKER);
  traceRecovery('marcador_sesion_limpiado');
};

const hasRecoveryIntent = () => Boolean(
  getRecoveryParam('code') ||
  getRecoveryParam('token_hash') ||
  getRecoveryParam('access_token') ||
  getRecoveryParam('refresh_token') ||
  getRecoveryParam('type') === 'recovery' ||
  getRecoveryParam('error')
);

const waitForSession = async () => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) return session;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return null;
};

const acceptActiveRecoverySession = async () => {
  const session = await waitForSession();
  if (!session) return false;

  markStoredRecoverySession();
  cleanRecoveryUrl();
  return true;
};

const establishRecoverySession = async () => {
  const hasRecoveryParams = hasRecoveryIntent();

  if (getRecoveryParam('error')) {
    clearStoredRecoverySession();
    return {
      ok: false,
      message: getRecoveryParam('error_description') || 'Enlace inválido o expirado. Solicita uno nuevo.',
    };
  }

  if (!hasRecoveryParams && await acceptActiveRecoverySession()) {
    return { ok: true };
  }

  const accessToken = getRecoveryParam('access_token');
  const refreshToken = getRecoveryParam('refresh_token');
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (!error) {
      markStoredRecoverySession();
      cleanRecoveryUrl();
      return { ok: true };
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token === accessToken) {
      markStoredRecoverySession();
      cleanRecoveryUrl();
      return { ok: true };
    }
  }

  const code = getRecoveryParam('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      markStoredRecoverySession();
      cleanRecoveryUrl();
      return { ok: true };
    }
  }

  const tokenHash = getRecoveryParam('token_hash');
  if (tokenHash && getRecoveryParam('type') === 'recovery') {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
    if (!error) {
      markStoredRecoverySession();
      cleanRecoveryUrl();
      return { ok: true };
    }
  }

  if (hasRecoveryParams) {
    if (await acceptActiveRecoverySession()) {
      return { ok: true };
    }

    clearStoredRecoverySession();
    return {
      ok: false,
      message: 'Enlace inválido o expirado. Solicita uno nuevo.',
    };
  }

  if (hasStoredRecoverySession() && await acceptActiveRecoverySession()) {
    return { ok: true };
  }

  return {
    ok: false,
    message: hasRecoveryParams
      ? 'Enlace inválido o expirado. Solicita uno nuevo.'
      : 'Solicita un nuevo enlace de recuperación desde el inicio de sesión.',
  };
};

type LinkStatus = 'processing' | 'active' | 'expired';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [checkingLink, setCheckingLink] = useState(true);
  const [linkStatus, setLinkStatus] = useState<LinkStatus>('processing');
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const markReady = async () => {
      markStoredRecoverySession();
      setReady(true);
      setLinkError('');
      setCheckingLink(false);
      setLinkStatus('active');
      const { data: { session } } = await supabase.auth.getSession();
      setSessionEmail(session?.user?.email ?? null);
    };

    const init = async () => {
      setLinkStatus('processing');
      const result = await establishRecoverySession();
      if (result.ok) {
        await markReady();
      } else {
        setReady(false);
        setLinkError(result.message);
        setCheckingLink(false);
        setLinkStatus('expired');
        setSessionEmail(null);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        markReady();
        cleanRecoveryUrl();
      } else if (event === 'INITIAL_SESSION' && session && hasStoredRecoverySession()) {
        markReady();
      }
    });

    init();
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let canSubmit = ready;

    if (!canSubmit) {
      setCheckingLink(true);
      setLinkStatus('processing');
      const result = await establishRecoverySession();
      if (result.ok) {
        canSubmit = true;
        setReady(true);
        setLinkError('');
        setLinkStatus('active');
        const { data: { session } } = await supabase.auth.getSession();
        setSessionEmail(session?.user?.email ?? null);
      } else {
        setLinkStatus('expired');
      }
      setCheckingLink(false);
    }

    if (!canSubmit) {
      toast.error('El enlace aún no está listo o expiró. Solicita uno nuevo.');
      return;
    }
    if (password !== confirm) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 8) {
      toast.error('Mínimo 8 caracteres');
      return;
    }
    setLoading(true);
    try {
      const { data: updateData, error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
      } else {
        const email = updateData.user?.email;
        clearStoredRecoverySession();
        await supabase.auth.signOut();

        if (email) {
          const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password });
          if (verifyError) {
            toast.error('La contraseña se actualizó pero no se pudo verificar. Intenta iniciar sesión manualmente.');
            navigate('/auth');
            return;
          }
          await supabase.auth.signOut();
          toast.success('Contraseña actualizada y verificada correctamente');
        } else {
          toast.success('Contraseña actualizada');
        }
        navigate('/auth');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center p-4 relative"
      style={{ backgroundImage: `url(${dashboardHero})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a2847]/95 to-[#2d4875]/90" />
      <Card className="w-full max-w-md relative z-10 bg-white/95 backdrop-blur-sm border-2 border-white/20 shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center mb-4">
            <img src={horizonteLogo} alt="Horizonte Positivo" className="w-24 h-24 drop-shadow-xl" />
          </div>
          <CardTitle className="text-3xl font-bold text-[#1a2847] uppercase tracking-tight">
            Nueva Contraseña
          </CardTitle>
          <CardDescription className="text-base text-[#2d4875]">
            Ingresa tu nueva contraseña
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`mb-4 rounded-md border px-3 py-2 text-sm flex items-center gap-2 ${
              linkStatus === 'active'
                ? 'border-green-300 bg-green-50 text-green-800'
                : linkStatus === 'expired'
                ? 'border-red-300 bg-red-50 text-red-800'
                : 'border-amber-300 bg-amber-50 text-amber-800'
            }`}
            role="status"
            aria-live="polite"
          >
            {linkStatus === 'processing' && <Loader2 className="h-4 w-4 animate-spin" />}
            <span className="font-medium">
              {linkStatus === 'processing' && 'Procesando enlace de recuperación...'}
              {linkStatus === 'active' && (
                <>Sesión activa{sessionEmail ? ` para ${sessionEmail}` : ''}. Puedes establecer tu nueva contraseña.</>
              )}
              {linkStatus === 'expired' && (linkError || 'Enlace expirado o inválido. Solicita uno nuevo.')}
            </span>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                {checkingLink ? 'Validando enlace...' : linkError || 'Mínimo 8 caracteres'}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar Contraseña</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[#1a2847] hover:bg-[#2d4875] text-white font-semibold py-6 text-lg"
              disabled={loading || checkingLink}
            >
              {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Actualizar Contraseña
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
