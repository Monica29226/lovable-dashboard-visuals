import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  FileText, Upload, Download, Trash2, Mail, Paperclip, RefreshCw, Loader2, FolderOpen, Inbox,
} from "lucide-react";

interface DocItem {
  id: string;
  name: string;
  size: number;
  lastModified: string;
  webUrl: string;
}

interface EmailItem {
  id: string;
  subject: string;
  from: string;
  fromName: string;
  received: string;
  isRead: boolean;
  preview: string;
  hasAttachments: boolean;
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function CentroDocumental() {
  const { selectedCompanyId, companies } = useCompany();
  const { language } = useLanguage();
  const es = language === "es";

  const company = companies.find((c) => c.id === selectedCompanyId);

  const [docs, setDocs] = useState<DocItem[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [noEmail, setNoEmail] = useState(false);
  const [openEmail, setOpenEmail] = useState<{ subject: string; from: string; received: string; body: string; bodyType: string } | null>(null);

  const loadDocs = useCallback(async () => {
    if (!selectedCompanyId) return;
    setDocsLoading(true);
    const { data, error } = await supabase.functions.invoke("onedrive-documents", {
      body: { companyId: selectedCompanyId, action: "list" },
    });
    setDocsLoading(false);
    if (error) {
      toast.error(es ? "Error al cargar documentos" : "Error loading documents");
      return;
    }
    setDocs(data?.items ?? []);
  }, [selectedCompanyId, es]);

  const loadEmails = useCallback(async () => {
    if (!selectedCompanyId) return;
    setEmailsLoading(true);
    const { data, error } = await supabase.functions.invoke("outlook-emails", {
      body: { companyId: selectedCompanyId, action: "list" },
    });
    setEmailsLoading(false);
    if (error) {
      toast.error(es ? "Error al cargar correos" : "Error loading emails");
      return;
    }
    setNoEmail(!!data?.noEmail);
    setEmails(data?.items ?? []);
  }, [selectedCompanyId, es]);

  useEffect(() => {
    setDocs([]);
    setEmails([]);
    loadDocs();
  }, [selectedCompanyId, loadDocs]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCompanyId) return;
    if (file.size > 18 * 1024 * 1024) {
      toast.error(es ? "El archivo supera 18 MB" : "File exceeds 18 MB");
      return;
    }
    setUploading(true);
    const buffer = await file.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);

    const { error } = await supabase.functions.invoke("onedrive-documents", {
      body: { companyId: selectedCompanyId, action: "upload", fileName: file.name, fileContentBase64: base64 },
    });
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (error) {
      toast.error(es ? "Error al subir el archivo" : "Upload failed");
      return;
    }
    toast.success(es ? "Documento subido" : "Document uploaded");
    loadDocs();
  };

  const handleDownload = async (item: DocItem) => {
    const { data, error } = await supabase.functions.invoke("onedrive-documents", {
      body: { companyId: selectedCompanyId, action: "download", itemId: item.id },
    });
    if (error || !data?.downloadUrl) {
      toast.error(es ? "No se pudo descargar" : "Download failed");
      return;
    }
    window.open(data.downloadUrl, "_blank");
  };

  const handleDelete = async (item: DocItem) => {
    if (!confirm(es ? `¿Eliminar "${item.name}"?` : `Delete "${item.name}"?`)) return;
    const { error } = await supabase.functions.invoke("onedrive-documents", {
      body: { companyId: selectedCompanyId, action: "delete", itemId: item.id },
    });
    if (error) {
      toast.error(es ? "No se pudo eliminar" : "Delete failed");
      return;
    }
    toast.success(es ? "Documento eliminado" : "Document deleted");
    setDocs((d) => d.filter((x) => x.id !== item.id));
  };

