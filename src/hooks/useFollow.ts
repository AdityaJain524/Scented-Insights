import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useFollow(targetUserId: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const checkFollowStatus = useCallback(async () => {
    if (!user || user.id === targetUserId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle();

      if (error) throw error;
      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error checking follow status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, targetUserId]);

  const fetchCounts = useCallback(async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('followers_count, following_count')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (profile) {
        setFollowersCount(profile.followers_count || 0);
        setFollowingCount(profile.following_count || 0);
      }
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  }, [targetUserId]);

  useEffect(() => {
    checkFollowStatus();
    fetchCounts();
  }, [checkFollowStatus, fetchCounts]);

  const toggleFollow = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to follow users.',
        variant: 'destructive',
      });
      return;
    }

    if (user.id === targetUserId) {
      toast({
        title: 'Cannot follow yourself',
        description: "You can't follow your own profile.",
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);

        if (error) throw error;

        // Update counts via security definer function
        await supabase.rpc('update_follow_counts', {
          follower: user.id,
          followed: targetUserId,
          is_follow: false,
        });

        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
        setFollowingCount(prev => Math.max(0, prev - 1));

        toast({
          title: 'Unfollowed',
          description: 'You are no longer following this user.',
        });
      } else {
        // Follow
        const { error } = await supabase.from('follows').insert({
          follower_id: user.id,
          following_id: targetUserId,
        });

        if (error) throw error;

        // Update counts via security definer function
        await supabase.rpc('update_follow_counts', {
          follower: user.id,
          followed: targetUserId,
          is_follow: true,
        });

        // Create notification
        await supabase.from('notifications').insert({
          user_id: targetUserId,
          actor_id: user.id,
          type: 'follow',
          message: `${user.profile?.display_name || 'Someone'} started following you`,
        });

        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        setFollowingCount(prev => prev + 1);

        toast({
          title: 'Following',
          description: 'You are now following this user.',
        });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { isFollowing, isLoading, followersCount, followingCount, toggleFollow };
}
