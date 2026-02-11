import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  expertise_level: 'beginner' | 'explorer' | 'enthusiast' | 'expert';
  credibility_score: number;
  followers_count: number;
  following_count: number;
  interested_in_sustainability: boolean;
  preferred_language: string;
  created_at: string;
  updated_at: string;
}

interface Badge {
  id: string;
  badge_type: string;
  name: string;
  description: string | null;
  earned_at: string;
}

interface UserInterest {
  interest_type: string;
  interest_value: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile | null;
  badges: Badge[];
  interests: UserInterest[];
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  needsOnboarding: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export interface OnboardingData {
  expertiseLevel: 'beginner' | 'explorer' | 'enthusiast' | 'expert' | null;
  fragranceFamilies: string[];
  occasions: string[];
  sustainability: boolean;
  preferredLanguage: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const fetchUserData = async (supabaseUser: SupabaseUser): Promise<AuthUser | null> => {
    try {
      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return null;
      }

      // Fetch badges
      const { data: badges, error: badgesError } = await supabase
        .from('badges')
        .select('*')
        .eq('user_id', supabaseUser.id);

      if (badgesError) {
        console.error('Error fetching badges:', badgesError);
      }

      // Fetch interests
      const { data: interests, error: interestsError } = await supabase
        .from('user_interests')
        .select('interest_type, interest_value')
        .eq('user_id', supabaseUser.id);

      if (interestsError) {
        console.error('Error fetching interests:', interestsError);
      }

      return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        profile: profile as Profile | null,
        badges: (badges || []) as Badge[],
        interests: (interests || []) as UserInterest[],
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);

        if (currentSession?.user) {
          // Use setTimeout to avoid potential race conditions with Supabase
          setTimeout(async () => {
            const userData = await fetchUserData(currentSession.user);
            setUser(userData);
            
            // Check if onboarding is needed (no interests set)
            if (userData && userData.interests.length === 0) {
              setNeedsOnboarding(true);
            } else {
              setNeedsOnboarding(false);
            }
            setIsLoading(false);
          }, 0);
        } else {
          setUser(null);
          setNeedsOnboarding(false);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (!existingSession) {
        setIsLoading(false);
      }
      // Auth state change will handle the rest
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (session?.user) {
      const userData = await fetchUserData(session.user);
      setUser(userData);
    }
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  };

  const signup = async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      throw error;
    }

    setNeedsOnboarding(true);
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    setUser(null);
    setSession(null);
  };

  const completeOnboarding = async (data: OnboardingData) => {
    if (!session?.user) return;

    const userId = session.user.id;

    try {
      // Update profile with expertise level and sustainability preference
      if (data.expertiseLevel) {
        await supabase
          .from('profiles')
          .update({
            expertise_level: data.expertiseLevel,
            interested_in_sustainability: data.sustainability,
            preferred_language: data.preferredLanguage,
          })
          .eq('user_id', userId);
      }

      // Insert fragrance family interests
      for (const family of data.fragranceFamilies) {
        await supabase
          .from('user_interests')
          .insert({
            user_id: userId,
            interest_type: 'fragrance_family',
            interest_value: family,
          });
      }

      // Insert occasion interests
      for (const occasion of data.occasions) {
        await supabase
          .from('user_interests')
          .insert({
            user_id: userId,
            interest_type: 'occasion',
            interest_value: occasion,
          });
      }

      // Refresh user data
      await refreshProfile();
      setNeedsOnboarding(false);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        isLoading,
        needsOnboarding,
        login,
        signup,
        logout,
        completeOnboarding,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
