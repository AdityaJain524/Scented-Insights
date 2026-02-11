import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, OnboardingData } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { expertiseLevels, fragranceFamilies, occasions } from '@/data/mockData';
import { Check, ArrowRight, ArrowLeft, Sparkles, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type Step = 'expertise' | 'families' | 'occasions' | 'sustainability';
type ExpertiseLevel = 'beginner' | 'explorer' | 'enthusiast' | 'expert';

export default function Onboarding() {
  const [step, setStep] = useState<Step>('expertise');
  const [data, setData] = useState<OnboardingData>({
    expertiseLevel: null,
    fragranceFamilies: [],
    occasions: [],
    sustainability: false,
    preferredLanguage: 'en',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { completeOnboarding, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const steps: Step[] = ['expertise', 'families', 'occasions', 'sustainability'];
  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const canContinue = () => {
    switch (step) {
      case 'expertise':
        return data.expertiseLevel !== null;
      case 'families':
        return data.fragranceFamilies.length > 0;
      case 'occasions':
        return data.occasions.length > 0;
      case 'sustainability':
        return true;
    }
  };

  const handleNext = async () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    } else {
      // Complete onboarding
      setIsSubmitting(true);
      try {
        await completeOnboarding(data);
        toast({
          title: 'Profile complete!',
          description: 'Welcome to ScentVerse. Start exploring!',
        });
        navigate('/feed');
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Could not save preferences. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    }
  };

  const toggleFamily = (family: string) => {
    setData(prev => ({
      ...prev,
      fragranceFamilies: prev.fragranceFamilies.includes(family)
        ? prev.fragranceFamilies.filter(f => f !== family)
        : [...prev.fragranceFamilies, family],
    }));
  };

  const toggleOccasion = (occasion: string) => {
    setData(prev => ({
      ...prev,
      occasions: prev.occasions.includes(occasion)
        ? prev.occasions.filter(o => o !== occasion)
        : [...prev.occasions, occasion],
    }));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-cream-dark/30 to-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Step {currentStepIndex + 1} of {steps.length}
          </p>
        </div>

        <Card className="glass-card animate-fade-in">
          {step === 'expertise' && (
            <>
              <CardHeader className="text-center">
                <CardTitle className="font-display text-2xl">What's your fragrance experience?</CardTitle>
                <CardDescription>This helps us personalize your learning journey</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {expertiseLevels.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setData({ ...data, expertiseLevel: level.id as ExpertiseLevel })}
                    className={cn(
                      'p-4 rounded-xl border-2 text-left transition-all hover-lift',
                      data.expertiseLevel === level.id
                        ? 'border-primary bg-primary/5 shadow-amber'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{level.icon}</span>
                      <span className="font-semibold">{level.name}</span>
                      {data.expertiseLevel === level.id && (
                        <Check className="h-5 w-5 text-primary ml-auto" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{level.description}</p>
                  </button>
                ))}
              </CardContent>
            </>
          )}

          {step === 'families' && (
            <>
              <CardHeader className="text-center">
                <CardTitle className="font-display text-2xl">Which scent families interest you?</CardTitle>
                <CardDescription>Select all that appeal to you</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {fragranceFamilies.map((family) => (
                  <button
                    key={family.id}
                    onClick={() => toggleFamily(family.id)}
                    className={cn(
                      'p-4 rounded-xl border-2 text-left transition-all hover-lift',
                      data.fragranceFamilies.includes(family.id)
                        ? 'border-primary bg-primary/5 shadow-amber'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{family.emoji}</span>
                      <span className="font-semibold">{family.name}</span>
                      {data.fragranceFamilies.includes(family.id) && (
                        <Check className="h-5 w-5 text-primary ml-auto" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{family.description}</p>
                  </button>
                ))}
              </CardContent>
            </>
          )}

          {step === 'occasions' && (
            <>
              <CardHeader className="text-center">
                <CardTitle className="font-display text-2xl">When do you wear fragrance?</CardTitle>
                <CardDescription>Select your most common occasions</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3 justify-center">
                {occasions.map((occasion) => (
                  <button
                    key={occasion.id}
                    onClick={() => toggleOccasion(occasion.id)}
                    className={cn(
                      'px-4 py-3 rounded-xl border-2 transition-all hover-lift inline-flex items-center gap-2',
                      data.occasions.includes(occasion.id)
                        ? 'border-primary bg-primary/5 shadow-amber'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <span className="text-lg">{occasion.emoji}</span>
                    <span className="font-medium">{occasion.name}</span>
                    {data.occasions.includes(occasion.id) && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </CardContent>
            </>
          )}

          {step === 'sustainability' && (
            <>
              <CardHeader className="text-center">
                <CardTitle className="font-display text-2xl">Care about sustainable perfumery?</CardTitle>
                <CardDescription>Learn about refills, conscious sourcing, and eco-friendly practices</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-6">
                <div className="flex gap-4">
                  <button
                    onClick={() => setData({ ...data, sustainability: true })}
                    className={cn(
                      'p-6 rounded-xl border-2 transition-all hover-lift flex flex-col items-center gap-3',
                      data.sustainability
                        ? 'border-emerald-500 bg-emerald-50 shadow-lg'
                        : 'border-border hover:border-emerald-300'
                    )}
                  >
                    <Leaf className={cn('h-12 w-12', data.sustainability ? 'text-emerald-600' : 'text-muted-foreground')} />
                    <span className="font-semibold">Yes, I'm interested</span>
                  </button>
                  <button
                    onClick={() => setData({ ...data, sustainability: false })}
                    className={cn(
                      'p-6 rounded-xl border-2 transition-all hover-lift flex flex-col items-center gap-3',
                      !data.sustainability
                        ? 'border-primary bg-primary/5 shadow-amber'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <Sparkles className={cn('h-12 w-12', !data.sustainability ? 'text-primary' : 'text-muted-foreground')} />
                    <span className="font-semibold">Maybe later</span>
                  </button>
                </div>
              </CardContent>
            </>
          )}

          <div className="flex justify-between p-6 pt-0">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStepIndex === 0}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              variant="hero"
              onClick={handleNext}
              disabled={!canContinue() || isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? 'Saving...' : currentStepIndex === steps.length - 1 ? 'Complete' : 'Continue'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
