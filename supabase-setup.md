# SakuraScans Supabase Database Setup

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create a free account
2. Click "New Project"
3. Choose a name (e.g., "sakurascans") and password
4. Wait for project to initialize (2-3 minutes)

## Step 2: Get Your Credentials

1. Go to Settings > API in your Supabase dashboard
2. Copy your **Project URL** and **anon/public key**
3. Update your `.env.local` file with these values

## Step 3: Set Up Database Tables

Go to Database > SQL Editor in Supabase and run this SQL:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comic_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, comic_id)
);

-- Create reading history table
CREATE TABLE IF NOT EXISTS public.reading_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comic_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  page_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, comic_id, chapter_id)
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can manage own bookmarks" ON public.bookmarks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own reading history" ON public.reading_history
  FOR ALL USING (auth.uid() = user_id);

-- Create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Step 4: Update Environment Variables

Update your `.env.local` file:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 5: Deploy and Test

After setting up, your user accounts and bookmarks will persist across deployments!

## Benefits

✅ **Persistent Data**: User accounts survive deployments
✅ **Real-time Sync**: Data syncs across devices
✅ **Scalable**: Handles thousands of users
✅ **Secure**: Row-level security built-in
✅ **Free Tier**: 50,000 monthly active users free
