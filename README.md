# DT Visuals

> Full-stack web application for cinematic media production company

## Getting Started

### Prerequisites

- Node.js 20+ LTS
- PostgreSQL (or compatible database)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/tomtwentysix/dtv.git
   cd dtv
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Copy the example environment file and configure it:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your actual database connection and other configuration values.

4. **Set up the database:**
   ```bash
   npm run db:push
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

## Architecture

**Stack:** React + TypeScript + Vite + Node.js + Express + PostgreSQL

**Key Features:**
- React frontend with TypeScript
- Express.js REST API backend
- PostgreSQL database with Drizzle ORM
- Authentication and authorization
- File upload and media management
- Responsive design with Tailwind CSS

## Project Structure

```
├── client/                     # React frontend application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom React hooks
│   │   └── lib/              # Utility functions
├── server/                     # Express.js backend
│   ├── routes.ts             # API routes
│   ├── auth.ts               # Authentication logic
│   ├── db.ts                 # Database connection
│   └── middleware/           # Express middleware
├── shared/                     # Shared types and schemas
├── migrations/                 # Database migrations
└── attached_assets/           # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run start` - Start production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes

## Development

The application runs in development mode with hot reloading enabled. The frontend development server runs on port 5173, and the backend API runs on port 5000.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test your changes
5. Submit a pull request

---

**Built for DT Visuals** ✨