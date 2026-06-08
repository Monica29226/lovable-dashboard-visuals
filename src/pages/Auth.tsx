import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Lock, Building2, Fingerprint } from 'lucide-react';
import { AclMonogram } from '@/components/AclMonogram';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('¡Bienvenido!');
        navigate('/');
      }
    } catch (error) {
      toast.error('Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left — brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-ink p-12 text-paper">
        <div className="flex items-center gap-3">
          <AclMonogram size={44} onInk arc={false} />
          <div className="leading-tight">
            <div className="font-display text-lg">ACL Costa Rica</div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-paper/60">Portal de clientes</div>
          </div>
        </div>

        <div className="relative max-w-md">
          <div className="absolute -left-4 -top-10 opacity-90">
            <AclMonogram size={120} onInk arc />
          </div>
          <blockquote className="relative pt-24 font-serif text-2xl italic leading-snug text-paper/95">
            «Sus finanzas en tiempo real — un panel claro, en los colores de su empresa.»
          </blockquote>
        </div>

        <div className="grid grid-cols-3 gap-4 text-xs text-paper/80">
          <div className="flex flex-col items-start gap-2">
            <Lock className="h-5 w-5 text-gold" />
            <span>Cifrado AES-256 / TLS</span>
          </div>
          <div className="flex flex-col items-start gap-2">
            <Building2 className="h-5 w-5 text-gold" />
            <span>Aislado por empresa</span>
          </div>
          <div className="flex flex-col items-start gap-2">
            <Fingerprint className="h-5 w-5 text-gold" />
            <span>2FA + biometría</span>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
            <AclMonogram size={56} arc />
            <div className="font-display text-xl text-foreground">ACL Costa Rica</div>
          </div>

          <h1 className="font-display text-3xl text-foreground">Iniciar sesión</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ingrese sus credenciales para acceder a su panel.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="usted@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full py-6 text-base" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Ingresar
            </Button>
            <div className="text-center">
              <a
                href="/forgot-password"
                className="text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                ¿Olvidó su contraseña?
              </a>
            </div>
          </form>

          <div className="mt-8 border-t border-line pt-6 text-center text-xs text-muted-foreground">
            ¿Es administrador de ACL?{' '}
            <a href="/forgot-password" className="text-royal hover:underline">
              Acceso de equipo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
