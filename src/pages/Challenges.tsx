import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { useDisciplineEngine } from '@/hooks/useDisciplineEngine';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Swords,
  Plus,
  Clock,
  Target,
  AlertTriangle,
  Trophy,
  Skull,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar
} from 'lucide-react';
import { format, differenceInDays, differenceInHours } from 'date-fns';

interface Challenge {
  id: string;
  challenge_name: string;
  description: string | null;
  duration_days: number;
  started_at: string;
  ends_at: string;
  daily_requirement: Record<string, unknown>;
  zero_tolerance: boolean;
  status: 'active' | 'completed' | 'failed' | 'abandoned';
  days_completed: number;
  days_missed: number;
  xp_reward: number;
  title_reward: string | null;
  is_exclusive: boolean;
}

const PRESET_CHALLENGES = [
  {
    name: '7-Day Nutrition Streak',
    description: 'Log your meals every day for 7 consecutive days. No exceptions.',
    duration: 7,
    task: 'food_logging',
    xpReward: 350,
    titleReward: 'Consistent Logger',
  },
  {
    name: '14-Day Discipline Trial',
    description: 'Two weeks of daily meal logging. Miss a day, and you start over.',
    duration: 14,
    task: 'food_logging',
    xpReward: 800,
    titleReward: 'Disciplined',
    isExclusive: true,
  },
  {
    name: '30-Day Iron Will',
    description: 'A full month of unwavering commitment. Only the disciplined survive.',
    duration: 30,
    task: 'food_logging',
    xpReward: 2000,
    titleReward: 'Iron Will',
    isExclusive: true,
  },
  {
    name: '7-Day AI Mastery',
    description: 'Use AI assistants daily for a week to build the consultation habit.',
    duration: 7,
    task: 'ai_consultation',
    xpReward: 250,
    titleReward: null,
  },
];

