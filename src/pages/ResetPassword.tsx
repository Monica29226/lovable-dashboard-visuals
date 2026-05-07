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
    const markReady = () => {
      setReady(true);
      setLinkError('');
      setCheckingLink(false);
    };

    const init = async () => {
      const result = await establishRecoverySession();
      if (result.ok) {
        markReady();
      } else {
        setReady(false);
        setLinkError(result.message);
        setCheckingLink(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        markReady();
        cleanRecoveryUrl();
      } else if (event === 'INITIAL_SESSION' && session) {
        markReady();
      }
    });

    init();
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
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
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Contraseña actualizada');
        await supabase.auth.signOut();
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
