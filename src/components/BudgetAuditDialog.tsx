import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { History, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AuditLog {
  id: string;
  category: string;
  field_changed: string;
  old_value: number;
  new_value: number;
  changed_at: string;
  user_id: string;
}

interface BudgetAuditDialogProps {
  companyId: string | null;
}

export const BudgetAuditDialog = ({ companyId }: BudgetAuditDialogProps) => {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const texts = {
    es: {
      title: 'Historial de Cambios',
      description: 'Registro de auditoría de modificaciones al presupuesto',
      category: 'Categoría',
      field: 'Campo',
      oldValue: 'Valor Anterior',
      newValue: 'Valor Nuevo',
      date: 'Fecha',
      user: 'Usuario',
      loading: 'Cargando historial...',
      noData: 'No hay cambios registrados',
      viewHistory: 'Ver Historial'
    },
    en: {
      title: 'Change History',
      description: 'Audit log of budget modifications',
      category: 'Category',
      field: 'Field',
      oldValue: 'Old Value',
      newValue: 'New Value',
      date: 'Date',
      user: 'User',
      loading: 'Loading history...',
      noData: 'No changes recorded',
      viewHistory: 'View History'
    }
  };

  const t = texts[language];

  const monthNames = {
    es: {
      january: 'Enero',
      february: 'Febrero',
      march: 'Marzo',
      april: 'Abril',
      may: 'Mayo',
      june: 'Junio',
      july: 'Julio',
      august: 'Agosto',
      september: 'Septiembre',
      october: 'Octubre',
      november: 'Noviembre',
      december: 'Diciembre'
    },
    en: {
      january: 'January',
      february: 'February',
      march: 'March',
      april: 'April',
      may: 'May',
      june: 'June',
      july: 'July',
      august: 'August',
      september: 'September',
      october: 'October',
      november: 'November',
      december: 'December'
    }
  };

  useEffect(() => {
    if (open && companyId) {
      loadAuditLogs();
    }
  }, [open, companyId]);

  const loadAuditLogs = async () => {
    if (!companyId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('budget_2026_audit')
        .select('*')
        .eq('company_id', companyId)
        .order('changed_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatFieldName = (field: string) => {
    return monthNames[language][field as keyof typeof monthNames.es] || field;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <History className="h-4 w-4 mr-2" />
          {t.viewHistory}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">{t.loading}</span>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t.noData}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.date}</TableHead>
                <TableHead>{t.category}</TableHead>
                <TableHead>{t.field}</TableHead>
                <TableHead className="text-right">{t.oldValue}</TableHead>
                <TableHead className="text-right">{t.newValue}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">
                    {format(new Date(log.changed_at), 'PPp', { locale: language === 'es' ? es : undefined })}
                  </TableCell>
                  <TableCell className="font-medium">{log.category}</TableCell>
                  <TableCell>{formatFieldName(log.field_changed)}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(log.old_value)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-green-600 font-semibold">
                    {formatNumber(log.new_value)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};
