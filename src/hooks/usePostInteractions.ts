import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function usePostInteractions(postId: string, authorId: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [savesCount, setSavesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const checkInteractionStatus = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const [likeResult, saveResult, postResult] = await Promise.all([
        supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('post_saves')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('fragrance_posts')
          .select('likes_count, saves_count')
          .eq('id', postId)
          .maybeSingle(),
      ]);

      setIsLiked(!!likeResult.data);
      setIsSaved(!!saveResult.data);
      setLikesCount(postResult.data?.likes_count || 0);
      setSavesCount(postResult.data?.saves_count || 0);
    } catch (error) {
      console.error('Error checking interaction status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, postId]);

  useEffect(() => {
    checkInteractionStatus();
  }, [checkInteractionStatus]);

  const toggleLike = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to like posts.',
        variant: 'destructive',
      });
      return;
    }

    const newLikedState = !isLiked;
    const newCount = newLikedState ? likesCount + 1 : likesCount - 1;

    // Optimistic update
    setIsLiked(newLikedState);
    setLikesCount(newCount);

    try {
      if (newLikedState) {
        const { error } = await supabase.from('post_likes').insert({
          post_id: postId,
          user_id: user.id,
        });
        if (error) throw error;

        // Update post likes_count
        await supabase
          .from('fragrance_posts')
          .update({ likes_count: newCount })
          .eq('id', postId);

        // Create notification if not own post
        if (authorId !== user.id) {
          await supabase.from('notifications').insert({
            user_id: authorId,
            actor_id: user.id,
            type: 'like',
            post_id: postId,
            message: `${user.profile?.display_name || 'Someone'} liked your post`,
          });
        }
      } else {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        if (error) throw error;

        await supabase
          .from('fragrance_posts')
          .update({ likes_count: Math.max(0, newCount) })
          .eq('id', postId);
      }
    } catch (error) {
      // Revert on error
      setIsLiked(!newLikedState);
      setLikesCount(likesCount);
      console.error('Error toggling like:', error);
      toast({
        title: 'Error',
        description: 'Could not update like. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const toggleSave = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save posts.',
        variant: 'destructive',
      });
      return;
    }

    const newSavedState = !isSaved;
    const newCount = newSavedState ? savesCount + 1 : savesCount - 1;

    // Optimistic update
    setIsSaved(newSavedState);
    setSavesCount(newCount);

    try {
      if (newSavedState) {
        const { error } = await supabase.from('post_saves').insert({
          post_id: postId,
          user_id: user.id,
        });
        if (error) throw error;

        await supabase
          .from('fragrance_posts')
          .update({ saves_count: newCount })
          .eq('id', postId);

        toast({
          title: 'Saved',
          description: 'Post saved to your collection.',
        });
      } else {
        const { error } = await supabase
          .from('post_saves')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        if (error) throw error;

        await supabase
          .from('fragrance_posts')
          .update({ saves_count: Math.max(0, newCount) })
          .eq('id', postId);

        toast({
          title: 'Removed',
          description: 'Post removed from your collection.',
        });
      }
    } catch (error) {
      // Revert on error
      setIsSaved(!newSavedState);
      setSavesCount(savesCount);
      console.error('Error toggling save:', error);
      toast({
        title: 'Error',
        description: 'Could not update save. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return {
    isLiked,
    isSaved,
    likesCount,
    savesCount,
    isLoading,
    toggleLike,
    toggleSave,
  };
}
