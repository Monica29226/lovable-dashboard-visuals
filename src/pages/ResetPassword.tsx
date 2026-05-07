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

const cleanRecoveryUrl = () => {
  window.history.replaceState(window.history.state, '', window.location.pathname);
};

const waitForSession = async () => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) return session;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return null;
};

const establishRecoverySession = async () => {
  const hasRecoveryParams = Boolean(
    getRecoveryParam('code') ||
    getRecoveryParam('token_hash') ||
    getRecoveryParam('access_token') ||
    getRecoveryParam('refresh_token')
  );

  if (getRecoveryParam('error')) {
    return {
      ok: false,
      message: getRecoveryParam('error_description') || 'Enlace inválido o expirado. Solicita uno nuevo.',
    };
  }

  const accessToken = getRecoveryParam('access_token');
  const refreshToken = getRecoveryParam('refresh_token');
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (!error) {
      cleanRecoveryUrl();
      return { ok: true };
    }
  }

  const code = getRecoveryParam('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      cleanRecoveryUrl();
      return { ok: true };
    }
  }

  const tokenHash = getRecoveryParam('token_hash');
  if (tokenHash && getRecoveryParam('type') === 'recovery') {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
    if (!error) {
      cleanRecoveryUrl();
      return { ok: true };
    }
  }

  const session = await waitForSession();
  if (session) {
    if (hasRecoveryParams || getRecoveryParam('type') === 'recovery') cleanRecoveryUrl();
    return { ok: true };
  }

  return {
    ok: false,
    message: hasRecoveryParams
      ? 'Enlace inválido o expirado. Solicita uno nuevo.'
      : 'Solicita un nuevo enlace de recuperación desde el inicio de sesión.',
  };
};

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [checkingLink, setCheckingLink] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let recoverySessionDetected = false;

    const markReady = () => {
      recoverySessionDetected = true;
      setReady(true);
      setLinkError('');
      setCheckingLink(false);
    };

    const init = async () => {
      try {
        const url = new URL(window.location.href);
        const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
        const getParam = (name: string) => url.searchParams.get(name) || hashParams.get(name);
        const hasRecoveryParams = Boolean(getParam('code') || getParam('token_hash') || getParam('access_token'));

        // Handle errors in URL search or hash
        if (getParam('error')) {
          const message = getParam('error_description') || 'Enlace inválido o expirado. Solicita uno nuevo.';
          setLinkError(message);
          toast.error(message);
          return;
        }

        const { data: { session: initialSession } } = await recoverySupabase.auth.getSession();
        if (initialSession && (getParam('type') === 'recovery' || !hasRecoveryParams)) {
          markReady();
          return;
        }

        // PKCE flow: ?code=...
        const code = getParam('code');
        if (code) {
          const { error } = await recoverySupabase.auth.exchangeCodeForSession(code);
          if (error) {
            if (!recoverySessionDetected) {
              const message = 'Enlace inválido o expirado. Solicita uno nuevo.';
              setLinkError(message);
              toast.error(message);
            }
            return;
          }
          markReady();
          return;
        }

        // Email template flow: ?token_hash=...&type=recovery
        const tokenHash = getParam('token_hash');
        const type = getParam('type');
        if (tokenHash && type === 'recovery') {
          const { error } = await recoverySupabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
          if (error) {
            const message = 'Enlace inválido o expirado. Solicita uno nuevo.';
            setLinkError(message);
            toast.error(message);
            return;
          }
          markReady();
          return;
        }

        // Implicit flow: tokens in hash
        const access_token = getParam('access_token');
        const refresh_token = getParam('refresh_token');
        if (access_token && refresh_token) {
          const expiresIn = Number(getParam('expires_in')) || 3600;
          const { error } = await recoverySupabase.auth.setSession({ access_token, refresh_token });
          if (error) {
            const message = 'Enlace inválido o expirado. Solicita uno nuevo.';
            setLinkError(message);
            toast.error(message);
            return;
          }
          RECOVERY_LINK_KEYS.forEach((key) => url.searchParams.set(key, getParam(key) || ''));
          window.history.replaceState(window.history.state, '', `${url.pathname}?${url.searchParams.toString()}`);
          setTimeout(markReady, 0);
          setTimeout(markReady, 250);
          setTimeout(markReady, 1000);
          setTimeout(markReady, Math.max(expiresIn * 1000 - 30000, 1000));
          markReady();
          return;
        }

        if (!hasRecoveryParams) {
          setLinkError('Solicita un nuevo enlace de recuperación desde el inicio de sesión.');
        }
      } finally {
        if (!recoverySessionDetected) {
          setCheckingLink(false);
        }
      }
    };

    const { data: { subscription } } = recoverySupabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        markReady();
      } else if (event === 'INITIAL_SESSION' && session && new URLSearchParams(window.location.hash.replace(/^#/, '')).get('type') === 'recovery') {
        markReady();
      }
    });

    init();
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { session } } = await recoverySupabase.auth.getSession();
    if (!ready && !session) {
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
      const { error } = await recoverySupabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Contraseña actualizada');
        await recoverySupabase.auth.signOut();
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
