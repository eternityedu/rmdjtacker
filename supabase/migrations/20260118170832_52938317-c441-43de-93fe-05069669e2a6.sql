-- Drop existing simple gamification tables and create new discipline-focused system

-- Create rank enum
CREATE TYPE public.discipline_rank AS ENUM ('Iron', 'Steel', 'Titan', 'Ascendant', 'Immortal');

-- Create challenge status enum  
CREATE TYPE public.challenge_status AS ENUM ('active', 'completed', 'failed', 'abandoned');

-- Create discipline_profiles table (replaces user_levels with advanced tracking)
CREATE TABLE public.discipline_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  
  -- Core Stats
  total_xp INTEGER NOT NULL DEFAULT 0,
  weekly_xp INTEGER NOT NULL DEFAULT 0,
  current_rank discipline_rank NOT NULL DEFAULT 'Iron',
  rank_progress DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  
  -- Shadow Score (HIDDEN from users)
  shadow_score DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  honesty_factor DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  effort_quality DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  recovery_factor DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  
  -- Legacy System
  total_failures INTEGER NOT NULL DEFAULT 0,
  legacy_modifier DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  permanent_debuffs JSONB DEFAULT '[]'::jsonb,
  
  -- Decay System
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  decay_rate DECIMAL(4,3) NOT NULL DEFAULT 0.010,
  days_inactive INTEGER NOT NULL DEFAULT 0,
  
  -- Consistency Engine
  completion_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  total_tasks_completed INTEGER NOT NULL DEFAULT 0,
  total_tasks_missed INTEGER NOT NULL DEFAULT 0,
  
  -- Difficulty Scaling
  difficulty_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  mastered_tasks JSONB DEFAULT '[]'::jsonb,
  
  -- Season Tracking
  current_season INTEGER NOT NULL DEFAULT 1,
  season_xp INTEGER NOT NULL DEFAULT 0,
  season_survived BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create discipline_tasks table (tracks task requirements)
CREATE TABLE public.discipline_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  task_name VARCHAR(100) NOT NULL,
  task_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'habit', 'challenge'
  
  -- Requirements
  target_frequency INTEGER NOT NULL DEFAULT 1, -- times per period
  minimum_duration_minutes INTEGER DEFAULT NULL,
  acceptable_miss_limit INTEGER NOT NULL DEFAULT 2,
  
  -- Progress
  current_period_completions INTEGER NOT NULL DEFAULT 0,
  current_period_misses INTEGER NOT NULL DEFAULT 0,
  total_completions INTEGER NOT NULL DEFAULT 0,
  consecutive_completions INTEGER NOT NULL DEFAULT 0,
  
  -- Difficulty
  base_xp INTEGER NOT NULL DEFAULT 10,
  current_difficulty INTEGER NOT NULL DEFAULT 1,
  times_mastered INTEGER NOT NULL DEFAULT 0,
  
  -- Validation
  requires_proof BOOLEAN NOT NULL DEFAULT false,
  requires_reflection BOOLEAN NOT NULL DEFAULT false,
  last_completion_at TIMESTAMPTZ,
  
  -- Active status
  is_active BOOLEAN NOT NULL DEFAULT true,
  period_start_at TIMESTAMPTZ DEFAULT now(),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, task_name)
);

-- Create task_completions table (proof of work)
CREATE TABLE public.task_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID REFERENCES public.discipline_tasks(id) ON DELETE CASCADE,
  
  -- Completion details
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_minutes INTEGER,
  
  -- Proof of work
  reflection_text TEXT,
  proof_url TEXT,
  
  -- Quality assessment (hidden)
  effort_score DECIMAL(4,2), -- AI/system assessed
  is_valid BOOLEAN NOT NULL DEFAULT true,
  
  -- XP awarded
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create discipline_challenges table (time-bound zero tolerance)
CREATE TABLE public.discipline_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  challenge_name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Duration
  duration_days INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  
  -- Requirements
  daily_requirement JSONB NOT NULL, -- { task_name, count }
  zero_tolerance BOOLEAN NOT NULL DEFAULT true,
  
  -- Progress
  status challenge_status NOT NULL DEFAULT 'active',
  days_completed INTEGER NOT NULL DEFAULT 0,
  days_missed INTEGER NOT NULL DEFAULT 0,
  
  -- Rewards
  xp_reward INTEGER NOT NULL DEFAULT 0,
  title_reward VARCHAR(100),
  is_exclusive BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create seasons table (seasonal survival system)
