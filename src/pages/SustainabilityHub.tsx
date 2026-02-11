import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Leaf, 
  Recycle, 
  TreePine, 
  Droplets, 
  Award, 
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ExternalLink
} from 'lucide-react';

interface SustainabilityTip {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'ingredients' | 'packaging' | 'usage' | 'brands';
}

interface UserImpact {
  refillsUsed: number;
  sustainableBrands: number;
  tipsFollowed: number;
  carbonSaved: number;
}

const sustainabilityTips: SustainabilityTip[] = [
  {
    id: '1',
    title: 'Choose Refillable Bottles',
    description: 'Opt for fragrances with refill options to reduce glass and packaging waste by up to 70%.',
    impact: 'high',
    category: 'packaging'
  },
  {
    id: '2',
    title: 'Support Biotech Ingredients',
    description: 'Look for fragrances using lab-grown alternatives to endangered natural ingredients like sandalwood and oud.',
    impact: 'high',
    category: 'ingredients'
  },
  {
    id: '3',
    title: 'Apply Smarter, Not More',
    description: 'Apply fragrance to pulse points instead of spraying excessively. One bottle can last much longer with proper application.',
    impact: 'medium',
    category: 'usage'
  },
  {
    id: '4',
    title: 'Research Brand Practices',
    description: 'Before purchasing, check if brands have sustainability certifications like B Corp, Leaping Bunny, or COSMOS.',
    impact: 'high',
    category: 'brands'
  },
  {
    id: '5',
    title: 'Recycle Properly',
    description: 'Separate glass bottles, metal sprayers, and plastic caps before recycling. Many brands offer take-back programs.',
    impact: 'medium',
    category: 'packaging'
  },
  {
    id: '6',
    title: 'Choose Concentrated Formulas',
    description: 'Eau de Parfum and Extrait require fewer sprays and last longer, reducing overall consumption.',
    impact: 'medium',
    category: 'usage'
  },
  {
    id: '7',
    title: 'Support Upcycled Ingredients',
    description: 'Some brands use ingredients derived from food industry waste, like orange blossom from juice production.',
    impact: 'high',
    category: 'ingredients'
  },
  {
    id: '8',
    title: 'Build a Capsule Collection',
    description: 'Instead of many fragrances, curate 3-5 versatile scents that cover all your occasions.',
    impact: 'medium',
    category: 'usage'
  }
];

const sustainableBrands = [
  { name: 'Clean Reserve', focus: 'Sustainable sourcing & recyclable packaging', certification: 'B Corp' },
  { name: 'Le Labo', focus: 'Refillable bottles & minimal packaging', certification: 'Cruelty-free' },
  { name: 'Abel', focus: '100% natural, carbon-neutral', certification: 'B Corp, Organic' },
  { name: 'Floral Street', focus: 'Vegan, recyclable pulp packaging', certification: 'Leaping Bunny' },
  { name: 'Hermetica', focus: 'Alcohol-free, refillable', certification: 'Vegan' },
  { name: 'By Rosie Jane', focus: 'Clean ingredients, sustainable practices', certification: 'Leaping Bunny' },
];

const impactCategories = {
  high: { color: 'bg-green-100 text-green-800', label: 'High Impact' },
  medium: { color: 'bg-amber-100 text-amber-800', label: 'Medium Impact' },
  low: { color: 'bg-blue-100 text-blue-800', label: 'Low Impact' }
};

