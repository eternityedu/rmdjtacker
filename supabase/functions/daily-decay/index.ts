import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Decay rates per day of inactivity
const DECAY_RATES = {
  xp: 0.02, // 2% XP decay per day
  rank_progress: 0.05, // 5% rank progress decay per day
  shadow_score: 1, // 1 point shadow score decay per day
};

const RANK_ORDER = ['Iron', 'Steel', 'Titan', 'Ascendant', 'Immortal'];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting daily decay check...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all profiles that have been inactive for more than 1 day
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data: inactiveProfiles, error: fetchError } = await supabase
      .from('discipline_profiles')
      .select('*')
      .lt('last_activity_at', oneDayAgo.toISOString());

    if (fetchError) {
      console.error('Error fetching profiles:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${inactiveProfiles?.length || 0} inactive profiles to process`);

    let processedCount = 0;
    let demotionCount = 0;

    for (const profile of inactiveProfiles || []) {
      const lastActivity = new Date(profile.last_activity_at);
      const now = new Date();
      const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceActivity <= 0) continue;

      // Calculate decay values
      const xpDecay = Math.floor(profile.total_xp * DECAY_RATES.xp * daysSinceActivity);
      const rankProgressDecay = profile.rank_progress * DECAY_RATES.rank_progress * daysSinceActivity;
      const shadowDecay = DECAY_RATES.shadow_score * daysSinceActivity;

      // Calculate new values
      let newTotalXp = Math.max(0, profile.total_xp - xpDecay);
      let newRankProgress = Math.max(0, profile.rank_progress - rankProgressDecay);
      let newRank = profile.current_rank;
      let newShadowScore = Math.max(0, profile.shadow_score - shadowDecay);

      // Check for rank demotion
      if (newRankProgress <= 0) {
        const currentRankIndex = RANK_ORDER.indexOf(profile.current_rank);
        if (currentRankIndex > 0) {
          newRank = RANK_ORDER[currentRankIndex - 1];
          newRankProgress = 75; // Start at 75% of previous rank when demoted
          demotionCount++;
          console.log(`User ${profile.user_id} demoted from ${profile.current_rank} to ${newRank}`);
        }
      }

      // Reset streak on inactivity (streak broken after 1 day)
      const newStreak = daysSinceActivity > 1 ? 0 : profile.current_streak;

      // Increase decay rate for chronic inactivity (exponential)
      const newDecayRate = Math.min(0.1, profile.decay_rate * (1 + (daysSinceActivity * 0.01)));

      // Apply legacy penalty for extended inactivity (> 7 days)
      let newLegacyModifier = profile.legacy_modifier;
      if (daysSinceActivity > 7) {
        newLegacyModifier = Math.max(0.5, profile.legacy_modifier - 0.02);
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('discipline_profiles')
        .update({
          total_xp: newTotalXp,
          rank_progress: newRankProgress,
          current_rank: newRank,
          current_streak: newStreak,
          shadow_score: newShadowScore,
          days_inactive: daysSinceActivity,
          decay_rate: newDecayRate,
          legacy_modifier: newLegacyModifier,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error(`Error updating profile ${profile.id}:`, updateError);
      } else {
        processedCount++;
      }

      // Log the decay event (for anti-exploit detection)
      await supabase.from('discipline_activity_log').insert({
        user_id: profile.user_id,
        activity_type: 'decay_applied',
        activity_data: {
          days_inactive: daysSinceActivity,
          xp_lost: xpDecay,
          rank_before: profile.current_rank,
          rank_after: newRank,
        },
      });
    }

    // Check for failed challenges (missed daily requirements)
    const { data: activeChallenges, error: challengeError } = await supabase
      .from('discipline_challenges')
      .select('*')
      .eq('status', 'active');

    if (!challengeError && activeChallenges) {
      for (const challenge of activeChallenges) {
        const endsAt = new Date(challenge.ends_at);
        const now = new Date();

        // Check if challenge has expired
        if (now > endsAt) {
          if (challenge.days_completed >= challenge.duration_days) {
            // Challenge completed
            await supabase
              .from('discipline_challenges')
              .update({ status: 'completed' })
              .eq('id', challenge.id);
          } else {
            // Challenge failed
            await supabase
              .from('discipline_challenges')
              .update({ status: 'failed' })
              .eq('id', challenge.id);

            // Apply legacy penalty for challenge failure
            await supabase
              .from('discipline_profiles')
              .update({
                total_failures: supabase.rpc('increment_failures'),
                legacy_modifier: supabase.rpc('decrease_legacy_modifier'),
              })
              .eq('user_id', challenge.user_id);
          }
        }
      }
    }

    console.log(`Decay check complete. Processed: ${processedCount}, Demotions: ${demotionCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        demotions: demotionCount,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Decay check error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
