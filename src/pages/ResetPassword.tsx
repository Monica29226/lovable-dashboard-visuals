import { useState, useEffect, useRef } from 'react';
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

const RECOVERY_PARAM_BACKUP = 'passwordRecoveryParamsBackup';

type LinkStatus = 'processing' | 'active' | 'expired';

const getStoredParams = (): Record<string, string> => {
  try {
    return JSON.parse(sessionStorage.getItem(RECOVERY_PARAM_BACKUP) || '{}');
  } catch {
    return {};
  }
};

const readParam = (name: string): string | null => {
  const url = new URL(window.location.href);
  const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
  return url.searchParams.get(name) || hash.get(name) || getStoredParams()[name] || null;
};

const cleanUrl = () => {
  sessionStorage.removeItem(RECOVERY_PARAM_BACKUP);
  window.history.replaceState(window.history.state, '', window.location.pathname);
};

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkStatus, setLinkStatus] = useState<LinkStatus>('processing');
  const [linkError, setLinkError] = useState('');
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const ready = linkStatus === 'active';
  const navigate = useNavigate();
  const settledRef = useRef(false);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = (resendEmail || sessionEmail || '').trim();
    if (!email) {
      toast.error('Ingresa tu correo electrónico');
      return;
    }
    setResending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Enlace de recuperación enviado. Revisa tu correo.');
      }
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    let timeoutId: number | undefined;

    const markActive = (email: string | null) => {
      if (settledRef.current && linkStatus === 'active') return;
      settledRef.current = true;
      setSessionEmail(email);
      setLinkError('');
      setLinkStatus('active');
      cleanUrl();
    };

    const markExpired = (message: string) => {
      if (settledRef.current && linkStatus === 'active') return;
      settledRef.current = true;
      setLinkError(message);
      setLinkStatus('expired');
      setSessionEmail(null);
    };

    // 1) Listen for auth state changes (covers SDK auto-processing of #access_token).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.info('[reset-password] auth event', event, Boolean(session));
      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        markActive(session.user?.email ?? null);
      }
    });

    const init = async () => {
      // Provider error in URL
      const providerError = readParam('error_description') || readParam('error');
      if (providerError && !readParam('access_token') && !readParam('code') && !readParam('token_hash')) {
        markExpired(providerError);
        return;
      }

      // 2) Maybe SDK already created a session
      const { data: { session: existing } } = await supabase.auth.getSession();
      if (existing) {
        markActive(existing.user?.email ?? null);
        return;
      }

      // 3) Implicit flow: #access_token + #refresh_token
      const accessToken = readParam('access_token');
      const refreshToken = readParam('refresh_token');
      if (accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!error && data.session) {
          markActive(data.session.user?.email ?? null);
          return;
        }
        console.warn('[reset-password] setSession failed', error?.message);
      }

      // 4) PKCE flow: ?code=...
      const code = readParam('code');
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error && data.session) {
          markActive(data.session.user?.email ?? null);
          return;
        }
        console.warn('[reset-password] exchangeCodeForSession failed', error?.message);

        // Fallback: treat as token_hash for recovery
        if (readParam('type') === 'recovery') {
          const { error: otpErr } = await supabase.auth.verifyOtp({ token_hash: code, type: 'recovery' });
          if (!otpErr) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              markActive(session.user?.email ?? null);
              return;
            }
          }
        }
      }

      // 5) token_hash + type=recovery (OTP verify)
      const tokenHash = readParam('token_hash');
      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery',
        });
        if (!error) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            markActive(session.user?.email ?? null);
            return;
          }
        } else {
          console.warn('[reset-password] verifyOtp failed', error.message);
        }
      }

      // 6) Wait briefly for the auth listener (SDK may still be processing)
      timeoutId = window.setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          markActive(session.user?.email ?? null);
        } else {
          markExpired('Enlace inválido o expirado. Solicita uno nuevo desde "Olvidé mi contraseña".');
        }
      }, 2500);
    };

    init();

    return () => {
      subscription.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) {
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
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
        return;
      }
      await supabase.auth.signOut();
      toast.success('Contraseña actualizada. Inicia sesión con tu nueva contraseña.');
      navigate('/auth');
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
                : 'border-blue-300 bg-blue-50 text-blue-800'
            }`}
            role="status"
            aria-live="polite"
          >
            {linkStatus === 'processing' && <Loader2 className="h-4 w-4 animate-spin" />}
            <span className="font-medium">
              {linkStatus === 'processing' && 'Procesando enlace de recuperación...'}
              {linkStatus === 'active' && (
                <>Sesión de recuperación activa{sessionEmail ? ` para ${sessionEmail}` : ''}.</>
              )}
              {linkStatus === 'expired' && (linkError || 'Enlace expirado o inválido.')}
            </span>
          </div>
          {linkStatus === 'expired' ? (
            <Button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="w-full bg-[#1a2847] hover:bg-[#2d4875] text-white font-semibold py-6 text-lg"
            >
              Solicitar nuevo enlace
            </Button>
          ) : (
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
                  disabled={loading || !ready}
                />
                <p className="text-xs text-muted-foreground">Mínimo 8 caracteres</p>
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
                  disabled={loading || !ready}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#1a2847] hover:bg-[#2d4875] text-white font-semibold py-6 text-lg"
                disabled={loading || !ready}
              >
                {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Actualizar Contraseña
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
