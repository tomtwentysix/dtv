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
  filename: text("filename").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  isFeatured: boolean("is_featured").default(false),
  showInPortfolio: boolean("show_in_portfolio").default(true), // Controls public visibility
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
  section: text("section").notNull().unique(), // 'hero', 'featured_work', 'services', 'portfolio_header', 'portfolio_gallery', 'about_header', 'about_values', 'services_header', 'services_section', 'services_cta'
  backgroundImageId: varchar("background_image_id").references(() => media.id),
  backgroundVideoId: varchar("background_video_id").references(() => media.id),
  updatedBy: varchar("updated_by").notNull().references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const mediaFeedback = pgTable("media_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mediaId: varchar("media_id").notNull().references(() => media.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  feedbackText: text("feedback_text"),
  rating: integer("rating"), // 1-5 stars
  createdAt: timestamp("created_at").defaultNow(),
});

export const mediaTimelineNotes = pgTable("media_timeline_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mediaId: varchar("media_id").notNull().references(() => media.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
  client: one(users, {
    fields: [mediaFeedback.clientId],
    references: [users.id],
  }),
}));

export const mediaTimelineNotesRelations = relations(mediaTimelineNotes, ({ one }) => ({
  media: one(media, {
    fields: [mediaTimelineNotes.mediaId],
    references: [media.id],
  }),
  client: one(users, {
    fields: [mediaTimelineNotes.clientId],
    references: [users.id],
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
  updater: one(users, {
    fields: [websiteSettings.updatedBy],
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

export const insertMediaSchema = createInsertSchema(media).omit({
  id: true,
  createdAt: true,
});

export const insertMediaClientSchema = createInsertSchema(mediaClients).omit({
  id: true,
});

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
export type Media = typeof media.$inferSelect;
export type InsertMedia = z.infer<typeof insertMediaSchema>;
export type MediaClient = typeof mediaClients.$inferSelect;
export type InsertMediaClient = z.infer<typeof insertMediaClientSchema>;
export type WebsiteSettings = typeof websiteSettings.$inferSelect;
export type InsertWebsiteSettings = z.infer<typeof insertWebsiteSettingsSchema>;
export type UserRole = typeof userRoles.$inferSelect;
export type RolePermission = typeof rolePermissions.$inferSelect;
