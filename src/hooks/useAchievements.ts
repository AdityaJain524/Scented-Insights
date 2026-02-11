import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Achievement {
  id: string;
  achievement_type: string;
  name: string;
  description: string | null;
  icon: string | null;
  earned_at: string;
}

const ACHIEVEMENT_DEFINITIONS = [
  { type: 'first_module', name: 'First Steps', description: 'Complete your first learning module', icon: '🎯' },
  { type: 'five_modules', name: 'Eager Learner', description: 'Complete 5 learning modules', icon: '📚' },
  { type: 'ten_modules', name: 'Knowledge Seeker', description: 'Complete 10 learning modules', icon: '🧠' },
  { type: 'twenty_modules', name: 'Scholar', description: 'Complete 20 learning modules', icon: '🎓' },
  { type: 'first_path', name: 'Path Finder', description: 'Complete your first learning path', icon: '🏆' },
  { type: 'three_paths', name: 'Multi-Disciplinary', description: 'Complete 3 learning paths', icon: '⭐' },
  { type: 'all_paths', name: 'Grand Master', description: 'Complete all learning paths', icon: '👑' },
  { type: 'perfect_quiz', name: 'Perfect Score', description: 'Get 100% on a quiz', icon: '💯' },
  { type: 'five_perfect', name: 'Quiz Whiz', description: 'Get perfect scores on 5 quizzes', icon: '🌟' },
  { type: 'streak_3', name: '3-Day Streak', description: 'Learn for 3 consecutive days', icon: '🔥' },
  { type: 'streak_7', name: 'Week Warrior', description: 'Learn for 7 consecutive days', icon: '💪' },
  { type: 'sustainability_path', name: 'Eco Champion', description: 'Complete the Sustainability path', icon: '🌿' },
];

export function useAchievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  const fetchAchievements = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('learning_achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      setAchievements((data || []) as Achievement[]);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchStreak = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('learning_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setCurrentStreak(data.current_streak);
        setLongestStreak(data.longest_streak);
      }
    } catch (error) {
      console.error('Error fetching streak:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchAchievements();
    fetchStreak();
  }, [fetchAchievements, fetchStreak]);

  const awardAchievement = useCallback(async (type: string) => {
    if (!user) return;
    const def = ACHIEVEMENT_DEFINITIONS.find(d => d.type === type);
    if (!def) return;

    // Check if already earned
    if (achievements.some(a => a.achievement_type === type)) return;

    try {
      const { error } = await supabase
        .from('learning_achievements')
        .insert({
          user_id: user.id,
          achievement_type: type,
          name: def.name,
          description: def.description,
          icon: def.icon,
        });

      if (error) {
        if (error.code === '23505') return; // duplicate
        throw error;
      }

      toast({
        title: `🏆 Achievement Unlocked!`,
        description: `${def.icon} ${def.name} — ${def.description}`,
      });

      fetchAchievements();
    } catch (error) {
      console.error('Error awarding achievement:', error);
    }
  }, [user, achievements, fetchAchievements]);

  const recordLearningActivity = useCallback(async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: existing } = await supabase
        .from('learning_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existing) {
        // First activity ever
        await supabase.from('learning_streaks').insert({
          user_id: user.id,
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: today,
        });
        setCurrentStreak(1);
        setLongestStreak(1);
        return;
      }

      if (existing.last_activity_date === today) return; // Already recorded today

      const lastDate = new Date(existing.last_activity_date);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      let newStreak = 1;
      if (diffDays === 1) {
        newStreak = existing.current_streak + 1;
      }

      const newLongest = Math.max(existing.longest_streak, newStreak);

      await supabase
        .from('learning_streaks')
        .update({
          current_streak: newStreak,
          longest_streak: newLongest,
          last_activity_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      setCurrentStreak(newStreak);
      setLongestStreak(newLongest);

      // Check streak achievements
      if (newStreak >= 3) await awardAchievement('streak_3');
      if (newStreak >= 7) await awardAchievement('streak_7');

      if (newStreak > 1) {
        toast({
          title: `🔥 ${newStreak}-Day Streak!`,
          description: 'Keep learning every day to grow your streak!',
        });
      }
    } catch (error) {
      console.error('Error recording learning activity:', error);
    }
  }, [user, awardAchievement]);

  const checkAndAwardAchievements = useCallback(async () => {
    if (!user) return;

    try {
      // Get user progress
      const { data: progress } = await supabase
        .from('user_learning_progress')
        .select('*')
        .eq('user_id', user.id);

      if (!progress) return;

      const totalModulesCompleted = progress.reduce(
        (sum, p) => sum + (p.completed_modules?.length || 0), 0
      );
      const completedPaths = progress.filter(p => p.completed_at).length;

      // Module milestones
      if (totalModulesCompleted >= 1) await awardAchievement('first_module');
      if (totalModulesCompleted >= 5) await awardAchievement('five_modules');
      if (totalModulesCompleted >= 10) await awardAchievement('ten_modules');
      if (totalModulesCompleted >= 20) await awardAchievement('twenty_modules');

      // Path milestones
      if (completedPaths >= 1) await awardAchievement('first_path');
      if (completedPaths >= 3) await awardAchievement('three_paths');

      // Check total paths
      const { count } = await supabase
        .from('learning_paths')
        .select('*', { count: 'exact', head: true });
      if (count && completedPaths >= count) await awardAchievement('all_paths');

      // Quiz scores
      const allScores: number[] = [];
      progress.forEach(p => {
        if (p.quiz_scores && typeof p.quiz_scores === 'object') {
          Object.values(p.quiz_scores as Record<string, number>).forEach(s => allScores.push(s));
        }
      });
      const perfectScores = allScores.filter(s => s === 100).length;
      if (perfectScores >= 1) await awardAchievement('perfect_quiz');
      if (perfectScores >= 5) await awardAchievement('five_perfect');

    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  }, [user, awardAchievement]);

  const shareAchievement = (achievement: Achievement | { type: string; name: string; description: string; icon: string }) => {
    const name = 'name' in achievement ? achievement.name : '';
    const icon = 'icon' in achievement ? achievement.icon : '';
    const description = 'description' in achievement ? achievement.description : '';

    const text = `${icon} I just earned the "${name}" achievement on ScentVerse! ${description}`;

    if (navigator.share) {
      navigator.share({
        title: `ScentVerse Achievement: ${name}`,
        text,
        url: window.location.origin + '/achievements',
      }).catch(() => {
        // Fallback to clipboard
        copyToClipboard(text);
      });
    } else {
      copyToClipboard(text);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: 'Copied to clipboard!',
        description: 'Share your achievement with friends.',
      });
    });
  };

  return {
    achievements,
    allAchievements: ACHIEVEMENT_DEFINITIONS,
    isLoading,
    currentStreak,
    longestStreak,
    checkAndAwardAchievements,
    awardAchievement,
    recordLearningActivity,
    shareAchievement,
  };
}
