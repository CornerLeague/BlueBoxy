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
- **Database**: PostgreSQL with Drizzle ORM for persistent user profile storage
- **Storage**: Hybrid approach - PostgreSQL for user profiles, localStorage for client-side session management
- **Data Persistence**: User profiles, assessment responses, and preferences stored in database with unique user IDs
- **Authentication**: Simplified authentication without JWT tokens, using localStorage for session management
- **API Pattern**: RESTful API with database persistence and client-side session handling
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
- Activity recommendations with location data
- Priority-based recommendation system  
- Location-based activity suggestions with personality matching

### Activity Management
- Curated activity database with ratings and locations
- Personality-matched activity suggestions
- Activity categorization (dining, outdoor, cultural, active)
- Integration with calendar for scheduling

### Calendar and Scheduling
- Event management for relationship activities
- Date scheduling with reminders
- **Multi-provider calendar integration** (Google Calendar, Outlook, Apple Calendar, Yahoo Calendar)
- OAuth-based authentication for calendar providers
- Automatic calendar sync with external providers
- Event type categorization (date, activity, special)
- Calendar provider selection and management interface

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
- July 09, 2025. Fixed guest assessment flow - added guest assessment endpoint for unauthenticated users, results saved to localStorage and transferred to user account on login
- July 10, 2025. Added onboarding flow - created multi-step onboarding page to capture user name, partner name, and relationship duration before assessment
- July 11, 2025. Updated assessment completion flow - users now go directly to dashboard after completing assessment instead of being redirected to login, with guest dashboard showing assessment results and encouraging account creation
- July 11, 2025. Enhanced onboarding with account creation - added email and password setup steps to onboarding flow, users now create accounts during onboarding and go directly to authenticated assessment
- July 11, 2025. Integrated OpenAI for dynamic recommendations - connected OpenAI API to generate personalized messages, personality insights, and activity recommendations based on actual assessment responses and user data
- July 11, 2025. Added location-based preferences system - implemented comprehensive geolocation functionality with user preference questionnaires across all activity categories (dining, outdoor, entertainment, active, creative, cultural), OpenAI-powered location-specific recommendations within user-defined radius, and seamless integration with existing personality assessment system
- July 11, 2025. Enhanced preferences with multi-select functionality - updated dashboard greeting to use first name only, converted key preference questions to "select all that apply" format with checkbox interface for better user experience and more accurate preference collection
- July 11, 2025. Complete transition to localStorage-based storage - removed all database dependencies and JWT authentication, switched to storing all user data (account setup, assessment responses, preferences, location data) in browser localStorage for completely client-side data persistence, simplified API endpoints to work with localStorage architecture
- July 11, 2025. Hybrid database + localStorage architecture - restored PostgreSQL database for persistent user profile storage with unique user IDs, maintains localStorage for client-side session management, ensures no duplicate emails in database, stores user information (name, email, password, partner name, assessment scores) under unique user profiles
- July 11, 2025. Fixed authentication and database integration - resolved database schema issues by adding missing columns (password_hash, personality_insight, preferences, location), fixed authentication flow to properly store user session data in localStorage, corrected assessment saving functionality with proper DatabaseStorage methods, ensured dashboard displays authenticated user data from database
- July 12, 2025. Multi-provider calendar integration - added comprehensive calendar provider system supporting Google Calendar, Outlook, Apple Calendar, and Yahoo Calendar with OAuth authentication, calendar sync functionality, provider selection interface, and secure token management for external calendar access
- July 19, 2025. Dynamic user statistics system - replaced static numbers with real-time database-driven counters for messages copied and events created, implemented user_stats table with PostgreSQL storage, added message copy tracking in Messages page that increments statistics in real-time
- July 19, 2025. Smart back navigation system - created comprehensive navigation history tracking across all pages (Profile, Messages, Calendar, Activities, Preferences), remembers up to 10 previous pages, intelligently returns users to their previous location instead of always defaulting to dashboard
- July 19, 2025. UI cleanup - removed unnecessary Edit button from Partner Profile section and "See All" button from Today's Recommendations to streamline interface and reduce clutter
- July 21, 2025. Complete messages system removal - eliminated message display functionality, removed back navigation buttons from all major pages (Calendar, Activities, Messages), cleaned up database schema by removing recommendations table and messagesCopied field from user statistics, removed all message-related API endpoints and OpenAI integration calls for a streamlined interface focused on activity recommendations
- July 22, 2025. AI Message Generation System - implemented comprehensive AI-powered message generation with 5 categories (daily check-ins, appreciation, support, romantic, playful), OpenAI GPT-4o integration with personality-aware prompting, new backend service with fallback system, category-specific guidelines for each personality type, complete Messages page redesign with generation interface, copy-to-clipboard functionality, and real-time AI message creation based on partner's personality assessment