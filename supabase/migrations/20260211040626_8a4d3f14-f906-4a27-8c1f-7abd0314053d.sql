
-- Create a security definer function to update follow counts
CREATE OR REPLACE FUNCTION public.update_follow_counts(follower uuid, followed uuid, is_follow boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF is_follow THEN
    UPDATE profiles SET followers_count = COALESCE(followers_count, 0) + 1 WHERE user_id = followed;
    UPDATE profiles SET following_count = COALESCE(following_count, 0) + 1 WHERE user_id = follower;
  ELSE
    UPDATE profiles SET followers_count = GREATEST(COALESCE(followers_count, 0) - 1, 0) WHERE user_id = followed;
    UPDATE profiles SET following_count = GREATEST(COALESCE(following_count, 0) - 1, 0) WHERE user_id = follower;
  END IF;
END;
$$;