  const openEmailDetail = async (id: string) => {
    const { data, error } = await supabase.functions.invoke("outlook-emails", {
      body: { companyId: selectedCompanyId, action: "get", messageId: id },
    });
    if (error) {
      toast.error(es ? "No se pudo abrir el correo" : "Could not open email");
      return;
    }
    setOpenEmail(data);
  };

  if (!selectedCompanyId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        {es ? "Selecciona una empresa para ver su centro documental." : "Select a company to view its document center."}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl text-foreground">
          {es ? "Centro Documental" : "Document Center"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {company?.company_name} · {es ? "documentos y correos vinculados a esta empresa" : "documents and emails linked to this company"}
        </p>
      </div>

      <Tabs defaultValue="docs" onValueChange={(v) => { if (v === "mail" && emails.length === 0) loadEmails(); }}>
        <TabsList>
          <TabsTrigger value="docs" className="gap-2"><FolderOpen className="h-4 w-4" />{es ? "Documentos" : "Documents"}</TabsTrigger>
          <TabsTrigger value="mail" className="gap-2"><Inbox className="h-4 w-4" />{es ? "Correos" : "Emails"}</TabsTrigger>
        </TabsList>

        {/* DOCUMENTS */}
        <TabsContent value="docs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{es ? "Repositorio (OneDrive)" : "Repository (OneDrive)"}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={loadDocs} disabled={docsLoading}>
                  <RefreshCw className={`h-4 w-4 ${docsLoading ? "animate-spin" : ""}`} />
                </Button>
                <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
                <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  <span className="ml-2">{es ? "Subir" : "Upload"}</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {docsLoading ? (
                <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : docs.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  {es ? "No hay documentos todavía." : "No documents yet."}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{es ? "Nombre" : "Name"}</TableHead>
                      <TableHead>{es ? "Tamaño" : "Size"}</TableHead>
                      <TableHead>{es ? "Modificado" : "Modified"}</TableHead>
                      <TableHead className="text-right">{es ? "Acciones" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {docs.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />{d.name}
                        </TableCell>
                        <TableCell>{formatBytes(d.size)}</TableCell>
                        <TableCell>{new Date(d.lastModified).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => handleDownload(d)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(d)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* EMAILS */}
        <TabsContent value="mail">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{es ? "Correos (Outlook)" : "Emails (Outlook)"}</CardTitle>
              <Button variant="outline" size="sm" onClick={loadEmails} disabled={emailsLoading}>
                <RefreshCw className={`h-4 w-4 ${emailsLoading ? "animate-spin" : ""}`} />
              </Button>
            </CardHeader>
            <CardContent>
              {emailsLoading ? (
                <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : noEmail ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  {es ? "Esta empresa no tiene un correo principal configurado. Agrégalo en la ficha de la empresa." : "This company has no primary email configured."}
                </div>
              ) : emails.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  <Mail className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  {es ? "No se encontraron correos relacionados." : "No related emails found."}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {emails.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => openEmailDetail(m.id)}
                      className="w-full text-left py-3 px-1 hover:bg-muted/50 transition-colors flex gap-3"
                    >
                      <Mail className={`h-4 w-4 mt-1 shrink-0 ${m.isRead ? "text-muted-foreground" : "text-primary"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`truncate ${m.isRead ? "" : "font-semibold"}`}>{m.subject || (es ? "(sin asunto)" : "(no subject)")}</span>
                          {m.hasAttachments && <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{m.fromName || m.from}</div>
                        <div className="text-xs text-muted-foreground/80 truncate">{m.preview}</div>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{new Date(m.received).toLocaleDateString()}</span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!openEmail} onOpenChange={(o) => !o && setOpenEmail(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{openEmail?.subject}</DialogTitle>
          </DialogHeader>
          {openEmail && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                {openEmail.from} · {new Date(openEmail.received).toLocaleString()}
              </div>
              {openEmail.bodyType === "html" ? (
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: openEmail.body }} />
              ) : (
                <pre className="whitespace-pre-wrap text-sm">{openEmail.body}</pre>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
