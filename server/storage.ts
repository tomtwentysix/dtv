import { 
  users, 
  clients,
  roles, 
  permissions, 
  userRoles, 
  rolePermissions, 
  media, 
  mediaClients,
  websiteSettings,
  mediaFeedback,
  mediaTimelineNotes,
  type User, 
  type InsertUser,
  type Client,
  type InsertClient,
  type Role,
  type InsertRole,
  type Permission,
  type InsertPermission,
  type Media,
  type InsertMedia,
  type MediaClient,
  type InsertMediaClient,
  type WebsiteSettings,
  type InsertWebsiteSettings
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getUsers(): Promise<User[]>;
  
  // Client management
  getClient(id: string): Promise<Client | undefined>;
  getClientByEmail(email: string): Promise<Client | undefined>;
  getAllClients(): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, updates: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;
  
  // Role management
  getRole(id: string): Promise<Role | undefined>;
  getRoleByName(name: string): Promise<Role | undefined>;
  getAllRoles(): Promise<Role[]>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: string, updates: Partial<InsertRole>): Promise<Role | undefined>;
  deleteRole(id: string): Promise<boolean>;
  
  // Permission management
  getPermission(id: string): Promise<Permission | undefined>;
  getPermissionByName(name: string): Promise<Permission | undefined>;
  getAllPermissions(): Promise<Permission[]>;
  createPermission(permission: InsertPermission): Promise<Permission>;
  updatePermission(id: string, updates: Partial<InsertPermission>): Promise<Permission | undefined>;
  deletePermission(id: string): Promise<boolean>;
  
  // User-Role associations
  assignRoleToUser(userId: string, roleId: string): Promise<boolean>;
  removeRoleFromUser(userId: string, roleId: string): Promise<boolean>;
  getUserRoles(userId: string): Promise<Role[]>;
  getUsersWithRole(roleId: string): Promise<User[]>;
  
  // Role-Permission associations
  assignPermissionToRole(roleId: string, permissionId: string): Promise<boolean>;
  removePermissionFromRole(roleId: string, permissionId: string): Promise<boolean>;
  getRolePermissions(roleId: string): Promise<Permission[]>;
  getUserPermissions(userId: string): Promise<Permission[]>;
  
  // Media management
  getMedia(id: string): Promise<Media | undefined>;
  getMediaByIds(ids: string[]): Promise<Media[]>;
  getAllMedia(): Promise<Media[]>;
  getFeaturedMedia(): Promise<Media[]>;
  getPortfolioMedia(): Promise<Media[]>; // Only media marked for portfolio display
  getMediaByUploader(uploaderId: string): Promise<Media[]>;
  createMedia(media: InsertMedia): Promise<Media>;
  updateMedia(id: string, updates: Partial<InsertMedia>): Promise<Media | undefined>;
  deleteMedia(id: string): Promise<boolean>;
  
  // Media-Client associations
  assignMediaToClient(mediaId: string, clientId: string): Promise<boolean>;
  removeMediaFromClient(mediaId: string, clientId: string): Promise<boolean>;
  getClientMedia(clientId: string): Promise<Media[]>;
  getMediaClients(mediaId: string): Promise<User[]>;
  
  // Website settings
  getWebsiteSettings(): Promise<WebsiteSettings[]>;
  getWebsiteSettingBySection(section: string): Promise<WebsiteSettings | undefined>;
  updateWebsiteSetting(section: string, setting: InsertWebsiteSettings): Promise<WebsiteSettings>;
  
  // Client feedback and timeline notes
  createMediaFeedback(feedback: { mediaId: string; clientId: string; feedbackText: string; rating: number }): Promise<any>;
  getClientFeedback(clientId: string): Promise<any[]>;
  createTimelineNote(note: { mediaId: string; clientId: string; timestampSeconds: number; noteText: string }): Promise<any>;
  getClientTimelineNotes(clientId: string): Promise<any[]>;
  
  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User management
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Client management
  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async getClientByEmail(email: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.email, email));
    return client || undefined;
  }

  async getAllClients(): Promise<Client[]> {
    return await db.select().from(clients);
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db
      .insert(clients)
      .values(insertClient)
      .returning();
    return client;
  }

  async updateClient(id: string, updates: Partial<InsertClient>): Promise<Client | undefined> {
    const [client] = await db
      .update(clients)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return client || undefined;
  }

  async deleteClient(id: string): Promise<boolean> {
    const result = await db.delete(clients).where(eq(clients.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Role management
  async getRole(id: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role || undefined;
  }

  async getRoleByName(name: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.name, name));
    return role || undefined;
  }

  async getAllRoles(): Promise<Role[]> {
    return await db.select().from(roles);
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const [role] = await db
      .insert(roles)
      .values(insertRole)
      .returning();
    return role;
  }

  async updateRole(id: string, updates: Partial<InsertRole>): Promise<Role | undefined> {
    const [role] = await db
      .update(roles)
      .set(updates)
      .where(eq(roles.id, id))
      .returning();
    return role || undefined;
  }

  async deleteRole(id: string): Promise<boolean> {
    const result = await db.delete(roles).where(eq(roles.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Permission management
  async getPermission(id: string): Promise<Permission | undefined> {
    const [permission] = await db.select().from(permissions).where(eq(permissions.id, id));
    return permission || undefined;
  }

  async getPermissionByName(name: string): Promise<Permission | undefined> {
    const [permission] = await db.select().from(permissions).where(eq(permissions.name, name));
    return permission || undefined;
  }

  async getAllPermissions(): Promise<Permission[]> {
    return await db.select().from(permissions);
  }

  async createPermission(insertPermission: InsertPermission): Promise<Permission> {
    const [permission] = await db
      .insert(permissions)
      .values(insertPermission)
      .returning();
    return permission;
  }

  async updatePermission(id: string, updates: Partial<InsertPermission>): Promise<Permission | undefined> {
    const [permission] = await db
      .update(permissions)
      .set(updates)
      .where(eq(permissions.id, id))
      .returning();
    return permission || undefined;
  }

  async deletePermission(id: string): Promise<boolean> {
    const result = await db.delete(permissions).where(eq(permissions.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // User-Role associations
  async assignRoleToUser(userId: string, roleId: string): Promise<boolean> {
    try {
      await db.insert(userRoles).values({ userId, roleId });
      return true;
    } catch {
      return false;
    }
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<boolean> {
    const result = await db
      .delete(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    const userRoleResults = await db
      .select({ role: roles })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));
    
    return userRoleResults.map(result => result.role);
  }

  async getUsersWithRole(roleId: string): Promise<User[]> {
    const userRoleResults = await db
      .select({ user: users })
      .from(userRoles)
      .innerJoin(users, eq(userRoles.userId, users.id))
      .where(eq(userRoles.roleId, roleId));
    
    return userRoleResults.map(result => result.user);
  }

  // Role-Permission associations
  async assignPermissionToRole(roleId: string, permissionId: string): Promise<boolean> {
    try {
      await db.insert(rolePermissions).values({ roleId, permissionId });
      return true;
    } catch {
      return false;
    }
  }

  async removePermissionFromRole(roleId: string, permissionId: string): Promise<boolean> {
    const result = await db
      .delete(rolePermissions)
      .where(and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.permissionId, permissionId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const rolePermissionResults = await db
      .select({ permission: permissions })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId));
    
    return rolePermissionResults.map(result => result.permission);
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    const userPermissionResults = await db
      .select({ permission: permissions })
      .from(userRoles)
      .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(userRoles.userId, userId));
    
    return userPermissionResults.map(result => result.permission);
  }

  // Media management
  async getMedia(id: string): Promise<Media | undefined> {
    const [mediaItem] = await db.select().from(media).where(eq(media.id, id));
    return mediaItem || undefined;
  }

  async getMediaByIds(ids: string[]): Promise<Media[]> {
    if (ids.length === 0) return [];
    return await db.select().from(media).where(inArray(media.id, ids));
  }

  async getAllMedia(): Promise<Media[]> {
    return await db.select().from(media);
  }

  async getFeaturedMedia(): Promise<Media[]> {
    return await db.select().from(media).where(eq(media.isFeatured, true));
  }

  async getPortfolioMedia(): Promise<Media[]> {
    return await db.select().from(media).where(eq(media.showInPortfolio, true));
  }

  async getMediaByUploader(uploaderId: string): Promise<Media[]> {
    return await db.select().from(media).where(eq(media.uploadedBy, uploaderId));
  }

  async createMedia(insertMedia: InsertMedia): Promise<Media> {
    const [mediaItem] = await db
      .insert(media)
      .values(insertMedia)
      .returning();
    return mediaItem;
  }

  async updateMedia(id: string, updates: Partial<InsertMedia>): Promise<Media | undefined> {
    const [mediaItem] = await db
      .update(media)
      .set(updates)
      .where(eq(media.id, id))
      .returning();
    return mediaItem || undefined;
  }

  async deleteMedia(id: string): Promise<boolean> {
    const result = await db.delete(media).where(eq(media.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Media-Client associations
  async assignMediaToClient(mediaId: string, clientId: string): Promise<boolean> {
    try {
      await db.insert(mediaClients).values({ mediaId, clientId });
      return true;
    } catch {
      return false;
    }
  }

  async removeMediaFromClient(mediaId: string, clientId: string): Promise<boolean> {
    const result = await db
      .delete(mediaClients)
      .where(and(eq(mediaClients.mediaId, mediaId), eq(mediaClients.clientId, clientId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getClientMedia(clientId: string): Promise<Media[]> {
    const clientMediaResults = await db
      .select({ media: media })
      .from(mediaClients)
      .innerJoin(media, eq(mediaClients.mediaId, media.id))
      .where(eq(mediaClients.clientId, clientId));
    
    return clientMediaResults.map(result => result.media);
  }

  async getMediaClients(mediaId: string): Promise<User[]> {
    const mediaClientResults = await db
      .select({ user: users })
      .from(mediaClients)
      .innerJoin(users, eq(mediaClients.clientId, users.id))
      .where(eq(mediaClients.mediaId, mediaId));
    
    return mediaClientResults.map(result => result.user);
  }

  // Website settings
  async getWebsiteSettings(): Promise<WebsiteSettings[]> {
    return await db.select().from(websiteSettings);
  }

  async getWebsiteSettingBySection(section: string): Promise<WebsiteSettings | undefined> {
    const [setting] = await db.select().from(websiteSettings).where(eq(websiteSettings.section, section));
    return setting || undefined;
  }

  async updateWebsiteSetting(section: string, insertSetting: InsertWebsiteSettings): Promise<WebsiteSettings> {
    // Try to update existing setting first
    const [existingSetting] = await db
      .update(websiteSettings)
      .set({ ...insertSetting, updatedAt: new Date() })
      .where(eq(websiteSettings.section, section))
      .returning();

    // If no existing setting, create a new one
    if (!existingSetting) {
      const [newSetting] = await db
        .insert(websiteSettings)
        .values({ ...insertSetting, section })
        .returning();
      return newSetting;
    }

    return existingSetting;
  }

  // Client feedback and timeline notes implementation
  async createMediaFeedback(feedback: { mediaId: string; clientId: string; feedbackText: string; rating: number }): Promise<any> {
    const [result] = await db
      .insert(mediaFeedback)
      .values(feedback)
      .returning();
    return result;
  }

  async getClientFeedback(clientId: string): Promise<any[]> {
    const results = await db
      .select()
      .from(mediaFeedback)
      .where(eq(mediaFeedback.clientId, clientId));
    return results;
  }

  async createTimelineNote(note: { mediaId: string; clientId: string; timestampSeconds: number; noteText: string }): Promise<any> {
    const [result] = await db
      .insert(mediaTimelineNotes)
      .values(note)
      .returning();
    return result;
  }

  async getClientTimelineNotes(clientId: string): Promise<any[]> {
    const results = await db
      .select()
      .from(mediaTimelineNotes)
      .where(eq(mediaTimelineNotes.clientId, clientId));
    return results;
  }
}

export const storage = new DatabaseStorage();
