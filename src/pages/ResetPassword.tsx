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

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        // Handle errors in URL hash
        const hash = window.location.hash;
        if (hash.includes('error=')) {
          const params = new URLSearchParams(hash.substring(1));
          toast.error(params.get('error_description') || 'Enlace inválido o expirado');
          return;
        }

        // PKCE flow: ?code=...
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            toast.error('Enlace inválido o expirado. Solicita uno nuevo.');
            return;
          }
          setReady(true);
          return;
        }

        // Email template flow: ?token_hash=...&type=recovery
        const tokenHash = url.searchParams.get('token_hash');
        const type = url.searchParams.get('type');
        if (tokenHash && type === 'recovery') {
          const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
          if (error) {
            toast.error('Enlace inválido o expirado. Solicita uno nuevo.');
            return;
          }
          setReady(true);
          return;
        }

        // Implicit flow: tokens in hash
        if (hash.includes('access_token')) {
          const params = new URLSearchParams(hash.substring(1));
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');
          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) {
              toast.error('Enlace inválido o expirado');
              return;
            }
            setReady(true);
            return;
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session) setReady(true);
      } finally {
        setCheckingLink(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true);
      }
    });

    init();
    return () => subscription.unsubscribe();
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
                {checkingLink ? 'Validando enlace...' : 'Mínimo 8 caracteres'}
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
