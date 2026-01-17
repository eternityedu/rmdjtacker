-- Create medals table
CREATE TABLE public.medals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    points_required INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_medals table for earned medals
CREATE TABLE public.user_medals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    medal_id UUID NOT NULL REFERENCES public.medals(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, medal_id)
);

-- Create user_levels table
CREATE TABLE public.user_levels (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    current_level INTEGER NOT NULL DEFAULT 1,
    total_points INTEGER NOT NULL DEFAULT 0,
    weekly_points INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.medals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_medals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;

-- Medals are viewable by everyone
CREATE POLICY "Medals are viewable by everyone" 
ON public.medals 
FOR SELECT 
USING (true);

-- Users can view their own medals
CREATE POLICY "Users can view their own medals" 
ON public.user_medals 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own medals (earned by system)
CREATE POLICY "Users can earn medals" 
ON public.user_medals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can view their own level
CREATE POLICY "Users can view their own level" 
ON public.user_levels 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own level
CREATE POLICY "Users can insert their own level" 
ON public.user_levels 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own level
CREATE POLICY "Users can update their own level" 
ON public.user_levels 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Insert default medals
INSERT INTO public.medals (name, description, icon, points_required) VALUES
('First Steps', 'Log your first meal', 'baby', 0),
('Streak Starter', 'Achieve a 3-day streak', 'flame', 50),
('Week Warrior', 'Achieve a 7-day streak', 'trophy', 100),
('Month Master', 'Achieve a 30-day streak', 'crown', 500),
('Nutrition Ninja', 'Log 10 meals', 'salad', 150),
('Consistency King', 'Log meals for 14 days straight', 'star', 300),
('Health Hero', 'Reach Level 5', 'heart', 400),
('AI Explorer', 'Chat with all 3 AI assistants', 'brain', 75);

-- Add habit_type column to habit_streaks if not exists
ALTER TABLE public.habit_streaks ADD COLUMN IF NOT EXISTS habit_type TEXT DEFAULT 'general';

-- Update habit_streaks for better tracking
ALTER TABLE public.habit_streaks ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;