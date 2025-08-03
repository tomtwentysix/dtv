# dt.visuals - Cinematic Media Production Website

## Overview

This is a full-stack showcase website for dt.visuals, a cinematic media production company. The application features a modern React frontend with a Node.js/Express backend, implementing a complete Role-Based Access Control (RBAC) system with custom authentication. The design emphasizes a cinematic aesthetic with a black and white color palette, accented by dark teal and muted orange highlights.

## User Preferences

Preferred communication style: Simple, everyday language.

## Test Accounts

The following test accounts are set up for testing different user roles:

### Admin Account
- **Username:** admin
- **Email:** admin@dtvisuals.com
- **Password:** admin123
- **Permissions:** Full access to all features including user management, role editing, system management, analytics, media upload/delete/assign, and client viewing

### Staff Account
- **Username:** staff
- **Email:** staff@dtvisuals.com
- **Password:** staff123
- **Permissions:** Limited access including media upload, media assignment to clients, and client viewing

### Client Account
- **Username:** client
- **Email:** client@example.com
- **Password:** client123
- **Permissions:** Login access to view only their assigned media content

All passwords use secure scrypt hashing with salt for production-level security.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom configuration

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: Custom Passport.js implementation with local strategy
- **Session Management**: Express sessions with PostgreSQL storage
- **Password Security**: Node.js crypto module with scrypt hashing
- **File Upload**: Multer middleware for media handling

### Database Architecture
- **Database**: PostgreSQL (via Neon serverless)
- **ORM**: Drizzle ORM with type-safe queries
- **Schema**: Full RBAC implementation with users, roles, permissions, and junction tables
- **Migrations**: Drizzle Kit for schema management

## Key Components

### Authentication System
- Custom local authentication (no third-party auth services)
- Secure password hashing using Node.js crypto scrypt
- Session-based authentication with secure cookies
- JWT-free implementation focusing on server-side sessions

### Role-Based Access Control (RBAC)
- **Database Tables**:
  - `users` - Core user information
  - `roles` - Role definitions (Admin, Staff, Client)
  - `permissions` - Granular permission system
  - `user_roles` - Many-to-many user-role relationships
  - `role_permissions` - Many-to-many role-permission relationships
- **Middleware**: Custom RBAC middleware for route protection
- **Permissions**: Granular permissions like `upload:media`, `edit:users`, `assign:client`

### Media Management
- File upload system with Multer
- Media categorization and tagging
- Featured media selection
- Client media assignment system
- Website customization system for background images/videos

### Website Customization System
- **Background Media Support**: Both images and videos supported
- **Section Management**: Hero, Featured Work, and Services sections
- **Video Requirements**: Auto-play, muted, looped, no controls
- **Permission Control**: `edit:website` permission for managing site backgrounds
- **Admin Interface**: Visual media selector with preview functionality

### UI/UX Design
- Cinematic design theme with dark/light mode support
- Responsive layout with mobile-first approach
- Glass morphism effects and cinematic shadows
- Custom color scheme with CSS variables
- Smooth animations and transitions

## Data Flow

### Authentication Flow
1. User submits credentials via login form
2. Passport.js validates against database using scrypt hash comparison
3. Session created and stored in PostgreSQL
4. Frontend receives user data and updates React Query cache
5. Protected routes check authentication status via middleware

### RBAC Flow
1. User requests protected resource
2. Authentication middleware verifies session
3. RBAC middleware checks user roles and permissions
4. Database queries fetch user's effective permissions
5. Access granted or denied based on permission requirements

### Media Upload Flow
1. User selects files through React frontend
2. Multer middleware processes multipart uploads
3. Files stored with metadata in database
4. Optional client assignment and categorization
5. Frontend updates media gallery via React Query

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM
- **passport**: Authentication middleware
- **express-session**: Session management
- **multer**: File upload handling
- **bcrypt**: Password hashing (backup option)

### Frontend Dependencies
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **wouter**: Lightweight routing
- **react-hook-form**: Form management
- **zod**: Schema validation
- **tailwindcss**: Utility-first CSS framework

### Development Dependencies
- **vite**: Fast build tool and dev server
- **typescript**: Type safety
- **drizzle-kit**: Database migration tool
- **@replit/vite-plugin-***: Replit-specific development tools

## Deployment Strategy

### Development Environment
- Vite dev server for frontend with HMR
- tsx for TypeScript execution in development
- Express server with middleware logging
- Database migrations via Drizzle Kit

### Production Build
- Vite builds optimized frontend bundle
- esbuild bundles Express server for Node.js
- Static assets served from Express
- Environment-specific configurations

### Database Management
- Schema defined in shared TypeScript files
- Migrations managed through Drizzle Kit
- Connection pooling via Neon serverless
- Session storage in dedicated PostgreSQL table

### Security Considerations
- Secure session configuration with httpOnly cookies
- CSRF protection through same-site cookies
- Password hashing with crypto-secure methods
- Environment-based secret management
- Trusted proxy configuration for production

The application follows a monorepo structure with clear separation between client, server, and shared code, enabling maintainable full-stack development with type safety throughout the entire stack.

## Recent Changes

