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

const RECOVERY_SESSION_MARKER = 'passwordRecoverySessionReady';
const RECOVERY_TRACE_ID = 'passwordRecoveryTraceId';
const RECOVERY_PARAM_BACKUP = 'passwordRecoveryParamsBackup';

const getStoredRecoveryParams = () => {
  try {
    return JSON.parse(sessionStorage.getItem(RECOVERY_PARAM_BACKUP) || '{}') as Record<string, string>;
  } catch {
    return {};
  }
};

const getRecoveryParam = (name: string) => {
  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
  return url.searchParams.get(name) || hashParams.get(name) || getStoredRecoveryParams()[name] || null;
};

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
  sessionStorage.removeItem(RECOVERY_PARAM_BACKUP);
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
  sessionStorage.removeItem(RECOVERY_PARAM_BACKUP);
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
  traceRecovery('validacion_sesion_inicio');
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      traceRecovery('validacion_sesion_error', { attempt: attempt + 1, errorMessage: error.message });
    }
    if (session) {
      traceRecovery('validacion_sesion_activa', {
        attempt: attempt + 1,
        email: maskEmail(session.user?.email),
        expiresAt: session.expires_at,
      });
      return session;
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  traceRecovery('validacion_sesion_sin_sesion');
  return null;
};

const acceptActiveRecoverySession = async () => {
  traceRecovery('aceptar_sesion_activa_inicio');
  const session = await waitForSession();
  if (!session) {
    traceRecovery('aceptar_sesion_activa_fallida');
    return false;
  }

  traceRecovery('sesion_recuperacion_creada', { email: maskEmail(session.user?.email), hasUserId: Boolean(session.user?.id) });
  markStoredRecoverySession();
  cleanRecoveryUrl();
  return true;
};

const establishRecoverySession = async () => {
  const hasRecoveryParams = hasRecoveryIntent();
  traceRecovery('flujo_recuperacion_inicio', { hasRecoveryParams });

  if (getRecoveryParam('error')) {
    traceRecovery('proveedor_reporta_enlace_invalido', {
      providerError: getRecoveryParam('error'),
      hasProviderErrorDescription: Boolean(getRecoveryParam('error_description')),
    });
    clearStoredRecoverySession();
    return {
      ok: false,
      message: getRecoveryParam('error_description') || 'Enlace inválido o expirado. Solicita uno nuevo.',
    };
  }

  if (!hasRecoveryParams && await acceptActiveRecoverySession()) {
    traceRecovery('flujo_recuperacion_activo_sin_parametros');
    return { ok: true };
  }

  const accessToken = getRecoveryParam('access_token');
  const refreshToken = getRecoveryParam('refresh_token');
  if (accessToken && refreshToken) {
    traceRecovery('crear_sesion_con_tokens_inicio');
    const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (!error) {
      traceRecovery('crear_sesion_con_tokens_exitosa');
      markStoredRecoverySession();
      cleanRecoveryUrl();
      return { ok: true };
    }
    traceRecovery('crear_sesion_con_tokens_error', { errorMessage: error.message });

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token === accessToken) {
      traceRecovery('crear_sesion_con_tokens_ya_consumida_por_sdk', { email: maskEmail(session.user?.email) });
      markStoredRecoverySession();
      cleanRecoveryUrl();
      return { ok: true };
    }
  }

  const code = getRecoveryParam('code');
  if (code) {
    traceRecovery('intercambiar_codigo_inicio');
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      traceRecovery('intercambiar_codigo_exitoso');
      markStoredRecoverySession();
      cleanRecoveryUrl();
      return { ok: true };
    }
    traceRecovery('intercambiar_codigo_error', { errorMessage: error.message });

    if (getRecoveryParam('type') === 'recovery' && error.message.includes('code verifier')) {
      traceRecovery('intercambiar_codigo_reintentar_como_token_hash');
      const { error: otpError } = await supabase.auth.verifyOtp({ token_hash: code, type: 'recovery' });
      if (!otpError) {
        traceRecovery('verificar_codigo_como_token_hash_exitoso');
        markStoredRecoverySession();
        cleanRecoveryUrl();
        return { ok: true };
      }
      traceRecovery('verificar_codigo_como_token_hash_error', { errorMessage: otpError.message });
    }
  }

  const tokenHash = getRecoveryParam('token_hash');
  if (tokenHash && getRecoveryParam('type') === 'recovery') {
    traceRecovery('verificar_token_hash_inicio');
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
    if (!error) {
      traceRecovery('verificar_token_hash_exitoso');
      markStoredRecoverySession();
      cleanRecoveryUrl();
      return { ok: true };
    }
    traceRecovery('verificar_token_hash_error', { errorMessage: error.message });
  }

  if (hasRecoveryParams) {
    traceRecovery('validacion_final_con_parametros_inicio');
    if (await acceptActiveRecoverySession()) {
      traceRecovery('validacion_final_con_parametros_exitosa');
      return { ok: true };
    }

    clearStoredRecoverySession();
    return {
      ok: false,
      message: 'Enlace inválido o expirado. Solicita uno nuevo.',
    };
  }

  if (hasStoredRecoverySession() && await acceptActiveRecoverySession()) {
    traceRecovery('flujo_recuperacion_activo_desde_marcador');
    return { ok: true };
  }

  traceRecovery('flujo_recuperacion_expirado_sin_sesion');
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
    traceRecovery('submit_actualizar_password_inicio', { ready, linkStatus });

    if (!canSubmit) {
      traceRecovery('submit_revalidar_enlace_inicio');
      setCheckingLink(true);
      setLinkStatus('processing');
      const result = await establishRecoverySession();
      if (result.ok) {
        traceRecovery('submit_revalidar_enlace_exitoso');
        canSubmit = true;
        setReady(true);
        setLinkError('');
        setLinkStatus('active');
        const { data: { session } } = await supabase.auth.getSession();
        setSessionEmail(session?.user?.email ?? null);
      } else {
        traceRecovery('submit_revalidar_enlace_expirado');
        setLinkStatus('expired');
      }
      setCheckingLink(false);
    }

    if (!canSubmit) {
      traceRecovery('submit_bloqueado_sin_sesion_recuperacion');
      toast.error('El enlace aún no está listo o expiró. Solicita uno nuevo.');
      return;
    }
    if (password !== confirm) {
      traceRecovery('validacion_formulario_password_no_coincide');
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 8) {
      traceRecovery('validacion_formulario_password_corta');
      toast.error('Mínimo 8 caracteres');
      return;
    }
    setLoading(true);
    try {
      traceRecovery('actualizacion_password_inicio');
      const { data: updateData, error } = await supabase.auth.updateUser({ password });
      if (error) {
        traceRecovery('actualizacion_password_error', { errorMessage: error.message });
        toast.error(error.message);
      } else {
        const email = updateData.user?.email;
        traceRecovery('actualizacion_password_exitosa', { email: maskEmail(email), hasEmail: Boolean(email) });
        clearStoredRecoverySession();
        await supabase.auth.signOut();

        if (email) {
          traceRecovery('validacion_password_actualizada_inicio', { email: maskEmail(email) });
          const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password });
          if (verifyError) {
            traceRecovery('validacion_password_actualizada_error', { errorMessage: verifyError.message });
            toast.error('La contraseña se actualizó pero no se pudo verificar. Intenta iniciar sesión manualmente.');
            navigate('/auth');
            return;
          }
          traceRecovery('validacion_password_actualizada_exitosa', { email: maskEmail(email) });
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
