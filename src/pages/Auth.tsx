import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  
  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Signup form
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupFullName, setSignupFullName] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");

  const texts = {
    es: {
      title: 'QuickBooks Dashboard',
      subtitle: 'Ingresa a tu cuenta',
      loginTab: 'Iniciar Sesión',
      signupTab: 'Registrarse',
      loginTitle: 'Bienvenido',
      loginDesc: 'Ingresa tus credenciales para acceder',
      signupTitle: 'Crear Cuenta',
      signupDesc: 'Completa el formulario para registrarte',
      email: 'Correo Electrónico',
      password: 'Contraseña',
      confirmPassword: 'Confirmar Contraseña',
      fullName: 'Nombre Completo',
      loginButton: 'Iniciar Sesión',
      signupButton: 'Registrarse',
      passwordMismatch: 'Las contraseñas no coinciden',
      fillAllFields: 'Por favor completa todos los campos',
      loginSuccess: 'Inicio de sesión exitoso',
      signupSuccess: 'Registro exitoso. Redirigiendo...',
      loginError: 'Error al iniciar sesión',
      signupError: 'Error al registrarse',
      emailInUse: 'Este correo ya está registrado',
      invalidEmail: 'Correo electrónico inválido',
      weakPassword: 'La contraseña debe tener al menos 6 caracteres'
    },
    en: {
      title: 'QuickBooks Dashboard',
      subtitle: 'Sign in to your account',
      loginTab: 'Login',
      signupTab: 'Sign Up',
      loginTitle: 'Welcome Back',
      loginDesc: 'Enter your credentials to access',
      signupTitle: 'Create Account',
      signupDesc: 'Fill in the form to register',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      fullName: 'Full Name',
      loginButton: 'Sign In',
      signupButton: 'Sign Up',
      passwordMismatch: 'Passwords do not match',
      fillAllFields: 'Please fill in all fields',
      loginSuccess: 'Login successful',
      signupSuccess: 'Registration successful. Redirecting...',
      loginError: 'Error signing in',
      signupError: 'Error signing up',
      emailInUse: 'This email is already registered',
      invalidEmail: 'Invalid email address',
      weakPassword: 'Password must be at least 6 characters'
    }
  };

  const t = texts[language];

  useEffect(() => {
    if (user && !authLoading) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      toast.error(t.fillAllFields);
      return;
    }
    
    setLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setLoading(false);
    
    if (error) {
      console.error('Login error:', error);
      toast.error(t.loginError + ': ' + error.message);
    } else {
      toast.success(t.loginSuccess);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupEmail || !signupPassword || !signupFullName || !signupConfirmPassword) {
      toast.error(t.fillAllFields);
      return;
    }
    
    if (signupPassword !== signupConfirmPassword) {
      toast.error(t.passwordMismatch);
      return;
    }
    
    if (signupPassword.length < 6) {
      toast.error(t.weakPassword);
      return;
    }
    
    setLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupFullName);
    setLoading(false);
    
    if (error) {
      console.error('Signup error:', error);
      if (error.message.includes('already registered')) {
        toast.error(t.emailInUse);
      } else {
        toast.error(t.signupError + ': ' + error.message);
      }
    } else {
      toast.success(t.signupSuccess);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="flex justify-end">
          <LanguageToggle />
        </div>
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">{t.loginTab}</TabsTrigger>
            <TabsTrigger value="signup">{t.signupTab}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>{t.loginTitle}</CardTitle>
                <CardDescription>{t.loginDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">{t.email}</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">{t.password}</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogIn className="mr-2 h-4 w-4" />
                    )}
                    {t.loginButton}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>{t.signupTitle}</CardTitle>
                <CardDescription>{t.signupDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">{t.fullName}</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={signupFullName}
                      onChange={(e) => setSignupFullName(e.target.value)}
                      placeholder="Juan Pérez"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">{t.email}</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">{t.password}</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">{t.confirmPassword}</Label>
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="mr-2 h-4 w-4" />
                    )}
                    {t.signupButton}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
