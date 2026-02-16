import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Domain {
  id: string;
  domain_name: string;
  display_name: string | null;
  is_active: boolean;
}

export const DomainSelector = () => {
  const { user } = useAuth();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setIsLoading(true);
      const [domainsRes, profileRes] = await Promise.all([
        supabase.from('domains' as any).select('*').eq('is_active', true).order('domain_name'),
        supabase.from('profiles').select('selected_domain_id').eq('user_id', user.id).maybeSingle(),
      ]);

      if (domainsRes.data) setDomains(domainsRes.data as any);
      if (profileRes.data?.selected_domain_id) setSelectedDomainId(profileRes.data.selected_domain_id);
      setIsLoading(false);
    };

    load();
  }, [user]);

  const handleSelect = async (domainId: string) => {
    if (!user) return;
    setIsSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ selected_domain_id: domainId } as any)
      .eq('user_id', user.id);

    if (error) {
      toast.error('Error al guardar dominio');
    } else {
      setSelectedDomainId(domainId);
      const domain = domains.find(d => d.id === domainId);
      toast.success(`Dominio actualizado: ${domain?.domain_name}`);
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const selectedDomain = domains.find(d => d.id === selectedDomainId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Dominio de correo
        </CardTitle>
        <CardDescription>
          Selecciona el dominio para envío de correos electrónicos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedDomainId ?? undefined} onValueChange={handleSelect} disabled={isSaving}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccionar dominio">
              {selectedDomain && (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>{selectedDomain.domain_name}</span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {domains.map((domain) => (
              <SelectItem key={domain.id} value={domain.id}>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{domain.domain_name}</span>
                  {domain.display_name && (
                    <span className="text-muted-foreground text-xs">({domain.display_name})</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedDomain && (
          <p className="text-sm text-muted-foreground">
            Los correos se enviarán desde <span className="font-medium text-foreground">@{selectedDomain.domain_name}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
};