### July 29, 2025 - User Management Fix
- Fixed `/api/users` endpoint that was returning empty array instead of actual users
- Updated route to properly call `storage.getUsers()` method
- Enhanced API to include user roles information for each user
- Verified database contains test users (admin, staff, client) with proper RBAC setup
- User management page now correctly displays all users with their roles and permissions

### July 29, 2025 - Drag & Drop Roles and Permissions
- Implemented drag and drop interface for roles and permissions management
- Added @dnd-kit libraries for smooth drag and drop experience
- Created draggable permission components with visual grip handles
- Built role drop zones with hover states and visual feedback
- Added API mutations for assigning/removing permissions from roles
- Made Client role read-only with visual indicators to prevent accidental modifications
- Added instructional banner to guide users on how to use the interface

### August 3, 2025 - Authentication & Navigation Fixes
- Fixed client user redirect issue where clients were incorrectly sent to admin dashboard
- Updated `auth-page.tsx` to check user roles and redirect appropriately:
  - Admin/Staff users → `/admin/dashboard`
  - Client users → `/client/dashboard`
  - No role/unauthenticated → `/` (home page)
- Updated `navigation.tsx` dashboard link to dynamically route users based on their roles
- Added proper role-based routing logic with type safety
- Fixed authentication flow to respect RBAC permissions throughout the application

### August 3, 2025 - Role-Based Access Control & UI Improvements
- Implemented comprehensive permission-based access control throughout the application
- Added permission checks to navigation items (view:media, view:clients, edit:website, edit:roles, edit:users)
- Protected admin features like upload, edit, and assignment with proper permission validation
- Added permission checks to client feedback and timeline note features
- Removed featured and portfolio tags from client dashboard for cleaner interface
- Applied glass morphism styling to all filter dropdowns matching navigation design
- Added individual download buttons to client media cards for easy file access
- Updated modal layouts to scale content appropriately with improved spacing and overflow handling
- Fixed TypeScript errors in client dashboard with proper data type defaults

### August 3, 2025 - Modal Spacing Fix
- Fixed video modal white space issue by changing `h-[90vh]` to `max-h-[90vh]` in DialogContent
- Modal now dynamically resizes to content instead of using fixed height
- Created floating header and footer UI elements that adapt to content length
- Implemented minimal video-first modal design with external floating controls
- Video content now uses natural dimensions with smart viewport constraints
- Added smooth animations to modal size changes for polished user experience transitions

### August 3, 2025 - Docker Timeline Functionality Solution
- Resolved missing timeline functionality when running application in Docker containers
- Fixed TypeScript type safety issues in client dashboard that could prevent proper compilation
- Added comprehensive Docker configuration files: Dockerfile, docker-compose.yml, .dockerignore
- Created environment configuration template (.env.docker) with timeline-specific settings
- Implemented health check endpoint (/api/health) for container monitoring
- Added deployment automation scripts: deploy-docker.sh and docker-troubleshoot.sh
- Enhanced database initialization with proper PostgreSQL setup for containers
- Timeline features now fully functional in containerized environments:
  - Video timestamp notes creation and management
  - Timeline navigation and note sorting
  - Client feedback system integration
  - Real-time timeline updates with proper API connectivity
- Added comprehensive documentation for Docker deployment and troubleshooting
- Ensured production-ready container configuration with security best practices

### August 3, 2025 - Windows Docker Desktop Support
- Created comprehensive Docker deployment solution for Windows Docker Desktop
- Built separate development and production environments with isolated databases
- Added PowerShell scripts for Windows users:
  - `deploy-dev.ps1` - Development environment deployment
  - `deploy-prod.ps1` - Production environment deployment  
  - `docker-management.ps1` - Complete Docker management utility
- Created Windows batch files (`deploy-dev.bat`) for cmd users
- Implemented separate Docker configurations:
  - `docker-compose.dev.yml` - Development with hot reload (port 3000)
  - `docker-compose.prod.yml` - Production optimized (port 5000)
  - `Dockerfile.dev` - Development container with volume mounting
  - `Dockerfile.prod` - Multi-stage production build
- Enhanced environment configurations:
  - `.env.dev` - Development database and settings
  - `.env.prod` - Production database and security settings
- Added persistent volume management:
  - Separate upload folders for dev/prod environments
  - Database data persistence across container restarts
  - Backup and restore functionality
- Implemented health check endpoint (`/api/health`) for container monitoring
- Created comprehensive Windows Docker documentation (`DOCKER_README.md`)
- Enhanced server configuration for Docker compatibility (0.0.0.0 binding)
- Updated database configuration to automatically use local PostgreSQL for Docker development and production
- Both Docker environments (dev/prod) now use local PostgreSQL instead of Neon
- Neon is only used in the Replit environment
- Fixed PowerShell script syntax issues for Windows compatibility
- Added pg driver support for local PostgreSQL in Docker environments
- Updated TypeScript configuration to support ES2022 modules with top-level await
- Added comprehensive database initialization scripts with test data population for development
- Created default admin user setup for production environment with security warnings
- Updated deployment scripts to automatically populate databases after schema creation
- Integrated real password hashing using Node.js scrypt algorithm for test users
- Added test clients, media, and RBAC permissions setup for development testing