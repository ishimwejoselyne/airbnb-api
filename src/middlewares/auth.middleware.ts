import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: number;
  role?: "ADMIN" | "HOST" | "GUEST";
}

type JwtPayload = {
  userId: number;
  role: "ADMIN" | "HOST" | "GUEST";
};

function getJwtSecret(): string {
  const secret = process.env["JWT_SECRET"];
  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
    req.userId = decoded.userId;
    req.role = decoded.role;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireHost(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.role === "HOST" || req.role === "ADMIN") return next();
  return res.status(403).json({ message: "Forbidden" });
}

export function requireGuest(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.role === "GUEST" || req.role === "ADMIN") return next();
  return res.status(403).json({ message: "Forbidden" });
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.role === "ADMIN") return next();
  return res.status(403).json({ message: "Forbidden" });
}