export default function Challenges() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data, startChallenge, refetch } = useDisciplineEngine();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<typeof PRESET_CHALLENGES[0] | null>(null);
  const [customName, setCustomName] = useState('');
  const [customDuration, setCustomDuration] = useState('7');
  const [customTask, setCustomTask] = useState('food_logging');
  const [isStarting, setIsStarting] = useState(false);

  const activeChallenges = data?.challenges.filter(c => c.status === 'active') || [];
  const completedChallenges = data?.challenges.filter(c => c.status === 'completed') || [];
  const failedChallenges = data?.challenges.filter(c => c.status === 'failed') || [];

  const handleStartChallenge = async () => {
    setIsStarting(true);
    try {
      if (isCustom) {
        await startChallenge(
          customName || `${customDuration}-Day Challenge`,
          parseInt(customDuration),
          { task_name: customTask, count: 1 },
          { 
            xpReward: parseInt(customDuration) * 50,
            zeroTolerance: true 
          }
        );
      } else if (selectedPreset) {
        await startChallenge(
          selectedPreset.name,
          selectedPreset.duration,
          { task_name: selectedPreset.task, count: 1 },
          {
            xpReward: selectedPreset.xpReward,
            titleReward: selectedPreset.titleReward || undefined,
            isExclusive: selectedPreset.isExclusive,
            zeroTolerance: true,
          }
        );
      }

      toast({
        title: "Challenge Started",
        description: "Your discipline trial begins now. No excuses.",
      });

      setIsCreateOpen(false);
      setSelectedPreset(null);
      setIsCustom(false);
      refetch();
    } catch (error) {
      toast({
        title: "Failed to start challenge",
        description: "Something went wrong. Try again.",
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  };

  const getTimeRemaining = (endsAt: string) => {
    const end = new Date(endsAt);
    const now = new Date();
    const daysLeft = differenceInDays(end, now);
    const hoursLeft = differenceInHours(end, now) % 24;

    if (daysLeft > 0) {
      return `${daysLeft}d ${hoursLeft}h remaining`;
    } else if (hoursLeft > 0) {
      return `${hoursLeft}h remaining`;
    } else {
      return 'Ending soon';
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center border border-destructive/20">
              <Swords className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">Challenges</h1>
              <p className="text-sm text-muted-foreground">Zero tolerance. No excuses.</p>
            </div>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Start Challenge
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Start a Discipline Challenge</DialogTitle>
                <DialogDescription>
                  Choose a preset challenge or create your own. Miss a single day and you fail.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {!isCustom ? (
                  <>
                    <div className="space-y-3">
                      {PRESET_CHALLENGES.map((preset, index) => (
                        <Card 
                          key={index}
                          className={`cursor-pointer transition-all ${
                            selectedPreset?.name === preset.name 
                              ? 'border-primary bg-primary/5' 
                              : 'hover:border-muted-foreground/50'
                          }`}
                          onClick={() => setSelectedPreset(preset)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{preset.name}</h4>
                                  {preset.isExclusive && (
                                    <Badge variant="secondary" className="text-xs">Exclusive</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{preset.description}</p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {preset.duration} days
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Trophy className="h-3 w-3" />
                                    {preset.xpReward} XP
                                  </span>
                                  {preset.titleReward && (
                                    <span className="text-primary">+ Title</span>
                                  )}
                                </div>
                              </div>
                              {selectedPreset?.name === preset.name && (
                                <CheckCircle className="h-5 w-5 text-primary" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <Button
                      variant="ghost"
                      className="w-full text-muted-foreground"
                      onClick={() => setIsCustom(true)}
                    >
                      Create Custom Challenge
                    </Button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Challenge Name</Label>
                      <Input
                        placeholder="My Discipline Challenge"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Duration (days)</Label>
                        <Select value={customDuration} onValueChange={setCustomDuration}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">7 days</SelectItem>
                            <SelectItem value="14">14 days</SelectItem>
                            <SelectItem value="21">21 days</SelectItem>
                            <SelectItem value="30">30 days</SelectItem>
                            <SelectItem value="90">90 days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Daily Task</Label>
                        <Select value={customTask} onValueChange={setCustomTask}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="food_logging">Meal Logging</SelectItem>
                            <SelectItem value="ai_consultation">AI Consultation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <div className="flex items-center gap-2 text-destructive text-sm">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">Zero Tolerance Policy</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Missing a single day will result in challenge failure. No exceptions.
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      className="w-full text-muted-foreground"
                      onClick={() => setIsCustom(false)}
                    >
                      ← Back to Presets
                    </Button>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleStartChallenge}
                  disabled={isStarting || (!isCustom && !selectedPreset)}
                  className="gap-2"
                >
                  {isStarting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Swords className="h-4 w-4" />
                  )}
                  Begin Challenge
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Active Challenges */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Active Challenges
          </h2>

          {activeChallenges.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Swords className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No active challenges.</p>
                <p className="text-sm text-muted-foreground">Start one to test your discipline.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeChallenges.map((challenge) => {
                const progress = (challenge.days_completed / challenge.duration_days) * 100;
                const dailyReq = challenge.daily_requirement as { task_name?: string };

                return (
                  <Card key={challenge.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{challenge.challenge_name}</h3>
                            {challenge.zero_tolerance && (
                              <Badge variant="destructive" className="text-xs">Zero Tolerance</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {challenge.description || `Complete ${dailyReq?.task_name?.replace('_', ' ')} daily`}
                          </p>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {getTimeRemaining(challenge.ends_at)}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{challenge.days_completed} / {challenge.duration_days} days</span>
                        </div>
                        <Progress value={progress} className="h-3" />
                      </div>

                      <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                        <span>Started {format(new Date(challenge.started_at), 'MMM d, yyyy')}</span>
                        <span className="flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          {challenge.xp_reward} XP reward
                          {challenge.title_reward && ` + "${challenge.title_reward}" title`}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed Challenges */}
        {completedChallenges.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              Completed
            </h2>
            <div className="grid gap-3">
              {completedChallenges.map((challenge) => (
                <Card key={challenge.id} className="border-l-4 border-l-emerald-500 bg-emerald-500/5">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                        <div>
                          <h4 className="font-medium">{challenge.challenge_name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {challenge.duration_days} days • {challenge.xp_reward} XP earned
                          </p>
                        </div>
                      </div>
                      {challenge.title_reward && (
                        <Badge variant="secondary">{challenge.title_reward}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Failed Challenges */}
        {failedChallenges.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Failed
            </h2>
            <div className="grid gap-3">
              {failedChallenges.map((challenge) => (
                <Card key={challenge.id} className="border-l-4 border-l-destructive bg-destructive/5 opacity-60">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                      <Skull className="h-5 w-5 text-destructive" />
                      <div>
                        <h4 className="font-medium line-through">{challenge.challenge_name}</h4>
                        <p className="text-xs text-muted-foreground">
                          Failed at day {challenge.days_completed} of {challenge.duration_days}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
