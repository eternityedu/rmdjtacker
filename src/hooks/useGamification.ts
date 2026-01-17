import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Medal {
  id: string;
  name: string;
  description: string;
  icon: string;
  points_required: number;
}

interface UserMedal {
  id: string;
  medal_id: string;
  earned_at: string;
  medal?: Medal;
}

interface UserLevel {
  current_level: number;
  total_points: number;
  weekly_points: number;
  last_activity_date: string | null;
}

interface HabitStreak {
  id: string;
  habit_name: string;
  current_streak: number;
  longest_streak: number;
  last_completed_at: string | null;
}

interface GamificationData {
  level: UserLevel;
  medals: Medal[];
  earnedMedals: UserMedal[];
  streaks: HabitStreak[];
  foodLogsCount: number;
}

const POINTS_PER_MEAL_LOG = 10;
const POINTS_PER_AI_CHAT = 5;
const POINTS_PER_STREAK_DAY = 15;
const POINTS_PER_LEVEL = 100;

export const useGamification = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch user level
      const { data: levelData } = await supabase
        .from('user_levels')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // Fetch all medals
      const { data: medalsData } = await supabase
        .from('medals')
        .select('*')
        .order('points_required', { ascending: true });

      // Fetch earned medals
      const { data: earnedMedalsData } = await supabase
        .from('user_medals')
        .select('*, medals(*)')
        .eq('user_id', user.id);

      // Fetch streaks
      const { data: streaksData } = await supabase
        .from('habit_streaks')
        .select('*')
        .eq('user_id', user.id);

      // Fetch food logs count
      const { count: foodLogsCount } = await supabase
        .from('food_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const level: UserLevel = levelData || {
        current_level: 1,
        total_points: 0,
        weekly_points: 0,
        last_activity_date: null,
      };

      setData({
        level,
        medals: (medalsData || []) as Medal[],
        earnedMedals: (earnedMedalsData || []).map((em: any) => ({
          ...em,
          medal: em.medals
        })) as UserMedal[],
        streaks: (streaksData || []) as HabitStreak[],
        foodLogsCount: foodLogsCount || 0,
      });
    } catch (error) {
      console.error('Error fetching gamification data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addPoints = async (points: number, reason: string) => {
    if (!user || !data) return;

    const newTotalPoints = data.level.total_points + points;
    const newWeeklyPoints = data.level.weekly_points + points;
    const newLevel = Math.floor(newTotalPoints / POINTS_PER_LEVEL) + 1;

    try {
      // Check if user_levels record exists
      const { data: existingLevel } = await supabase
        .from('user_levels')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingLevel) {
        await supabase
          .from('user_levels')
          .update({
            total_points: newTotalPoints,
            weekly_points: newWeeklyPoints,
            current_level: newLevel,
            last_activity_date: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('user_levels')
          .insert({
            user_id: user.id,
            total_points: newTotalPoints,
            weekly_points: newWeeklyPoints,
            current_level: newLevel,
            last_activity_date: new Date().toISOString().split('T')[0],
          });
      }

      // Check for level up
      if (newLevel > data.level.current_level) {
        toast({
          title: "🎉 Level Up!",
          description: `Congratulations! You've reached Level ${newLevel}!`,
        });
      }

      // Update local state
      setData(prev => prev ? {
        ...prev,
        level: {
          ...prev.level,
          total_points: newTotalPoints,
          weekly_points: newWeeklyPoints,
          current_level: newLevel,
        }
      } : null);

      // Check for new medals
      await checkAndAwardMedals(newTotalPoints, newLevel);
    } catch (error) {
      console.error('Error adding points:', error);
    }
  };

  const checkAndAwardMedals = async (totalPoints: number, level: number) => {
    if (!user || !data) return;

    const unearnedMedals = data.medals.filter(
      m => !data.earnedMedals.some(em => em.medal_id === m.id)
    );

    for (const medal of unearnedMedals) {
      let shouldAward = false;

      switch (medal.name) {
        case 'First Steps':
          shouldAward = data.foodLogsCount >= 1;
          break;
        case 'Streak Starter':
          shouldAward = data.streaks.some(s => s.current_streak >= 3);
          break;
        case 'Week Warrior':
          shouldAward = data.streaks.some(s => s.current_streak >= 7);
          break;
        case 'Month Master':
          shouldAward = data.streaks.some(s => s.current_streak >= 30);
          break;
        case 'Nutrition Ninja':
          shouldAward = data.foodLogsCount >= 10;
          break;
        case 'Consistency King':
          shouldAward = data.streaks.some(s => s.current_streak >= 14);
          break;
        case 'Health Hero':
          shouldAward = level >= 5;
          break;
        default:
          shouldAward = totalPoints >= medal.points_required;
      }

      if (shouldAward) {
        try {
          await supabase
            .from('user_medals')
            .insert({
              user_id: user.id,
              medal_id: medal.id,
            });

          toast({
            title: "🏅 Medal Earned!",
            description: `You earned the "${medal.name}" medal!`,
          });

          // Update local state
          setData(prev => prev ? {
            ...prev,
            earnedMedals: [...prev.earnedMedals, { id: crypto.randomUUID(), medal_id: medal.id, earned_at: new Date().toISOString(), medal }]
          } : null);
        } catch (error) {
          // Ignore duplicate medal errors
          console.log('Medal already earned or error:', error);
        }
      }
    }
  };

  const updateStreak = async (habitName: string) => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const existingStreak = data?.streaks.find(s => s.habit_name === habitName);

    if (existingStreak) {
      const lastCompleted = existingStreak.last_completed_at 
        ? new Date(existingStreak.last_completed_at).toISOString().split('T')[0]
        : null;

      if (lastCompleted === today) return; // Already completed today

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const isConsecutive = lastCompleted === yesterday.toISOString().split('T')[0];

      const newStreak = isConsecutive ? existingStreak.current_streak + 1 : 1;
      const newLongest = Math.max(newStreak, existingStreak.longest_streak);

      await supabase
        .from('habit_streaks')
        .update({
          current_streak: newStreak,
          longest_streak: newLongest,
          last_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingStreak.id);

      // Award points for streak
      await addPoints(POINTS_PER_STREAK_DAY, `${habitName} streak day ${newStreak}`);
    } else {
      await supabase
        .from('habit_streaks')
        .insert({
          user_id: user.id,
          habit_name: habitName,
          current_streak: 1,
          longest_streak: 1,
          last_completed_at: new Date().toISOString(),
        });

      await addPoints(POINTS_PER_STREAK_DAY, `Started ${habitName} streak`);
    }

    fetchData();
  };

  const logMealPoints = async () => {
    await addPoints(POINTS_PER_MEAL_LOG, 'Logged a meal');
    await updateStreak('food_logging');
    fetchData();
  };

  const logAIChatPoints = async () => {
    await addPoints(POINTS_PER_AI_CHAT, 'AI chat session');
  };

  return {
    data,
    loading,
    addPoints,
    updateStreak,
    logMealPoints,
    logAIChatPoints,
    refetch: fetchData,
  };
};
