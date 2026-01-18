import { useDisciplineEngine } from '@/hooks/useDisciplineEngine';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Flame, 
  Trophy, 
  TrendingUp, 
  Shield,
  Skull,
  Swords,
  Crown,
  Zap
} from 'lucide-react';

const RANK_ICONS: Record<string, any> = {
  Iron: Shield,
  Steel: Swords,
  Titan: Skull,
  Ascendant: Zap,
  Immortal: Crown,
};

const RANK_COLORS: Record<string, string> = {
  Iron: 'text-gray-500',
  Steel: 'text-slate-400',
  Titan: 'text-amber-600',
  Ascendant: 'text-purple-500',
  Immortal: 'text-yellow-400',
};

const RANK_BG_COLORS: Record<string, string> = {
  Iron: 'bg-gray-500/10',
  Steel: 'bg-slate-400/10',
  Titan: 'bg-amber-600/10',
  Ascendant: 'bg-purple-500/10',
  Immortal: 'bg-yellow-400/10',
};

export const DisciplineStats = () => {
  const { data, loading, getVisibleStats } = useDisciplineEngine();
  const stats = getVisibleStats();

  if (loading || !stats) {
    return (
      <div className="space-y-4 mb-6">
        <Card className="animate-pulse">
          <CardContent className="pt-4 pb-3">
            <div className="h-16 bg-muted rounded" />
          </CardContent>
        </Card>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="text-center animate-pulse">
              <CardContent className="pt-4 pb-3">
                <div className="h-12 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const RankIcon = RANK_ICONS[stats.rank] || Shield;
  const rankColor = RANK_COLORS[stats.rank] || 'text-gray-500';
  const rankBgColor = RANK_BG_COLORS[stats.rank] || 'bg-gray-500/10';

  const quickStats = [
    { 
      icon: Flame, 
      label: 'Streak', 
      value: stats.currentStreak.toString(), 
      color: stats.currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground',
      bgColor: stats.currentStreak > 0 ? 'bg-orange-500/10' : 'bg-muted'
    },
    { 
      icon: Trophy, 
      label: 'Medals', 
      value: stats.earnedMedals.length.toString(), 
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    },
    { 
      icon: TrendingUp, 
      label: 'Weekly', 
      value: stats.weeklyXP.toString(), 
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    },
  ];

  return (
    <div className="space-y-4 mb-6">
      {/* Rank Card - Serious, discipline-focused design */}
      <Card className={`border-2 ${rankBgColor} border-border/50`}>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg ${rankBgColor} flex items-center justify-center border border-border/50`}>
                <RankIcon className={`h-6 w-6 ${rankColor}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Rank</p>
                <p className={`font-display text-xl font-bold ${rankColor}`}>{stats.rank}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total XP</p>
              <p className="font-display text-xl font-bold">{stats.totalXP.toLocaleString()}</p>
            </div>
          </div>
          
          {/* Rank Progress - Slow, deliberate progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress to next rank</span>
              <span>{Math.floor(stats.rankProgress)}%</span>
            </div>
            <Progress 
              value={stats.rankProgress} 
              className="h-2 bg-muted" 
            />
          </div>

          {/* Longest Streak - Shows discipline history */}
          {stats.longestStreak > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Longest Streak</span>
              <span className="font-medium">{stats.longestStreak} days</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {quickStats.map((stat) => (
          <Card key={stat.label} className="text-center border-border/50">
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

      {/* Active Titles */}
      {stats.titles.length > 0 && (
        <Card className="border-border/50">
          <CardContent className="py-3">
            <div className="flex flex-wrap gap-2">
              {stats.titles.filter(t => t.is_active).map((title) => (
                <span 
                  key={title.id}
                  className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded border border-primary/20"
                >
                  {title.title_name}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
