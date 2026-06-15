import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Loader2 } from 'lucide-react';
import ResumenTab from '@/components/empresas/ResumenTab';
import AdministracionTab from '@/components/empresas/AdministracionTab';

export default function Empresas() {
  const { language } = useLanguage();
  const { isAdmin, isLoading: roleLoading } = useIsAdmin();

  const t = {
    es: { title: 'Empresas', resumen: 'Resumen', admin: 'Administración' },
    en: { title: 'Companies', resumen: 'Overview', admin: 'Administration' },
  }[language];

  return (
    <div className="p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <h1 className="font-display text-3xl text-foreground">{t.title}</h1>

        {roleLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : isAdmin ? (
          <Tabs defaultValue="resumen" className="space-y-6">
            <TabsList>
              <TabsTrigger value="resumen">{t.resumen}</TabsTrigger>
              <TabsTrigger value="admin">{t.admin}</TabsTrigger>
            </TabsList>
            <TabsContent value="resumen">
              <ResumenTab />
            </TabsContent>
            <TabsContent value="admin">
              <AdministracionTab />
            </TabsContent>
          </Tabs>
        ) : (
          <ResumenTab />
        )}
      </div>
    </div>
  );
}
