export type ExpertiseLevel = 'beginner' | 'explorer' | 'enthusiast' | 'expert';

export type FragranceFamily = 
  | 'floral' 
  | 'oriental' 
  | 'woody' 
  | 'fresh' 
  | 'citrus' 
  | 'aromatic' 
  | 'gourmand' 
  | 'aquatic';

export type Occasion = 
  | 'everyday' 
  | 'office' 
  | 'date-night' 
  | 'formal' 
  | 'summer' 
  | 'winter' 
  | 'special-occasion';

export interface User {
  id: string;
  email: string;
  displayName: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  expertiseLevel: ExpertiseLevel;
  credibilityScore: number;
  interests: {
    fragranceFamilies: FragranceFamily[];
    occasions: Occasion[];
    sustainability: boolean;
  };
  badges: Badge[];
  followersCount: number;
  followingCount: number;
  createdAt: Date;
}

export interface Badge {
  id: string;
  type: 'beginner' | 'verified-reviewer' | 'expert' | 'sustainability-champion';
  name: string;
  description: string;
  earnedAt: Date;
}

export interface FragranceNote {
  name: string;
  type: 'top' | 'heart' | 'base';
}

export interface FragrancePost {
  id: string;
  authorId: string;
  author: User;
  type: 'review' | 'story' | 'comparison' | 'educational';
  fragranceName: string;
  brandName: string;
  notes: FragranceNote[];
  emotions: string[];
  occasions: Occasion[];
  longevity?: number; // 1-10
  projection?: number; // 1-10
  content: string;
  sustainabilityNotes?: string;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  credibilityRating: number;
  isVerified: boolean;
  createdAt: Date;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: User;
  content: string;
  createdAt: Date;
}

export interface OnboardingData {
  expertiseLevel: ExpertiseLevel | null;
  fragranceFamilies: FragranceFamily[];
  occasions: Occasion[];
  sustainability: boolean;
  preferredLanguage: string;
}
