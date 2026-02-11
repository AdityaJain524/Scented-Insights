import { Button } from '@/components/ui/button';
import { useFollow } from '@/hooks/useFollow';
import { Loader2, UserPlus, UserMinus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface FollowButtonProps {
  targetUserId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
}

export function FollowButton({
  targetUserId,
  variant = 'default',
  size = 'default',
  showIcon = true,
}: FollowButtonProps) {
  const { user } = useAuth();
  const { isFollowing, isLoading, toggleFollow } = useFollow(targetUserId);

  // Don't show follow button for own profile
  if (user?.id === targetUserId) {
    return null;
  }

  return (
    <Button
      variant={isFollowing ? 'outline' : 'hero'}
      size={size}
      onClick={toggleFollow}
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {showIcon && (
            isFollowing ? (
              <UserMinus className="h-4 w-4" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )
          )}
          {isFollowing ? 'Following' : 'Follow'}
        </>
      )}
    </Button>
  );
}
