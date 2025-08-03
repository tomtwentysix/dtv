# Docker Deployment Guide for Timeline Functionality

This guide addresses the specific issues that can cause timeline functionality to be missing when running the dt.visuals application in Docker containers.

## Timeline Functionality Overview

The timeline feature allows clients to:
- Add timestamped notes to video content
- View existing timeline notes sorted by timestamp
- Navigate to specific video timestamps
- Associate feedback with specific video moments

## Common Docker-Related Issues and Solutions

### 1. Environment Variables
The timeline functionality depends on proper environment configuration:

```bash
# Required environment variables
NODE_ENV=production
DATABASE_URL=postgresql://postgres:password@postgres:5432/dt_visuals
SESSION_SECRET=your-secure-session-secret
ENABLE_TIMELINE=true
```

### 2. Database Connectivity
Timeline functionality requires the `media_timeline_notes` table to be properly migrated:

```bash
# Run in container to ensure migrations
docker exec <container-name> npm run db:push
```

### 3. Port Binding
Ensure the application binds to `0.0.0.0` instead of `localhost` for Docker:

```javascript
// server/index.ts should use:
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
```

### 4. Volume Mounting
Mount persistent volumes for uploads and database data:

```yaml
volumes:
  - ./uploads:/app/uploads
  - postgres_data:/var/lib/postgresql/data
```

## Deployment Instructions

### Using Docker Compose (Recommended)

1. **Copy environment file:**
   ```bash
   cp .env.docker .env
   ```

2. **Build and start services:**
   ```bash
   docker-compose up --build -d
   ```

3. **Check service health:**
   ```bash
   docker-compose logs app
   curl http://localhost:5000/api/health
   ```

4. **Run database migrations:**
   ```bash
   docker-compose exec app npm run db:push
   ```

### Using Docker Build

1. **Build the image:**
   ```bash
   docker build -t dt-visuals:latest .
   ```

2. **Run with external database:**
   ```bash
   docker run -d \
     --name dt-visuals \
     -p 5000:5000 \
     -e DATABASE_URL="your-database-url" \
     -e SESSION_SECRET="your-session-secret" \
     -v ./uploads:/app/uploads \
     dt-visuals:latest
   ```

## Troubleshooting Timeline Issues

### Issue: Timeline notes not saving
**Symptoms:** Notes form appears but submissions fail
**Solutions:**
1. Check database connectivity: `docker logs <container-name>`
2. Verify `/api/client/media/timeline-notes` endpoint is accessible
3. Ensure client authentication is working

### Issue: Timeline interface not appearing
**Symptoms:** Timeline tabs missing from video modal
**Solutions:**
1. Check user permissions in database
2. Verify client role has proper access
3. Check browser console for JavaScript errors

### Issue: Video timestamps not working
**Symptoms:** Video playback works but timestamp capture fails
**Solutions:**
1. Ensure video element has proper event listeners
2. Check CORS settings for video files
3. Verify video metadata is loading correctly

## API Endpoints for Timeline

The following endpoints must be accessible in Docker:

- `GET /api/client/media/timeline-notes` - Fetch user's timeline notes
- `POST /api/client/media/:mediaId/timeline-notes` - Create new timeline note
- `GET /api/admin/media/timeline-notes` - Admin view of all timeline notes

## Database Schema Verification

Ensure the timeline table exists:

```sql
-- Connect to your database and verify:
\d media_timeline_notes;

-- Should show:
-- id (varchar, primary key)
-- media_id (varchar, foreign key to media.id)
-- client_id (varchar, foreign key to users.id)
-- timestamp_seconds (integer)
-- note_text (text)
-- created_at (timestamp)
```

## Container Resource Requirements

For proper timeline functionality:
- **Memory:** Minimum 512MB, recommended 1GB+
- **CPU:** 1 vCPU minimum for video processing
- **Storage:** Persistent volumes for uploads and database

## Security Considerations

1. **Database Access:** Use environment variables, not hardcoded credentials
2. **Session Security:** Generate secure session secrets
3. **File Uploads:** Properly validate video file types
4. **CORS:** Configure appropriate CORS headers for video content

## Monitoring Timeline Health

The health check endpoint includes timeline status:

```bash
curl http://localhost:5000/api/health
# Response includes: "timeline_functionality": "enabled"
```

Monitor for these logs:
- Timeline note creation: `Timeline note added successfully`
- Database connections: `Database connection successful`
- Video processing: Video metadata loaded

## Performance Optimization

For better timeline performance in Docker:

1. **Use multi-stage builds** to reduce image size
2. **Enable PostgreSQL connection pooling**
3. **Implement video thumbnail generation**
4. **Use CDN for video content** in production
5. **Configure proper caching headers**