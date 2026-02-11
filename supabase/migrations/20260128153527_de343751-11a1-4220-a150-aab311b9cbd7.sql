-- Create custom types
CREATE TYPE public.expertise_level AS ENUM ('beginner', 'explorer', 'enthusiast', 'expert');
CREATE TYPE public.post_type AS ENUM ('review', 'story', 'comparison', 'educational');
CREATE TYPE public.note_type AS ENUM ('top', 'heart', 'base');
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  location TEXT,
  expertise_level expertise_level DEFAULT 'beginner',
  credibility_score INTEGER DEFAULT 0 CHECK (credibility_score >= 0 AND credibility_score <= 100),
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  interested_in_sustainability BOOLEAN DEFAULT false,
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table (roles must be in separate table)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Create user_interests table for fragrance families and occasions
CREATE TABLE public.user_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  interest_type TEXT NOT NULL, -- 'fragrance_family' or 'occasion'
  interest_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, interest_type, interest_value)
);

-- Create badges table
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_type TEXT NOT NULL, -- 'beginner', 'verified-reviewer', 'expert', 'sustainability-champion'
  name TEXT NOT NULL,
  description TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create fragrance_posts table
CREATE TABLE public.fragrance_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_type post_type NOT NULL DEFAULT 'review',
  fragrance_name TEXT NOT NULL,
  brand_name TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  longevity INTEGER CHECK (longevity >= 1 AND longevity <= 10),
  projection INTEGER CHECK (projection >= 1 AND projection <= 10),
  sustainability_notes TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,
  credibility_rating INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create fragrance_notes table
CREATE TABLE public.fragrance_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.fragrance_posts(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  note_type note_type NOT NULL
);

-- Create post_emotions table
CREATE TABLE public.post_emotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.fragrance_posts(id) ON DELETE CASCADE NOT NULL,
  emotion TEXT NOT NULL,
  UNIQUE (post_id, emotion)
);

-- Create post_occasions table
CREATE TABLE public.post_occasions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.fragrance_posts(id) ON DELETE CASCADE NOT NULL,
  occasion TEXT NOT NULL,
  UNIQUE (post_id, occasion)
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.fragrance_posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create follows table
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Create post_likes table
CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.fragrance_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (post_id, user_id)
);

-- Create post_saves table
CREATE TABLE public.post_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.fragrance_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (post_id, user_id)
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fragrance_posts_updated_at
  BEFORE UPDATE ON public.fragrance_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), ' ', '')) || '_' || substr(NEW.id::text, 1, 8)
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Assign beginner badge
  INSERT INTO public.badges (user_id, badge_type, name, description)
  VALUES (NEW.id, 'beginner', 'Beginner', 'Welcome to the fragrance community!');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fragrance_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fragrance_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_emotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_occasions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_saves ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for user_roles (read-only for users, admin can manage)
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_interests
CREATE POLICY "User interests are viewable by everyone"
  ON public.user_interests FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own interests"
  ON public.user_interests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interests"
  ON public.user_interests FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for badges
CREATE POLICY "Badges are viewable by everyone"
  ON public.badges FOR SELECT
  USING (true);

-- RLS Policies for fragrance_posts
CREATE POLICY "Posts are viewable by everyone"
  ON public.fragrance_posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON public.fragrance_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts"
  ON public.fragrance_posts FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts"
  ON public.fragrance_posts FOR DELETE
  USING (auth.uid() = author_id);

-- RLS Policies for fragrance_notes
CREATE POLICY "Notes are viewable by everyone"
  ON public.fragrance_notes FOR SELECT
  USING (true);

CREATE POLICY "Post authors can manage notes"
  ON public.fragrance_notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.fragrance_posts
      WHERE id = post_id AND author_id = auth.uid()
    )
  );

CREATE POLICY "Post authors can delete notes"
  ON public.fragrance_notes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.fragrance_posts
      WHERE id = post_id AND author_id = auth.uid()
    )
  );

-- RLS Policies for post_emotions
CREATE POLICY "Emotions are viewable by everyone"
  ON public.post_emotions FOR SELECT
  USING (true);

CREATE POLICY "Post authors can manage emotions"
  ON public.post_emotions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.fragrance_posts
      WHERE id = post_id AND author_id = auth.uid()
    )
  );

CREATE POLICY "Post authors can delete emotions"
  ON public.post_emotions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.fragrance_posts
      WHERE id = post_id AND author_id = auth.uid()
    )
  );

-- RLS Policies for post_occasions
CREATE POLICY "Occasions are viewable by everyone"
  ON public.post_occasions FOR SELECT
  USING (true);

CREATE POLICY "Post authors can manage occasions"
  ON public.post_occasions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.fragrance_posts
      WHERE id = post_id AND author_id = auth.uid()
    )
  );

CREATE POLICY "Post authors can delete occasions"
  ON public.post_occasions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.fragrance_posts
      WHERE id = post_id AND author_id = auth.uid()
    )
  );

-- RLS Policies for comments
CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = author_id);

-- RLS Policies for follows
CREATE POLICY "Follows are viewable by everyone"
  ON public.follows FOR SELECT
  USING (true);

CREATE POLICY "Users can create follows"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows"
  ON public.follows FOR DELETE
  USING (auth.uid() = follower_id);

-- RLS Policies for post_likes
CREATE POLICY "Likes are viewable by everyone"
  ON public.post_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can create likes"
  ON public.post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON public.post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for post_saves
CREATE POLICY "Saves are viewable by owner"
  ON public.post_saves FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create saves"
  ON public.post_saves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saves"
  ON public.post_saves FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_fragrance_posts_author_id ON public.fragrance_posts(author_id);
CREATE INDEX idx_fragrance_posts_created_at ON public.fragrance_posts(created_at DESC);
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX idx_follows_following_id ON public.follows(following_id);
CREATE INDEX idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX idx_post_saves_user_id ON public.post_saves(user_id);