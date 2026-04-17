-- ==============================================================================
-- 1. EXTEND PROFILES TABLE
-- ==============================================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_top_percentile BOOLEAN DEFAULT false;

-- ==============================================================================
-- 2. JOB APPLICATIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'interviewing', 'offered', 'hired', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, job_id)
);

-- ==============================================================================
-- 3. USER MODULE COMPLETIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_module_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.learning_modules(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, module_id)
);

-- ==============================================================================
-- 4. UPDATE LEARNING MODULES FOR SKILLS
-- ==============================================================================
ALTER TABLE public.learning_modules ADD COLUMN IF NOT EXISTS skill_name TEXT;

-- ==============================================================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_completions ENABLE ROW LEVEL SECURITY;

-- Creating basic policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_applications' AND policyname = 'Users can manage their own applications') THEN
        CREATE POLICY "Users can manage their own applications" ON public.job_applications
            FOR ALL USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_module_completions' AND policyname = 'Users can manage their own completions') THEN
        CREATE POLICY "Users can manage their own completions" ON public.user_module_completions
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- ==============================================================================
-- 6. SEED MOCK SKILLS TO MODULES (OPTIONAL)
-- ==============================================================================
-- This helps link modules to skills if they aren't already set.
UPDATE public.learning_modules SET skill_name = 'UI/UX Design' WHERE title ILIKE '%Design%' OR title ILIKE '%UI%';
UPDATE public.learning_modules SET skill_name = 'React Native' WHERE title ILIKE '%React%' OR title ILIKE '%Mobile%';
UPDATE public.learning_modules SET skill_name = 'Problem Solving' WHERE title ILIKE '%Problem%' OR title ILIKE '%Algorithm%';

-- ==============================================================================
-- 7. TOP 10% RANKING RPC
-- ==============================================================================
-- This function ranks users by their 'interested' swipes count.
CREATE OR REPLACE FUNCTION public.get_user_match_rankings()
RETURNS TABLE (user_id UUID, match_count BIGINT, rank BIGINT)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        user_id, 
        COUNT(*) as match_count,
        RANK() OVER (ORDER BY COUNT(*) DESC) as rank
    FROM public.job_swipes
    WHERE is_interested = true
    GROUP BY user_id;
$$;

