import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CredibilityBadge } from '@/components/CredibilityBadge';
import { FollowersFollowingList } from '@/components/FollowersFollowingList';
import { FragranceCard } from '@/components/FragranceCard';
import { MapPin, Calendar, Settings, Edit2, BookOpen, Heart, Bookmark, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useFollow } from '@/hooks/useFollow';

interface UserPost {
  id: string;
  author_id: string;
  post_type: 'review' | 'story' | 'comparison' | 'educational';
  fragrance_name: string;
  brand_name: string | null;
  content: string;
  image_url: string | null;
  longevity: number | null;
  projection: number | null;
  likes_count: number;
  comments_count: number;
  saves_count: number;
  credibility_rating: number;
  is_verified: boolean;
  created_at: string;
  notes: Array<{ name: string; note_type: 'top' | 'heart' | 'base' }>;
  emotions: string[];
  occasions: string[];
}

interface SavedPost extends UserPost {
  authorProfile?: {
    display_name: string;
    username: string;
    avatar_url: string | null;
    expertise_level: string;
    credibility_score: number;
  };
}

export default function Profile() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [likedPosts, setLikedPosts] = useState<SavedPost[]>([]);
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingLiked, setIsLoadingLiked] = useState(true);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const [showFollowers, setShowFollowers] = useState(false);
  const [defaultTab, setDefaultTab] = useState<'followers' | 'following'>('followers');

  const { followersCount: liveFollowersCount, followingCount: liveFollowingCount } = useFollow(user?.id || '');

  useEffect(() => {
    if (user) {
      fetchUserPosts();
      fetchLikedPosts();
      fetchSavedPosts();
    }
  }, [user]);

  const fetchUserPosts = async () => {
    if (!user) return;
    
    setIsLoadingPosts(true);
    try {
      const { data: postsData, error } = await supabase
        .from('fragrance_posts')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enrichedPosts = await Promise.all(
        (postsData || []).map(async (post) => {
          const [notesRes, emotionsRes, occasionsRes] = await Promise.all([
            supabase.from('fragrance_notes').select('name, note_type').eq('post_id', post.id),
            supabase.from('post_emotions').select('emotion').eq('post_id', post.id),
            supabase.from('post_occasions').select('occasion').eq('post_id', post.id),
          ]);

          return {
            ...post,
            notes: notesRes.data || [],
            emotions: (emotionsRes.data || []).map((e: { emotion: string }) => e.emotion),
            occasions: (occasionsRes.data || []).map((o: { occasion: string }) => o.occasion),
          };
        })
      );

      setUserPosts(enrichedPosts as UserPost[]);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const fetchLikedPosts = async () => {
    if (!user) return;
    
    setIsLoadingLiked(true);
    try {
      const { data: likesData } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!likesData || likesData.length === 0) {
        setLikedPosts([]);
        setIsLoadingLiked(false);
        return;
      }

      const postIds = likesData.map(l => l.post_id);
      const { data: postsData } = await supabase
        .from('fragrance_posts')
        .select('*')
        .in('id', postIds);

      if (!postsData) {
        setLikedPosts([]);
        setIsLoadingLiked(false);
        return;
      }

      // Fetch author profiles
      const authorIds = [...new Set(postsData.map(p => p.author_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url, expertise_level, credibility_score')
        .in('user_id', authorIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const enrichedPosts = await Promise.all(
        postsData.map(async (post) => {
          const [notesRes, emotionsRes, occasionsRes] = await Promise.all([
            supabase.from('fragrance_notes').select('name, note_type').eq('post_id', post.id),
            supabase.from('post_emotions').select('emotion').eq('post_id', post.id),
            supabase.from('post_occasions').select('occasion').eq('post_id', post.id),
          ]);

          return {
            ...post,
            notes: notesRes.data || [],
            emotions: (emotionsRes.data || []).map((e: { emotion: string }) => e.emotion),
            occasions: (occasionsRes.data || []).map((o: { occasion: string }) => o.occasion),
            authorProfile: profileMap.get(post.author_id),
          };
        })
      );

      setLikedPosts(enrichedPosts as SavedPost[]);
    } catch (error) {
      console.error('Error fetching liked posts:', error);
    } finally {
      setIsLoadingLiked(false);
    }
  };

  const fetchSavedPosts = async () => {
    if (!user) return;
    
    setIsLoadingSaved(true);
    try {
      const { data: savesData } = await supabase
        .from('post_saves')
        .select('post_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!savesData || savesData.length === 0) {
        setSavedPosts([]);
        setIsLoadingSaved(false);
        return;
      }

      const postIds = savesData.map(s => s.post_id);
      const { data: postsData } = await supabase
        .from('fragrance_posts')
        .select('*')
        .in('id', postIds);

      if (!postsData) {
        setSavedPosts([]);
        setIsLoadingSaved(false);
        return;
      }

      const authorIds = [...new Set(postsData.map(p => p.author_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url, expertise_level, credibility_score')
        .in('user_id', authorIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const enrichedPosts = await Promise.all(
        postsData.map(async (post) => {
          const [notesRes, emotionsRes, occasionsRes] = await Promise.all([
            supabase.from('fragrance_notes').select('name, note_type').eq('post_id', post.id),
            supabase.from('post_emotions').select('emotion').eq('post_id', post.id),
            supabase.from('post_occasions').select('occasion').eq('post_id', post.id),
          ]);

          return {
            ...post,
            notes: notesRes.data || [],
            emotions: (emotionsRes.data || []).map((e: { emotion: string }) => e.emotion),
            occasions: (occasionsRes.data || []).map((o: { occasion: string }) => o.occasion),
            authorProfile: profileMap.get(post.author_id),
          };
        })
      );

      setSavedPosts(enrichedPosts as SavedPost[]);
    } catch (error) {
      console.error('Error fetching saved posts:', error);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const openFollowersList = (tab: 'followers' | 'following') => {
    setDefaultTab(tab);
    setShowFollowers(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const profile = user.profile;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const transformPostForCard = (post: UserPost, authorProfile?: SavedPost['authorProfile']) => {
    const ap = authorProfile || {
      display_name: profile?.display_name || 'Unknown',
      username: profile?.username || 'unknown',
      avatar_url: profile?.avatar_url,
      expertise_level: profile?.expertise_level || 'beginner',
      credibility_score: profile?.credibility_score || 0,
    };

    return {
      id: post.id,
      authorId: post.author_id,
      author: {
        id: post.author_id,
        email: '',
        displayName: ap.display_name,
        username: ap.username,
        avatarUrl: ap.avatar_url || undefined,
        expertiseLevel: ap.expertise_level as any,
        credibilityScore: ap.credibility_score,
        interests: { fragranceFamilies: [], occasions: [], sustainability: false },
        badges: [],
        followersCount: 0,
        followingCount: 0,
        createdAt: new Date(),
      },
      type: post.post_type,
      fragranceName: post.fragrance_name,
      brandName: post.brand_name || '',
      notes: post.notes.map(n => ({ name: n.name, type: n.note_type })),
      emotions: post.emotions,
      occasions: post.occasions as any[],
      longevity: post.longevity || undefined,
      projection: post.projection || undefined,
      content: post.content,
      imageUrl: post.image_url || undefined,
      likesCount: post.likes_count,
      commentsCount: post.comments_count,
      savesCount: post.saves_count,
      credibilityRating: post.credibility_rating,
      isVerified: post.is_verified,
      createdAt: new Date(post.created_at),
    };
  };

  const fragranceFamilyInterests = user.interests
    .filter(i => i.interest_type === 'fragrance_family')
    .map(i => i.interest_value);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6 px-4">
        {/* Profile Header */}
        <Card className="glass-card mb-6 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary/30 via-accent/20 to-burgundy/30" />
          
          <CardContent className="relative pt-0">
            <div className="absolute -top-12 left-6">
              <Avatar className="h-24 w-24 border-4 border-card shadow-elevated">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-secondary text-secondary-foreground text-2xl">
                  {profile ? getInitials(profile.display_name) : 'U'}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="hero" size="sm" onClick={() => navigate('/profile/edit')}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>

            <div className="mt-8 space-y-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="font-display text-2xl font-semibold">{profile?.display_name || 'User'}</h1>
                  {profile && (
                    <Badge variant={profile.expertise_level}>{profile.expertise_level}</Badge>
                  )}
                </div>
                <p className="text-muted-foreground">@{profile?.username || 'user'}</p>
              </div>

              {profile?.bio && (
                <p className="text-sm max-w-xl">{profile.bio}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {profile?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </span>
                )}
                {profile && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-6">
                <button
                  onClick={() => openFollowersList('followers')}
                  className="text-center hover:text-primary transition-colors"
                >
                  <p className="font-semibold">{liveFollowersCount}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </button>
                <button
                  onClick={() => openFollowersList('following')}
                  className="text-center hover:text-primary transition-colors"
                >
                  <p className="font-semibold">{liveFollowingCount}</p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </button>
                <div className="flex items-center gap-2">
                  <CredibilityBadge score={profile?.credibility_score || 0} size="lg" showLabel />
                </div>
              </div>

              {user.badges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {user.badges.map((badge) => (
                    <Badge key={badge.id} variant="verified" className="gap-1">
                      {badge.badge_type === 'verified-reviewer' && '✓'}
                      {badge.badge_type === 'expert' && '👑'}
                      {badge.badge_type === 'sustainability-champion' && '🌿'}
                      {badge.badge_type === 'beginner' && '🌱'}
                      {badge.badge_type === 'contributor' && '⭐'}
                      {badge.badge_type === 'trusted' && '🛡️'}
                      {badge.badge_type === 'community-expert' && '🏆'}
                      {badge.name}
                    </Badge>
                  ))}
                </div>
              )}

              {fragranceFamilyInterests.length > 0 && (
                <div className="pt-2">
                  <p className="text-sm font-medium mb-2">Interested in</p>
                  <div className="flex flex-wrap gap-2">
                    {fragranceFamilyInterests.map((family) => (
                      <Badge key={family} variant="secondary">{family}</Badge>
                    ))}
                    {profile?.interested_in_sustainability && (
                      <Badge variant="sustainability">🌿 Sustainability</Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="posts">
          <TabsList className="bg-card border border-border mb-6">
            <TabsTrigger value="posts" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="likes" className="gap-2">
              <Heart className="h-4 w-4" />
              Likes
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-2">
              <Bookmark className="h-4 w-4" />
              Saved
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            {isLoadingPosts ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : userPosts.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {userPosts.map((post) => (
                  <FragranceCard
                    key={post.id}
                    post={transformPostForCard(post)}
                    onDelete={(postId) => setUserPosts(prev => prev.filter(p => p.id !== postId))}
                  />
                ))}
              </div>
            ) : (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No posts yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Share your fragrance journey with the community
                  </p>
                  <Button variant="hero" onClick={() => navigate('/create')}>
                    Create Your First Post
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="likes">
            {isLoadingLiked ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : likedPosts.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {likedPosts.map((post) => (
                  <FragranceCard key={post.id} post={transformPostForCard(post, post.authorProfile)} />
                ))}
              </div>
            ) : (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No liked posts yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Posts you like will appear here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="saved">
            {isLoadingSaved ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : savedPosts.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {savedPosts.map((post) => (
                  <FragranceCard key={post.id} post={transformPostForCard(post, post.authorProfile)} />
                ))}
              </div>
            ) : (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Your saved collection</h3>
                  <p className="text-sm text-muted-foreground">
                    Posts you save will appear here for easy access
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <FollowersFollowingList
        userId={user.id}
        isOpen={showFollowers}
        onClose={() => setShowFollowers(false)}
        defaultTab={defaultTab}
      />
    </div>
  );
}
