import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import crypto from 'crypto';
import { ClientUser } from '@shared/schema';

// Extend Express Request type to include clientUser and session
declare global {
  namespace Express {
    interface Request {
      clientUser?: ClientUser;
    }
    interface SessionData {
      clientUserId?: string;
    }
  }
}

// Hash password using scrypt
function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + ':' + derivedKey.toString('hex'));
    });
  });
}

// Verify password
function verifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString('hex'));
    });
  });
}

// Client authentication middleware
export async function requireClientAuth(req: Request, res: Response, next: NextFunction) {
  const clientUserId = (req.session as any).clientUserId;
  
  if (!clientUserId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const clientUser = await storage.getClientUser(clientUserId);
    if (!clientUser || !clientUser.isActive) {
      // Clear invalid session
      (req.session as any).clientUserId = undefined;
      return res.status(401).json({ message: "Invalid authentication" });
    }

    req.clientUser = clientUser;
    next();
  } catch (error) {
    console.error("Client auth error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
}

// Client login function
export async function loginClientUser(username: string, password: string): Promise<ClientUser | null> {
  try {
    const clientUser = await storage.getClientUserByUsername(username);
    if (!clientUser || !clientUser.isActive) {
      return null;
    }

    const isValid = await verifyPassword(password, clientUser.password);
    if (!isValid) {
      return null;
    }

    // Update last login
    await storage.updateClientUserLastLogin(clientUser.id);
    
    return clientUser;
  } catch (error) {
    console.error("Client login error:", error);
    return null;
  }
}

// Register client user function (for admin use)
export async function registerClientUser(clientId: string, username: string, email: string, password: string): Promise<ClientUser | null> {
  try {
    // Check if username or email already exists
    const existingByUsername = await storage.getClientUserByUsername(username);
    const existingByEmail = await storage.getClientUserByEmail(email);
    
    if (existingByUsername || existingByEmail) {
      return null;
    }

    const hashedPassword = await hashPassword(password);
    
    const clientUser = await storage.createClientUser({
      clientId,
      username,
      email,
      password: hashedPassword,
      isActive: true
    });

    return clientUser;
  } catch (error) {
    console.error("Client registration error:", error);
    return null;
  }
}