import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import path from "path";
import fs from "fs";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users, media, mediaFeedback, mediaTimelineNotes, clientUsers, clients } from "@shared/schema";
import { requireAuth, requirePermission, requireRole, requireAnyRole } from "./middleware/rbac";
import { requireClientAuth, loginClientUser, registerClientUser } from "./client-auth";
import multer from "multer";

// Initialize default roles and permissions
async function initializeRBAC() {
  try {
    // Create default permissions
    const defaultPermissions = [
      { name: "upload:media", description: "Can upload new media" },
      { name: "assign:media", description: "Can assign media to clients" },
      { name: "delete:media", description: "Can delete media" },
      { name: "view:clients", description: "Can view client profiles" },
      { name: "edit:users", description: "Can create/edit staff users" },
      { name: "edit:roles", description: "Can create/edit roles and permissions" },
      { name: "view:analytics", description: "Can view analytics and stats" },
      { name: "manage:system", description: "Full system management access" },
    ];

    for (const perm of defaultPermissions) {
      const existing = await storage.getPermissionByName(perm.name);
      if (!existing) {
        await storage.createPermission(perm);
      }
    }

    // Create default roles
    const adminRole = await storage.getRoleByName("Admin");
    if (!adminRole) {
      const newAdminRole = await storage.createRole({
        name: "Admin",
        description: "Full access to all admin features",
      });
      
      // Assign all permissions to admin
      const allPermissions = await storage.getAllPermissions();
      for (const permission of allPermissions) {
        await storage.assignPermissionToRole(newAdminRole.id, permission.id);
      }
    }

    const staffRole = await storage.getRoleByName("Staff");
    if (!staffRole) {
      const newStaffRole = await storage.createRole({
        name: "Staff",
        description: "Limited access based on assigned permissions",
      });
      
      // Assign basic permissions to staff
      const basicPermissions = ["upload:media", "assign:media", "view:clients"];
      for (const permName of basicPermissions) {
        const permission = await storage.getPermissionByName(permName);
        if (permission) {
          await storage.assignPermissionToRole(newStaffRole.id, permission.id);
        }
      }
    }

    // Note: Client role removed - clients now have their own authentication system separate from users
  } catch (error) {
    console.error("Error initializing RBAC:", error);
  }
}

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for video files
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/png", 
      "image/gif",
      "video/mp4",
      "video/mov",
      "video/avi",
      "video/mkv",
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize RBAC system
  await initializeRBAC();
  
  // Setup authentication
  setupAuth(app);

  // Serve uploaded files
  app.use("/uploads", express.static(uploadDir));

  // API Routes

  // Health check endpoint for Docker
  app.get("/api/health", (req, res) => {
    res.status(200).json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development"
    });
  });

  // Contact form endpoint
  app.post("/api/contact", async (req, res) => {
    try {
      const { firstName, lastName, email, projectType, message } = req.body;
      
      // Here you would typically send an email or save to database
      console.log("Contact form submission:", { firstName, lastName, email, projectType, message });
      
      res.json({ message: "Message sent successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // User roles and permissions for frontend
  app.get("/api/user/roles", requireAuth, async (req, res) => {
    try {
      const roles = await storage.getUserRoles(req.user!.id);
      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user roles" });
    }
  });

  app.get("/api/user/permissions", requireAuth, async (req, res) => {
    try {
      const permissions = await storage.getUserPermissions(req.user!.id);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user permissions" });
    }
  });

  // User management routes
  app.get("/api/users", requireAuth, requirePermission("edit:users"), async (req, res) => {
    try {
      // Get all users with their roles
      const allUsers = await storage.getUsers();
      const usersWithRoles = await Promise.all(
        allUsers.map(async (user) => ({
          ...user,
          roles: await storage.getUserRoles(user.id),
        }))
      );
      res.json(usersWithRoles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireAuth, requirePermission("edit:users"), async (req, res) => {
    try {
      const { username, email, password, forename, surname, displayName } = req.body;
      const { scrypt, randomBytes } = await import("crypto");
      const { promisify } = await import("util");
      const scryptAsync = promisify(scrypt);
      
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync(password, salt, 64)) as Buffer;
      const hashedPassword = `${buf.toString("hex")}.${salt}`;
      
      const user = await storage.createUser({ 
        username, 
        email, 
        password: hashedPassword,
        forename,
        surname,
        displayName
      });
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", requireAuth, requirePermission("edit:users"), async (req, res) => {
    try {
      const { username, email, forename, surname, displayName, isActive, password } = req.body;
      
      let updateData: any = { 
        username, 
        email, 
        forename, 
        surname, 
        displayName, 
        isActive 
      };
      
      // If password is provided, hash it
      if (password) {
        const { scrypt, randomBytes } = await import("crypto");
        const { promisify } = await import("util");
        const scryptAsync = promisify(scrypt);
        
        const salt = randomBytes(16).toString("hex");
        const buf = (await scryptAsync(password, salt, 64)) as Buffer;
        const hashedPassword = `${buf.toString("hex")}.${salt}`;
        updateData.password = hashedPassword;
      }
      
      const user = await storage.updateUser(req.params.id, updateData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", requireAuth, requirePermission("edit:users"), async (req, res) => {
    try {
      const success = await storage.deleteUser(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.put("/api/users/:id/roles", requireAuth, requirePermission("edit:users"), async (req, res) => {
    try {
      const { roleIds } = req.body;
      const userId = req.params.id;
      
      // Get current user roles
      const currentRoles = await storage.getUserRoles(userId);
      const currentRoleIds = currentRoles.map(role => role.id);
      
      // Remove roles that are no longer selected
      for (const roleId of currentRoleIds) {
        if (!roleIds.includes(roleId)) {
          await storage.removeRoleFromUser(userId, roleId);
        }
      }
      
      // Add new roles
      for (const roleId of roleIds) {
        if (!currentRoleIds.includes(roleId)) {
          await storage.assignRoleToUser(userId, roleId);
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user roles" });
    }
  });

  // Role management routes
  app.get("/api/roles", requireAuth, requirePermission("edit:roles"), async (req, res) => {
    try {
      const roles = await storage.getAllRoles();
      const rolesWithPermissions = await Promise.all(
        roles.map(async (role) => ({
          ...role,
          permissions: await storage.getRolePermissions(role.id),
        }))
      );
      res.json(rolesWithPermissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  app.post("/api/roles", requireAuth, requirePermission("edit:roles"), async (req, res) => {
    try {
      const role = await storage.createRole(req.body);
      res.status(201).json(role);
    } catch (error) {
      res.status(500).json({ message: "Failed to create role" });
    }
  });

  app.put("/api/roles/:id", requireAuth, requirePermission("edit:roles"), async (req, res) => {
    try {
      const role = await storage.updateRole(req.params.id, req.body);
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      res.json(role);
    } catch (error) {
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  app.delete("/api/roles/:id", requireAuth, requirePermission("edit:roles"), async (req, res) => {
    try {
      const success = await storage.deleteRole(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Role not found" });
      }
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete role" });
    }
  });

  // Permission management routes
  app.get("/api/permissions", requireAuth, requirePermission("edit:roles"), async (req, res) => {
    try {
      const permissions = await storage.getAllPermissions();
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  app.post("/api/permissions", requireAuth, requirePermission("edit:roles"), async (req, res) => {
    try {
      const permission = await storage.createPermission(req.body);
      res.status(201).json(permission);
    } catch (error) {
      res.status(500).json({ message: "Failed to create permission" });
    }
  });

  // Role-Permission assignment routes
  app.post("/api/roles/:roleId/permissions/:permissionId", requireAuth, requirePermission("edit:roles"), async (req, res) => {
    try {
      const success = await storage.assignPermissionToRole(req.params.roleId, req.params.permissionId);
      if (!success) {
        return res.status(400).json({ message: "Failed to assign permission" });
      }
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to assign permission" });
    }
  });

  app.delete("/api/roles/:roleId/permissions/:permissionId", requireAuth, requirePermission("edit:roles"), async (req, res) => {
    try {
      const success = await storage.removePermissionFromRole(req.params.roleId, req.params.permissionId);
      if (!success) {
        return res.status(400).json({ message: "Failed to remove permission" });
      }
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to remove permission" });
    }
  });

  // User-Role assignment routes
  app.post("/api/users/:userId/roles/:roleId", requireAuth, requirePermission("edit:users"), async (req, res) => {
    try {
      const success = await storage.assignRoleToUser(req.params.userId, req.params.roleId);
      if (!success) {
        return res.status(400).json({ message: "Failed to assign role" });
      }
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to assign role" });
    }
  });

  app.delete("/api/users/:userId/roles/:roleId", requireAuth, requirePermission("edit:users"), async (req, res) => {
    try {
      const success = await storage.removeRoleFromUser(req.params.userId, req.params.roleId);
      if (!success) {
        return res.status(400).json({ message: "Failed to remove role" });
      }
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to remove role" });
    }
  });

  // Media management routes
  app.get("/api/media", async (req, res) => {
    try {
      const media = await storage.getAllMedia();
      res.json(media);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch media" });
    }
  });

  app.get("/api/media/featured", async (req, res) => {
    try {
      const media = await storage.getFeaturedMedia();
      res.json(media);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured media" });
    }
  });

  app.get("/api/media/portfolio", async (req, res) => {
    try {
      const media = await storage.getPortfolioMedia();
      res.json(media);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portfolio media" });
    }
  });

  app.post("/api/media", requireAuth, requirePermission("upload:media"), (req, res) => {
    // Handle multiple files: main file and optional poster file
    upload.fields([
      { name: 'file', maxCount: 1 },
      { name: 'posterFile', maxCount: 1 }
    ])(req, res, async (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ message: "File too large. Maximum size allowed is 500MB." });
        }
        if (err.message === 'Invalid file type') {
          return res.status(400).json({ message: "Invalid file type. Please upload JPG, PNG, GIF, MP4, MOV, AVI, or MKV files." });
        }
        return res.status(400).json({ message: err.message || "Upload failed" });
      }

      try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        if (!files?.file || !files.file[0]) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        const mainFile = files.file[0];
        const posterFile = files.posterFile?.[0];
        
        const { title, tags, isFeatured, showInPortfolio, projectStage, notes, clientId } = req.body;
        const fileUrl = `/uploads/${mainFile.filename}`;
        const posterUrl = posterFile ? `/uploads/${posterFile.filename}` : null;
        
        const media = await storage.createMedia({
          title,
          type: mainFile.mimetype.startsWith("video/") ? "video" : "image",
          url: fileUrl,
          posterUrl,
          filename: mainFile.originalname,
          fileSize: mainFile.size,
          mimeType: mainFile.mimetype,
          isFeatured: isFeatured === "true",
          showInPortfolio: showInPortfolio === "true",
          projectStage: projectStage || null,
          notes: notes || null,
          clientId: clientId || null,
          tags: tags ? tags.split(",").map((tag: string) => tag.trim()) : [],
          uploadedBy: req.user!.id,
        });

        res.status(201).json(media);
      } catch (error) {
        console.error("Media upload error:", error);
        res.status(500).json({ message: "Failed to upload media" });
      }
    });
  });

  app.put("/api/media/:id", requireAuth, requirePermission("upload:media"), async (req, res) => {
    try {
      const media = await storage.updateMedia(req.params.id, req.body);
      if (!media) {
        return res.status(404).json({ message: "Media not found" });
      }
      res.json(media);
    } catch (error) {
      res.status(500).json({ message: "Failed to update media" });
    }
  });

  app.delete("/api/media/:id", requireAuth, requirePermission("delete:media"), async (req, res) => {
    try {
      const success = await storage.deleteMedia(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Media not found" });
      }
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete media" });
    }
  });

  // Client management routes
  app.get("/api/clients", requireAuth, requirePermission("view:clients"), async (req, res) => {
    try {
      const clients = await storage.getAllClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.post("/api/clients", requireAuth, requirePermission("edit:clients"), async (req, res) => {
    try {
      const { username, password, ...clientData } = req.body;
      
      // Create the client first
      const client = await storage.createClient({ ...clientData, createdBy: req.user!.id });
      
      // Hash the password for the client user
      const { scrypt, randomBytes } = await import("crypto");
      const { promisify } = await import("util");
      const scryptAsync = promisify(scrypt);
      
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync(password, salt, 64)) as Buffer;
      const hashedPassword = `${buf.toString("hex")}.${salt}`;
      
      // Create the client user for authentication
      await storage.createClientUser({
        clientId: client.id,
        username,
        email: client.email,
        password: hashedPassword,
        isActive: true
      });
      
      res.status(201).json(client);
    } catch (error) {
      console.error("Failed to create client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put("/api/clients/:id", requireAuth, requirePermission("edit:clients"), async (req, res) => {
    try {
      const client = await storage.updateClient(req.params.id, req.body);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", requireAuth, requirePermission("edit:clients"), async (req, res) => {
    try {
      const success = await storage.deleteClient(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Client User management routes for admins
  app.post("/api/clients/:clientId/user", requireAuth, requirePermission("edit:clients"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const { username, email, password } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email, and password are required" });
      }

      const clientUser = await registerClientUser(clientId, username, email, password);
      if (!clientUser) {
        return res.status(400).json({ message: "Username or email already exists" });
      }

      res.status(201).json({
        id: clientUser.id,
        username: clientUser.username,
        email: clientUser.email,
        clientId: clientUser.clientId,
        isActive: clientUser.isActive
      });
    } catch (error) {
      console.error("Create client user error:", error);
      res.status(500).json({ message: "Failed to create client user" });
    }
  });

  app.get("/api/clients/:clientId/user", requireAuth, requirePermission("view:clients"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const clientUser = await storage.getClientUserByClientId(clientId);
      
      if (!clientUser) {
        return res.status(404).json({ message: "Client user not found" });
      }

      res.json({
        id: clientUser.id,
        username: clientUser.username,
        email: clientUser.email,
        clientId: clientUser.clientId,
        isActive: clientUser.isActive,
        createdAt: clientUser.createdAt,
        lastLoginAt: clientUser.lastLoginAt
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client user" });
    }
  });

  app.put("/api/clients/:clientId/user", requireAuth, requirePermission("edit:clients"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const { username, email, isActive } = req.body;
      
      const clientUser = await storage.getClientUserByClientId(clientId);
      if (!clientUser) {
        return res.status(404).json({ message: "Client user not found" });
      }

      const updates: any = {};
      if (username) updates.username = username;
      if (email) updates.email = email;
      if (typeof isActive === 'boolean') updates.isActive = isActive;

      const updatedClientUser = await storage.updateClientUser(clientUser.id, updates);
      if (!updatedClientUser) {
        return res.status(404).json({ message: "Failed to update client user" });
      }

      res.json({
        id: updatedClientUser.id,
        username: updatedClientUser.username,
        email: updatedClientUser.email,
        clientId: updatedClientUser.clientId,
        isActive: updatedClientUser.isActive
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update client user" });
    }
  });

  // Media assignment route (simplified endpoint)
  app.post("/api/media/assign", requireAuth, requirePermission("assign:media"), async (req, res) => {
    try {
      const { mediaId, clientId } = req.body;
      const success = await storage.assignMediaToClient(mediaId, clientId);
      if (!success) {
        return res.status(400).json({ message: "Failed to assign media" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to assign media" });
    }
  });

  // Media-Client assignment routes
  app.post("/api/media/:mediaId/clients/:clientId", requireAuth, requirePermission("assign:media"), async (req, res) => {
    try {
      const success = await storage.assignMediaToClient(req.params.mediaId, req.params.clientId);
      if (!success) {
        return res.status(400).json({ message: "Failed to assign media" });
      }
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to assign media" });
    }
  });

  app.delete("/api/media/:mediaId/clients/:clientId", requireAuth, requirePermission("assign:media"), async (req, res) => {
    try {
      const success = await storage.removeMediaFromClient(req.params.mediaId, req.params.clientId);
      if (!success) {
        return res.status(400).json({ message: "Failed to remove media assignment" });
      }
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to remove media assignment" });
    }
  });

  // Client authentication routes
  app.post("/api/client/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const clientUser = await loginClientUser(username, password);
      if (!clientUser) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      (req.session as any).clientUserId = clientUser.id;
      res.json({ 
        success: true, 
        clientUser: { 
          id: clientUser.id, 
          username: clientUser.username, 
          email: clientUser.email 
        } 
      });
    } catch (error) {
      console.error("Client login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/client/logout", (req, res) => {
    (req.session as any).clientUserId = undefined;
    res.json({ success: true });
  });

  app.get("/api/client/profile", requireClientAuth, async (req, res) => {
    try {
      const clientUser = req.clientUser!;
      const client = await storage.getClient(clientUser.clientId);
      
      res.json({
        id: clientUser.id,
        username: clientUser.username,
        email: clientUser.email,
        client: client ? {
          id: client.id,
          name: client.name,
          company: client.company,
          phone: client.phone
        } : null
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Client portal routes (updated to use client authentication)
  app.get("/api/client/media", requireClientAuth, async (req, res) => {
    try {
      const media = await storage.getClientUserMedia(req.clientUser!.id);
      res.json(media);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client media" });
    }
  });

  // Client feedback routes (updated to use client authentication)
  app.get("/api/client/media/feedback", requireClientAuth, async (req, res) => {
    try {
      const feedback = await storage.getClientUserFeedback(req.clientUser!.id);
      res.json(feedback);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  app.post("/api/client/media/:mediaId/feedback", requireClientAuth, async (req, res) => {
    try {
      const { mediaId } = req.params;
      const { feedbackText, rating } = req.body;
      
      if (!feedbackText || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Feedback text and rating (1-5) are required" });
      }

      const feedback = await storage.createMediaFeedback({
        mediaId,
        clientUserId: req.clientUser!.id,
        feedbackText,
        rating
      });
      
      res.json(feedback);
    } catch (error) {
      res.status(500).json({ message: "Failed to create feedback" });
    }
  });

  // Client timeline notes routes (updated to use client authentication)
  app.get("/api/client/media/timeline-notes", requireClientAuth, async (req, res) => {
    try {
      const notes = await storage.getClientUserTimelineNotes(req.clientUser!.id);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch timeline notes" });
    }
  });

  app.post("/api/client/media/:mediaId/timeline-notes", requireClientAuth, async (req, res) => {
    try {
      const { mediaId } = req.params;
      const { timestampSeconds, noteText } = req.body;
      
      if (!noteText || timestampSeconds === undefined) {
        return res.status(400).json({ message: "Note text and timestamp are required" });
      }

      const note = await storage.createTimelineNote({
        mediaId,
        clientUserId: req.clientUser!.id,
        timestampSeconds: Math.floor(timestampSeconds),
        noteText
      });
      
      res.json(note);
    } catch (error) {
      res.status(500).json({ message: "Failed to create timeline note" });
    }
  });

  // Admin routes for viewing all feedback and timeline notes (updated for client user system)
  app.get("/api/admin/media/feedback", requireAuth, requirePermission("view:clients"), async (req, res) => {
    try {
      const feedback = await db
        .select({
          id: mediaFeedback.id,
          mediaId: mediaFeedback.mediaId,
          clientUserId: mediaFeedback.clientUserId,
          feedbackText: mediaFeedback.feedbackText,
          rating: mediaFeedback.rating,
          createdAt: mediaFeedback.createdAt,
          clientUsername: clientUsers.username,
          clientEmail: clientUsers.email,
          clientName: clients.name,
          clientCompany: clients.company,
          mediaTitle: media.title
        })
        .from(mediaFeedback)
        .leftJoin(clientUsers, eq(mediaFeedback.clientUserId, clientUsers.id))
        .leftJoin(clients, eq(clientUsers.clientId, clients.id))
        .leftJoin(media, eq(mediaFeedback.mediaId, media.id));
      
      res.json(feedback);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch all feedback" });
    }
  });

  app.get("/api/admin/media/timeline-notes", requireAuth, requirePermission("view:clients"), async (req, res) => {
    try {
      const notes = await db
        .select({
          id: mediaTimelineNotes.id,
          mediaId: mediaTimelineNotes.mediaId,
          clientUserId: mediaTimelineNotes.clientUserId,
          timestampSeconds: mediaTimelineNotes.timestampSeconds,
          noteText: mediaTimelineNotes.noteText,
          createdAt: mediaTimelineNotes.createdAt,
          clientUsername: clientUsers.username,
          clientEmail: clientUsers.email,
          clientName: clients.name,
          clientCompany: clients.company,
          mediaTitle: media.title
        })
        .from(mediaTimelineNotes)
        .leftJoin(clientUsers, eq(mediaTimelineNotes.clientUserId, clientUsers.id))
        .leftJoin(clients, eq(clientUsers.clientId, clients.id))
        .leftJoin(media, eq(mediaTimelineNotes.mediaId, media.id));
      
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch all timeline notes" });
    }
  });

  // Website settings routes
  app.get("/api/website-settings", async (req, res) => {
    try {
      const settings = await storage.getWebsiteSettings();
      
      // Get all background image IDs
      const imageIds = settings
        .filter(s => s.backgroundImageId)
        .map(s => s.backgroundImageId!) as string[];
      
      // Fetch all media items at once
      const mediaItems = await storage.getMediaByIds(imageIds);
      
      // Create a map for quick lookup
      const mediaMap = new Map(mediaItems.map(m => [m.id, m]));
      
      // Enhance settings with media information
      const enhancedSettings = settings.map(setting => ({
        ...setting,
        backgroundImage: setting.backgroundImageId ? mediaMap.get(setting.backgroundImageId) : null
      }));
      
      res.json(enhancedSettings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch website settings" });
    }
  });

  app.get("/api/website-settings/:section", async (req, res) => {
    try {
      const setting = await storage.getWebsiteSettingBySection(req.params.section);
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch website setting" });
    }
  });

  app.put("/api/website-settings/:section", requireAuth, requirePermission("edit:website"), async (req, res) => {
    try {
      const { backgroundImageId } = req.body;
      
      const setting = await storage.updateWebsiteSetting(req.params.section, {
        section: req.params.section,
        backgroundImageId,
        updatedBy: req.user!.id,
      });
      
      res.json(setting);
    } catch (error) {
      res.status(500).json({ message: "Failed to update website setting" });
    }
  });

  // Contact information routes
  app.get("/api/contact-info", async (req, res) => {
    try {
      const contactInfo = await storage.getContactInfo();
      res.json(contactInfo || { contactEmail: '', contactPhone: '', contactAddress: '' });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contact information" });
    }
  });

  app.put("/api/contact-info", requireAuth, requirePermission("edit:website"), async (req, res) => {
    try {
      const { contactEmail, contactPhone, contactAddress } = req.body;
      
      const contactInfo = await storage.updateContactInfo({
        contactEmail,
        contactPhone,
        contactAddress,
        updatedBy: req.user!.id,
      });
      
      res.json(contactInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to update contact information" });
    }
  });

  // Dashboard stats
  app.get("/api/stats", requireAuth, requireAnyRole(["Admin", "Staff"]), async (req, res) => {
    try {
      const [allMedia, allRoles, allPermissions] = await Promise.all([
        storage.getAllMedia(),
        storage.getAllRoles(),
        storage.getAllPermissions(),
      ]);

      // Get client count (users with Client role)
      const clientRole = await storage.getRoleByName("Client");
      const clients = clientRole ? await storage.getUsersWithRole(clientRole.id) : [];
      
      // Get staff count (users with Staff or Admin role)
      const [adminRole, staffRole] = await Promise.all([
        storage.getRoleByName("Admin"),
        storage.getRoleByName("Staff"),
      ]);
      
      const [admins, staff] = await Promise.all([
        adminRole ? storage.getUsersWithRole(adminRole.id) : [],
        staffRole ? storage.getUsersWithRole(staffRole.id) : [],
      ]);

      const stats = {
        totalMedia: allMedia.length,
        featuredMedia: allMedia.filter(m => m.isFeatured).length,
        activeClients: clients.length,
        staffMembers: admins.length + staff.length,
        totalRoles: allRoles.length,
        totalPermissions: allPermissions.length,
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Health check endpoint for Docker containers
  app.get("/api/health", (req, res) => {
    res.status(200).json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timeline_functionality: "enabled"
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
