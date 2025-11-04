# Query Fan-Out Analyzer

## Overview

The Query Fan-Out Analyzer is a full-stack web application that analyzes web pages to predict how Google's AI Mode would break down content into sub-queries. Built with React on the frontend and Express.js on the backend, it uses Google's Gemini AI to perform semantic analysis of web content and provides actionable insights for content optimization.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side navigation
- **State Management**: TanStack Query for server state management
- **UI Components**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **Design System**: Natural green color palette inspired by professional SEO industry aesthetics
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **AI Integration**: Google Gemini AI for content analysis
- **Web Scraping**: Cheerio for HTML parsing and content extraction
- **Session Management**: Express sessions with PostgreSQL session store

### Data Storage Solutions
- **Primary Database**: PostgreSQL with the following schema:
  - `users` table for user authentication
  - `analyses` table for storing analysis results with JSONB fields for complex data
- **Database Integration**: DatabaseStorage class using Drizzle ORM for type-safe operations
- **Session Storage**: PostgreSQL session store using connect-pg-simple

## Key Components

### Web Scraping Service
- Extracts content from web pages using axios and cheerio
- Implements proper user-agent headers and timeout handling
- Sanitizes HTML content by removing scripts, styles, and ads
- Intelligently identifies main content areas using common CSS selectors

### AI Analysis Service
- Integrates with Google Gemini AI for semantic content analysis
- Performs query fan-out analysis to predict AI search behavior
- Extracts semantic chunks and identifies primary entities
- Provides coverage scoring and optimization recommendations

### Analysis Pipeline
1. **Content Extraction**: Scrapes and cleans web page content
2. **Semantic Chunking**: Identifies key content sections and topics
3. **Query Generation**: Creates sub-queries that AI would likely generate
4. **Coverage Analysis**: Evaluates how well content answers each query
5. **Recommendation Engine**: Provides actionable optimization suggestions

### Real-time Progress Tracking
- Background processing with status updates
- WebSocket-like polling for real-time progress feedback
- Graceful error handling and recovery mechanisms

### Competitor Comparison Engine
- Multi-URL simultaneous analysis for competitive intelligence
- Content gap identification between competitors
- Unique content strength analysis per competitor
- Comparative query coverage scoring and recommendations

## Data Flow

1. **User Input**: URL submission through the frontend interface
2. **Analysis Initialization**: Backend creates analysis record with "pending" status
3. **Background Processing**: 
   - Web scraping → "scraping" status
   - Content chunking → "chunking" status  
   - AI analysis → "analyzing" status
   - Completion → "completed" status
4. **Real-time Updates**: Frontend polls for status changes every 2 seconds
5. **Results Display**: Comprehensive analysis results with export capabilities

## External Dependencies

### Core Dependencies
- **@google/genai**: Google Gemini AI integration for content analysis
- **@neondatabase/serverless**: Neon PostgreSQL driver for serverless environments
- **drizzle-orm**: Type-safe ORM for database operations
- **cheerio**: Server-side HTML parsing and manipulation
- **axios**: HTTP client for web scraping

### UI Dependencies
- **@radix-ui/***: Comprehensive set of accessible UI primitives
- **@tanstack/react-query**: Powerful data synchronization for React
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe variant styling

### Development Dependencies
- **vite**: Fast build tool and development server
- **typescript**: Static type checking
- **@replit/vite-plugin-***: Replit-specific development tools

## Deployment Strategy

### Environment Configuration
- **Development**: Vite dev server with hot module replacement
- **Production**: Static build with Express serving both API and frontend
- **Database**: Configured for PostgreSQL with environment-based connection strings

### Build Process
1. **Frontend Build**: Vite compiles React app to static assets
2. **Backend Build**: esbuild bundles Express server for Node.js
3. **Static Serving**: Express serves frontend assets in production

### Database Management
- **Migrations**: Drizzle Kit handles schema migrations
- **Connection**: Environment-based database URL configuration
- **Session Store**: PostgreSQL-backed session management

### Error Handling
- Comprehensive error boundaries in React components
- Express error middleware for API route protection
- Graceful degradation for failed analysis attempts

## Changelog

```
Changelog:
- July 03, 2025. Initial setup
- July 03, 2025. Added PostgreSQL database integration, migrated from in-memory storage to DatabaseStorage with Drizzle ORM
- July 03, 2025. Implemented batch URL analysis feature with parallel processing, progress tracking, and CSV export capabilities
- July 04, 2025. Added competitor comparison analysis feature with multi-URL comparison, content gap identification, and competitive intelligence insights
- July 04, 2025. Implemented mobile-responsive design with adaptive sidebar/mobile layouts and MediaVision branding
- July 04, 2025. Added hover tooltips throughout the interface to help users understand tool functionality and features
- November 04, 2025. Complete design overhaul to match Lilypad SEO's clean, professional aesthetic with natural green color palette (forest green #1a4d2e, sage green #4a7c59), improved typography with bolder headlines, increased white space, professional button styling with subtle shadows, and simplified header
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```