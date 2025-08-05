# dt.visuals - Cinematic Media Production Website

## Overview
dt.visuals is a full-stack showcase website for a cinematic media production company. It features a modern React frontend with a Node.js/Express backend, implementing a complete Role-Based Access Control (RBAC) system with custom authentication. The design emphasizes a cinematic aesthetic with a black and white color palette, accented by dark teal and muted orange highlights. The project's ambition is to provide a robust platform for showcasing media, managing clients, and facilitating internal operations within a media production company.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (January 2025)

### Multiplatform Deployment System
**Date**: January 5, 2025  
**Description**: Implemented robust multiplatform deployment that automatically detects and configures for both Replit Neon and Docker PostgreSQL environments.

**Key Changes**:
- **Automatic Environment Detection**: Created server/init-database.ts that detects Replit vs Docker environments
- **Universal Database Initialization**: Single initialization system works for both Neon serverless and PostgreSQL containers
- **Emergency Admin Creation**: Guarantees admin user exists in any environment, prevents unusable deployments
- **Dynamic ID Handling**: Fixed Docker initialization to handle generated UUIDs properly without hardcoded conflicts
- **Unified Schema Management**: All environments now use same database schema with proper table creation
- **Critical Admin Verification**: Both development and production deployments verify admin user exists or fail deployment

### Docker Database Initialization Fix
**Date**: January 4, 2025  
**Description**: Fixed Docker deployment database schema and test data initialization issues.

**Key Changes**:
- **Database Schema Fix**: Fixed missing column errors during Docker deployment by adding proper migration sequencing and application restart
- **Updated Init Scripts**: Completely rebuilt docker/postgres/init-dev.sql with current production data and docker/postgres/init-prod.sql with proper default admin user
- **Deployment Script Enhancement**: Added proper wait times, migration completion checks, and application restarts to ensure schema is applied correctly
- **Auth System Fix**: Updated server/auth.ts to include required name fields (forename, surname, displayName) in user creation
- **Data Migration**: Exported complete current database structure including users, roles, permissions, clients, and client_users to ensure Docker environments match production

### Multi-Client Media Assignment System Completion
**Date**: January 4, 2025  
**Description**: Completed implementation of live-updating multi-client media assignment system with search-based interface.

**Key Changes**:
- **Live Updates**: Fixed real-time synchronization of currently assigned clients display when assignments change
- **Search Interface**: Implemented direct search-based client assignment without dropdown complexity
- **UI Efficiency**: Shows all available clients by default with instant search filtering
- **Assignment System**: REST endpoints (POST/DELETE) for adding/removing clients from media
- **Visual Feedback**: Real-time updates to assigned clients list with remove buttons
- **Deployment Scripts**: Updated PowerShell deployment scripts to reflect dual authentication architecture
- **User Experience**: Streamlined workflow - type to search, click to assign, immediate visual feedback

## Earlier Changes (January 2025)
### Database Cleanup and Architecture Refinement
**Date**: January 4, 2025  
**Description**: Completed database cleanup to remove redundant client user from main users table and updated all deployment scripts.

**Key Changes**:
- **Database Cleanup**: Removed redundant client user from main users table that was no longer needed after client-user separation
- **Schema Alignment**: Fixed foreign key constraints to properly align with the dual authentication architecture
- **Deployment Scripts**: Updated all deployment scripts (bash and PowerShell) to reflect current system architecture
- **Database Initialization**: Updated both development and production init scripts with proper user name fields and client authentication structure
- **Documentation**: Updated deployment script output to clearly show separate admin/staff and client portal accounts

### Enhanced User Management with Name Fields
**Date**: January 4, 2025  
**Description**: Added comprehensive name fields to user management system with automatic display name population.

**Key Changes**:
- **Database Schema**: Added `forename`, `surname`, and `displayName` fields to users table
- **User Creation**: Enhanced create user form with first name, last name, and auto-populated display name
- **User Editing**: Updated edit user dialog to include all name fields with role assignment and status management
- **Admin Navigation**: Display names now shown in admin navigation instead of usernames for better UX
- **Form Validation**: Automatic display name generation from first and last names during form input
- **UI Consistency**: User table and profile displays use display names when available, falling back to usernames

