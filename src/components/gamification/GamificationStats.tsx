import { useGamification } from '@/hooks/useGamification';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Flame, 
  Trophy, 
  TrendingUp, 
  Star,
  Zap,
  Crown
} from 'lucide-react';

const POINTS_PER_LEVEL = 100;

export const GamificationStats = () => {
  const { data, loading } = useGamification();

  if (loading || !data) {
    return (
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="text-center animate-pulse">
            <CardContent className="pt-4 pb-3">
              <div className="h-5 w-5 mx-auto mb-2 bg-muted rounded" />
              <div className="h-6 w-8 mx-auto bg-muted rounded mb-1" />
              <div className="h-3 w-12 mx-auto bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const mainStreak = data.streaks.find(s => s.habit_name === 'food_logging');
  const currentStreak = mainStreak?.current_streak || 0;
  const progressToNextLevel = (data.level.total_points % POINTS_PER_LEVEL) / POINTS_PER_LEVEL * 100;

  const stats = [
    { 
      icon: Flame, 
      label: 'Streak', 
      value: currentStreak.toString(), 
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    },
    { 
      icon: Trophy, 
      label: 'Medals', 
      value: data.earnedMedals.length.toString(), 
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    },
    { 
      icon: TrendingUp, 
      label: 'Weekly', 
      value: data.level.weekly_points.toString(), 
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    },
  ];

  return (
    <div className="space-y-4 mb-6">
      {/* Level Progress Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-emerald-500/10 border-primary/20">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Star className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Level</p>
                <p className="font-display text-lg font-bold">{data.level.current_level}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total Points</p>
              <p className="font-display text-lg font-bold text-primary">{data.level.total_points}</p>
            </div>
          </div>
          <div className="space-y-1">
            <Progress value={progressToNextLevel} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              {POINTS_PER_LEVEL - (data.level.total_points % POINTS_PER_LEVEL)} pts to Level {data.level.current_level + 1}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="text-center">
            <CardContent className="pt-4 pb-3">
              <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center mx-auto mb-2`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className="font-display text-xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
