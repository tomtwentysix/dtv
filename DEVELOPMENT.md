# Development Guide

## Prerequisites

Before setting up the DT Visuals application, ensure you have:

1. **Node.js 20+ LTS** - Download from [nodejs.org](https://nodejs.org/)
2. **PostgreSQL** - Install locally or use a cloud provider
3. **Git** - For version control

## Initial Setup

### 1. Database Setup

Create a PostgreSQL database for the application:

```bash
# Using psql command line
createdb dtvisuals

# Or using PostgreSQL client
CREATE DATABASE dtvisuals;
```

### 2. Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your actual values:
   ```env
   DATABASE_URL=postgresql://yourusername:yourpassword@localhost:5432/dtvisuals
   SESSION_SECRET=a-very-long-random-string-for-sessions
   NODE_ENV=development
   ```

### 3. Install Dependencies and Setup

```bash
# Install all dependencies
npm install

# Push database schema (creates tables)
npm run db:push

# Start development server
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Development Workflow

### Available Scripts

- `npm run dev` - Start development servers (frontend + backend)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes

### Making Changes

1. **Frontend changes**: Edit files in `client/src/` - hot reloading is enabled
2. **Backend changes**: Edit files in `server/` - server will restart automatically
3. **Database changes**: Update schema in `shared/schema.ts` and run `npm run db:push`

### Project Structure

```
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/            # Page components/routes
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities and helpers
│   │   └── main.tsx          # App entry point
│   └── index.html            # HTML template
│
├── server/                     # Express.js backend
│   ├── index.ts              # Server entry point
│   ├── routes.ts             # API routes
│   ├── auth.ts               # Authentication logic
│   ├── db.ts                 # Database connection
│   ├── middleware/           # Express middleware
│   └── init-database.ts      # Database initialization
│
├── shared/                     # Shared code
│   └── schema.ts             # Database schema & validation
│
├── migrations/                 # Database migrations
├── attached_assets/           # Static assets
└── dist/                      # Built files (created by build)
```

## Features

The application includes:

- **Authentication & Authorization**: User login, role-based permissions
- **Media Management**: File uploads, image/video handling
- **Portfolio Management**: Project showcases and galleries
- **User Administration**: User and role management
- **Responsive Design**: Mobile-friendly interface

## Troubleshooting

### Common Issues

1. **Database connection errors**
   - Verify PostgreSQL is running
   - Check DATABASE_URL in `.env`
   - Ensure database exists

2. **Build failures**
   - Clear node_modules: `rm -rf node_modules package-lock.json && npm install`
   - Check Node.js version: `node --version` (should be 20+)

3. **Port conflicts**
   - Frontend (5173) or backend (5000) ports in use
   - Change ports in `vite.config.ts` or server configuration

### Development Tips

- Use browser dev tools for debugging frontend issues
- Check server logs in terminal for backend issues
- Use `npm run check` to catch TypeScript errors early
- Database changes require `npm run db:push` to apply

## Contributing

1. Create a feature branch from `clean-app`
2. Make your changes
3. Test thoroughly
4. Submit a pull request with clear description