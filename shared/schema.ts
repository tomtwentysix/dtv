import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  forename: text("forename").notNull(),
  surname: text("surname").notNull(),
  displayName: text("display_name").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  company: text("company"),
  phone: text("phone"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Separate authentication table for client logins
export const clientUsers = pgTable("client_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

export const roles = pgTable("roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const permissions = pgTable("permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const userRoles = pgTable("user_roles", {
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: varchar("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.roleId] }),
}));

export const rolePermissions = pgTable("role_permissions", {
  roleId: varchar("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permissionId: varchar("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
}));

export const media = pgTable("media", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  type: text("type").notNull(), // 'image' | 'video'
  url: text("url").notNull(),
  posterUrl: text("poster_url"), // For video poster frames
  thumbnailUrl: text("thumbnail_url"), // For optimized thumbnails
  thumbnailWebpUrl: text("thumbnail_webp_url"), // For WebP optimized thumbnails
  webpUrl: text("webp_url"), // For WebP optimized backgrounds
  filename: text("filename").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  isFeatured: boolean("is_featured").default(false),
  showInPortfolio: boolean("show_in_portfolio").default(false), // Controls public visibility - changed default to false
  tags: text("tags").array(),
  projectStage: text("project_stage"), // 'concept', 'pre-production', 'production', 'post-production', 'completed', 'delivered'
  notes: text("notes"),
  clientId: varchar("client_id").references(() => clients.id), // Direct client assignment
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mediaClients = pgTable("media_clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mediaId: varchar("media_id").notNull().references(() => media.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
});

export const websiteSettings = pgTable("website_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  section: text("section").notNull().unique(), // 'hero', 'what_we_do', 'who_we_work_with', 'how_we_work', 'retainer_partnerships', 'who_weve_worked_with', 'lets_connect', 'portfolio_header', 'portfolio_gallery', 'about_header', 'about_values', 'services_header', 'services_section', 'services_cta', 'contact_info'
  backgroundImageId: varchar("background_image_id").references(() => media.id),
  backgroundVideoId: varchar("background_video_id").references(() => media.id),
  // Contact information fields
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  contactAddress: text("contact_address"),
  // Social media links
  instagramUrl: text("instagram_url"),
  facebookUrl: text("facebook_url"),
  linkedinUrl: text("linkedin_url"),
  updatedBy: varchar("updated_by").notNull().references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const brandingSettings = pgTable("branding_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull().default("dt.visuals"),
  showCompanyText: boolean("show_company_text").notNull().default(true),
  logoLightImageId: varchar("logo_light_image_id").references(() => media.id),
  logoDarkImageId: varchar("logo_dark_image_id").references(() => media.id),
  faviconImageId: varchar("favicon_image_id").references(() => media.id),
  openGraphImageId: varchar("open_graph_image_id").references(() => media.id),
  showTradingDetails: boolean("show_trading_details").notNull().default(false),
  updatedBy: varchar("updated_by").notNull().references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const seoSettings = pgTable("seo_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Basic SEO
  metaTitle: text("meta_title").default("Video Production Company | Luxury Events, Music & Brands | DT Visuals UK"),
  metaDescription: text("meta_description").default("DT Visuals is a UK-based video production team creating cinematic content for luxury events, artists, brands and agencies. Based in Leicestershire, working UK-wide."),
  metaKeywords: text("meta_keywords").default("video production company UK, cinematic video production, luxury event videographer, corporate video production, music video production UK, video production Leicestershire, creative video agency, branded content production, monthly video retainer UK"),
  canonicalUrl: text("canonical_url").default("https://dtvisuals.com/"),
  
  // Open Graph & Twitter
  openGraphImageId: varchar("open_graph_image_id").references(() => media.id),
  twitterImageId: varchar("twitter_image_id").references(() => media.id),
  
  // Business Info for Structured Data
  businessName: text("business_name").default("DT Visuals"),
  businessDescription: text("business_description").default("Professional video production company specializing in luxury events, music videos, and branded content"),
  businessType: text("business_type").default("VideoProductionService"),
  businessUrl: text("business_url").default("https://dtvisuals.com"),
  
  // Location Data
  addressLocality: text("address_locality").default("Leicestershire"),
  addressRegion: text("address_region").default("England"),
  addressCountry: text("address_country").default("GB"),
  postalCode: text("postal_code"),
  streetAddress: text("street_address"),
  latitude: text("latitude").default("52.6369"),
  longitude: text("longitude").default("-1.1398"),
  
  // Contact for Structured Data
  businessEmail: text("business_email").default("hello@dtvisuals.com"),
  businessPhone: text("business_phone"),
  
  // Services for Structured Data (JSON array as text)
  services: text("services").default('["Luxury Event Videography","Corporate Video Production","Music Video Production","Creative Direction","Post-Production Services"]'),
  
  // FAQ Data (JSON array as text)
  faqs: text("faqs").default('[]'),
  
  // Other SEO Settings
  enableStructuredData: boolean("enable_structured_data").default(true),
  enableOpenGraph: boolean("enable_open_graph").default(true),
  enableTwitterCards: boolean("enable_twitter_cards").default(true),
  robotsDirective: text("robots_directive").default("index, follow"),
  
  updatedBy: varchar("updated_by").notNull().references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const mediaFeedback = pgTable("media_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mediaId: varchar("media_id").notNull().references(() => media.id, { onDelete: "cascade" }),
  clientUserId: varchar("client_user_id").notNull().references(() => clientUsers.id, { onDelete: "cascade" }),
  feedbackText: text("feedback_text"),
  rating: integer("rating"), // 1-5 stars
  createdAt: timestamp("created_at").defaultNow(),
});

export const mediaTimelineNotes = pgTable("media_timeline_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mediaId: varchar("media_id").notNull().references(() => media.id, { onDelete: "cascade" }),
  clientUserId: varchar("client_user_id").notNull().references(() => clientUsers.id, { onDelete: "cascade" }),
  timestampSeconds: integer("timestamp_seconds").notNull(),
  noteText: text("note_text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
  uploadedMedia: many(media),
  createdClients: many(clients),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [clients.createdBy],
    references: [users.id],
  }),
  assignedMedia: many(mediaClients),
  directAssignedMedia: many(media),
  clientUsers: many(clientUsers),
}));

export const clientUsersRelations = relations(clientUsers, ({ one, many }) => ({
  client: one(clients, {
    fields: [clientUsers.clientId],
    references: [clients.id],
  }),
  mediaFeedback: many(mediaFeedback),
  timelineNotes: many(mediaTimelineNotes),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  rolePermissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const mediaRelations = relations(media, ({ one, many }) => ({
  uploader: one(users, {
    fields: [media.uploadedBy],
    references: [users.id],
  }),
  assignedClient: one(clients, {
    fields: [media.clientId],
    references: [clients.id],
  }),
  mediaClients: many(mediaClients),
  feedback: many(mediaFeedback),
  timelineNotes: many(mediaTimelineNotes),
}));

export const mediaFeedbackRelations = relations(mediaFeedback, ({ one }) => ({
  media: one(media, {
    fields: [mediaFeedback.mediaId],
    references: [media.id],
  }),
  clientUser: one(clientUsers, {
    fields: [mediaFeedback.clientUserId],
    references: [clientUsers.id],
  }),
}));

export const mediaTimelineNotesRelations = relations(mediaTimelineNotes, ({ one }) => ({
  media: one(media, {
    fields: [mediaTimelineNotes.mediaId],
    references: [media.id],
  }),
  clientUser: one(clientUsers, {
    fields: [mediaTimelineNotes.clientUserId],
    references: [clientUsers.id],
  }),
}));

export const mediaClientsRelations = relations(mediaClients, ({ one }) => ({
  media: one(media, {
    fields: [mediaClients.mediaId],
    references: [media.id],
  }),
  client: one(clients, {
    fields: [mediaClients.clientId],
    references: [clients.id],
  }),
}));

export const websiteSettingsRelations = relations(websiteSettings, ({ one }) => ({
  backgroundImage: one(media, {
    fields: [websiteSettings.backgroundImageId],
    references: [media.id],
  }),
  backgroundVideo: one(media, {
    fields: [websiteSettings.backgroundVideoId],
    references: [media.id],
  }),
  updater: one(users, {
    fields: [websiteSettings.updatedBy],
    references: [users.id],
  }),
}));

export const brandingSettingsRelations = relations(brandingSettings, ({ one }) => ({
  logoLightImage: one(media, {
    fields: [brandingSettings.logoLightImageId],
    references: [media.id],
    relationName: "logoLightImage",
  }),
  logoDarkImage: one(media, {
    fields: [brandingSettings.logoDarkImageId],
    references: [media.id],
    relationName: "logoDarkImage", 
  }),
  faviconImage: one(media, {
    fields: [brandingSettings.faviconImageId],
    references: [media.id],
  }),
  openGraphImage: one(media, {
    fields: [brandingSettings.openGraphImageId],
    references: [media.id],
    relationName: "openGraphImage",
  }),
  updater: one(users, {
    fields: [brandingSettings.updatedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
});

export const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientUserSchema = createInsertSchema(clientUsers).omit({
  id: true,
  createdAt: true,
  lastLoginAt: true,
});

export const insertMediaSchema = createInsertSchema(media).omit({
  id: true,
  createdAt: true,
});

export const insertMediaClientSchema = createInsertSchema(mediaClients).omit({
  id: true,
});

export const insertBrandingSettingsSchema = createInsertSchema(brandingSettings).omit({
  id: true,
  updatedAt: true,
});

// Types
export type BrandingSettings = typeof brandingSettings.$inferSelect;
export type InsertBrandingSettings = typeof insertBrandingSettingsSchema._type;

export const insertSeoSettingsSchema = createInsertSchema(seoSettings).omit({
  id: true,
  updatedAt: true,
});

// Types  
export type SeoSettings = typeof seoSettings.$inferSelect;
export type InsertSeoSettings = typeof insertSeoSettingsSchema._type;

export const insertWebsiteSettingsSchema = createInsertSchema(websiteSettings).omit({
  id: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type ClientUser = typeof clientUsers.$inferSelect;
export type InsertClientUser = z.infer<typeof insertClientUserSchema>;
export type Media = typeof media.$inferSelect;
export type InsertMedia = z.infer<typeof insertMediaSchema>;
export type MediaClient = typeof mediaClients.$inferSelect;
export type InsertMediaClient = z.infer<typeof insertMediaClientSchema>;
export type WebsiteSettings = typeof websiteSettings.$inferSelect;
export type InsertWebsiteSettings = z.infer<typeof insertWebsiteSettingsSchema>;
export type UserRole = typeof userRoles.$inferSelect;
export type RolePermission = typeof rolePermissions.$inferSelect;
