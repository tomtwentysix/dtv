import { db } from './db.js';
import { sql } from 'drizzle-orm';
import { users, roles, permissions, userRoles, rolePermissions } from '../shared/schema.js';

export async function initializeDatabase() {
  console.log('🔧 Initializing database for current environment...');
  
  try {
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
    throw error;
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