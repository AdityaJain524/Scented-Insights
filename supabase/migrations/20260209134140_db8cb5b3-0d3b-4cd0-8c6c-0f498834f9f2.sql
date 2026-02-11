
-- Learning achievements table
CREATE TABLE public.learning_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.learning_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements" ON public.learning_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements" ON public.learning_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Unique constraint to prevent duplicate achievements
CREATE UNIQUE INDEX idx_unique_achievement ON public.learning_achievements (user_id, achievement_type);

-- Fragrance collection (bookmarks/saved fragrances)
CREATE TABLE public.fragrance_collection (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL REFERENCES public.fragrance_posts(id) ON DELETE CASCADE,
  collection_name TEXT NOT NULL DEFAULT 'My Collection',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fragrance_collection ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own collection" ON public.fragrance_collection
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their collection" ON public.fragrance_collection
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their collection" ON public.fragrance_collection
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can remove from their collection" ON public.fragrance_collection
  FOR DELETE USING (auth.uid() = user_id);

CREATE UNIQUE INDEX idx_unique_collection_item ON public.fragrance_collection (user_id, post_id, collection_name);
