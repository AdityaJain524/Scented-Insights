import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAchievements } from '@/hooks/useAchievements';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  BookOpen,
  GraduationCap,
  Trophy
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface LearningModule {
  id: string;
  title: string;
  content: string;
  order_index: number;
  quiz_questions: QuizQuestion[] | null;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface LearningPath {
  id: string;
  title: string;
  difficulty: string;
}

export default function LearningModule() {
  const { pathId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { recordLearningActivity } = useAchievements();
  
  const [path, setPath] = useState<LearningPath | null>(null);
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  useEffect(() => {
    if (pathId) {
      loadPathAndModules();
    }
  }, [pathId, user]);

  const loadPathAndModules = async () => {
    try {
      // Fetch path info
      const { data: pathData, error: pathError } = await supabase
        .from('learning_paths')
        .select('id, title, difficulty')
        .eq('id', pathId)
        .single();

      if (pathError) throw pathError;
      setPath(pathData);

      // Fetch modules
      const { data: modulesData, error: modulesError } = await supabase
        .from('learning_modules')
        .select('*')
        .eq('path_id', pathId)
        .order('order_index', { ascending: true });

      if (modulesError) throw modulesError;
      
      // Parse quiz_questions from JSON
      const parsedModules = (modulesData || []).map(m => ({
        ...m,
        quiz_questions: Array.isArray(m.quiz_questions) ? m.quiz_questions as unknown as QuizQuestion[] : null
      }));
      
      setModules(parsedModules);

      // Fetch user progress if authenticated
      if (user) {
        const { data: progressData } = await supabase
          .from('user_learning_progress')
          .select('completed_modules, current_module_id')
          .eq('user_id', user.id)
          .eq('path_id', pathId)
          .single();

        if (progressData?.completed_modules) {
          setCompletedModules(new Set(progressData.completed_modules));
        }

        // Set current module based on progress
        if (progressData?.current_module_id && parsedModules.length > 0) {
          const currentIdx = parsedModules.findIndex(m => m.id === progressData.current_module_id);
          if (currentIdx >= 0) {
            setCurrentModuleIndex(currentIdx);
          }
        }
      }
    } catch (error) {
      console.error('Error loading learning path:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentModule = modules[currentModuleIndex];
  const progressPercent = modules.length > 0 
    ? Math.round((completedModules.size / modules.length) * 100) 
    : 0;

  const markModuleComplete = async () => {
    if (!currentModule || !user) return;

    const newCompleted = new Set(completedModules);
    newCompleted.add(currentModule.id);
    
    // Record learning activity for streak tracking
    recordLearningActivity();
    setCompletedModules(newCompleted);

    try {
      const completedArray = Array.from(newCompleted);
      const isPathComplete = completedArray.length === modules.length;

      await supabase
        .from('user_learning_progress')
        .upsert({
          user_id: user.id,
          path_id: pathId,
          completed_modules: completedArray,
          current_module_id: currentModule.id,
          completed_at: isPathComplete ? new Date().toISOString() : null
        }, { onConflict: 'user_id,path_id' });
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleQuizSubmit = () => {
    if (!currentModule?.quiz_questions) return;

    let correct = 0;
    currentModule.quiz_questions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctAnswer) {
        correct++;
      }
    });

    setQuizScore(correct);
    setQuizSubmitted(true);

    // Mark as complete if passed (70%+)
    if (correct / currentModule.quiz_questions.length >= 0.7) {
      markModuleComplete();
    }
  };

  const goToNextModule = () => {
    if (currentModuleIndex < modules.length - 1) {
      setCurrentModuleIndex(prev => prev + 1);
      setShowQuiz(false);
      setQuizAnswers({});
      setQuizSubmitted(false);
    }
  };

  const goToPrevModule = () => {
    if (currentModuleIndex > 0) {
      setCurrentModuleIndex(prev => prev - 1);
      setShowQuiz(false);
      setQuizAnswers({});
      setQuizSubmitted(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6 px-4 max-w-4xl">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-full mb-8" />
          <Skeleton className="h-96 rounded-xl" />
        </main>
      </div>
    );
  }

  if (!path || modules.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6 px-4 max-w-4xl">
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No content available</h3>
              <p className="text-muted-foreground mb-4">
                This learning path doesn't have any modules yet.
              </p>
              <Button onClick={() => navigate('/learn')}>
                Back to Learning Paths
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6 px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/learn')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Learning Paths
          </Button>

          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold">{path.title}</h1>
              <p className="text-muted-foreground">
                Module {currentModuleIndex + 1} of {modules.length}
              </p>
            </div>
            <Badge variant="outline">{path.difficulty}</Badge>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </div>

        {/* Module Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {modules.map((module, idx) => (
            <Button
              key={module.id}
              variant={idx === currentModuleIndex ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setCurrentModuleIndex(idx);
                setShowQuiz(false);
                setQuizAnswers({});
                setQuizSubmitted(false);
              }}
              className="flex-shrink-0"
            >
              {completedModules.has(module.id) && (
                <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
              )}
              {idx + 1}
            </Button>
          ))}
        </div>

        {/* Content or Quiz */}
        {!showQuiz ? (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {currentModule.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{currentModule.content}</ReactMarkdown>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Knowledge Check
              </CardTitle>
              <CardDescription>
                Answer these questions to complete this module
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {currentModule.quiz_questions?.map((q, qIdx) => (
                <div key={qIdx} className="space-y-4">
                  <div className="flex items-start gap-2">
                    <span className="font-medium">{qIdx + 1}.</span>
                    <span className="font-medium">{q.question}</span>
                    {quizSubmitted && (
                      quizAnswers[qIdx] === q.correctAnswer ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                      )
                    )}
                  </div>
                  <RadioGroup
                    value={quizAnswers[qIdx]?.toString()}
                    onValueChange={(value) => {
                      if (!quizSubmitted) {
                        setQuizAnswers(prev => ({ ...prev, [qIdx]: parseInt(value) }));
                      }
                    }}
                    disabled={quizSubmitted}
                  >
                    {q.options.map((option, oIdx) => (
                      <div 
                        key={oIdx} 
                        className={`flex items-center space-x-2 p-2 rounded ${
                          quizSubmitted && oIdx === q.correctAnswer 
                            ? 'bg-green-50 dark:bg-green-950/30' 
                            : ''
                        }`}
                      >
                        <RadioGroupItem value={oIdx.toString()} id={`q${qIdx}-o${oIdx}`} />
                        <Label htmlFor={`q${qIdx}-o${oIdx}`}>{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}

              {quizSubmitted ? (
                <div className={`p-4 rounded-lg ${
                  quizScore / (currentModule.quiz_questions?.length || 1) >= 0.7
                    ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800'
                    : 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {quizScore / (currentModule.quiz_questions?.length || 1) >= 0.7 ? (
                      <Trophy className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-amber-600" />
                    )}
                    <span className="font-semibold">
                      Score: {quizScore}/{currentModule.quiz_questions?.length}
                    </span>
                  </div>
                  <p className="text-sm">
                    {quizScore / (currentModule.quiz_questions?.length || 1) >= 0.7
                      ? 'Great job! You passed this module.'
                      : 'You need 70% to pass. Review the content and try again.'}
                  </p>
                </div>
              ) : (
                <Button 
                  onClick={handleQuizSubmit}
                  disabled={Object.keys(quizAnswers).length !== currentModule.quiz_questions?.length}
                  className="w-full"
                >
                  Submit Answers
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={goToPrevModule}
            disabled={currentModuleIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            {!showQuiz && currentModule.quiz_questions && currentModule.quiz_questions.length > 0 && (
              <Button onClick={() => setShowQuiz(true)}>
                Take Quiz
              </Button>
            )}
            
            {!showQuiz && (!currentModule.quiz_questions || currentModule.quiz_questions.length === 0) && (
              <Button onClick={() => {
                markModuleComplete();
                if (currentModuleIndex < modules.length - 1) {
                  goToNextModule();
                }
              }}>
                {currentModuleIndex === modules.length - 1 ? 'Complete Path' : 'Mark Complete & Continue'}
              </Button>
            )}

            {showQuiz && quizSubmitted && quizScore / (currentModule.quiz_questions?.length || 1) >= 0.7 && (
              <Button onClick={goToNextModule} disabled={currentModuleIndex === modules.length - 1}>
                {currentModuleIndex === modules.length - 1 ? 'Path Complete!' : 'Next Module'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {showQuiz && quizSubmitted && quizScore / (currentModule.quiz_questions?.length || 1) < 0.7 && (
              <Button onClick={() => {
                setQuizAnswers({});
                setQuizSubmitted(false);
              }}>
                Try Again
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
