import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export function requirePermission(permissionName: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const userPermissions = await storage.getUserPermissions(req.user.id);
      const hasPermission = userPermissions.some(p => p.name === permissionName);
      
      if (!hasPermission) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ message: "Error checking permissions" });
    }
  };
}

export function requireRole(roleName: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const userRoles = await storage.getUserRoles(req.user.id);
      const hasRole = userRoles.some(r => r.name === roleName);
      
      if (!hasRole) {
        return res.status(403).json({ message: "Insufficient role access" });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ message: "Error checking role" });
    }
  };
}

export function requireAnyRole(roleNames: string[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const userRoles = await storage.getUserRoles(req.user.id);
      const hasAnyRole = userRoles.some(r => roleNames.includes(r.name));
      
      if (!hasAnyRole) {
        return res.status(403).json({ message: "Insufficient role access" });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ message: "Error checking roles" });
    }
  };
}
