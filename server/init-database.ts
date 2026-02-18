import { db, pool } from './db.js';
import { sql } from 'drizzle-orm';
import { users, roles, permissions, userRoles, rolePermissions } from '../shared/schema.js';

export async function initializeDatabase() {
  console.log('🔧 Initializing database for current environment...');
  
  try {
    // First, ensure the database schema exists
    await ensureDatabaseSchema();
    
    // Check if we're in a fresh database by counting users
    const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
    const currentUserCount = Number(userCount[0]?.count || 0);
    
    if (currentUserCount === 0) {
      console.log('📝 Database appears empty, creating essential data...');
      await createEssentialData();
    } else {
      console.log(`✅ Database already has ${currentUserCount} users, checking admin access...`);
      await ensureAdminExists();
    }
    
    console.log('✅ Database initialization completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.error('Server will continue but some features may not work properly');
    // Don't throw - let the server start anyway
    return false;
  }
}

async function createEssentialData() {
  console.log('Creating essential roles and permissions...');
  
  // Create roles
  const adminRoleId = crypto.randomUUID();
  const staffRoleId = crypto.randomUUID();
  const clientRoleId = crypto.randomUUID();
  
  await db.insert(roles).values([
    { id: adminRoleId, name: 'Admin', description: 'Full system administrator with all permissions' },
    { id: staffRoleId, name: 'Staff', description: 'Staff member with limited administrative access' },
    { id: clientRoleId, name: 'Client', description: 'Client user with view-only access to assigned content' }
  ]).onConflictDoNothing();
  
  console.log('Created base roles');
  
  // Create permissions
  const permissionData = [
    { name: 'manage:system', description: 'Full system management access' },
    { name: 'edit:users', description: 'Can create/edit staff users' },
    { name: 'edit:roles', description: 'Can create/edit roles and permissions' },
    { name: 'edit:clients', description: 'Can create/edit client information' },
    { name: 'upload:media', description: 'Can upload and manage media files' },
    { name: 'edit:media', description: 'Can edit media information and assignments' },
    { name: 'view:media', description: 'Can view assigned media content' },
    { name: 'edit:website', description: 'Can customize website settings and appearance' },
    { name: 'view:admin', description: 'Can access admin dashboard' },
    { name: 'view:analytics', description: 'Can view system analytics and reports' },
    { name: 'delete:media', description: 'Can delete media files' },
    { name: 'manage:feedback', description: 'Can view and manage client feedback' }
  ];
  
  const permissionIds: { [key: string]: string } = {};
  const permissionValues = permissionData.map(p => {
    const id = crypto.randomUUID();
    permissionIds[p.name] = id;
    return { id, ...p };
  });
  
  await db.insert(permissions).values(permissionValues).onConflictDoNothing();
  console.log('Created permissions');
  
  // Assign permissions to roles
  const adminPermissions = Object.values(permissionIds); // Admin gets all permissions
  const staffPermissions = [
    permissionIds['edit:clients'],
    permissionIds['upload:media'],
    permissionIds['edit:media'],
    permissionIds['view:media'],
    permissionIds['edit:website'],
    permissionIds['view:admin'],
    permissionIds['manage:feedback']
  ];
  
  const rolePermissionValues = [
    ...adminPermissions.map(permId => ({ roleId: adminRoleId, permissionId: permId })),
    ...staffPermissions.map(permId => ({ roleId: staffRoleId, permissionId: permId }))
  ];
  
  await db.insert(rolePermissions).values(rolePermissionValues).onConflictDoNothing();
  console.log('Assigned permissions to roles');
  
  // Create admin user
  await createAdminUser(adminRoleId);
}

async function createAdminUser(adminRoleId?: string) {
  // Password is "admin123" hashed with scrypt
  const hashedPassword = 'df10c71f317ded80d49fc8ebd89b928fdb6706e3bb45ea330da8a7caa009d98ebc3c57461844955f37b7dbb5651a00c42a0a924e7030550d4eb8bb2b1196878a.4e8dad95ff12fe8b727f303f8ac1a12f';
  
  const adminUserId = crypto.randomUUID();
  
  await db.insert(users).values({
    id: adminUserId,
    username: 'admin',
    email: 'admin@dtvisuals.com',
    password: hashedPassword,
    forename: 'Admin',
    surname: 'User',
    displayName: 'Admin User',
    isActive: true
  }).onConflictDoNothing();
  
  console.log('Created admin user: admin@dtvisuals.com / admin123');
  
  // Assign admin role if provided
  if (adminRoleId) {
    await db.insert(userRoles).values({
      userId: adminUserId,
      roleId: adminRoleId
    }).onConflictDoNothing();
  } else {
    // Find existing admin role
    const existingAdminRole = await db.select().from(roles).where(sql`name = 'Admin'`).limit(1);
    if (existingAdminRole.length > 0) {
      await db.insert(userRoles).values({
        userId: adminUserId,
        roleId: existingAdminRole[0].id
      }).onConflictDoNothing();
    }
  }
  
  console.log('Assigned admin role to user');
}

async function ensureAdminExists() {
  // Check if any admin user exists
  const adminUsers = await db.select({ count: sql<number>`count(*)` })
    .from(users)
    .innerJoin(userRoles, sql`${users.id} = ${userRoles.userId}`)
    .innerJoin(roles, sql`${userRoles.roleId} = ${roles.id}`)
    .where(sql`${roles.name} = 'Admin'`);
  
  const adminCount = Number(adminUsers[0]?.count || 0);
  
  if (adminCount === 0) {
    console.log('⚠️  No admin user found, creating emergency admin...');
    await createAdminUser();
  } else {
    console.log(`✅ Found ${adminCount} admin user(s)`);
  }
}

async function ensureDatabaseSchema() {
  console.log('🔍 Checking database schema...');
  
  try {
    // Use Drizzle sql to check if the users table exists
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    const tableExists = result.rows[0]?.exists;
    
    if (!tableExists) {
      console.log('📦 Database schema missing, running migrations...');
      
      // Try to run Drizzle push programmatically
      try {
        const { execSync } = await import('child_process');
        execSync('npx drizzle-kit push', { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
        console.log('✅ Database schema created successfully');
      } catch (migrationError) {
        console.log('⚠️  npm run db:push failed, trying alternative schema creation...');
        
        // Fallback: Create essential tables manually
        await createBasicSchema();
      }
    } else {
      console.log('✅ Database schema already exists');
    }
  } catch (error) {
    console.error('❌ Schema check failed:', error);
    console.log('🔧 Attempting to create basic schema...');
    await createBasicSchema();
  }
}

async function createBasicSchema() {
  console.log('🛠️  Creating basic database schema...');
  
  // Create essential tables if they don't exist
  const createTablesSQL = `
    -- Create users table
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      forename TEXT,
      surname TEXT,
      display_name TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create roles table
    CREATE TABLE IF NOT EXISTS roles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create permissions table
    CREATE TABLE IF NOT EXISTS permissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create user_roles junction table
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, role_id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create role_permissions junction table
    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
      permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
      PRIMARY KEY (role_id, permission_id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create comprehensive media management tables
    CREATE TABLE IF NOT EXISTS media (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      url TEXT NOT NULL,
      poster_url TEXT,
      filename TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT,
      is_featured BOOLEAN DEFAULT false,
      show_in_portfolio BOOLEAN DEFAULT true,
      tags TEXT[],
      project_stage TEXT,
      notes TEXT,
      client_id VARCHAR,
      uploaded_by VARCHAR NOT NULL,
      created_at TIMESTAMP DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS clients (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      company TEXT,
      phone TEXT,
      notes TEXT,
      is_active BOOLEAN DEFAULT true,
      created_by VARCHAR NOT NULL,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS client_users (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id VARCHAR NOT NULL,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT now(),
      last_login_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS media_clients (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      media_id VARCHAR NOT NULL,
      client_id VARCHAR NOT NULL
    );

    CREATE TABLE IF NOT EXISTS website_settings (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      section TEXT UNIQUE NOT NULL,
      background_image_id VARCHAR,
      background_video_id VARCHAR,
      contact_email TEXT,
      contact_phone TEXT,
      contact_address TEXT,
      updated_by VARCHAR NOT NULL,
      updated_at TIMESTAMP DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS branding_settings (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      company_name TEXT DEFAULT 'dt.visuals' NOT NULL,
      show_company_text BOOLEAN DEFAULT true NOT NULL,
      show_trading_info BOOLEAN DEFAULT false NOT NULL,
      logo_light_image_id VARCHAR,
      logo_dark_image_id VARCHAR,
      favicon_image_id VARCHAR,
      updated_by VARCHAR NOT NULL,
      updated_at TIMESTAMP DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS media_feedback (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      media_id VARCHAR NOT NULL,
      client_user_id VARCHAR NOT NULL,
      feedback_text TEXT,
      rating INTEGER,
      created_at TIMESTAMP DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS media_timeline_notes (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      media_id VARCHAR NOT NULL,
      client_user_id VARCHAR NOT NULL,
      timestamp_seconds INTEGER NOT NULL,
      note_text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT now()
    );
  `;

  try {
    await db.execute(sql.raw(createTablesSQL));
    console.log('✅ Basic schema created successfully');
  } catch (error) {
    console.error('❌ Failed to create basic schema:', error);
    throw error;
  }
}

// Environment detection
export function getEnvironmentInfo() {
  const isReplit = process.env.REPLIT_DB_URL || process.env.DATABASE_URL?.includes('neon');
  const isDocker = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('postgres-');
  
  return {
    isReplit,
    isDocker,
    environment: isReplit ? 'replit' : isDocker ? 'docker' : 'local',
    databaseUrl: process.env.DATABASE_URL
  };
}