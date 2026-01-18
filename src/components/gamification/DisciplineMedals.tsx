import { useDisciplineEngine } from '@/hooks/useDisciplineEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
  Baby,
  Flame,
  Trophy,
  Crown,
  Salad,
  Star,
  Heart,
  Brain,
  Lock,
  Shield
} from 'lucide-react';

const iconMap: Record<string, any> = {
  baby: Baby,
  flame: Flame,
  trophy: Trophy,
  crown: Crown,
  salad: Salad,
  star: Star,
  heart: Heart,
  brain: Brain,
};

export const DisciplineMedals = () => {
  const { data, loading, getVisibleStats } = useDisciplineEngine();
  const stats = getVisibleStats();

  if (loading || !stats) {
    return null;
  }

  const earnedMedalIds = stats.earnedMedals.map(em => em.medal_id);

  return (
    <Card className="mb-6 border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <span className="text-muted-foreground font-normal">Achievements</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-2">
            {stats.medals.map((medal) => {
              const isEarned = earnedMedalIds.includes(medal.id);
              const IconComponent = iconMap[medal.icon] || Star;

              return (
                <div
                  key={medal.id}
                  className={`flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                    isEarned 
                      ? 'bg-muted/80 border border-border' 
                      : 'bg-muted/30 opacity-40'
                  }`}
                  style={{ width: '80px' }}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isEarned 
                      ? 'bg-foreground/10 border border-foreground/20' 
                      : 'bg-muted'
                  }`}>
                    {isEarned ? (
                      <IconComponent className="h-6 w-6 text-foreground/70" />
                    ) : (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className={`text-xs font-medium truncate w-full ${isEarned ? 'text-foreground/80' : 'text-muted-foreground'}`}>
                      {medal.name}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
