import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const activeMembers = 27;
const totalMembers = 41;
const pendingMembers = 14;
const percentage = Math.round((activeMembers / totalMembers) * 100);

export const SecondMembershipChart = () => {
  const { t } = useLanguage();
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-base font-semibold text-primary mb-4">
              {t('associatesWhoContributed')}
            </CardTitle>
            <div className="text-5xl font-bold text-[hsl(var(--accent))] mb-2">
              {percentage}%
            </div>
            <p className="text-sm text-muted-foreground">
              {activeMembers} de {totalMembers} {t('associates').toLowerCase()}
            </p>
            <Badge variant="outline" className="mt-3 border-[hsl(var(--accent))] text-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10">
              {pendingMembers} no aportaron
            </Badge>
          </div>
          <Users className="h-8 w-8 text-[hsl(var(--accent))]" />
        </div>
      </CardHeader>
    </Card>
  );
};
