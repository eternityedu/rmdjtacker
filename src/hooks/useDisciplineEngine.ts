import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Types
type DisciplineRank = 'Iron' | 'Steel' | 'Titan' | 'Ascendant' | 'Immortal';

interface DisciplineProfile {
  id: string;
  user_id: string;
  total_xp: number;
  weekly_xp: number;
  current_rank: DisciplineRank;
  rank_progress: number;
  // Hidden from users
  shadow_score: number;
  honesty_factor: number;
  effort_quality: number;
  recovery_factor: number;
  // Legacy
  total_failures: number;
  legacy_modifier: number;
  permanent_debuffs: string[];
  // Decay
  last_activity_at: string | null;
  decay_rate: number;
  days_inactive: number;
  // Consistency
  completion_rate: number;
  current_streak: number;
  longest_streak: number;
  total_tasks_completed: number;
  total_tasks_missed: number;
  // Difficulty
  difficulty_multiplier: number;
  mastered_tasks: string[];
  // Season
  current_season: number;
  season_xp: number;
  season_survived: boolean;
}

interface DisciplineTask {
  id: string;
  task_name: string;
  task_type: string;
  target_frequency: number;
  minimum_duration_minutes: number | null;
  acceptable_miss_limit: number;
  current_period_completions: number;
  current_period_misses: number;
  total_completions: number;
  consecutive_completions: number;
  base_xp: number;
  current_difficulty: number;
  times_mastered: number;
  requires_proof: boolean;
  requires_reflection: boolean;
  last_completion_at: string | null;
  is_active: boolean;
}

