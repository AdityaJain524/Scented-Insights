import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Sparkles, 
  Heart, 
  TrendingUp, 
  Users, 
  Star,
  Clock,
  Bookmark,
  ThumbsUp,
  RefreshCw
} from 'lucide-react';

interface RecommendedFragrance {
  id: string;
  fragrance_name: string;
  brand_name: string | null;
  content: string;
  likes_count: number;
  helpful_count: number;
  author_name: string;
  reason: string;
  match_score: number;
}

interface UserPreferences {
  fragranceFamilies: string[];
  occasions: string[];
  sustainability: boolean;
  expertiseLevel: string;
}

export default function Recommendations() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<RecommendedFragrance[]>([]);
  const [trendingFragrances, setTrendingFragrances] = useState<RecommendedFragrance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);

  useEffect(() => {
    loadRecommendations();
  }, [user]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      // Fetch user preferences if authenticated
      if (user) {
        const [profileRes, interestsRes] = await Promise.all([
          supabase.from('profiles').select('expertise_level, interested_in_sustainability').eq('user_id', user.id).single(),
          supabase.from('user_interests').select('interest_type, interest_value').eq('user_id', user.id)
        ]);

        if (profileRes.data) {
          const families = interestsRes.data?.filter(i => i.interest_type === 'fragrance_family').map(i => i.interest_value) || [];
          const occasions = interestsRes.data?.filter(i => i.interest_type === 'occasion').map(i => i.interest_value) || [];
          
          setUserPreferences({
            fragranceFamilies: families,
            occasions: occasions,
            sustainability: profileRes.data.interested_in_sustainability || false,
            expertiseLevel: profileRes.data.expertise_level || 'beginner'
          });
        }
      }

      // Fetch personalized recommendations based on user interactions
      const { data: postsData } = await supabase
        .from('fragrance_posts')
        .select(`
          id,
          fragrance_name,
          brand_name,
          content,
          likes_count,
          helpful_count,
          author_id
        `)
        .order('likes_count', { ascending: false })
        .limit(20);

      // Fetch author names
      const authorIds = [...new Set(postsData?.map(p => p.author_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', authorIds);

      const profileMap = new Map(profilesData?.map(p => [p.user_id, p.display_name]) || []);

      // Generate personalized recommendations with scoring
      const scoredPosts = (postsData || []).map(post => {
        let score = 50; // Base score
        let reason = 'Popular in the community';

        // Boost by engagement
        score += Math.min((post.likes_count || 0) * 2, 20);
        score += Math.min((post.helpful_count || 0) * 5, 25);

        // If we have user preferences, personalize
        if (userPreferences) {
          if (userPreferences.sustainability && post.content?.toLowerCase().includes('sustainable')) {
            score += 15;
            reason = 'Matches your sustainability interest';
          }
          
          // Check for fragrance family matches
          const contentLower = post.content?.toLowerCase() || '';
          for (const family of userPreferences.fragranceFamilies) {
            if (contentLower.includes(family.toLowerCase())) {
              score += 10;
              reason = `Matches your ${family} preference`;
              break;
            }
          }
        }

        return {
          id: post.id,
          fragrance_name: post.fragrance_name,
          brand_name: post.brand_name,
          content: post.content,
          likes_count: post.likes_count || 0,
          helpful_count: post.helpful_count || 0,
          author_name: profileMap.get(post.author_id) || 'Anonymous',
          reason,
          match_score: Math.min(score, 100)
        };
      });

      // Sort by score and take top recommendations
      scoredPosts.sort((a, b) => b.match_score - a.match_score);
      setRecommendations(scoredPosts.slice(0, 6));

      // Trending (most recent with good engagement)
      const { data: trendingData } = await supabase
        .from('fragrance_posts')
        .select(`
          id,
          fragrance_name,
          brand_name,
          content,
          likes_count,
          helpful_count,
          author_id
        `)
        .order('created_at', { ascending: false })
        .gte('likes_count', 1)
        .limit(6);

      const trendingScored = (trendingData || []).map(post => ({
        id: post.id,
        fragrance_name: post.fragrance_name,
        brand_name: post.brand_name,
        content: post.content,
        likes_count: post.likes_count || 0,
        helpful_count: post.helpful_count || 0,
        author_name: profileMap.get(post.author_id) || 'Anonymous',
        reason: 'Trending now',
        match_score: 70 + Math.min((post.likes_count || 0), 30)
      }));

      setTrendingFragrances(trendingScored);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6 px-4 max-w-6xl">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6 px-4 max-w-6xl">
        {/* Hero Section */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-primary" />
              For You
            </h1>
            <p className="text-muted-foreground">
              {isAuthenticated 
                ? 'Personalized recommendations based on your preferences and activity'
                : 'Discover popular fragrances loved by our community'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadRecommendations}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* User Preferences Summary */}
        {isAuthenticated && userPreferences && (
          <Card className="glass-card mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="h-5 w-5 text-primary" />
                <span className="font-medium">Your Preferences</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {userPreferences.fragranceFamilies.length > 0 ? (
                  userPreferences.fragranceFamilies.map((family, i) => (
                    <Badge key={i} variant="secondary">{family}</Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No fragrance families selected</span>
                )}
                {userPreferences.sustainability && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    🌱 Sustainability
                  </Badge>
                )}
                <Badge variant="outline">{userPreferences.expertiseLevel}</Badge>
              </div>
              {userPreferences.fragranceFamilies.length === 0 && (
                <Button 
                  variant="link" 
                  className="px-0 mt-2 h-auto"
                  onClick={() => navigate('/profile/edit')}
                >
                  Complete your preferences for better recommendations →
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Personalized Recommendations */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-amber-500" />
            <h2 className="text-xl font-semibold">Recommended for You</h2>
          </div>

          {recommendations.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((fragrance) => (
                <Card key={fragrance.id} className="glass-card hover-lift cursor-pointer" onClick={() => navigate('/feed')}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg line-clamp-1">{fragrance.fragrance_name}</CardTitle>
                        {fragrance.brand_name && (
                          <CardDescription>{fragrance.brand_name}</CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        <Star className="h-3 w-3" />
                        {fragrance.match_score}%
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {fragrance.content}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {fragrance.likes_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        {fragrance.helpful_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {fragrance.author_name}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {fragrance.reason}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No recommendations yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start exploring and interacting with posts to get personalized recommendations
                </p>
                <Button onClick={() => navigate('/feed')}>
                  Explore Feed
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Trending Now */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <h2 className="text-xl font-semibold">Trending Now</h2>
          </div>

          {trendingFragrances.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingFragrances.map((fragrance) => (
                <Card key={fragrance.id} className="glass-card hover-lift cursor-pointer" onClick={() => navigate('/feed')}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg line-clamp-1">{fragrance.fragrance_name}</CardTitle>
                        {fragrance.brand_name && (
                          <CardDescription>{fragrance.brand_name}</CardDescription>
                        )}
                      </div>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {fragrance.content}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {fragrance.likes_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Recent
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="glass-card">
              <CardContent className="py-8 text-center">
                <TrendingUp className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">No trending fragrances yet</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* CTA for non-authenticated users */}
        {!isAuthenticated && (
          <Card className="glass-card mt-12 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="py-8 text-center">
              <Sparkles className="h-10 w-10 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Get Personalized Recommendations</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Sign up to unlock AI-powered recommendations based on your fragrance preferences and interactions
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate('/signup')}>
                  Create Account
                </Button>
                <Button variant="outline" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