export default function SustainabilityHub() {
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [userImpact, setUserImpact] = useState<UserImpact>({
    refillsUsed: 0,
    sustainableBrands: 0,
    tipsFollowed: 0,
    carbonSaved: 0
  });
  const [completedTips, setCompletedTips] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Simulate loading user sustainability data
    const timer = setTimeout(() => {
      setIsLoading(false);
      // Mock data - in real app, fetch from database
      if (isAuthenticated) {
        setUserImpact({
          refillsUsed: 3,
          sustainableBrands: 5,
          tipsFollowed: 4,
          carbonSaved: 2.5
        });
        setCompletedTips(new Set(['1', '3', '5', '8']));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  const toggleTip = (tipId: string) => {
    setCompletedTips(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tipId)) {
        newSet.delete(tipId);
      } else {
        newSet.add(tipId);
      }
      return newSet;
    });
  };

  const overallScore = Math.round((completedTips.size / sustainabilityTips.length) * 100);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6 px-4 max-w-6xl">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
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
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-3">
            <Leaf className="h-8 w-8 text-green-600" />
            Sustainability Hub
          </h1>
          <p className="text-muted-foreground">
            Make conscious fragrance choices and track your environmental impact
          </p>
        </div>

        {/* Impact Overview Cards */}
        {isAuthenticated && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-100">
                    <Recycle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{userImpact.refillsUsed}</p>
                    <p className="text-xs text-muted-foreground">Refills Used</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-emerald-100">
                    <TreePine className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{userImpact.sustainableBrands}</p>
                    <p className="text-xs text-muted-foreground">Eco Brands</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-100">
                    <Droplets className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{userImpact.carbonSaved}kg</p>
                    <p className="text-xs text-muted-foreground">CO₂ Saved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-amber-100">
                    <Award className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{overallScore}%</p>
                    <p className="text-xs text-muted-foreground">Eco Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="tips" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tips">Eco Tips</TabsTrigger>
            <TabsTrigger value="brands">Sustainable Brands</TabsTrigger>
            <TabsTrigger value="guide">Ingredient Guide</TabsTrigger>
          </TabsList>

          {/* Eco Tips Tab */}
          <TabsContent value="tips" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Sustainability Tips</h2>
              {isAuthenticated && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {completedTips.size}/{sustainabilityTips.length} completed
                  </span>
                  <Progress value={overallScore} className="w-24 h-2" />
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {sustainabilityTips.map((tip) => (
                <Card 
                  key={tip.id} 
                  className={`glass-card transition-all ${
                    completedTips.has(tip.id) ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : ''
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        {isAuthenticated && (
                          <button 
                            onClick={() => toggleTip(tip.id)}
                            className="mt-0.5 flex-shrink-0"
                          >
                            {completedTips.has(tip.id) ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                            )}
                          </button>
                        )}
                        <div>
                          <CardTitle className="text-base">{tip.title}</CardTitle>
                          <CardDescription className="mt-1">{tip.description}</CardDescription>
                        </div>
                      </div>
                      <Badge className={impactCategories[tip.impact].color}>
                        {impactCategories[tip.impact].label}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Sustainable Brands Tab */}
          <TabsContent value="brands" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <p className="text-sm text-muted-foreground">
                These brands prioritize sustainability in their practices. Research and support those aligned with your values.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sustainableBrands.map((brand, index) => (
                <Card key={index} className="glass-card hover-lift">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{brand.name}</CardTitle>
                      <TreePine className="h-5 w-5 text-green-600" />
                    </div>
                    <CardDescription>{brand.focus}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {brand.certification.split(', ').map((cert, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Ingredient Guide Tab */}
          <TabsContent value="guide" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  At-Risk Ingredients
                </CardTitle>
                <CardDescription>
                  These natural ingredients face sustainability challenges. Consider alternatives when possible.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                    <h4 className="font-semibold text-amber-800 dark:text-amber-200">Indian Sandalwood</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      Severely overharvested. Look for Australian sandalwood or biotech alternatives.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                    <h4 className="font-semibold text-amber-800 dark:text-amber-200">Wild Oud</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      Wild agarwood trees are threatened. Prefer plantation-grown or synthetic oud.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                    <h4 className="font-semibold text-amber-800 dark:text-amber-200">Rosewood</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      Nearly endangered. Ho wood oil provides a similar scent profile sustainably.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                    <h4 className="font-semibold text-amber-800 dark:text-amber-200">Wild Musk</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      Animal-derived musk is banned. Synthetic musks are ethical and excellent.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Sustainable Innovations
                </CardTitle>
                <CardDescription>
                  Modern perfumery offers exciting sustainable alternatives.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold text-green-800 dark:text-green-200">Biotechnology</h4>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Lab-grown ingredients identical to natural ones, with zero environmental impact.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold text-green-800 dark:text-green-200">Upcycled Materials</h4>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Ingredients from food waste: orange blossom from juice, coffee from cafes.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold text-green-800 dark:text-green-200">Carbon Capture</h4>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Some brands create ethanol from captured carbon dioxide emissions.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold text-green-800 dark:text-green-200">Regenerative Farming</h4>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Growing ingredients while improving soil health and biodiversity.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