interface DisciplineChallenge {
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

interface Season {
  id: string;
  season_number: number;
  name: string;
  theme: string;
  survival_xp_threshold: number;
  rank_retention_threshold: DisciplineRank;
  is_active: boolean;
}

interface UserTitle {
  id: string;
  title_name: string;
  title_description: string;
  earned_from: string;
  is_active: boolean;
  can_be_lost: boolean;
  earned_at: string;
}

interface DisciplineEngineData {
  profile: DisciplineProfile | null;
  tasks: DisciplineTask[];
  challenges: DisciplineChallenge[];
  currentSeason: Season | null;
  titles: UserTitle[];
  // Merged from old system
  medals: any[];
  earnedMedals: any[];
}

// Constants
const RANK_XP_THRESHOLDS: Record<DisciplineRank, number> = {
  Iron: 0,
  Steel: 500,
  Titan: 2000,
  Ascendant: 5000,
  Immortal: 15000,
};

const RANK_ORDER: DisciplineRank[] = ['Iron', 'Steel', 'Titan', 'Ascendant', 'Immortal'];

const MIN_COMPLETION_RATE = 0.85; // 85% required for progress

// Decay rates (per day inactive)
const DECAY_RATES = {
  xp: 0.02, // 2% XP decay per day
  streak: 1, // Full streak reset after 1 day
  rank: 0.05, // 5% rank progress decay per day
};

export const useDisciplineEngine = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<DisciplineEngineData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch all discipline data
  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Parallel fetch all data
      const [
        profileRes,
        tasksRes,
        challengesRes,
        seasonRes,
        titlesRes,
        medalsRes,
        earnedMedalsRes,
      ] = await Promise.all([
        supabase.from('discipline_profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('discipline_tasks').select('*').eq('user_id', user.id).eq('is_active', true),
        supabase.from('discipline_challenges').select('*').eq('user_id', user.id).eq('status', 'active'),
        supabase.from('discipline_seasons').select('*').eq('is_active', true).maybeSingle(),
        supabase.from('user_titles').select('*').eq('user_id', user.id),
        supabase.from('medals').select('*').order('points_required', { ascending: true }),
        supabase.from('user_medals').select('*, medals(*)').eq('user_id', user.id),
      ]);

      setData({
        profile: profileRes.data as DisciplineProfile | null,
        tasks: (tasksRes.data || []) as DisciplineTask[],
        challenges: (challengesRes.data || []) as DisciplineChallenge[],
        currentSeason: seasonRes.data as Season | null,
        titles: (titlesRes.data || []) as UserTitle[],
        medals: medalsRes.data || [],
        earnedMedals: (earnedMedalsRes.data || []).map((em: any) => ({
          ...em,
          medal: em.medals,
        })),
      });
    } catch (error) {
      console.error('Error fetching discipline data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Initialize profile for new users
  const initializeProfile = useCallback(async () => {
    if (!user) return null;

    try {
      const { data: newProfile, error } = await supabase
        .from('discipline_profiles')
        .insert({
          user_id: user.id,
          total_xp: 0,
          weekly_xp: 0,
          current_rank: 'Iron',
        })
        .select()
        .single();

      if (error) throw error;

      // Create default tasks
      const defaultTasks = [
        { task_name: 'food_logging', task_type: 'daily', target_frequency: 1, base_xp: 10 },
        { task_name: 'ai_consultation', task_type: 'daily', target_frequency: 1, base_xp: 5 },
      ];

      await supabase.from('discipline_tasks').insert(
        defaultTasks.map(t => ({ ...t, user_id: user.id }))
      );

      return newProfile;
    } catch (error) {
      console.error('Error initializing profile:', error);
      return null;
    }
  }, [user]);

  // Calculate effective XP with all modifiers
  const calculateEffectiveXP = useCallback((baseXP: number, profile: DisciplineProfile): number => {
    const shadowModifier = profile.shadow_score / 50; // Normalized around 1.0
    const legacyModifier = profile.legacy_modifier;
    const difficultyModifier = profile.difficulty_multiplier;
    const consistencyBonus = profile.completion_rate >= MIN_COMPLETION_RATE ? 1.2 : 0.8;

    return Math.floor(baseXP * shadowModifier * legacyModifier * difficultyModifier * consistencyBonus);
  }, []);

  // Apply decay based on inactivity
  const applyDecay = useCallback(async (profile: DisciplineProfile) => {
    if (!user) return;

    const lastActivity = new Date(profile.last_activity_at || new Date());
    const now = new Date();
    const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceActivity <= 0) return;

    // Calculate decay
    const xpDecay = Math.floor(profile.total_xp * DECAY_RATES.xp * daysSinceActivity);
    const rankProgressDecay = profile.rank_progress * DECAY_RATES.rank * daysSinceActivity;

    // Check for rank demotion
    let newRank = profile.current_rank;
    let newRankProgress = Math.max(0, profile.rank_progress - rankProgressDecay);

    if (newRankProgress <= 0 && RANK_ORDER.indexOf(profile.current_rank) > 0) {
      newRank = RANK_ORDER[RANK_ORDER.indexOf(profile.current_rank) - 1];
      newRankProgress = 100;
    }

    // Silent update (no toast - this is intentional for discipline)
    await supabase
      .from('discipline_profiles')
      .update({
        total_xp: Math.max(0, profile.total_xp - xpDecay),
        current_rank: newRank,
        rank_progress: newRankProgress,
        current_streak: daysSinceActivity > 1 ? 0 : profile.current_streak,
        days_inactive: daysSinceActivity,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);
  }, [user]);

  // Complete a task with proof-of-work validation
  const completeTask = useCallback(async (
    taskName: string, 
    options?: { 
      durationMinutes?: number; 
      reflectionText?: string; 
      proofUrl?: string;
    }
  ) => {
    if (!user || !data?.profile) {
      // Initialize profile if not exists
      const newProfile = await initializeProfile();
      if (!newProfile) return false;
    }

    try {
      // Get or create task
      let task = data?.tasks.find(t => t.task_name === taskName);
      
      if (!task) {
        const { data: newTask, error } = await supabase
          .from('discipline_tasks')
          .insert({
            user_id: user.id,
            task_name: taskName,
            task_type: 'daily',
            target_frequency: 1,
            base_xp: taskName === 'food_logging' ? 10 : 5,
          })
          .select()
          .single();

        if (error) throw error;
        task = newTask as DisciplineTask;
      }

      // Validate proof-of-work if required
      const isValidCompletion = validateCompletion(task, options);
      if (!isValidCompletion.valid) {
        // Silent penalty - increase shadow score penalty
        await applySilentPenalty('low_effort', 2);
        return false;
      }

      // Calculate XP
      const profile = data?.profile || (await initializeProfile()) as DisciplineProfile;
      if (!profile) return false;

      const baseXP = task.base_xp * task.current_difficulty;
      const effectiveXP = calculateEffectiveXP(baseXP, profile);

      // Record completion
      await supabase.from('task_completions').insert({
        user_id: user.id,
        task_id: task.id,
        duration_minutes: options?.durationMinutes,
        reflection_text: options?.reflectionText,
        proof_url: options?.proofUrl,
        effort_score: isValidCompletion.effortScore,
        xp_awarded: effectiveXP,
      });

      // Update task
      const newConsecutive = task.consecutive_completions + 1;
      const shouldScaleDifficulty = newConsecutive >= 7 && task.current_difficulty < 5;

      await supabase
        .from('discipline_tasks')
        .update({
          current_period_completions: task.current_period_completions + 1,
          total_completions: task.total_completions + 1,
          consecutive_completions: newConsecutive,
          current_difficulty: shouldScaleDifficulty ? task.current_difficulty + 1 : task.current_difficulty,
          last_completion_at: new Date().toISOString(),
        })
        .eq('id', task.id);

      // Update profile
      const newTotalXP = profile.total_xp + effectiveXP;
      const newStreak = profile.current_streak + 1;
      const newLongestStreak = Math.max(profile.longest_streak, newStreak);

      // Check for rank up
      let newRank = profile.current_rank;
      let newRankProgress = profile.rank_progress;

      const currentRankIndex = RANK_ORDER.indexOf(profile.current_rank);
      const nextRank = RANK_ORDER[currentRankIndex + 1];

      if (nextRank && newTotalXP >= RANK_XP_THRESHOLDS[nextRank]) {
        newRank = nextRank;
        newRankProgress = 0;

        toast({
          title: `Rank Achieved: ${newRank}`,
          description: "Your discipline has been recognized.",
        });
      } else if (nextRank) {
        const progressToNext = (newTotalXP - RANK_XP_THRESHOLDS[profile.current_rank]) / 
          (RANK_XP_THRESHOLDS[nextRank] - RANK_XP_THRESHOLDS[profile.current_rank]) * 100;
        newRankProgress = Math.min(99, progressToNext);
      }

      // Improve shadow score for valid effort
      const shadowBonus = isValidCompletion.effortScore * 0.5;

      await supabase
        .from('discipline_profiles')
        .update({
          total_xp: newTotalXP,
          weekly_xp: profile.weekly_xp + effectiveXP,
          season_xp: profile.season_xp + effectiveXP,
          current_rank: newRank,
          rank_progress: newRankProgress,
          current_streak: newStreak,
          longest_streak: newLongestStreak,
          total_tasks_completed: profile.total_tasks_completed + 1,
          shadow_score: Math.min(100, profile.shadow_score + shadowBonus),
          effort_quality: Math.min(2, profile.effort_quality + 0.01),
          last_activity_at: new Date().toISOString(),
          days_inactive: 0,
        })
        .eq('user_id', user.id);

      // Log activity for pattern detection
      await supabase.from('discipline_activity_log').insert({
        user_id: user.id,
        activity_type: 'task_completion',
        activity_data: { task_name: taskName, xp: effectiveXP },
        duration_seconds: (options?.durationMinutes || 0) * 60,
        input_length: options?.reflectionText?.length || 0,
      });

      // Check challenges
      await checkChallengeProgress(taskName);

      fetchData();
      return true;
    } catch (error) {
      console.error('Error completing task:', error);
      return false;
    }
  }, [user, data, calculateEffectiveXP, fetchData, initializeProfile, toast]);

  // Validate completion quality
  const validateCompletion = (
    task: DisciplineTask, 
    options?: { durationMinutes?: number; reflectionText?: string; }
  ): { valid: boolean; effortScore: number } => {
    let effortScore = 1.0;

    // Check duration requirement
    if (task.minimum_duration_minutes && options?.durationMinutes) {
      if (options.durationMinutes < task.minimum_duration_minutes) {
        return { valid: false, effortScore: 0 };
      }
      effortScore += 0.2;
    }

    // Check reflection requirement
    if (task.requires_reflection) {
      if (!options?.reflectionText || options.reflectionText.length < 20) {
        return { valid: false, effortScore: 0 };
      }
      // Penalize repetitive/low-effort text
      if (isLowEffortText(options.reflectionText)) {
        return { valid: false, effortScore: 0 };
      }
      effortScore += 0.3;
    }

    return { valid: true, effortScore: Math.min(2, effortScore) };
  };

  // Detect low-effort or exploit text
  const isLowEffortText = (text: string): boolean => {
    const lowEffortPatterns = [
      /^(.)\1+$/, // Repeated single character
      /^(..?)\1+$/, // Repeated short patterns
      /^[a-z]+$/i, // Only letters (likely random)
      /^[\d]+$/, // Only numbers
    ];

    return lowEffortPatterns.some(pattern => pattern.test(text.trim()));
  };

  // Apply silent penalty
  const applySilentPenalty = async (type: string, severity: number) => {
    if (!user || !data?.profile) return;

    const penaltyMultiplier = 1 - (severity * 0.05);

    await supabase
      .from('discipline_profiles')
      .update({
        shadow_score: Math.max(0, data.profile.shadow_score - severity),
        honesty_factor: Math.max(0.5, data.profile.honesty_factor - 0.05),
        difficulty_multiplier: Math.max(0.5, data.profile.difficulty_multiplier * penaltyMultiplier),
      })
      .eq('user_id', user.id);

    // Log exploit detection (hidden from user)
    await supabase.from('exploit_detections').insert({
      user_id: user.id,
      detection_type: type,
      penalty_type: 'shadow_score_reduction',
      penalty_value: severity,
    });
  };

  // Check and update challenge progress
  const checkChallengeProgress = async (taskName: string) => {
    if (!user || !data?.challenges) return;

    for (const challenge of data.challenges) {
      if (challenge.daily_requirement.task_name === taskName) {
        const newDaysCompleted = challenge.days_completed + 1;

        if (newDaysCompleted >= challenge.duration_days) {
          // Challenge completed!
          await supabase
            .from('discipline_challenges')
            .update({ status: 'completed', days_completed: newDaysCompleted })
            .eq('id', challenge.id);

          // Award title if exists
          if (challenge.title_reward) {
            await supabase.from('user_titles').insert({
              user_id: user.id,
              title_name: challenge.title_reward,
              title_description: `Earned by completing ${challenge.challenge_name}`,
              earned_from: 'challenge',
              source_id: challenge.id,
              can_be_lost: challenge.is_exclusive,
            });

            toast({
              title: `Title Earned: ${challenge.title_reward}`,
              description: "A mark of your discipline.",
            });
          }

          // Award XP
          if (data.profile) {
            await supabase
              .from('discipline_profiles')
              .update({ total_xp: data.profile.total_xp + challenge.xp_reward })
              .eq('user_id', user.id);
          }
        } else {
          await supabase
            .from('discipline_challenges')
            .update({ days_completed: newDaysCompleted })
            .eq('id', challenge.id);
        }
      }
    }
  };

  // Record a failure (missed task)
  const recordFailure = useCallback(async (taskName: string) => {
    if (!user || !data?.profile) return;

    const task = data.tasks.find(t => t.task_name === taskName);
    if (!task) return;

    // Update task
    const newMisses = task.current_period_misses + 1;
    const exceededLimit = newMisses > task.acceptable_miss_limit;

    await supabase
      .from('discipline_tasks')
      .update({
        current_period_misses: newMisses,
        consecutive_completions: 0, // Reset streak on miss
      })
      .eq('id', task.id);

    // Update profile
    await supabase
      .from('discipline_profiles')
      .update({
        total_failures: data.profile.total_failures + 1,
        total_tasks_missed: data.profile.total_tasks_missed + 1,
        current_streak: 0,
        // Legacy impact for excessive failures
        legacy_modifier: exceededLimit 
          ? Math.max(0.5, data.profile.legacy_modifier - 0.05)
          : data.profile.legacy_modifier,
        recovery_factor: Math.max(0.5, data.profile.recovery_factor - 0.1),
      })
      .eq('user_id', user.id);

    // Fail any zero-tolerance challenges
    for (const challenge of data.challenges.filter(c => c.zero_tolerance)) {
      if (challenge.daily_requirement.task_name === taskName) {
        await supabase
          .from('discipline_challenges')
          .update({ status: 'failed', days_missed: challenge.days_missed + 1 })
          .eq('id', challenge.id);

        toast({
          title: "Challenge Failed",
          description: `${challenge.challenge_name} requires zero tolerance.`,
          variant: "destructive",
        });
      }
    }

    fetchData();
  }, [user, data, fetchData, toast]);

  // Start a new challenge
  const startChallenge = useCallback(async (
    name: string,
    durationDays: number,
    requirement: { task_name: string; count: number },
    options?: { xpReward?: number; titleReward?: string; isExclusive?: boolean; zeroTolerance?: boolean }
  ) => {
    if (!user) return false;

    try {
      const endsAt = new Date();
      endsAt.setDate(endsAt.getDate() + durationDays);

      await supabase.from('discipline_challenges').insert({
        user_id: user.id,
        challenge_name: name,
        duration_days: durationDays,
        ends_at: endsAt.toISOString(),
        daily_requirement: requirement,
        zero_tolerance: options?.zeroTolerance ?? true,
        xp_reward: options?.xpReward || durationDays * 50,
        title_reward: options?.titleReward,
        is_exclusive: options?.isExclusive ?? false,
      });

      fetchData();
      return true;
    } catch (error) {
      console.error('Error starting challenge:', error);
      return false;
    }
  }, [user, fetchData]);

  // Get visible stats (hides shadow score)
  const getVisibleStats = useCallback(() => {
    if (!data?.profile) return null;

    return {
      rank: data.profile.current_rank,
      rankProgress: data.profile.rank_progress,
      totalXP: data.profile.total_xp,
      weeklyXP: data.profile.weekly_xp,
      seasonXP: data.profile.season_xp,
      currentStreak: data.profile.current_streak,
      longestStreak: data.profile.longest_streak,
      completionRate: data.profile.completion_rate,
      titles: data.titles,
      // From merged system
      medals: data.medals,
      earnedMedals: data.earnedMedals,
    };
  }, [data]);

  // Legacy functions for backwards compatibility with old medal system
  const logMealPoints = useCallback(async () => {
    return completeTask('food_logging');
  }, [completeTask]);

  const logAIChatPoints = useCallback(async () => {
    return completeTask('ai_consultation');
  }, [completeTask]);

  return {
    data,
    loading,
    completeTask,
    recordFailure,
    startChallenge,
    getVisibleStats,
    refetch: fetchData,
    // Legacy compatibility
    logMealPoints,
    logAIChatPoints,
  };
};
