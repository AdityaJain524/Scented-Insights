import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { FollowButton } from '@/components/FollowButton';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UserProfile {
  user_id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  expertise_level: string;
  credibility_score: number;
  is_mutual?: boolean;
}

interface FollowersFollowingListProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'followers' | 'following';
}

export function FollowersFollowingList({
  userId,
  isOpen,
  onClose,
  defaultTab = 'followers',
}: FollowersFollowingListProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [following, setFollowing] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchConnections();
    }
  }, [isOpen, userId]);

  const fetchConnections = async () => {
    setIsLoading(true);
    try {
      // Fetch followers
      const { data: followersData } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', userId);

      // Fetch following
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);

      const followerIds = followersData?.map(f => f.follower_id) || [];
      const followingIds = followingData?.map(f => f.following_id) || [];

      // Fetch profiles for followers
      if (followerIds.length > 0) {
        const { data: followerProfiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url, expertise_level, credibility_score')
          .in('user_id', followerIds);

        // Check for mutual follows
        const enrichedFollowers = (followerProfiles || []).map(profile => ({
          ...profile,
          is_mutual: followingIds.includes(profile.user_id),
        }));

        setFollowers(enrichedFollowers);
      } else {
        setFollowers([]);
      }

      // Fetch profiles for following
      if (followingIds.length > 0) {
        const { data: followingProfiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url, expertise_level, credibility_score')
          .in('user_id', followingIds);

        // Check for mutual follows
        const enrichedFollowing = (followingProfiles || []).map(profile => ({
          ...profile,
          is_mutual: followerIds.includes(profile.user_id),
        }));

        setFollowing(enrichedFollowing);
      } else {
        setFollowing([]);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();

  const handleUserClick = (targetUserId: string) => {
    onClose();
    navigate(`/user/${targetUserId}`);
  };

  const renderUserList = (users: UserProfile[]) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <p className="text-center text-sm text-muted-foreground py-8">
          No users to display
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {users.map(profile => (
          <div
            key={profile.user_id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <button
              onClick={() => handleUserClick(profile.user_id)}
              className="flex items-center gap-3 flex-1 text-left"
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback>{getInitials(profile.display_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{profile.display_name}</span>
                  {profile.is_mutual && (
                    <Badge variant="secondary" className="text-[10px]">
                      Mutual
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">@{profile.username}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={profile.expertise_level as any} className="text-[10px]">
                    {profile.expertise_level}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {profile.credibility_score}% credibility
                  </span>
                </div>
              </div>
            </button>
            {user && user.id !== profile.user_id && (
              <FollowButton targetUserId={profile.user_id} size="sm" showIcon={false} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connections</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followers">
              Followers ({followers.length})
            </TabsTrigger>
            <TabsTrigger value="following">
              Following ({following.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="followers" className="max-h-96 overflow-y-auto">
            {renderUserList(followers)}
          </TabsContent>
          <TabsContent value="following" className="max-h-96 overflow-y-auto">
            {renderUserList(following)}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
