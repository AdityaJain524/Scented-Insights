-- Create storage buckets for images
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('comment-images', 'comment-images', true);

-- Storage policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for post-images bucket
CREATE POLICY "Post images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

CREATE POLICY "Authenticated users can upload post images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own post images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own post images"
ON storage.objects FOR DELETE
USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for comment-images bucket
CREATE POLICY "Comment images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'comment-images');

CREATE POLICY "Authenticated users can upload comment images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'comment-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own comment images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'comment-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own comment images"
ON storage.objects FOR DELETE
USING (bucket_id = 'comment-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add image_url column to comments table
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'badge', 'mention')),
  actor_id UUID NOT NULL,
  post_id UUID REFERENCES public.fragrance_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- Create helpful_votes table for quality-weighted credibility
CREATE TABLE public.helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.fragrance_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.helpful_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Helpful votes are viewable by everyone"
ON public.helpful_votes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create helpful votes"
ON public.helpful_votes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own helpful votes"
ON public.helpful_votes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own helpful votes"
ON public.helpful_votes FOR DELETE
USING (auth.uid() = user_id);

-- Create expert_endorsements table
CREATE TABLE public.expert_endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.fragrance_posts(id) ON DELETE CASCADE,
  expert_id UUID NOT NULL,
  endorsement_type TEXT NOT NULL CHECK (endorsement_type IN ('accurate', 'insightful', 'well-written', 'educational')),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, expert_id, endorsement_type)
);

ALTER TABLE public.expert_endorsements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Expert endorsements are viewable by everyone"
ON public.expert_endorsements FOR SELECT
USING (true);

CREATE POLICY "Experts and admins can create endorsements"
ON public.expert_endorsements FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND expertise_level = 'expert'
  ) OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Experts can delete their own endorsements"
ON public.expert_endorsements FOR DELETE
USING (auth.uid() = expert_id);

-- Add helpful_count and expert_endorsement_count to fragrance_posts
ALTER TABLE public.fragrance_posts 
ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS expert_endorsement_count INTEGER DEFAULT 0;

-- Create flagged_posts table for bias/promotion detection
CREATE TABLE public.flagged_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.fragrance_posts(id) ON DELETE CASCADE,
  flagged_by UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('brand_pushing', 'affiliate_language', 'spam', 'misinformation', 'other')),
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'action_taken')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, flagged_by, reason)
);

