-- Learning Paths System
CREATE TABLE public.learning_paths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty expertise_level NOT NULL DEFAULT 'beginner',
  estimated_hours INTEGER NOT NULL DEFAULT 1,
  cover_image_url TEXT,
  category TEXT NOT NULL, -- 'note-families', 'history', 'ingredients', 'layering', 'sustainability'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.learning_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  quiz_questions JSONB, -- Array of quiz questions with answers
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.user_learning_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  current_module_id UUID REFERENCES public.learning_modules(id),
  completed_modules UUID[] DEFAULT '{}',
  quiz_scores JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, path_id)
);

-- AI extracted notes storage
CREATE TABLE public.ai_extracted_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.fragrance_posts(id) ON DELETE CASCADE,
  extracted_notes JSONB NOT NULL, -- [{name: "Rose", type: "heart", confidence: 0.95}]
  extracted_emotions JSONB, -- [{emotion: "Romantic", confidence: 0.88}]
  processing_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_extracted_notes ENABLE ROW LEVEL SECURITY;

-- Learning paths RLS (public read)
CREATE POLICY "Learning paths are viewable by everyone"
  ON public.learning_paths FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage learning paths"
  ON public.learning_paths FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Learning modules RLS
CREATE POLICY "Learning modules are viewable by everyone"
  ON public.learning_modules FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage learning modules"
  ON public.learning_modules FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- User progress RLS
CREATE POLICY "Users can view their own progress"
  ON public.user_learning_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own progress"
  ON public.user_learning_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.user_learning_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- AI extracted notes RLS
CREATE POLICY "AI extracted notes are viewable by everyone"
  ON public.ai_extracted_notes FOR SELECT
  USING (true);

CREATE POLICY "System can manage AI extracted notes"
  ON public.ai_extracted_notes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update AI extracted notes"
  ON public.ai_extracted_notes FOR UPDATE
  USING (true);

-- Insert sample learning paths
INSERT INTO public.learning_paths (title, description, difficulty, estimated_hours, category) VALUES
('Introduction to Fragrance Families', 'Learn the basics of fragrance classification including floral, oriental, woody, and fresh families.', 'beginner', 2, 'note-families'),
('The Art of Note Identification', 'Master the skill of identifying top, heart, and base notes in any fragrance.', 'explorer', 3, 'ingredients'),
('Sustainable Perfumery', 'Discover eco-friendly fragrance options and sustainable sourcing practices.', 'beginner', 2, 'sustainability'),
('Advanced Fragrance Layering', 'Learn techniques for combining fragrances to create unique signature scents.', 'enthusiast', 4, 'layering'),
('History of Perfumery', 'Journey through the rich history of fragrance from ancient Egypt to modern day.', 'explorer', 5, 'history');