### Major Architecture Refactoring: Client-User Separation
**Date**: January 4, 2025  
**Description**: Completed major refactoring to completely separate client management from user management system.

**Key Changes**:
- **Database Schema**: Added `client_users` table to completely decouple clients from the main users system
- **Authentication Systems**: Implemented dual authentication architecture:
  - Admin/Staff users continue using RBAC-based authentication system
  - Clients now have completely independent authentication with separate login endpoints
- **API Routes**: Created dedicated client API routes (`/api/client/*`) for client-specific functionality
- **Frontend Updates**: 
  - Created dedicated client login page (`/client/login`)
  - Updated client dashboard to use separate client authentication system
  - Removed client role dependencies from main navigation system
- **Media Assignment**: Updated media feedback and timeline systems to properly connect to client user accounts
- **Session Management**: Separate session handling for client users vs admin/staff users

**Impact**: This change ensures that when media is assigned to clients, it properly connects to their corresponding login accounts, providing a cleaner separation of concerns and better user experience for clients.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: Custom Passport.js implementation with local strategy
- **Session Management**: Express sessions with PostgreSQL storage
- **Password Security**: Node.js crypto module with scrypt hashing
- **File Upload**: Multer middleware

### Database Architecture
- **Database**: PostgreSQL (via Neon serverless for Replit, local for Docker)
- **ORM**: Drizzle ORM
- **Schema**: Full RBAC implementation (users, roles, permissions, junction tables)
- **Migrations**: Drizzle Kit

### Key Features & Design Decisions
- **Authentication System**: Custom local authentication using secure scrypt hashing and session-based authentication without JWTs.
- **Dual Authentication Architecture**: Completely separate authentication systems:
  - **Admin/Staff Authentication**: Traditional RBAC system with roles and permissions for internal users
  - **Client Authentication**: Independent client user system with direct client associations
- **Role-Based Access Control (RBAC)**: Granular permissions system (`users`, `roles`, `permissions`, `user_roles`, `role_permissions` tables) with custom middleware for route protection - applies only to admin/staff users.
- **Client Management System**: Separate client user system (`client_users` table) that connects clients to their own authentication accounts, completely decoupled from the main user management system.
- **Media Management**: File upload, categorization, tagging, featured media selection, and client-specific media assignment with proper linkage to client user accounts.
- **Website Customization System**: Admin interface for managing background media (images/videos) and sections (Hero, Featured Work, Services) with specific video requirements (auto-play, muted, looped, no controls).
- **UI/UX Design**: Cinematic dark/light theme, responsive layout, glass morphism effects, cinematic shadows, custom color scheme, and smooth animations.
- **Data Flow**: Defined authentication, RBAC, and media upload flows ensuring secure and efficient data handling with separate client and admin workflows.
- **Deployment Strategy**: Monorepo structure with separate configurations for development and production environments, including comprehensive Docker support for Windows and Linux with isolated databases and persistent volumes.
- **Security Considerations**: Secure session configuration, CSRF protection, crypto-secure password hashing, environment-based secret management, and trusted proxy configurations.

## External Dependencies

### Core Dependencies
- `@neondatabase/serverless`: PostgreSQL database connection (for Replit environment)
- `drizzle-orm`: Type-safe database ORM
- `passport`: Authentication middleware
- `express-session`: Session management
- `multer`: File upload handling
- `bcrypt`: Password hashing (backup option)

### Frontend Dependencies
- `@tanstack/react-query`: Server state management
- `@radix-ui/*`: Accessible UI primitives
- `wouter`: Lightweight routing
- `react-hook-form`: Form management
- `zod`: Schema validation
- `tailwindcss`: Utility-first CSS framework
- `@dnd-kit/*`: Drag and drop functionalities

### Development Dependencies
- `vite`: Fast build tool and dev server
- `typescript`: Type safety
- `drizzle-kit`: Database migration tool
- `@replit/vite-plugin-*`: Replit-specific development tools
- `tsx`: TypeScript execution in development