CREATE TABLE public.discipline_seasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  season_number INTEGER NOT NULL UNIQUE,
  
  name VARCHAR(100) NOT NULL,
  theme VARCHAR(100),
  
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  
  -- Thresholds
  survival_xp_threshold INTEGER NOT NULL DEFAULT 1000,
  rank_retention_threshold discipline_rank NOT NULL DEFAULT 'Steel',
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_titles table (earned titles)
CREATE TABLE public.user_titles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  title_name VARCHAR(100) NOT NULL,
  title_description TEXT,
  
  -- How it was earned
  earned_from VARCHAR(100), -- 'challenge', 'season', 'achievement'
  source_id UUID, -- reference to challenge/season
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  can_be_lost BOOLEAN NOT NULL DEFAULT false,
  
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, title_name)
);

-- Create exploit_detection table (anti-exploit logging)
CREATE TABLE public.exploit_detections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  detection_type VARCHAR(50) NOT NULL, -- 'repetitive', 'speed', 'pattern'
  details JSONB,
  
  -- Silent penalty applied
  penalty_type VARCHAR(50),
  penalty_value DECIMAL(5,2),
  
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create activity_log table (for decay and pattern detection)
CREATE TABLE public.discipline_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  activity_type VARCHAR(50) NOT NULL,
  activity_data JSONB,
  
  -- Quality metrics
  duration_seconds INTEGER,
  input_length INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.discipline_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discipline_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discipline_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discipline_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exploit_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discipline_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for discipline_profiles
CREATE POLICY "Users can view own discipline profile" 
ON public.discipline_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own discipline profile" 
ON public.discipline_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own discipline profile" 
ON public.discipline_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for discipline_tasks
CREATE POLICY "Users can view own tasks" 
ON public.discipline_tasks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks" 
ON public.discipline_tasks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" 
ON public.discipline_tasks 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" 
ON public.discipline_tasks 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for task_completions
CREATE POLICY "Users can view own completions" 
ON public.task_completions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own completions" 
ON public.task_completions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for discipline_challenges
CREATE POLICY "Users can view own challenges" 
ON public.discipline_challenges 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own challenges" 
ON public.discipline_challenges 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenges" 
ON public.discipline_challenges 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for discipline_seasons (public read)
CREATE POLICY "Anyone can view seasons" 
ON public.discipline_seasons 
FOR SELECT 
USING (true);

-- RLS Policies for user_titles
CREATE POLICY "Users can view own titles" 
ON public.user_titles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own titles" 
ON public.user_titles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own titles" 
ON public.user_titles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for exploit_detections (users shouldn't see this)
CREATE POLICY "Service role only for exploit detections" 
ON public.exploit_detections 
FOR ALL 
USING (false);

-- RLS Policies for activity_log
CREATE POLICY "Users can view own activity" 
ON public.discipline_activity_log 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own activity" 
ON public.discipline_activity_log 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_discipline_profiles_updated_at
BEFORE UPDATE ON public.discipline_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_discipline_tasks_updated_at
BEFORE UPDATE ON public.discipline_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_discipline_challenges_updated_at
BEFORE UPDATE ON public.discipline_challenges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial season
INSERT INTO public.discipline_seasons (season_number, name, theme, survival_xp_threshold, rank_retention_threshold)
VALUES (1, 'Genesis', 'The Beginning', 500, 'Steel');

-- Create indexes for performance
CREATE INDEX idx_discipline_profiles_user_id ON public.discipline_profiles(user_id);
CREATE INDEX idx_discipline_tasks_user_id ON public.discipline_tasks(user_id);
CREATE INDEX idx_task_completions_user_id ON public.task_completions(user_id);
CREATE INDEX idx_task_completions_task_id ON public.task_completions(task_id);
CREATE INDEX idx_discipline_challenges_user_id ON public.discipline_challenges(user_id);
CREATE INDEX idx_user_titles_user_id ON public.user_titles(user_id);
CREATE INDEX idx_activity_log_user_id ON public.discipline_activity_log(user_id);
CREATE INDEX idx_activity_log_created_at ON public.discipline_activity_log(created_at DESC);