-- Fix AI extracted notes RLS to be more restrictive
-- Drop existing policies
DROP POLICY IF EXISTS "System can manage AI extracted notes" ON public.ai_extracted_notes;
DROP POLICY IF EXISTS "System can update AI extracted notes" ON public.ai_extracted_notes;

-- The edge function will use service role key which bypasses RLS
-- Regular users can only read