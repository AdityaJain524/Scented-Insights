import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Clock, GraduationCap, Leaf, Layers, History, Sparkles, Search, BarChart3 } from 'lucide-react';

interface LearningPath {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'explorer' | 'enthusiast' | 'expert';
  estimated_hours: number;
  cover_image_url: string | null;
  category: string;
}

interface UserProgress {
  path_id: string;
  completed_modules: string[];
  completed_at: string | null;
}

const categoryIcons: Record<string, React.ReactNode> = {
  'note-families': <Sparkles className="h-5 w-5" />,
  'ingredients': <Layers className="h-5 w-5" />,
  'sustainability': <Leaf className="h-5 w-5" />,
  'layering': <Layers className="h-5 w-5" />,
  'history': <History className="h-5 w-5" />,
};

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  explorer: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  enthusiast: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  expert: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
};

const categoryMap: Record<string, string> = {
  'all': 'All Paths',
  'note-families': 'Note Families',
  'ingredients': 'Ingredients',
  'sustainability': 'Sustainability',
  'layering': 'Layering',
  'history': 'History',
};

export default function LearningPaths() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchLearningPaths();
    if (user) {
      fetchUserProgress();
    }
  }, [user]);

  const fetchLearningPaths = async () => {
    try {
      const { data, error } = await supabase
        .from('learning_paths')
        .select('*')
        .order('difficulty', { ascending: true });

      if (error) throw error;
      setPaths(data || []);
    } catch (error) {
      console.error('Error fetching learning paths:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserProgress = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_learning_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const progressMap: Record<string, UserProgress> = {};
      (data || []).forEach(p => {
        progressMap[p.path_id] = p;
      });
      setUserProgress(progressMap);
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  };

  const startPath = async (pathId: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_learning_progress')
        .upsert({
          user_id: user!.id,
          path_id: pathId,
        }, { onConflict: 'user_id,path_id' });

      if (error) throw error;
      navigate(`/learn/${pathId}`);
    } catch (error) {
      console.error('Error starting path:', error);
    }
  };

  const getProgressPercent = (pathId: string, totalModules: number = 5) => {
    const progress = userProgress[pathId];
    if (!progress) return 0;
    if (progress.completed_at) return 100;
    return Math.round((progress.completed_modules?.length || 0) / totalModules * 100);
  };

  const filteredPaths = useMemo(() => {
    return paths.filter(path => {
      const matchesSearch = searchQuery === '' || 
        path.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        path.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || path.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [paths, searchQuery, selectedCategory]);

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
            {[1, 2, 3].map(i => (
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
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-primary" />
              Learning Paths
            </h1>
            <p className="text-muted-foreground">
              Master the art of fragrance with our curated learning journeys
            </p>
          </div>
          {isAuthenticated && (
            <Button variant="outline" asChild>
              <Link to="/learn/progress">
                <BarChart3 className="h-4 w-4 mr-2" />
                My Progress
              </Link>
            </Button>
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search learning paths..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(categoryMap).map(([key, label]) => (
              <Badge
                key={key}
                variant={selectedCategory === key ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => setSelectedCategory(key)}
              >
                {key !== 'all' && categoryIcons[key] && (
                  <span className="mr-1">{categoryIcons[key]}</span>
                )}
                {label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Learning Paths Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPaths.map((path) => {
            const progress = getProgressPercent(path.id);
            const isStarted = userProgress[path.id] !== undefined;
            const isCompleted = userProgress[path.id]?.completed_at !== null;

            return (
              <Card key={path.id} className="glass-card hover-lift overflow-hidden">
                <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <div className="p-4 rounded-full bg-background/80">
                    {categoryIcons[path.category] || <BookOpen className="h-8 w-8 text-primary" />}
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-2">{path.title}</CardTitle>
                    <Badge className={difficultyColors[path.difficulty]}>
                      {path.difficulty}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{path.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {path.estimated_hours}h
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      5 modules
                    </span>
                  </div>

                  {isStarted && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  <Button
                    onClick={() => startPath(path.id)}
                    variant={isCompleted ? 'outline' : isStarted ? 'secondary' : 'hero'}
                    className="w-full"
                  >
                    {isCompleted ? 'Review' : isStarted ? 'Continue' : 'Start Learning'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredPaths.length === 0 && paths.length > 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No matching paths found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}

        {paths.length === 0 && (
          <div className="text-center py-12">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No learning paths available yet</h3>
            <p className="text-muted-foreground">Check back soon for new content!</p>
          </div>
        )}
      </main>
    </div>
  );
}
