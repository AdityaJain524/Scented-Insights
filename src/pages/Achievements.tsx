import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAchievements } from '@/hooks/useAchievements';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Trophy, Lock, Share2, Flame } from 'lucide-react';

export default function Achievements() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const {
    achievements,
    allAchievements,
    isLoading,
    currentStreak,
    longestStreak,
    checkAndAwardAchievements,
    shareAchievement,
  } = useAchievements();

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    checkAndAwardAchievements();
  }, [isAuthenticated]);

  const isEarned = (type: string) => achievements.some(a => a.achievement_type === type);
  const getEarnedDate = (type: string) => {
    const a = achievements.find(a => a.achievement_type === type);
    return a ? new Date(a.earned_at).toLocaleDateString() : null;
  };
  const getAchievement = (type: string) => achievements.find(a => a.achievement_type === type);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            Achievements
          </h1>
          <p className="text-muted-foreground">
            {achievements.length} of {allAchievements.length} unlocked
          </p>
        </div>

        {/* Streak Card */}
        <Card className="glass-card mb-8 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                  <Flame className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-bold">{currentStreak}-Day Streak</h3>
                  <p className="text-sm text-muted-foreground">
                    Longest streak: {longestStreak} days
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Keep learning daily!</p>
                <div className="flex gap-1 mt-1">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-3 w-3 rounded-full ${
                        i < currentStreak ? 'bg-orange-500' : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allAchievements.map((def) => {
            const earned = isEarned(def.type);
            const date = getEarnedDate(def.type);
            const achievementData = getAchievement(def.type);

            return (
              <Card
                key={def.type}
                className={`transition-all ${earned ? 'glass-card hover-lift border-primary/30' : 'opacity-60 grayscale'}`}
              >
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl mb-3">{earned ? def.icon : '🔒'}</div>
                  <h3 className="font-semibold mb-1">{def.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{def.description}</p>
                  {earned ? (
                    <div className="flex flex-col items-center gap-2">
                      <Badge variant="default" className="text-xs">
                        Earned {date}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => shareAchievement(achievementData || def)}
                      >
                        <Share2 className="h-3 w-3" />
                        Share
                      </Button>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      <Lock className="h-3 w-3 mr-1" />
                      Locked
                    </Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
