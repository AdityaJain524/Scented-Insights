import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CommentImageUploader } from '@/components/ImageUploader';
import { Loader2, Send, Trash2, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author_id: string;
  author?: {
    display_name: string;
    username: string;
    avatar_url: string | null;
  };
}

interface CommentSectionProps {
  postId: string;
  postAuthorId: string;
  onCommentCountChange?: (count: number) => void;
}

export function CommentSection({ postId, postAuthorId, onCommentCountChange }: CommentSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentImage, setCommentImage] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const { data: commentsData, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch author profiles
      const authorIds = [...new Set(commentsData?.map(c => c.author_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .in('user_id', authorIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const enrichedComments = (commentsData || []).map(comment => ({
        ...comment,
        author: profileMap.get(comment.author_id),
      }));

      setComments(enrichedComments);
      onCommentCountChange?.(enrichedComments.length);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to comment.',
        variant: 'destructive',
      });
      return;
    }

    if (!newComment.trim() && !commentImage) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          author_id: user.id,
          content: newComment.trim(),
          image_url: commentImage,
        })
        .select()
        .single();

      if (error) throw error;

      // Update post comments count
      await supabase
        .from('fragrance_posts')
        .update({ comments_count: comments.length + 1 })
        .eq('id', postId);

      // Create notification if not own post
      if (postAuthorId !== user.id) {
        await supabase.from('notifications').insert({
          user_id: postAuthorId,
          actor_id: user.id,
          type: 'comment',
          post_id: postId,
          comment_id: data.id,
          message: `${user.profile?.display_name || 'Someone'} commented on your post`,
        });
      }

      // Add to local state
      setComments(prev => [
        ...prev,
        {
          ...data,
          author: {
            display_name: user.profile?.display_name || 'User',
            username: user.profile?.username || 'user',
            avatar_url: user.profile?.avatar_url || null,
          },
        },
      ]);

      setNewComment('');
      setCommentImage(null);
      onCommentCountChange?.(comments.length + 1);

      toast({
        title: 'Comment posted',
        description: 'Your comment has been added.',
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: 'Error',
        description: 'Could not post comment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) throw error;

      setComments(prev => prev.filter(c => c.id !== commentId));

      await supabase
        .from('fragrance_posts')
        .update({ comments_count: Math.max(0, comments.length - 1) })
        .eq('id', postId);

      onCommentCountChange?.(Math.max(0, comments.length - 1));

      toast({
        title: 'Comment deleted',
        description: 'Your comment has been removed.',
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Error',
        description: 'Could not delete comment. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Comments list */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">
            No comments yet. Be the first to share your thoughts!
          </p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.author?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {getInitials(comment.author?.display_name || 'U')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {comment.author?.display_name || 'User'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                  {user?.id === comment.author_id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(comment.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <p className="text-sm">{comment.content}</p>
                {comment.image_url && (
                  <img
                    src={comment.image_url}
                    alt="Comment attachment"
                    className="max-w-xs rounded-lg border border-border mt-2"
                  />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* New comment form */}
      {user && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.profile?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {getInitials(user.profile?.display_name || 'U')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="min-h-[60px] resize-none"
              />
              {commentImage && (
                <img
                  src={commentImage}
                  alt="Attachment preview"
                  className="h-16 w-16 object-cover rounded-lg border border-border"
                />
              )}
            </div>
          </div>
          <div className="flex items-center justify-between pl-11">
            <CommentImageUploader
              userId={user.id}
              imageUrl={commentImage}
              onImageChange={setCommentImage}
            />
            <Button type="submit" size="sm" disabled={isSubmitting || (!newComment.trim() && !commentImage)}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Post
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
