# Database Population Summary - dt.visuals Docker Setup

## Overview
Both Docker environments now automatically populate their databases with appropriate data after schema creation.

## Development Environment Database Population

### Automatic Setup Includes:
- **3 Test Users** with secure scrypt-hashed passwords:
  - Admin: admin@dtvisuals.com / admin123 (full permissions)
  - Staff: staff@dtvisuals.com / staff123 (media + client management)
  - Client: client@example.com / client123 (view only)

- **Complete RBAC System**:
  - 3 Roles: Admin, Staff, Client
  - 11 Permissions: upload:media, edit:media, delete:media, assign:client, view:media, view:clients, edit:clients, edit:users, edit:roles, edit:website, view:analytics
  - Proper role-permission assignments

- **Test Clients**:
  - Acme Corporation (corporate client)
  - Creative Studios (agency client)

- **Sample Media Content**:
  - Corporate Brand Video (featured)
  - Product Photography (featured)  
  - Behind the Scenes Video (private)
  - Client media assignments for testing

- **Website Settings**:
  - Hero section background configuration
  - Featured section background setup

### Deployment Command:
```powershell
.\deploy-dev-fixed.ps1
```

The script automatically calls `populate_dev_test_data()` after schema migration.

## Production Environment Database Population

### Automatic Setup Includes:
- **Default Admin User**:
  - Email: admin@dtvisuals.com
  - Password: admin123 (⚠️ MUST be changed immediately!)
  - Full administrator permissions

- **Complete RBAC Foundation**:
  - Admin role with all permissions
  - All permission definitions for future role creation
  - Secure foundation for production deployment

### Deployment Command:
```powershell
.\deploy-prod-fixed.ps1
```

The script automatically calls `create_default_admin()` after schema migration.

## Security Features

### Password Security:
- Uses Node.js crypto.scrypt algorithm
- Proper salt generation for each password
- Production-level security implementation
- Format: `salt:hash` (both hex-encoded)

### Production Security:
- Default admin password must be changed immediately
- Clear security warnings in deployment output
- Minimal data footprint for production start

## Technical Implementation

### Database Functions:
- **Development**: `populate_dev_test_data()` - Comprehensive test environment
- **Production**: `create_default_admin()` - Minimal secure setup

### Smart Population:
- Functions check if tables exist and are empty
- Prevents duplicate data on re-runs
- Safe to execute multiple times
- Proper error handling and logging

### Integration Points:
- Executes after Drizzle schema migration
- Uses PostgreSQL container for execution
- Error handling in deployment scripts
- Success confirmation messages

## Environment Differences

| Feature | Development | Production |
|---------|-------------|------------|
| Users | 3 test users | 1 admin user |
| Clients | 2 test clients | None |
| Media | 3 sample items | None |
| RBAC | Full setup | Admin-only setup |
| Purpose | Complete testing | Secure foundation |

## Usage After Deployment

### Development Testing:
1. Login with any test account
2. Test different permission levels
3. Upload and assign media
4. Use timeline features
5. Test client feedback system

### Production Setup:
1. Login as admin@dtvisuals.com / admin123
2. **IMMEDIATELY** change password
3. Create additional users and roles
4. Configure website settings
5. Upload production media

## Troubleshooting

If database population fails:
```powershell
# Check if function exists
docker-compose -f docker-compose.dev.yml exec postgres-dev psql -U postgres -d dt_visuals_dev -c "\df populate_dev_test_data"

# Manually run population
docker-compose -f docker-compose.dev.yml exec postgres-dev psql -U postgres -d dt_visuals_dev -c "SELECT populate_dev_test_data();"
```

## Files Modified:
- `docker/postgres/init-dev.sql` - Development data population function
- `docker/postgres/init-prod.sql` - Production admin user creation function
- `deploy-dev-fixed.ps1` - Added test data population step
- `deploy-prod-fixed.ps1` - Added admin user creation step
- `deploy-dev.bat` - Added test data population step
- `replit.md` - Updated documentation

The database population system is now fully integrated into the Docker deployment process, providing immediate usability for both development testing and production deployment.