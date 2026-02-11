import { FragrancePost } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Bookmark, Share2, CheckCircle, Flag, Trash2, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { usePostInteractions } from '@/hooks/usePostInteractions';
import { CommentSection } from '@/components/CommentSection';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FragranceCardProps {
  post: FragrancePost;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onSave?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onHide?: (postId: string) => void;
}

export function FragranceCard({ post, onDelete, onHide }: FragranceCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    isLiked,
    isSaved,
    likesCount,
    toggleLike,
    toggleSave,
  } = usePostInteractions(post.id, post.authorId);

  const isOwner = user?.id === post.authorId;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getPostTypeLabel = (type: FragrancePost['type']) => {
    switch (type) {
      case 'review': return 'Review';
      case 'story': return 'Scent Story';
      case 'comparison': return 'Comparison';
      case 'educational': return 'Educational';
    }
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/user/${post.authorId}`);
  };

  const handleDelete = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('fragrance_posts')
        .delete()
        .eq('id', post.id)
        .eq('author_id', user.id);

      if (error) throw error;

      toast({ title: 'Post deleted', description: 'Your post has been removed.' });
      onDelete?.(post.id);
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({ title: 'Error', description: 'Could not delete post.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleHide = async () => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to hide posts.', variant: 'destructive' });
      return;
    }
    try {
      const { error } = await supabase
        .from('hidden_posts')
        .insert({ user_id: user.id, post_id: post.id });

      if (error) throw error;

      toast({ title: 'Post hidden', description: 'This post will no longer appear in your feed.' });
      onHide?.(post.id);
    } catch (error) {
      console.error('Error hiding post:', error);
      toast({ title: 'Error', description: 'Could not hide post.', variant: 'destructive' });
    }
  };

  return (
    <>
      <Card className="glass-card hover-lift overflow-hidden">
        {post.imageUrl && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={post.imageUrl}
              alt={post.fragranceName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <div className="absolute bottom-3 left-3">
              <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                {getPostTypeLabel(post.type)}
              </Badge>
            </div>
          </div>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <button
              onClick={handleAuthorClick}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left"
            >
              <Avatar className="h-10 w-10 border-2 border-border">
                <AvatarImage src={post.author.avatarUrl} />
                <AvatarFallback className="bg-secondary text-secondary-foreground">
                  {getInitials(post.author.displayName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-sm">{post.author.displayName}</span>
                  {post.isVerified && (
                    <CheckCircle className="h-4 w-4 text-primary fill-primary/20" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant={post.author.expertiseLevel} className="text-[10px] px-1.5 py-0">
                    {post.author.expertiseLevel}
                  </Badge>
                  <span>·</span>
                  <span>{post.author.credibilityScore}% credibility</span>
                </div>
              </div>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Flag className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwner ? (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete post
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem onClick={handleHide}>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide post
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Flag className="h-4 w-4 mr-2" />
                      Report post
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div>
            <h3 className="font-display text-lg font-semibold">{post.fragranceName}</h3>
            <p className="text-sm text-muted-foreground">{post.brandName}</p>
          </div>

          <p className="text-sm leading-relaxed line-clamp-3">{post.content}</p>

          {/* Notes */}
          <div className="flex flex-wrap gap-1.5">
            {post.notes.slice(0, 5).map((note, index) => (
              <Badge key={index} variant={note.type} className="text-[10px]">
                {note.name}
              </Badge>
            ))}
            {post.notes.length > 5 && (
              <Badge variant="outline" className="text-[10px]">
                +{post.notes.length - 5} more
              </Badge>
            )}
          </div>

          {/* Emotions */}
          {post.emotions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.emotions.slice(0, 3).map((emotion, index) => (
                <span key={index} className="text-xs text-muted-foreground">
                  ✨ {emotion}
                </span>
              ))}
            </div>
          )}

          {/* Longevity & Projection */}
          {(post.longevity || post.projection) && (
            <div className="flex gap-4 pt-1">
              {post.longevity && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Longevity</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 w-3 rounded-full ${
                          i < post.longevity! ? 'bg-primary' : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
              {post.projection && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Projection</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 w-3 rounded-full ${
                          i < post.projection! ? 'bg-accent' : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0 border-t border-border/50">
          <div className="flex items-center justify-between w-full pt-3">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-1.5 ${isLiked ? 'text-rose' : ''}`}
                onClick={toggleLike}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-xs">{likesCount}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => setShowComments(true)}
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs">{commentsCount}</span>
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={isSaved ? 'text-primary' : ''}
                onClick={toggleSave}
              >
                <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Comments Dialog */}
      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <CommentSection
              postId={post.id}
              postAuthorId={post.authorId}
              onCommentCountChange={setCommentsCount}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your post and all associated comments, likes, and saves.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
