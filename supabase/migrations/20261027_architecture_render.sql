-- ==============================================================================
-- ARCHITECTURE RENDER STUDIO - SUPABASE DATABASE MIGRATION
-- Generated: 2026-10-27
-- Description: Profiles, Render Projects, Render Images, Usage Tracking, and RLS
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  role TEXT DEFAULT 'architect',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 3. Render Projects Table
CREATE TABLE IF NOT EXISTS public.render_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  project_type TEXT NOT NULL,
  style TEXT NOT NULL,
  materials JSONB DEFAULT '[]'::jsonb,
  lighting TEXT NOT NULL,
  aspect_ratio TEXT DEFAULT '1:1',
  prompt TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 4. Render Images Table (Stores references to input & output files in Storage)
CREATE TABLE IF NOT EXISTS public.render_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.render_projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_type TEXT NOT NULL CHECK (image_type IN ('input', 'output')),
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 5. Render Usage Tracking Table (Auditing & rate limiting)
CREATE TABLE IF NOT EXISTS public.render_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.render_projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 6. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_render_projects_user_id ON public.render_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_render_projects_created_at ON public.render_projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_render_images_project_id ON public.render_images(project_id);
CREATE INDEX IF NOT EXISTS idx_render_images_user_id ON public.render_images(user_id);
CREATE INDEX IF NOT EXISTS idx_render_usage_user_id ON public.render_usage(user_id);

-- 7. Trigger to automatically update updated_at on render_projects
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_render_projects_timestamp ON public.render_projects;
CREATE TRIGGER trigger_update_render_projects_timestamp
  BEFORE UPDATE ON public.render_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Auto-create Profile on auth.users Sign Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'architect'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Isolation: Each user can ONLY access and modify their own records!
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.render_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.render_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.render_usage ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Render Projects Policies
DROP POLICY IF EXISTS "Users can view their own projects" ON public.render_projects;
CREATE POLICY "Users can view their own projects"
  ON public.render_projects FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own projects" ON public.render_projects;
CREATE POLICY "Users can create their own projects"
  ON public.render_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own projects" ON public.render_projects;
CREATE POLICY "Users can update their own projects"
  ON public.render_projects FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own projects" ON public.render_projects;
CREATE POLICY "Users can delete their own projects"
  ON public.render_projects FOR DELETE
  USING (auth.uid() = user_id);

-- Render Images Policies
DROP POLICY IF EXISTS "Users can view their own render images" ON public.render_images;
CREATE POLICY "Users can view their own render images"
  ON public.render_images FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own render images" ON public.render_images;
CREATE POLICY "Users can insert their own render images"
  ON public.render_images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own render images" ON public.render_images;
CREATE POLICY "Users can delete their own render images"
  ON public.render_images FOR DELETE
  USING (auth.uid() = user_id);

-- Render Usage Policies
DROP POLICY IF EXISTS "Users can view their own usage" ON public.render_usage;
CREATE POLICY "Users can view their own usage"
  ON public.render_usage FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own usage" ON public.render_usage;
CREATE POLICY "Users can insert their own usage"
  ON public.render_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- STORAGE BUCKETS SETUP & STORAGE RLS POLICIES
-- Buckets: architecture-inputs (private) and architecture-renders (private)
-- Path convention: {user_id}/{project_id}/{filename}
-- ==============================================================================

-- Create Buckets (if storage schema exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('architecture-inputs', 'architecture-inputs', false)
ON CONFLICT (id) DO UPDATE SET public = false;

INSERT INTO storage.buckets (id, name, public)
VALUES ('architecture-renders', 'architecture-renders', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Storage RLS: Users can only upload and read files in their own folder (folder name matching user_id)
DROP POLICY IF EXISTS "Users can upload their own input images" ON storage.objects;
CREATE POLICY "Users can upload their own input images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'architecture-inputs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can read their own input images" ON storage.objects;
CREATE POLICY "Users can read their own input images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'architecture-inputs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can upload their own render images" ON storage.objects;
CREATE POLICY "Users can upload their own render images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'architecture-renders' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can read their own render images" ON storage.objects;
CREATE POLICY "Users can read their own render images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'architecture-renders' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own render files" ON storage.objects;
CREATE POLICY "Users can delete their own render files"
  ON storage.objects FOR DELETE
  USING (
    (bucket_id = 'architecture-inputs' OR bucket_id = 'architecture-renders') AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
