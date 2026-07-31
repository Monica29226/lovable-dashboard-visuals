import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Languages } from "lucide-react";

export const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="outline"
      size="sm"
      aria-label={language === 'es' ? 'Cambiar a inglés' : 'Switch to Spanish'}
      onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
      className="flex items-center gap-2 px-2.5"
    >
      <Languages className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs tracking-wide">
        <span className={language === 'es' ? 'font-semibold text-foreground' : 'text-muted-foreground'}>ES</span>
        <span className="mx-1 text-border">|</span>
        <span className={language === 'en' ? 'font-semibold text-foreground' : 'text-muted-foreground'}>EN</span>
      </span>
    </Button>
  );
};
