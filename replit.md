# Overview

This is a full-stack web application for dt.visuals, a cinematic video production company. The application serves as a showcase website with client portal functionality, built using React, TypeScript, Express.js, and PostgreSQL with Drizzle ORM. The system features a comprehensive role-based access control (RBAC) system, custom authentication, media management, and dynamic branding capabilities.

# Recent Changes (August 2025)
**Complete Deployment System Rebuild**: Implemented clean, production-ready dual-environment deployment system replacing all previous Docker complexity. New system uses bare-metal Ubuntu server with Node.js + PM2 + Nginx + PostgreSQL for simplified maintenance and better performance. Includes automated SSL certificates via Let's Encrypt, GitHub Actions CI/CD (main→prod, dev→dev), automatic database migrations, and comprehensive monitoring/rollback procedures.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system featuring black/white palette with dark teal and muted orange accents
- **Build Tool**: Vite with TypeScript configuration
- **Form Handling**: React Hook Form with Zod validation

## Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with custom middleware
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Custom local authentication using Passport.js with bcrypt password hashing
- **Session Management**: Express sessions with PostgreSQL session store
- **File Uploads**: Multer for media file handling

## Database Design
The application uses a comprehensive PostgreSQL schema with the following key entities:

### Core User Management
- `users` - Admin/staff user accounts
- `client_users` - Separate authentication system for client access
- `clients` - Client profile information

### RBAC System
- `roles` - Flexible role definitions
- `permissions` - Granular permission system
- `user_roles` - Many-to-many user-role associations
- `role_permissions` - Many-to-many role-permission associations

### Media Management
- `media` - File storage and metadata
- `media_clients` - Media-client access control
- `media_feedback` - Client feedback on media items
- `media_timeline_notes` - Timeline-based annotations

### Content Management
- `website_settings` - Dynamic background media configuration
- `branding_settings` - Company branding and logo management

## Authentication & Authorization
- **Dual Authentication Systems**: Separate auth flows for admin/staff users and client users
- **RBAC Implementation**: Granular permission-based access control with middleware enforcement
- **Session Security**: HTTP-only cookies with CSRF protection
- **Password Security**: bcrypt hashing with salt for all user types

## Media Management
- **File Upload**: Multer-based file handling with validation
- **Media Organization**: Tagging and categorization system
- **Client Access Control**: Granular media assignment to specific clients
- **Feedback System**: Timeline-based feedback and annotation tools

## Dynamic Theming & Branding
- **Theme System**: Light/dark/system theme support with localStorage persistence
- **Dynamic Branding**: Database-driven logo, favicon, and company name management
- **Background Management**: Section-specific background image/video configuration
- **Responsive Design**: Mobile-first approach with breakpoint-aware components

## API Architecture
- **RESTful Design**: Consistent API endpoints with proper HTTP methods
- **Middleware Stack**: Authentication, RBAC, CORS, and logging middleware
- **Error Handling**: Centralized error handling with appropriate HTTP status codes
- **Data Validation**: Zod schema validation on both client and server

## Development Environment
- **Hot Reload**: Vite HMR for frontend development
- **TypeScript**: Shared types between client and server
- **Path Aliases**: Simplified imports with @ aliases
- **Build Process**: Separate client and server build pipelines

# External Dependencies

## Database
- **PostgreSQL**: Primary database with support for both Neon (cloud) and local instances
- **Connection Pooling**: pg-pool for connection management
- **Migrations**: Drizzle Kit for schema migrations

## File Storage
- **Local Storage**: File uploads stored in local filesystem with Express static serving
- **MIME Type Validation**: File type checking and validation

## UI Components
- **Radix UI**: Accessible component primitives for complex UI elements
- **Lucide React**: Icon library for consistent iconography
- **React Hook Form**: Form state management and validation
- **React Query**: Server state synchronization and caching

## Development Tools
- **Vite**: Fast development server and build tool
- **ESBuild**: Fast TypeScript compilation for production
- **PostCSS**: CSS processing with Tailwind CSS

## Replit Integration
- **Replit Database**: Fallback database option for development
- **Runtime Error Overlay**: Development debugging tools
- **Cartographer**: Code navigation and analysis

The application is designed to be deployment-ready with Docker support and can run in both development and production environments with appropriate environment variable configuration.