import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
import dashboardHero from '@/assets/dashboard-hero.png';
import horizonteLogo from '@/assets/horizonte-logo.png';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(error.message);
      } else {
        setSent(true);
        toast.success('Correo de recuperación enviado');
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
            Recuperar Contraseña
          </CardTitle>
          <CardDescription className="text-base text-[#2d4875]">
            Te enviaremos un enlace para restablecerla
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4 text-center">
              <p className="text-[#2d4875]">
                Revisa tu correo <strong>{email}</strong> y sigue las instrucciones.
              </p>
              <Link to="/auth">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Volver al inicio
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#1a2847] hover:bg-[#2d4875] text-white font-semibold py-6 text-lg"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Enviar enlace
              </Button>
              <Link to="/auth" className="block text-center text-sm text-[#2d4875] hover:underline">
                Volver al inicio de sesión
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
