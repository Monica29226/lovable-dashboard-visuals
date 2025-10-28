import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email({ message: 'Correo electrónico inválido' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
});

const Auth = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const texts = {
    es: {
      title: 'Bienvenido',
      description: 'Ingresa a tu cuenta o crea una nueva',
      login: 'Iniciar Sesión',
      signup: 'Registrarse',
      email: 'Correo electrónico',
      password: 'Contraseña',
      loginButton: 'Ingresar',
      signupButton: 'Crear cuenta',
      loginSuccess: 'Sesión iniciada correctamente',
      signupSuccess: 'Cuenta creada correctamente',
      error: 'Error',
      invalidEmail: 'Correo electrónico inválido',
      passwordShort: 'La contraseña debe tener al menos 6 caracteres',
      userExists: 'Este correo ya está registrado',
      invalidCredentials: 'Credenciales inválidas',
    },
    en: {
      title: 'Welcome',
      description: 'Sign in to your account or create a new one',
      login: 'Login',
      signup: 'Sign Up',
      email: 'Email',
      password: 'Password',
      loginButton: 'Sign In',
      signupButton: 'Create Account',
      loginSuccess: 'Signed in successfully',
      signupSuccess: 'Account created successfully',
      error: 'Error',
      invalidEmail: 'Invalid email address',
      passwordShort: 'Password must be at least 6 characters',
      userExists: 'This email is already registered',
      invalidCredentials: 'Invalid credentials',
    },
  };

  const t = texts[language];

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/quickbooks-hub');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/quickbooks-hub');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = authSchema.parse({ email, password });
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error(t.error, { description: t.invalidCredentials });
        } else {
          toast.error(t.error, { description: error.message });
        }
        return;
      }

      toast.success(t.loginSuccess);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(t.error, { description: firstError.message });
      } else {
        toast.error(t.error, { description: String(error) });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = authSchema.parse({ email, password });
      setLoading(true);

      const { error } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          emailRedirectTo: `${window.location.origin}/quickbooks-hub`,
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error(t.error, { description: t.userExists });
        } else {
          toast.error(t.error, { description: error.message });
        }
        return;
      }

      toast.success(t.signupSuccess);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(t.error, { description: firstError.message });
      } else {
        toast.error(t.error, { description: String(error) });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{t.login}</TabsTrigger>
              <TabsTrigger value="signup">{t.signup}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">{t.email}</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">{t.password}</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? '...' : t.loginButton}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t.email}</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t.password}</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? '...' : t.signupButton}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
