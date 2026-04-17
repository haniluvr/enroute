-- ==============================================================================
-- 1. DROP LEGACY TABLES (CAUTION: THIS DELETES EXISTING DATA IN THESE TABLES)
-- ==============================================================================

DROP TABLE IF EXISTS public.application CASCADE;
DROP TABLE IF EXISTS public.saved_job CASCADE;
DROP TABLE IF EXISTS public.swipe CASCADE;
DROP TABLE IF EXISTS public.job CASCADE;
DROP TABLE IF EXISTS public.employer CASCADE;
DROP TABLE IF EXISTS public.counselor CASCADE;
DROP TABLE IF EXISTS public.profile CASCADE;
DROP TABLE IF EXISTS public.student CASCADE;

-- ==============================================================================
-- 2. USER PROFILES & SETTINGS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    nickname TEXT,
    phone TEXT,
    persona TEXT,
    career_interest TEXT,
    current_level TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    push_notifications BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    alert_job_opportunities BOOLEAN DEFAULT true,
    alert_ai_insights BOOLEAN DEFAULT true,
    alert_app_updates BOOLEAN DEFAULT true,
    two_factor_auth BOOLEAN DEFAULT false,
    profile_visibility TEXT DEFAULT 'public', -- public, private, network_only
    data_sharing BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 3. AI COACHING & CONVERSATIONS (Record Idea / Audio Calls)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    coach_persona TEXT NOT NULL, -- e.g., 'Dahlia', 'Male', 'Female', 'IdeaBot'
    title TEXT DEFAULT 'Coaching Session',
    duration_seconds INTEGER DEFAULT 0,
    audio_url TEXT, -- Path to the raw audio file in Supabase Storage
    summary_insights JSONB DEFAULT '[]'::jsonb, -- Array of strings (recommendations)
    summary_quotes JSONB DEFAULT '[]'::jsonb, -- Array of strings (key quotes)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.conversation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.conversation_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 4. CAREER PATHING & PERSONALIZATION (CV Scan, Test, Roadmap)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.career_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    answers JSONB NOT NULL,
    ai_career_suggestion TEXT,
    match_percentage INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.cv_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_url TEXT,
    file_name TEXT,
    extracted_skills JSONB DEFAULT '[]'::jsonb,
    missing_skills JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_role TEXT NOT NULL,
    steps JSONB NOT NULL DEFAULT '[]'::jsonb, -- Includes step, est_time, resources
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 5. CAREER SWIPE (Jobs & Swipes)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    location TEXT,
    description TEXT,
    required_skills JSONB DEFAULT '[]'::jsonb,
    salary_range TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.job_swipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    ai_match_percentage INTEGER,
    is_interested BOOLEAN NOT NULL, -- True = Swipe Right, False = Swipe Left
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, job_id)
);

-- ==============================================================================
-- 6. DISCOVERY & LIBRARY (Static Paths & Saved Items)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.learning_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    overview TEXT,
    reviews_avg NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.learning_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('video', 'article', 'pdf')),
    content_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.library_saves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('conversation', 'roadmap', 'module', 'idea')),
    item_id UUID NOT NULL, -- Polymorphic reference
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, item_type, item_id)
);

-- ==============================================================================
-- 7. ENABLE ROW LEVEL SECURITY (RLS)
-- ==============================================================================
-- We turn on RLS so users can only see their own private data.
-- Static data like jobs and paths are viewable by everyone.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_saves ENABLE ROW LEVEL SECURITY;

-- Creating basic policies (User can SELECT/INSERT/UPDATE their own data)
-- For public tables (Jobs, Paths, Modules):
CREATE POLICY "Public read access" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.learning_paths FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.learning_modules FOR SELECT USING (true);

-- For user-specific tables (requires user_id column):
DO $$
DECLARE
    t_name text;
BEGIN
    FOR t_name IN 
        SELECT table_name FROM information_schema.columns 
        WHERE column_name = 'user_id' AND table_schema = 'public'
    LOOP
        EXECUTE format('CREATE POLICY "Own %I" ON public.%I FOR ALL USING (auth.uid() = user_id)', t_name, t_name);
    END LOOP;
END $$;
