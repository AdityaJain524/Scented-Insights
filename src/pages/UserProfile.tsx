import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CredibilityBadge } from '@/components/CredibilityBadge';
import { FollowButton } from '@/components/FollowButton';
import { FollowersFollowingList } from '@/components/FollowersFollowingList';
import { FragranceCard } from '@/components/FragranceCard';
import { MapPin, Calendar, BookOpen, Loader2 } from 'lucide-react';
import { useFollow } from '@/hooks/useFollow';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  expertise_level: 'beginner' | 'explorer' | 'enthusiast' | 'expert';
  credibility_score: number;
  followers_count: number;
  following_count: number;
  interested_in_sustainability: boolean;
  created_at: string;
}

interface UserBadge {
  id: string;
  badge_type: string;
  name: string;
  description: string | null;
}

interface UserInterest {
  interest_type: string;
  interest_value: string;
}

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

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [interests, setInterests] = useState<UserInterest[]>([]);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFollowers, setShowFollowers] = useState(false);
  const [defaultTab, setDefaultTab] = useState<'followers' | 'following'>('followers');

  const { followersCount, followingCount } = useFollow(userId || '');

  useEffect(() => {
    if (userId) {
      // If viewing own profile, redirect to /profile
      if (currentUser?.id === userId) {
        navigate('/profile');
        return;
      }
      fetchUserData();
    }
  }, [userId, currentUser]);

  const fetchUserData = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profileData) {
        navigate('/404');
        return;
      }

      setProfile(profileData as UserProfile);

      // Fetch badges, interests, posts in parallel
      const [badgesRes, interestsRes, postsRes] = await Promise.all([
        supabase.from('badges').select('*').eq('user_id', userId),
        supabase.from('user_interests').select('interest_type, interest_value').eq('user_id', userId),
        supabase.from('fragrance_posts').select('*').eq('author_id', userId).order('created_at', { ascending: false }),
      ]);

      setBadges((badgesRes.data || []) as UserBadge[]);
      setInterests((interestsRes.data || []) as UserInterest[]);

      // Enrich posts with notes, emotions, occasions
      const enrichedPosts = await Promise.all(
        (postsRes.data || []).map(async post => {
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

      setPosts(enrichedPosts as UserPost[]);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openFollowersList = (tab: 'followers' | 'following') => {
    setDefaultTab(tab);
    setShowFollowers(true);
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();

  const transformPostForCard = (post: UserPost) => ({
    id: post.id,
    authorId: post.author_id,
    author: {
      id: userId!,
      email: '',
      displayName: profile?.display_name || 'Unknown',
      username: profile?.username || 'unknown',
      avatarUrl: profile?.avatar_url || undefined,
      expertiseLevel: profile?.expertise_level || 'beginner',
      credibilityScore: profile?.credibility_score || 0,
      interests: { fragranceFamilies: [], occasions: [], sustainability: false },
      badges: [],
      followersCount: profile?.followers_count || 0,
      followingCount: profile?.following_count || 0,
      createdAt: new Date(profile?.created_at || Date.now()),
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
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const fragranceFamilyInterests = interests
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
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-secondary text-secondary-foreground text-2xl">
                  {getInitials(profile.display_name)}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <FollowButton targetUserId={profile.user_id} />
            </div>

            <div className="mt-8 space-y-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="font-display text-2xl font-semibold">{profile.display_name}</h1>
                  <Badge variant={profile.expertise_level}>{profile.expertise_level}</Badge>
                </div>
                <p className="text-muted-foreground">@{profile.username}</p>
              </div>

              {profile.bio && <p className="text-sm max-w-xl">{profile.bio}</p>}

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>

              <div className="flex items-center gap-6">
                <button
                  onClick={() => openFollowersList('followers')}
                  className="text-center hover:text-primary transition-colors"
                >
                  <p className="font-semibold">{followersCount}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </button>
                <button
                  onClick={() => openFollowersList('following')}
                  className="text-center hover:text-primary transition-colors"
                >
                  <p className="font-semibold">{followingCount}</p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </button>
                <CredibilityBadge score={profile.credibility_score} size="lg" showLabel />
              </div>

              {badges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {badges.map(badge => (
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
                    {fragranceFamilyInterests.map(family => (
                      <Badge key={family} variant="secondary">{family}</Badge>
                    ))}
                    {profile.interested_in_sustainability && (
                      <Badge variant="sustainability">🌿 Sustainability</Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Posts */}
        <Tabs defaultValue="posts">
          <TabsList className="bg-card border border-border mb-6">
            <TabsTrigger value="posts" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Posts ({posts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            {posts.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map(post => (
                  <FragranceCard key={post.id} post={transformPostForCard(post)} />
                ))}
              </div>
            ) : (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No posts yet</h3>
                  <p className="text-sm text-muted-foreground">
                    This user hasn't shared any fragrance reviews yet
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <FollowersFollowingList
        userId={profile.user_id}
        isOpen={showFollowers}
        onClose={() => setShowFollowers(false)}
        defaultTab={defaultTab}
      />
    </div>
  );
}
