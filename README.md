# Scented Insights

A modern fragrance community platform that combines social networking, education, and sustainability to help fragrance enthusiasts discover, learn, and share their passion for perfumes.

## Overview

Scented Insights is a comprehensive platform designed for fragrance lovers of all levels—from beginners to certified experts. The platform features a unique credibility scoring system that surfaces reliable reviews, educational content curated by experts, and a strong focus on sustainability and ethical practices in the fragrance industry.

## Key Features

### 🌟 Social & Community
- **Personalized Feed** - Discover reviews, stories, comparisons, and educational content
- **User Profiles** - Showcase your fragrance collection and expertise
- **Follow System** - Connect with fragrance enthusiasts and experts
- **Engagement** - Like, comment, and save posts
- **Real-time Notifications** - Stay updated with community interactions

### 🎓 Learning & Education
- **Learning Paths** - Structured courses from beginner to expert level
- **Educational Modules** - Deep dives into notes, families, and compositions
- **Progress Tracking** - Monitor your fragrance education journey
- **Expert Contributions** - Content from verified fragrance professionals

### 🏆 Gamification
- **Achievement System** - Unlock badges and rewards
- **Credibility Scoring** - Build reputation through quality contributions
- **Expertise Levels** - Progress from Beginner → Explorer → Enthusiast → Expert

### 🌱 Sustainability
- **Sustainability Hub** - Discover eco-friendly brands
- **Ethical Sourcing** - Learn about sustainable practices
- **Brand Transparency** - Access sustainability ratings and information

### ✨ Advanced Features
- **Fragrance Collection** - Organize and showcase your perfumes
- **Comparison Tool** - Compare fragrances side-by-side
- **Detailed Reviews** - Rate longevity, projection, and emotions
- **Notes & Occasions** - Tag fragrances with notes and suitable occasions
- **Image Upload** - Share visual content with your reviews
- **Admin Dashboard** - Platform management and moderation tools

## Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Form Handling**: React Hook Form with Zod validation
- **Charts**: Recharts
- **Testing**: Vitest with React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+ and npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Supabase account (for backend services)

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd scented-insights-main

# Install dependencies
npm install

# Set up environment variables
# Create a .env file with your Supabase credentials:
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Start the development server
npm run dev
```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build locally
- `npm test` - Run tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Lint code with ESLint

## Project Structure

```
src/
├── components/      # Reusable UI components
├── contexts/        # React contexts (Auth, etc.)
├── hooks/          # Custom React hooks
├── pages/          # Page components/routes
├── integrations/   # External service integrations (Supabase)
├── lib/            # Utility functions
├── types/          # TypeScript type definitions
└── data/           # Mock data and constants

supabase/
├── migrations/     # Database migrations
└── functions/      # Edge functions
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

