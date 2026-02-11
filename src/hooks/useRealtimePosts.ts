import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface RealtimeCallbacks {
  onPostInsert?: (post: any) => void;
  onPostUpdate?: (post: any) => void;
  onPostDelete?: (postId: string) => void;
  onLikeChange?: (payload: any) => void;
  onCommentChange?: (payload: any) => void;
  onFollowChange?: (payload: any) => void;
}

export function useRealtimePosts(callbacks: RealtimeCallbacks) {
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    const channel = supabase
      .channel('realtime-feed')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fragrance_posts',
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (payload.eventType === 'INSERT' && callbacksRef.current.onPostInsert) {
            callbacksRef.current.onPostInsert(payload.new);
          } else if (payload.eventType === 'UPDATE' && callbacksRef.current.onPostUpdate) {
            callbacksRef.current.onPostUpdate(payload.new);
          } else if (payload.eventType === 'DELETE' && callbacksRef.current.onPostDelete) {
            callbacksRef.current.onPostDelete(payload.old.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_likes',
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (callbacksRef.current.onLikeChange) {
            callbacksRef.current.onLikeChange(payload);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (callbacksRef.current.onCommentChange) {
            callbacksRef.current.onCommentChange(payload);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'follows',
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (callbacksRef.current.onFollowChange) {
            callbacksRef.current.onFollowChange(payload);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}

export function useRealtimeNotifications(userId: string | undefined, onNotification: (notification: any) => void) {
  const onNotificationRef = useRef(onNotification);
  onNotificationRef.current = onNotification;

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          onNotificationRef.current(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
}
