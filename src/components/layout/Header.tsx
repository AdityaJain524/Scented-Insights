import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationsDropdown } from '@/components/NotificationsDropdown';
import { Search, Plus, User, Settings, LogOut, Menu, X, Edit, Shield, Bookmark, ArrowLeftRight, Trophy } from 'lucide-react';

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const displayName = user?.profile?.display_name || 'User';
  const username = user?.profile?.username || 'user';
  const avatarUrl = user?.profile?.avatar_url || undefined;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold text-lg">S</span>
          </div>
          <span className="font-display text-xl font-semibold hidden sm:inline">ScentVerse</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/feed" className="text-muted-foreground hover:text-foreground transition-colors">
            Discover
          </Link>
          <Link to="/learn" className="text-muted-foreground hover:text-foreground transition-colors">
            Learn
          </Link>
          <Link to="/sustainability" className="text-muted-foreground hover:text-foreground transition-colors">
            Sustainability
          </Link>
          <Link to="/recommendations" className="text-muted-foreground hover:text-foreground transition-colors">
            For You
          </Link>
        </nav>

        {/* Search & Actions */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Search className="h-5 w-5" />
          </Button>

          {isAuthenticated ? (
            <>
              <NotificationsDropdown />

              <Button variant="hero" size="sm" className="hidden sm:flex gap-2" onClick={() => navigate('/create')}>
                <Plus className="h-4 w-4" />
                Create
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="font-medium">{displayName}</p>
                    <p className="text-sm text-muted-foreground">@{username}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile/edit')}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/collection')}>
                    <Bookmark className="mr-2 h-4 w-4" />
                    My Collection
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/achievements')}>
                    <Trophy className="mr-2 h-4 w-4" />
                    Achievements
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/compare')}>
                    <ArrowLeftRight className="mr-2 h-4 w-4" />
                    Compare
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Sign in
              </Button>
              <Button variant="hero" onClick={() => navigate('/signup')}>
                Get Started
              </Button>
            </div>
          )}

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/50 bg-background">
          <nav className="container flex flex-col py-4 px-4 gap-2">
            <Link
              to="/feed"
              className="py-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Discover
            </Link>
            <Link
              to="/learn"
              className="py-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Learn
            </Link>
            <Link
              to="/sustainability"
              className="py-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sustainability
            </Link>
            <Link
              to="/recommendations"
              className="py-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              For You
            </Link>
            {isAuthenticated && (
              <Button variant="hero" className="mt-2" onClick={() => { navigate('/create'); setMobileMenuOpen(false); }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
