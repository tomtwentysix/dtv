import { 
  users, 
  clients,
  clientUsers,
  roles, 
  permissions, 
  userRoles, 
  rolePermissions, 
  media, 
  mediaClients,
  websiteSettings,
  brandingSettings,
  mediaFeedback,
  mediaTimelineNotes,
  type User, 
  type InsertUser,
  type Client,
  type InsertClient,
  type ClientUser,
  type InsertClientUser,
  type Role,
  type InsertRole,
  type Permission,
  type InsertPermission,
  type Media,
  type InsertMedia,
  type MediaClient,
  type InsertMediaClient,
  type WebsiteSettings,
  type InsertWebsiteSettings,
  type BrandingSettings,
  type InsertBrandingSettings
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, sql } from "drizzle-orm";
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
  
  // Client User management (for client authentication)
  getClientUser(id: string): Promise<ClientUser | undefined>;
  getClientUserByUsername(username: string): Promise<ClientUser | undefined>;
  getClientUserByEmail(email: string): Promise<ClientUser | undefined>;
  getClientUserByClientId(clientId: string): Promise<ClientUser | undefined>;
  createClientUser(clientUser: InsertClientUser): Promise<ClientUser>;
  updateClientUser(id: string, updates: Partial<InsertClientUser>): Promise<ClientUser | undefined>;
  deleteClientUser(id: string): Promise<boolean>;
  updateClientUserLastLogin(id: string): Promise<void>;
  
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
  updateMediaWebpUrl(id: string, webpUrl: string): Promise<Media | undefined>;
  updateMediaThumbnailWebpUrl(id: string, thumbnailWebpUrl: string): Promise<Media | undefined>;
  deleteMedia(id: string): Promise<boolean>;
  
  // Media-Client associations
  assignMediaToClient(mediaId: string, clientId: string): Promise<boolean>;
  removeMediaFromClient(mediaId: string, clientId: string): Promise<boolean>;
  getClientMedia(clientId: string): Promise<Media[]>;
  getClientUserMedia(clientUserId: string): Promise<Media[]>;
  getMediaClients(mediaId: string): Promise<Client[]>;
  
  // Website settings
  getWebsiteSettings(): Promise<WebsiteSettings[]>;
  getWebsiteSettingBySection(section: string): Promise<WebsiteSettings | undefined>;
  updateWebsiteSetting(section: string, setting: InsertWebsiteSettings): Promise<WebsiteSettings>;
  getBackgroundImages(): Promise<Media[]>;
  
  // Contact information management
  getContactInfo(): Promise<WebsiteSettings | undefined>;
  updateContactInfo(contactInfo: { contactEmail?: string; contactPhone?: string; contactAddress?: string; instagramUrl?: string; facebookUrl?: string; linkedinUrl?: string; updatedBy: string }): Promise<WebsiteSettings>;
  
  // Branding settings management
  getBrandingSettings(): Promise<BrandingSettings | undefined>;
  updateBrandingSettings(updates: Partial<InsertBrandingSettings>): Promise<BrandingSettings>;
  
  // SEO settings management  
  getSeoSettings(): Promise<WebsiteSettings | undefined>;
  updateSeoSettings(seoSettings: { seoTitle?: string; seoDescription?: string; seoKeywords?: string; seoAuthor?: string; seoRobots?: string; seoCanonicalUrl?: string; seoOgImageUrl?: string; seoTwitterImageUrl?: string; updatedBy: string }): Promise<WebsiteSettings>;
  
  // Client feedback and timeline notes (now using clientUserId)
  createMediaFeedback(feedback: { mediaId: string; clientUserId: string; feedbackText: string; rating: number }): Promise<any>;
  getClientUserFeedback(clientUserId: string): Promise<any[]>;
  createTimelineNote(note: { mediaId: string; clientUserId: string; timestampSeconds: number; noteText: string }): Promise<any>;
  getClientUserTimelineNotes(clientUserId: string): Promise<any[]>;
  
  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool: pool as any, 
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

  // Client User management (for client authentication)
  async getClientUser(id: string): Promise<ClientUser | undefined> {
    const [clientUser] = await db.select().from(clientUsers).where(eq(clientUsers.id, id));
    return clientUser || undefined;
  }

  async getClientUserByUsername(username: string): Promise<ClientUser | undefined> {
    const [clientUser] = await db.select().from(clientUsers).where(eq(clientUsers.username, username));
    return clientUser || undefined;
  }

  async getClientUserByEmail(email: string): Promise<ClientUser | undefined> {
    const [clientUser] = await db.select().from(clientUsers).where(eq(clientUsers.email, email));
    return clientUser || undefined;
  }

  async getClientUserByClientId(clientId: string): Promise<ClientUser | undefined> {
    const [clientUser] = await db.select().from(clientUsers).where(eq(clientUsers.clientId, clientId));
    return clientUser || undefined;
  }

  async createClientUser(insertClientUser: InsertClientUser): Promise<ClientUser> {
    const [clientUser] = await db
      .insert(clientUsers)
      .values(insertClientUser)
      .returning();
    return clientUser;
  }

  async updateClientUser(id: string, updates: Partial<InsertClientUser>): Promise<ClientUser | undefined> {
    const [clientUser] = await db
      .update(clientUsers)
      .set(updates)
      .where(eq(clientUsers.id, id))
      .returning();
    return clientUser || undefined;
  }

  async deleteClientUser(id: string): Promise<boolean> {
    const result = await db.delete(clientUsers).where(eq(clientUsers.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async updateClientUserLastLogin(id: string): Promise<void> {
    await db
      .update(clientUsers)
      .set({ lastLoginAt: new Date() })
      .where(eq(clientUsers.id, id));
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

  async getAllMedia(): Promise<(Media & { assignedClients?: Client[] })[]> {
    const allMedia = await db.select().from(media);
    
    // For each media item, get assigned clients
    const mediaWithClients = await Promise.all(
      allMedia.map(async (mediaItem) => {
        const assignedClients = await this.getMediaClients(mediaItem.id);
        return { ...mediaItem, assignedClients };
      })
    );
    
    return mediaWithClients;
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

  async createMedia(insertMedia: InsertMedia & { clientId?: string | null }): Promise<Media> {
    // Extract clientId if provided
    const { clientId, ...mediaData } = insertMedia;
    
    const [mediaItem] = await db
      .insert(media)
      .values(mediaData)
      .returning();
    
    // If a client is specified, create assignment in media_clients table
    if (clientId) {
      await db.insert(mediaClients).values({ mediaId: mediaItem.id, clientId });
    }
    
    return mediaItem;
  }

  async updateMedia(id: string, updates: Partial<InsertMedia> & { clientId?: string | null }): Promise<Media | undefined> {
    // Handle client assignment separately using media_clients table
    let clientId: string | null | undefined;
    const mediaUpdates = { ...updates };
    
    // Extract clientId from updates if present
    if ('clientId' in updates) {
      clientId = updates.clientId;
      delete mediaUpdates.clientId; // Remove from media table updates
    }
    
    // Only update media record if there are fields to update
    let mediaItem: Media;
    if (Object.keys(mediaUpdates).length > 0) {
      const [updatedMedia] = await db
        .update(media)
        .set(mediaUpdates)
        .where(eq(media.id, id))
        .returning();
      
      if (!updatedMedia) return undefined;
      mediaItem = updatedMedia;
    } else {
      // If no media fields to update, just get the current record
      const [currentMedia] = await db.select().from(media).where(eq(media.id, id));
      if (!currentMedia) return undefined;
      mediaItem = currentMedia;
    }
    
    // Handle client assignment via media_clients table
    if (clientId !== undefined) {
      // First, remove all existing assignments for this media
      await db.delete(mediaClients).where(eq(mediaClients.mediaId, id));
      
      // If a client is specified (not null), create new assignment
      if (clientId !== null) {
        await db.insert(mediaClients).values({ mediaId: id, clientId });
      }
    }
    
    return mediaItem;
  }

  async deleteMedia(id: string): Promise<boolean> {
    const result = await db.delete(media).where(eq(media.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async updateMediaWebpUrl(id: string, webpUrl: string): Promise<Media | undefined> {
    const [updatedMedia] = await db
      .update(media)
      .set({ webpUrl })
      .where(eq(media.id, id))
      .returning();
    return updatedMedia || undefined;
  }

  async updateMediaThumbnailWebpUrl(id: string, thumbnailWebpUrl: string): Promise<Media | undefined> {
    const [updatedMedia] = await db
      .update(media)
      .set({ thumbnailWebpUrl })
      .where(eq(media.id, id))
      .returning();
    return updatedMedia || undefined;
  }

  // Media-Client associations
  async assignMediaToClient(mediaId: string, clientId: string): Promise<boolean> {
    try {
      // Check if assignment already exists
      const existing = await db
        .select()
        .from(mediaClients)
        .where(and(eq(mediaClients.mediaId, mediaId), eq(mediaClients.clientId, clientId)));
      
      if (existing.length > 0) {
        return true; // Already assigned
      }
      
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

  async getClientUserMedia(clientUserId: string): Promise<Media[]> {
    // Get the client ID from client user ID, then get media assigned to that client
    const clientUser = await this.getClientUser(clientUserId);
    if (!clientUser) return [];
    
    return await this.getClientMedia(clientUser.clientId);
  }

  async getMediaClients(mediaId: string): Promise<Client[]> {
    const mediaClientResults = await db
      .select({ client: clients })
      .from(mediaClients)
      .innerJoin(clients, eq(mediaClients.clientId, clients.id))
      .where(eq(mediaClients.mediaId, mediaId));
    
    return mediaClientResults.map(result => result.client);
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
      .set({ 
        backgroundImageId: insertSetting.backgroundImageId,
        backgroundVideoId: insertSetting.backgroundVideoId,
        updatedBy: insertSetting.updatedBy,
        updatedAt: new Date() 
      })
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

  async getBackgroundImages(): Promise<Media[]> {
    // Get all background images referenced in website settings
    const settings = await db.select().from(websiteSettings).where(
      // Only get settings that have a background image ID
      sql`background_image_id IS NOT NULL`
    );
    
    const imageIds = settings
      .map(s => s.backgroundImageId)
      .filter((id): id is string => id !== null && id !== undefined);
    
    if (imageIds.length === 0) return [];
    
    return await db.select().from(media).where(inArray(media.id, imageIds));
  }

  // Client feedback and timeline notes implementation (now using clientUserId)
  async createMediaFeedback(feedback: { mediaId: string; clientUserId: string; feedbackText: string; rating: number }): Promise<any> {
    const [result] = await db
      .insert(mediaFeedback)
      .values(feedback)
      .returning();
    return result;
  }

  async getClientUserFeedback(clientUserId: string): Promise<any[]> {
    const results = await db
      .select()
      .from(mediaFeedback)
      .where(eq(mediaFeedback.clientUserId, clientUserId));
    return results;
  }

  async createTimelineNote(note: { mediaId: string; clientUserId: string; timestampSeconds: number; noteText: string }): Promise<any> {
    const [result] = await db
      .insert(mediaTimelineNotes)
      .values(note)
      .returning();
    return result;
  }

  async getClientUserTimelineNotes(clientUserId: string): Promise<any[]> {
    const results = await db
      .select()
      .from(mediaTimelineNotes)
      .where(eq(mediaTimelineNotes.clientUserId, clientUserId));
    return results;
  }

  // Contact information management implementation
  async getContactInfo(): Promise<WebsiteSettings | undefined> {
    const [contactSetting] = await db
      .select()
      .from(websiteSettings)
      .where(eq(websiteSettings.section, 'contact_info'))
      .limit(1);
    return contactSetting;
  }

  async updateContactInfo(contactInfo: { contactEmail?: string; contactPhone?: string; contactAddress?: string; instagramUrl?: string; facebookUrl?: string; linkedinUrl?: string; updatedBy: string }): Promise<WebsiteSettings> {
    const section = 'contact_info';
    
    // Try to update existing setting first
    const [existingSetting] = await db
      .update(websiteSettings)
      .set({ 
        contactEmail: contactInfo.contactEmail,
        contactPhone: contactInfo.contactPhone,
        contactAddress: contactInfo.contactAddress,
        instagramUrl: contactInfo.instagramUrl,
        facebookUrl: contactInfo.facebookUrl,
        linkedinUrl: contactInfo.linkedinUrl,
        updatedBy: contactInfo.updatedBy,
        updatedAt: new Date() 
      })
      .where(eq(websiteSettings.section, section))
      .returning();

    // If no existing setting, create a new one
    if (!existingSetting) {
      const [newSetting] = await db
        .insert(websiteSettings)
        .values({ 
          section,
          contactEmail: contactInfo.contactEmail,
          contactPhone: contactInfo.contactPhone,
          contactAddress: contactInfo.contactAddress,
          instagramUrl: contactInfo.instagramUrl,
          facebookUrl: contactInfo.facebookUrl,
          linkedinUrl: contactInfo.linkedinUrl,
          updatedBy: contactInfo.updatedBy
        })
        .returning();
      return newSetting;
    }

    return existingSetting;
  }

  // Branding settings management
  async getBrandingSettings(): Promise<BrandingSettings | undefined> {
    const [settings] = await db
      .select()
      .from(brandingSettings)
      .limit(1);
    
    if (!settings) return undefined;

    // Fetch related media separately
    const [logoLightImage, logoDarkImage, faviconImage, openGraphImage] = await Promise.all([
      settings.logoLightImageId ? this.getMedia(settings.logoLightImageId) : null,
      settings.logoDarkImageId ? this.getMedia(settings.logoDarkImageId) : null,
      settings.faviconImageId ? this.getMedia(settings.faviconImageId) : null,
      settings.openGraphImageId ? this.getMedia(settings.openGraphImageId) : null,
    ]);
    
    return {
      ...settings,
      logoLightImage: logoLightImage ? {
        id: logoLightImage.id,
        url: logoLightImage.url,
        title: logoLightImage.title,
      } : null,
      logoDarkImage: logoDarkImage ? {
        id: logoDarkImage.id,
        url: logoDarkImage.url,
        title: logoDarkImage.title,
      } : null,
      faviconImage: faviconImage ? {
        id: faviconImage.id,
        url: faviconImage.url,
        title: faviconImage.title,
      } : null,
      openGraphImage: openGraphImage ? {
        id: openGraphImage.id,
        url: openGraphImage.url,
        title: openGraphImage.title,
      } : null,
    } as BrandingSettings;
  }

  async updateBrandingSettings(updates: Partial<InsertBrandingSettings>): Promise<BrandingSettings> {
    // First try to get existing settings
    const existing = await this.getBrandingSettings();
    
    if (existing) {
      // Update existing settings
      const [updated] = await db
        .update(brandingSettings)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(brandingSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new settings if none exist
      const [created] = await db
        .insert(brandingSettings)
        .values(updates as InsertBrandingSettings)
        .returning();
      return created;
    }
  }

  async getSeoSettings(): Promise<WebsiteSettings | undefined> {
    const [seoSettings] = await db
      .select()
      .from(websiteSettings)
      .where(eq(websiteSettings.section, 'seo_settings'))
      .limit(1);

    return seoSettings;
  }

  async updateSeoSettings(seoInfo: { seoTitle?: string; seoDescription?: string; seoKeywords?: string; seoAuthor?: string; seoRobots?: string; seoCanonicalUrl?: string; seoOgImageUrl?: string; seoTwitterImageUrl?: string; updatedBy: string }): Promise<WebsiteSettings> {
    // First try to get existing SEO settings
    const existing = await this.getSeoSettings();
    
    if (existing) {
      // Update existing SEO settings
      const [updated] = await db
        .update(websiteSettings)
        .set({
          seoTitle: seoInfo.seoTitle,
          seoDescription: seoInfo.seoDescription,
          seoKeywords: seoInfo.seoKeywords,
          seoAuthor: seoInfo.seoAuthor,
          seoRobots: seoInfo.seoRobots,
          seoCanonicalUrl: seoInfo.seoCanonicalUrl,
          seoOgImageUrl: seoInfo.seoOgImageUrl,
          seoTwitterImageUrl: seoInfo.seoTwitterImageUrl,
          updatedBy: seoInfo.updatedBy,
          updatedAt: new Date()
        })
        .where(eq(websiteSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new SEO settings if none exist
      const [created] = await db
        .insert(websiteSettings)
        .values({
          section: 'seo_settings',
          seoTitle: seoInfo.seoTitle,
          seoDescription: seoInfo.seoDescription,
          seoKeywords: seoInfo.seoKeywords,
          seoAuthor: seoInfo.seoAuthor,
          seoRobots: seoInfo.seoRobots,
          seoCanonicalUrl: seoInfo.seoCanonicalUrl,
          seoOgImageUrl: seoInfo.seoOgImageUrl,
          seoTwitterImageUrl: seoInfo.seoTwitterImageUrl,
          updatedBy: seoInfo.updatedBy,
        } as InsertWebsiteSettings)
        .returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
