# BlueBoxy - Relationship Management App

## Overview
BlueBoxy is a modern relationship management application built with React and Express. It helps users strengthen their relationships through personalized recommendations, message suggestions, and activity planning based on personality assessments. The app features a mobile-first design with dark mode UI optimized for personal relationship management.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Router**: Wouter for client-side routing
- **State Management**: TanStack Query for server state and local storage for user sessions
- **UI Framework**: Radix UI components with Tailwind CSS
- **Styling**: Tailwind CSS with glassmorphism effects and dark theme
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM (DatabaseStorage implementation)
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **API Pattern**: RESTful API with comprehensive endpoint coverage
- **Development**: Hot module replacement with Vite integration

### Comprehensive API Endpoints
- **Authentication**: Register, login, JWT token management
- **User Management**: Profile management, preferences, onboarding
- **Partner Management**: Partner profiles, relationship data
- **Personality Assessment**: 8-type algorithm, scoring, results
- **AI Recommendations**: Messages, activities, gifts with contextual generation
- **Notifications**: Scheduling, delivery, acknowledgment
- **Calendar Integration**: Availability analysis, event scheduling
- **Activity Management**: Location-based suggestions, personality matching

### Mobile-First Design
- Responsive design optimized for mobile devices
- Bottom navigation bar for easy thumb navigation
- Touch-friendly interface elements
- Glass effect styling for modern mobile aesthetics

## Key Components

### User Management
- User registration and profile management
- Partner information tracking
- Assessment completion status
- Personality type storage and retrieval

### Personality Assessment System
- Multi-question personality assessment
- Personality type determination algorithm
- Assessment response storage with timestamps
- Personality-based recommendation generation

### Recommendation Engine
- Personalized message suggestions based on personality types
- Activity recommendations with location data
- Priority-based recommendation system
- Category-based filtering (daily, appreciation, support, romantic, playful)

### Activity Management
- Curated activity database with ratings and locations
- Personality-matched activity suggestions
- Activity categorization (dining, outdoor, cultural, active)
- Integration with calendar for scheduling

### Calendar and Scheduling
- Event management for relationship activities
- Date scheduling with reminders
- Calendar integration for planned activities
- Event type categorization (date, activity, special)

## Data Flow

### User Onboarding Flow
1. User provides basic information (name, email, partner details)
2. User completes personality assessment
3. System determines personality type
4. Personalized dashboard is generated with recommendations

### Recommendation Flow
1. System analyzes user's personality type
2. Generates personalized message suggestions
3. Provides activity recommendations based on preferences
4. Updates recommendations based on user interactions

### Activity Scheduling Flow
1. User browses recommended activities
2. User selects activity to schedule
3. System creates calendar event
4. User receives notifications for scheduled activities

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Database connectivity
- **drizzle-orm**: Database ORM and query builder
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-***: UI component library
- **tailwindcss**: Utility-first CSS framework
- **wouter**: Lightweight React router

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type checking and development
- **tsx**: TypeScript execution for Node.js
- **esbuild**: JavaScript bundler for production

### Third-Party Integrations
- **Neon Database**: PostgreSQL database hosting
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling
- **React Hook Form**: Form validation and management
- **Zod**: Schema validation

## Deployment Strategy

### Development Environment
- Uses Vite dev server with hot module replacement
- TypeScript checking in watch mode
- Database migrations with Drizzle Kit
- Express server with development middleware

### Production Build
- Vite builds React application to `dist/public`
- esbuild bundles Express server to `dist/index.js`
- Static file serving for production assets
- Environment variable configuration for database

### Database Management
- Drizzle migrations in `migrations/` directory
- Schema definitions in `shared/schema.ts`
- Database push command for development updates
- PostgreSQL dialect with connection pooling

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- July 08, 2025. Initial setup
- July 08, 2025. Enhanced UI with glassmorphism effects and modern dark theme design
- July 08, 2025. Added PostgreSQL database with Drizzle ORM, replacing in-memory storage
- July 08, 2025. Implemented comprehensive backend architecture with full API specification including authentication, partner management, AI recommendations, notifications, and calendar integration
- July 08, 2025. Fixed authentication system - resolved "failed to create account" error by updating frontend to use correct /api/auth/register endpoint
- July 08, 2025. Fixed assessment saving - resolved "failed to save assessment" error by updating storage method calls and fixing endpoint routing
- July 09, 2025. Enhanced hover effects - added subtle transparent grey background with bright white text on hover for better visibility and user feedback
- July 09, 2025. Removed onboarding page - simplified app flow by making login page the default entry point and removing signup text
- July 09, 2025. Added Get Started page - created welcome page with app features and added back button to login page
- July 09, 2025. Updated Get Started flow - main button now directs to assessment, added "Have an account? Login here" text for existing users