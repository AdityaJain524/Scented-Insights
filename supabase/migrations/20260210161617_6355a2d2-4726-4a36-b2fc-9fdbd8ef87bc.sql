
-- Table for users to hide posts from their feed
CREATE TABLE public.hidden_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL REFERENCES public.fragrance_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE public.hidden_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own hidden posts"
ON public.hidden_posts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can hide posts"
ON public.hidden_posts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unhide posts"
ON public.hidden_posts FOR DELETE USING (auth.uid() = user_id);

-- Table for tracking learning streaks
CREATE TABLE public.learning_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.learning_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own streaks"
ON public.learning_streaks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks"
ON public.learning_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks"
ON public.learning_streaks FOR UPDATE USING (auth.uid() = user_id);
