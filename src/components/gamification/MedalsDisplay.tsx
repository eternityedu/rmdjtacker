import { useGamification } from '@/hooks/useGamification';
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
  Lock
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

export const MedalsDisplay = () => {
  const { data, loading } = useGamification();

  if (loading || !data) {
    return null;
  }

  const earnedMedalIds = data.earnedMedals.map(em => em.medal_id);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Medals
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-2">
            {data.medals.map((medal) => {
              const isEarned = earnedMedalIds.includes(medal.id);
              const IconComponent = iconMap[medal.icon] || Star;

              return (
                <div
                  key={medal.id}
                  className={`flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                    isEarned 
                      ? 'bg-gradient-to-b from-amber-500/20 to-amber-500/5 border border-amber-500/30' 
                      : 'bg-muted/50 opacity-50'
                  }`}
                  style={{ width: '80px' }}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isEarned 
                      ? 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg' 
                      : 'bg-muted'
                  }`}>
                    {isEarned ? (
                      <IconComponent className="h-6 w-6 text-white" />
                    ) : (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className={`text-xs font-medium truncate w-full ${isEarned ? '' : 'text-muted-foreground'}`}>
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