ALTER TABLE public.flagged_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own flags"
ON public.flagged_posts FOR SELECT
USING (auth.uid() = flagged_by OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Authenticated users can flag posts"
ON public.flagged_posts FOR INSERT
WITH CHECK (auth.uid() = flagged_by);

CREATE POLICY "Admins and moderators can update flags"
ON public.flagged_posts FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_helpful_votes_post_id ON public.helpful_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_expert_endorsements_post_id ON public.expert_endorsements(post_id);
CREATE INDEX IF NOT EXISTS idx_flagged_posts_status ON public.flagged_posts(status);

-- Function to calculate credibility score
CREATE OR REPLACE FUNCTION public.calculate_credibility_score(target_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_score INTEGER := 0;
  post_count INTEGER;
  total_likes INTEGER;
  total_helpful INTEGER;
  total_endorsements INTEGER;
  account_age_days INTEGER;
  followers INTEGER;
  final_score INTEGER;
BEGIN
  -- Get post count (max 20 points)
  SELECT COUNT(*) INTO post_count FROM fragrance_posts WHERE author_id = target_user_id;
  base_score := base_score + LEAST(post_count * 2, 20);
  
  -- Get total likes received (max 30 points)
  SELECT COALESCE(SUM(likes_count), 0) INTO total_likes FROM fragrance_posts WHERE author_id = target_user_id;
  base_score := base_score + LEAST(total_likes, 30);
  
  -- Get helpful votes (max 25 points) - quality weight
  SELECT COUNT(*) INTO total_helpful 
  FROM helpful_votes hv 
  JOIN fragrance_posts fp ON hv.post_id = fp.id 
  WHERE fp.author_id = target_user_id AND hv.is_helpful = true;
  base_score := base_score + LEAST(total_helpful * 3, 25);
  
  -- Get expert endorsements (max 15 points) - quality weight
  SELECT COUNT(*) INTO total_endorsements 
  FROM expert_endorsements ee 
  JOIN fragrance_posts fp ON ee.post_id = fp.id 
  WHERE fp.author_id = target_user_id;
  base_score := base_score + LEAST(total_endorsements * 5, 15);
  
  -- Account age bonus (max 5 points)
  SELECT EXTRACT(DAY FROM (now() - created_at))::INTEGER INTO account_age_days 
  FROM profiles WHERE user_id = target_user_id;
  base_score := base_score + LEAST(account_age_days / 30, 5);
  
  -- Followers bonus (max 5 points)
  SELECT COALESCE(followers_count, 0) INTO followers FROM profiles WHERE user_id = target_user_id;
  base_score := base_score + LEAST(followers / 10, 5);
  
  final_score := LEAST(base_score, 100);
  
  -- Update the profile
  UPDATE profiles SET credibility_score = final_score WHERE user_id = target_user_id;
  
  RETURN final_score;
END;
$$;

-- Function to check and award badges
CREATE OR REPLACE FUNCTION public.check_and_award_badges(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_count INTEGER;
  cred_score INTEGER;
  helpful_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO post_count FROM fragrance_posts WHERE author_id = target_user_id;
  SELECT credibility_score INTO cred_score FROM profiles WHERE user_id = target_user_id;
  SELECT COUNT(*) INTO helpful_count FROM helpful_votes hv 
    JOIN fragrance_posts fp ON hv.post_id = fp.id 
    WHERE fp.author_id = target_user_id AND hv.is_helpful = true;
  
  -- Contributor badge (5+ posts)
  IF post_count >= 5 AND NOT EXISTS (
    SELECT 1 FROM badges WHERE user_id = target_user_id AND badge_type = 'contributor'
  ) THEN
    INSERT INTO badges (user_id, badge_type, name, description)
    VALUES (target_user_id, 'contributor', 'Contributor', 'Active community member with 5+ reviews');
  END IF;
  
  -- Trusted badge (20+ credibility score, 10+ helpful votes)
  IF cred_score >= 20 AND helpful_count >= 10 AND NOT EXISTS (
    SELECT 1 FROM badges WHERE user_id = target_user_id AND badge_type = 'trusted'
  ) THEN
    INSERT INTO badges (user_id, badge_type, name, description)
    VALUES (target_user_id, 'trusted', 'Trusted Reviewer', 'Consistently helpful and accurate reviews');
  END IF;
  
  -- Expert badge (50+ credibility score, has expert endorsements)
  IF cred_score >= 50 AND EXISTS (
    SELECT 1 FROM expert_endorsements ee 
    JOIN fragrance_posts fp ON ee.post_id = fp.id 
    WHERE fp.author_id = target_user_id
  ) AND NOT EXISTS (
    SELECT 1 FROM badges WHERE user_id = target_user_id AND badge_type = 'community-expert'
  ) THEN
    INSERT INTO badges (user_id, badge_type, name, description)
    VALUES (target_user_id, 'community-expert', 'Community Expert', 'Recognized expert by the community');
  END IF;
END;
$$;

-- Trigger to recalculate credibility and check badges after post interactions
CREATE OR REPLACE FUNCTION public.trigger_recalculate_credibility()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  author UUID;
BEGIN
  -- Get the author of the post
  IF TG_TABLE_NAME = 'fragrance_posts' THEN
    author := COALESCE(NEW.author_id, OLD.author_id);
  ELSIF TG_TABLE_NAME = 'post_likes' THEN
    SELECT author_id INTO author FROM fragrance_posts WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  ELSIF TG_TABLE_NAME = 'helpful_votes' THEN
    SELECT author_id INTO author FROM fragrance_posts WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  ELSIF TG_TABLE_NAME = 'expert_endorsements' THEN
    SELECT author_id INTO author FROM fragrance_posts WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  END IF;
  
  IF author IS NOT NULL THEN
    PERFORM calculate_credibility_score(author);
    PERFORM check_and_award_badges(author);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for credibility recalculation
CREATE TRIGGER recalculate_credibility_on_post
AFTER INSERT OR DELETE ON public.fragrance_posts
FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_credibility();

CREATE TRIGGER recalculate_credibility_on_like
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_credibility();

CREATE TRIGGER recalculate_credibility_on_helpful
AFTER INSERT OR DELETE ON public.helpful_votes
FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_credibility();

CREATE TRIGGER recalculate_credibility_on_endorsement
AFTER INSERT OR DELETE ON public.expert_endorsements
FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_credibility();