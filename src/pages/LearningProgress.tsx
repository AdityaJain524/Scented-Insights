import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  GraduationCap, 
  Trophy, 
  Target,
  CheckCircle2,
  PlayCircle,
  Leaf,
  Layers,
  History,
  Sparkles
} from 'lucide-react';

interface LearningPath {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'explorer' | 'enthusiast' | 'expert';
  estimated_hours: number;
  category: string;
}

interface UserProgress {
  path_id: string;
  completed_modules: string[];
  completed_at: string | null;
  started_at: string;
}

interface ModuleCount {
  path_id: string;
  count: number;
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

export default function LearningProgress() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [moduleCounts, setModuleCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (user) {
      fetchProgressData();
    }
  }, [user, isAuthenticated]);

  const fetchProgressData = async () => {
    if (!user) return;

    try {
      // Fetch user progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_learning_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });

      if (progressError) throw progressError;
      setUserProgress(progressData || []);

      // Get path IDs that user has started
      const pathIds = (progressData || []).map(p => p.path_id);
      
      if (pathIds.length > 0) {
        // Fetch learning paths
        const { data: pathsData, error: pathsError } = await supabase
          .from('learning_paths')
          .select('*')
          .in('id', pathIds);

        if (pathsError) throw pathsError;
        setPaths(pathsData || []);

        // Fetch module counts per path
        const { data: modulesData, error: modulesError } = await supabase
          .from('learning_modules')
          .select('path_id')
          .in('path_id', pathIds);

        if (modulesError) throw modulesError;

        const counts: Record<string, number> = {};
        (modulesData || []).forEach(m => {
          counts[m.path_id] = (counts[m.path_id] || 0) + 1;
        });
        setModuleCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPathById = (pathId: string) => paths.find(p => p.id === pathId);

  const getProgressPercent = (progress: UserProgress) => {
    const totalModules = moduleCounts[progress.path_id] || 5;
    if (progress.completed_at) return 100;
    return Math.round((progress.completed_modules?.length || 0) / totalModules * 100);
  };

  // Calculate stats
  const completedPaths = userProgress.filter(p => p.completed_at).length;
  const inProgressPaths = userProgress.filter(p => !p.completed_at).length;
  const totalModulesCompleted = userProgress.reduce((sum, p) => sum + (p.completed_modules?.length || 0), 0);
  const totalHoursLearned = paths
    .filter(p => userProgress.some(up => up.path_id === p.id && up.completed_at))
    .reduce((sum, p) => sum + p.estimated_hours, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6 px-4 max-w-6xl">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 rounded-xl" />
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
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/learn')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Learning Paths
        </Button>

        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-3">
            <Target className="h-8 w-8 text-primary" />
            My Learning Progress
          </h1>
          <p className="text-muted-foreground">
            Track your journey through fragrance education
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                  <Trophy className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedPaths}</p>
                  <p className="text-xs text-muted-foreground">Paths Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <PlayCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{inProgressPaths}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalModulesCompleted}</p>
                  <p className="text-xs text-muted-foreground">Modules Done</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalHoursLearned}h</p>
                  <p className="text-xs text-muted-foreground">Hours Learned</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress List */}
        {userProgress.length > 0 ? (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold">Your Learning Paths</h2>
            
            {userProgress.map((progress) => {
              const path = getPathById(progress.path_id);
              if (!path) return null;
              
              const percent = getProgressPercent(progress);
              const isCompleted = progress.completed_at !== null;
              const totalModules = moduleCounts[progress.path_id] || 5;
              const completedModules = progress.completed_modules?.length || 0;

              return (
                <Card key={progress.path_id} className="glass-card hover-lift">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-3 rounded-full bg-primary/10">
                          {categoryIcons[path.category] || <BookOpen className="h-6 w-6 text-primary" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{path.title}</h3>
                            <Badge className={difficultyColors[path.difficulty]}>
                              {path.difficulty}
                            </Badge>
                            {isCompleted && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {completedModules} of {totalModules} modules completed
                          </p>
                          <Progress value={percent} className="h-2" />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-primary">{percent}%</span>
                        <Button 
                          onClick={() => navigate(`/learn/${progress.path_id}`)}
                          variant={isCompleted ? 'outline' : 'default'}
                        >
                          {isCompleted ? 'Review' : 'Continue'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No learning paths started yet</h3>
              <p className="text-muted-foreground mb-4">
                Begin your fragrance education journey today!
              </p>
              <Button onClick={() => navigate('/learn')} variant="hero">
                Explore Learning Paths
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
