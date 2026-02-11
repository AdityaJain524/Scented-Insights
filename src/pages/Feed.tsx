import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { FragranceCard } from '@/components/FragranceCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchFilters, SearchFiltersState } from '@/components/SearchFilters';
import { TrendingUp, GraduationCap, Users, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimePosts } from '@/hooks/useRealtimePosts';

type FeedType = 'for-you' | 'learning' | 'trending';

interface PostWithAuthor {
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
  author: {
    display_name: string;
    username: string;
    avatar_url: string | null;
    expertise_level: 'beginner' | 'explorer' | 'enthusiast' | 'expert';
    credibility_score: number;
  };
  notes: Array<{ name: string; note_type: 'top' | 'heart' | 'base' }>;
  emotions: string[];
  occasions: string[];
}

interface SuggestedUser {
  id: string;
  user_id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  expertise_level: 'beginner' | 'explorer' | 'enthusiast' | 'expert';
  credibility_score: number;
}

export default function Feed() {
  const [feedType, setFeedType] = useState<FeedType>('for-you');
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const [filters, setFilters] = useState<SearchFiltersState>({
    query: '',
    notes: [],
    emotions: [],
    minCredibility: 0,
    postType: null,
    sortBy: 'recent',
  });

  // Realtime updates
  useRealtimePosts({
    onPostInsert: (newPost) => {
      fetchPostWithAuthor(newPost.id).then((enrichedPost) => {
        if (enrichedPost) {
          setPosts((prev) => [enrichedPost, ...prev]);
        }
      });
    },
    onPostUpdate: (updatedPost) => {
      setPosts((prev) =>
        prev.map((p) => (p.id === updatedPost.id ? { ...p, ...updatedPost } : p))
      );
    },
    onPostDelete: (postId) => {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    },
    onLikeChange: () => {
      // Refetch to get updated counts
      fetchPosts();
    },
  });

  useEffect(() => {
    fetchPosts();
    fetchSuggestedUsers();
  }, [feedType, filters]);

  const fetchPostWithAuthor = async (postId: string): Promise<PostWithAuthor | null> => {
    try {
      const { data: post, error: postError } = await supabase
        .from('fragrance_posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (postError || !post) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url, expertise_level, credibility_score')
        .eq('user_id', post.author_id)
        .single();

      const [notesRes, emotionsRes, occasionsRes] = await Promise.all([
        supabase.from('fragrance_notes').select('name, note_type').eq('post_id', post.id),
        supabase.from('post_emotions').select('emotion').eq('post_id', post.id),
        supabase.from('post_occasions').select('occasion').eq('post_id', post.id),
      ]);

      return {
        ...post,
        author: profile || {
          display_name: 'Unknown',
          username: 'unknown',
          avatar_url: null,
          expertise_level: 'beginner' as const,
          credibility_score: 0,
        },
        notes: notesRes.data || [],
        emotions: (emotionsRes.data || []).map((e: { emotion: string }) => e.emotion),
        occasions: (occasionsRes.data || []).map((o: { occasion: string }) => o.occasion),
      } as PostWithAuthor;
    } catch (error) {
      console.error('Error fetching single post:', error);
      return null;
    }
  };

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      // Fetch hidden post IDs for the current user
      let hiddenPostIds: string[] = [];
      if (user) {
        const { data: hiddenData } = await supabase
          .from('hidden_posts')
          .select('post_id')
          .eq('user_id', user.id);
        hiddenPostIds = (hiddenData || []).map(h => h.post_id);
      }

      // Build query with filters
      let query = supabase.from('fragrance_posts').select('*');
      // Apply search query
      if (filters.query) {
        query = query.or(`fragrance_name.ilike.%${filters.query}%,brand_name.ilike.%${filters.query}%,content.ilike.%${filters.query}%`);
      }

      // Apply post type filter
      if (filters.postType) {
        query = query.eq('post_type', filters.postType as 'review' | 'story' | 'comparison' | 'educational');
      }

      // Apply credibility filter
      if (filters.minCredibility > 0) {
        query = query.gte('credibility_rating', filters.minCredibility);
      }

      // Apply sorting
      if (filters.sortBy === 'popular') {
        query = query.order('likes_count', { ascending: false });
      } else if (filters.sortBy === 'credibility') {
        query = query.order('credibility_rating', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data: postsData, error: postsError } = await query.limit(50);

      if (postsError) throw postsError;

      // Fetch all unique author IDs
      const authorIds = [...new Set((postsData || []).map(p => p.author_id))];
      
      // Fetch profiles for all authors
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url, expertise_level, credibility_score')
        .in('user_id', authorIds);

      if (profilesError) throw profilesError;

      // Create a map of profiles by user_id
      const profilesMap = new Map(
        (profilesData || []).map(p => [p.user_id, p])
      );

      // For each post, fetch notes, emotions, and occasions
      const enrichedPosts = await Promise.all(
        (postsData || []).map(async (post) => {
          const [notesRes, emotionsRes, occasionsRes] = await Promise.all([
            supabase.from('fragrance_notes').select('name, note_type').eq('post_id', post.id),
            supabase.from('post_emotions').select('emotion').eq('post_id', post.id),
            supabase.from('post_occasions').select('occasion').eq('post_id', post.id),
          ]);

          const authorProfile = profilesMap.get(post.author_id);

          return {
            ...post,
            author: authorProfile || {
              display_name: 'Unknown',
              username: 'unknown',
              avatar_url: null,
              expertise_level: 'beginner' as const,
              credibility_score: 0,
            },
            notes: notesRes.data || [],
            emotions: (emotionsRes.data || []).map((e: { emotion: string }) => e.emotion),
            occasions: (occasionsRes.data || []).map((o: { occasion: string }) => o.occasion),
          };
        })
      );

      // Apply client-side filters for notes and emotions (requires post enrichment first)
      let filteredPosts = enrichedPosts;
      
      if (filters.notes.length > 0) {
        filteredPosts = filteredPosts.filter(post =>
          filters.notes.some(note =>
            post.notes.some(n => n.name.toLowerCase().includes(note.toLowerCase()))
          )
        );
      }

      if (filters.emotions.length > 0) {
        filteredPosts = filteredPosts.filter(post =>
          filters.emotions.some(emotion =>
            post.emotions.some(e => e.toLowerCase().includes(emotion.toLowerCase()))
          )
        );
      }

      // Filter out hidden posts
      if (hiddenPostIds.length > 0) {
        filteredPosts = filteredPosts.filter(post => !hiddenPostIds.includes(post.id));
      }

      setPosts(filteredPosts as PostWithAuthor[]);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuggestedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, display_name, username, avatar_url, expertise_level, credibility_score')
        .order('credibility_score', { ascending: false })
        .limit(5);

      if (error) throw error;
      
      // Filter out current user if logged in
      const filtered = user 
        ? (data || []).filter((u: SuggestedUser) => u.user_id !== user.id)
        : data || [];
      
      setSuggestedUsers(filtered as SuggestedUser[]);
    } catch (error) {
      console.error('Error fetching suggested users:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  // Transform post data for FragranceCard
  const transformPostForCard = (post: PostWithAuthor) => ({
    id: post.id,
    authorId: post.author_id,
    author: {
      id: post.author_id,
      email: '',
      displayName: post.author?.display_name || 'Unknown',
      username: post.author?.username || 'unknown',
      avatarUrl: post.author?.avatar_url || undefined,
      expertiseLevel: post.author?.expertise_level || 'beginner',
      credibilityScore: post.author?.credibility_score || 0,
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
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-8 space-y-6">
            {/* Search & Filters */}
            <SearchFilters filters={filters} onFiltersChange={setFilters} />

            {/* Feed Tabs */}
            <Tabs value={feedType} onValueChange={(v) => setFeedType(v as FeedType)}>
              <TabsList className="grid w-full grid-cols-3 bg-card border border-border">
                <TabsTrigger value="for-you" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden sm:inline">For You</span>
                </TabsTrigger>
                <TabsTrigger value="learning" className="gap-2">
                  <GraduationCap className="h-4 w-4" />
                  <span className="hidden sm:inline">Learning</span>
                </TabsTrigger>
                <TabsTrigger value="trending" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Trending</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Posts */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : posts.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {posts.map((post) => (
                  <FragranceCard
                    key={post.id}
                    post={transformPostForCard(post)}
                    onDelete={(postId) => setPosts(prev => prev.filter(p => p.id !== postId))}
                    onHide={(postId) => setPosts(prev => prev.filter(p => p.id !== postId))}
                  />
                ))}
              </div>
            ) : (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No posts yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Be the first to share your fragrance experience!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Suggested Users */}
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Suggested for You
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {suggestedUsers.length > 0 ? (
                  suggestedUsers.map((suggestedUser) => (
                    <div key={suggestedUser.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={suggestedUser.avatar_url || undefined} />
                          <AvatarFallback className="bg-secondary text-secondary-foreground">
                            {getInitials(suggestedUser.display_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{suggestedUser.display_name}</p>
                          <div className="flex items-center gap-1.5">
                            <Badge variant={suggestedUser.expertise_level} className="text-[10px] px-1.5 py-0">
                              {suggestedUser.expertise_level}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {suggestedUser.credibility_score}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Follow
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No suggestions yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Trending Topics */}
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Trending Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {['Oud', 'Ambroxan', 'Iris', 'Saffron', 'Vetiver', 'Tonka Bean', 'Rose', 'Sandalwood'].map((note) => (
                    <Badge key={note} variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                      {note}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sustainability Tip */}
            <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🌿</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-emerald-900 mb-1">Sustainability Tip</h4>
                    <p className="text-sm text-emerald-700">
                      Many luxury houses now offer refill programs. Ask your favorite brands about refillable bottles to reduce waste.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
