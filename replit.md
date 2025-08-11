# dt.visuals - Cinematic Media Production Website

## Overview
dt.visuals is a full-stack showcase website for a cinematic media production company. It features a modern React frontend with a Node.js/Express backend, implementing a complete Role-Based Access Control (RBAC) system with custom authentication. The project's ambition is to provide a robust platform for showcasing media, managing clients, and facilitating internal operations within a media production company. It emphasizes a cinematic aesthetic with a black and white color palette, accented by dark teal and muted orange highlights, and includes robust SEO implementation.

## User Preferences
Preferred communication style: Simple, everyday language.

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
- **Authentication System**: Custom local authentication using secure scrypt hashing and session-based authentication.
- **Dual Authentication Architecture**: Completely separate authentication systems for Admin/Staff (RBAC) and Clients (independent client user system).
- **Role-Based Access Control (RBAC)**: Granular permissions system for admin/staff users with custom middleware for route protection.
- **Client Management System**: Separate `client_users` table and dedicated API routes for decoupling clients from the main user system.
- **Media Management**: File upload, categorization, tagging, featured media selection, and client-specific media assignment linked to client user accounts.
- **Website Customization System**: Admin interface for managing background media (images/videos) across all website sections (homepage sections, portfolio, about, services, contact pages) with specific video requirements (auto-play, muted, looped, no controls). Supports dual light/dark mode logo system.
- **UI/UX Design**: Cinematic dark/light theme, responsive layout, glass morphism effects, cinematic shadows, custom color scheme, and smooth animations. Incorporates user preference for theme-based blank backgrounds and dynamic navigation adjustments.
- **Deployment Strategy**: Monorepo structure with comprehensive Docker support (Windows/Linux), automatic environment detection (Replit Neon/Docker PostgreSQL) for database configuration and admin user creation, and complete Let's Encrypt SSL automation with automatic certificate generation and renewal.
- **Security Considerations**: Secure session configuration, CSRF protection, crypto-secure password hashing, environment-based secret management, and trusted proxy configurations.
- **Enhanced User Management**: Includes `forename`, `surname`, and `displayName` fields for users with auto-population and improved UI consistency.

## External Dependencies

### Core Dependencies
- `@neondatabase/serverless`: PostgreSQL database connection (for Replit environment)
- `drizzle-orm`: Type-safe database ORM
- `passport`: Authentication middleware
- `express-session`: Session management
- `multer`: File upload handling

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

### Deployment & Infrastructure
- **SSL Automation**: Complete Let's Encrypt integration with automatic certificate generation, renewal, and nginx configuration
- **Docker Orchestration**: Multi-environment support (production/development) with health checking and graceful startup sequences
- **CI/CD Pipeline**: GitHub Actions with automated SSL deployment and comprehensive logging