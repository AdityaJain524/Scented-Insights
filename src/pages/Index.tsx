import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { 
  Sparkles, 
  Shield, 
  Users, 
  BookOpen, 
  Leaf, 
  CheckCircle,
  ArrowRight,
  Star
} from 'lucide-react';

export default function Index() {
  const features = [
    {
      icon: Shield,
      title: 'Trust & Credibility',
      description: 'Our unique scoring system surfaces reliable reviews from verified enthusiasts and experts.',
    },
    {
      icon: BookOpen,
      title: 'Learn & Grow',
      description: 'Educational content curated by experts helps you understand notes, families, and compositions.',
    },
    {
      icon: Users,
      title: 'Community-Driven',
      description: 'Connect with fragrance lovers at every level, from beginners to certified noses.',
    },
    {
      icon: Leaf,
      title: 'Sustainability Focus',
      description: 'Discover brands committed to ethical sourcing and eco-friendly practices.',
    },
  ];

  const stats = [
    { value: '50K+', label: 'Fragrance Reviews' },
    { value: '12K+', label: 'Community Members' },
    { value: '800+', label: 'Expert Contributors' },
    { value: '95%', label: 'Verified Accuracy' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-burgundy/5 rounded-full blur-3xl" />
        </div>

        <div className="container relative px-4 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="px-4 py-1.5">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Trusted Fragrance Discovery
            </Badge>

            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Discover Scents with{' '}
              <span className="bg-gradient-to-r from-primary via-accent to-burgundy bg-clip-text text-transparent">
                Confidence
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Join a community where expertise meets authenticity. Get verified reviews, 
              learn from experts, and find your signature scent.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/signup">
                  Start Your Journey
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              <Button variant="glass" size="xl" asChild>
                <Link to="/feed">
                  Explore Fragrances
                </Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Expert-verified reviews
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Bias detection
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Inclusive community
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-card/50">
        <div className="container px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="font-display text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Why ScentVerse?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We're building a new standard for fragrance discovery—one that values 
            trust, education, and authentic community over hype.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="glass-card hover-lift group">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4 group-hover:from-primary/20 group-hover:to-accent/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonial Section — generic, no sample user names */}
      <section className="bg-gradient-to-br from-cream-dark/50 via-background to-cream-dark/50">
        <div className="container px-4 py-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex justify-center gap-1 mb-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-6 w-6 text-amber fill-amber" />
              ))}
            </div>
            <blockquote className="font-display text-2xl md:text-3xl italic mb-6">
              "Finally, a platform where I can trust the reviews. The credibility scoring 
              changed how I discover new fragrances—no more buyer's remorse."
            </blockquote>
            <div className="flex items-center justify-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold">
                ✦
              </div>
              <div className="text-left">
                <p className="font-semibold">Verified Community Member</p>
                <p className="text-sm text-muted-foreground">Fragrance Enthusiast</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 py-24">
        <Card className="bg-gradient-to-r from-primary via-accent to-burgundy text-primary-foreground overflow-hidden">
          <CardContent className="relative p-8 md:p-12">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
            <div className="relative max-w-2xl mx-auto text-center">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Ready to Find Your Signature Scent?
              </h2>
              <p className="text-primary-foreground/80 mb-8">
                Join thousands of fragrance enthusiasts who trust ScentVerse 
                for authentic reviews and expert guidance.
              </p>
              <Button variant="glass" size="xl" className="bg-white/10 hover:bg-white/20 text-white border-white/20" asChild>
                <Link to="/signup">
                  Create Free Account
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="container px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-primary-foreground font-display font-bold text-lg">S</span>
              </div>
              <span className="font-display text-xl font-semibold">ScentVerse</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link to="/feed" className="hover:text-foreground transition-colors">Discover</Link>
              <Link to="/learn" className="hover:text-foreground transition-colors">Learn</Link>
              <Link to="/community" className="hover:text-foreground transition-colors">Community</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            </nav>
            <p className="text-sm text-muted-foreground">
              © 2026 ScentVerse. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
