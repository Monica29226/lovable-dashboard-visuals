import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { AclMonogram } from '@/components/AclMonogram';

type State = 'loading' | 'valid' | 'invalid' | 'already' | 'submitting' | 'done';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const Unsubscribe = () => {
  const [state, setState] = useState<State>('loading');
  const token = new URLSearchParams(window.location.search).get('token');

  useEffect(() => {
    if (!token) {
      setState('invalid');
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_KEY } },
        );
        const data = await res.json();
        if (res.ok && data.valid) setState('valid');
        else if (data.reason === 'already_unsubscribed') setState('already');
        else setState('invalid');
      } catch {
        setState('invalid');
      }
    })();
  }, [token]);

  const handleConfirm = async () => {
    if (!token) return;
    setState('submitting');
    try {
      const { data, error } = await supabase.functions.invoke('handle-email-unsubscribe', {
        body: { token },
      });
      if (!error && (data?.success || data?.reason === 'already_unsubscribed')) {
        setState('done');
      } else {
        setState('invalid');
      }
    } catch {
      setState('invalid');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6 flex flex-col items-center gap-3">
          <AclMonogram size={48} arc />
          <div className="font-display text-xl text-foreground">ACL Costa Rica</div>
        </div>

        {state === 'loading' && (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p>Verificando enlace…</p>
          </div>
        )}

        {state === 'valid' && (
          <>
            <h1 className="font-display text-2xl text-foreground">Cancelar suscripción</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              ¿Desea dejar de recibir correos de notificación de ACL Costa Rica?
            </p>
            <Button onClick={handleConfirm} className="mt-6 w-full">
              Confirmar cancelación
            </Button>
          </>
        )}

        {state === 'submitting' && (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p>Procesando…</p>
          </div>
        )}

        {state === 'done' && (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 className="h-10 w-10 text-primary" />
            <h1 className="font-display text-2xl text-foreground">Suscripción cancelada</h1>
            <p className="text-sm text-muted-foreground">
              Ya no recibirá correos de notificación en esta dirección.
            </p>
          </div>
        )}

        {state === 'already' && (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 className="h-10 w-10 text-primary" />
            <h1 className="font-display text-2xl text-foreground">Ya cancelado</h1>
            <p className="text-sm text-muted-foreground">
              Esta dirección ya estaba dada de baja.
            </p>
          </div>
        )}

        {state === 'invalid' && (
          <div className="flex flex-col items-center gap-3">
            <XCircle className="h-10 w-10 text-destructive" />
            <h1 className="font-display text-2xl text-foreground">Enlace no válido</h1>
            <p className="text-sm text-muted-foreground">
              Este enlace de cancelación no es válido o ya expiró.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Unsubscribe;
