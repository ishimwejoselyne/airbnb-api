import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { sendEmail } from "../config/email.js";
import { passwordResetEmail, welcomeEmail } from "../templates/emails.js";

function getJwtSecret(): string {
  const secret = process.env["JWT_SECRET"];
  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
}

function getJwtExpiresIn(): string {
  return process.env["JWT_EXPIRES_IN"] ?? "7d";
}

function stripPassword<T extends { password?: unknown }>(user: T) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...rest } = user as any;
  return rest as Omit<T, "password">;
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, username, password, role, phone, avatar } = req.body ?? {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof username !== "string" ||
      typeof password !== "string" ||
      typeof phone !== "string"
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const assignedRole =
      role === "HOST" || role === "GUEST" ? role : role === undefined ? "GUEST" : null;
    if (!assignedRole) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { id: true }
    });
    if (existing) return res.status(409).json({ message: "Email or username already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        username,
        phone,
        avatar: typeof avatar === "string" ? avatar : undefined,
        password: hashed,
        role: assignedRole
      }
    });

    void sendEmail(user.email, "Welcome to Airbnb", welcomeEmail(user.name, user.role)).catch((e) =>
      console.error("Welcome email failed", e)
    );

    return res.status(201).json(stripPassword(user));
  } catch (error: unknown) {
    return next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body ?? {};
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      getJwtSecret(),
      { expiresIn: "1d" }
    );

    return res.json({ token, user: stripPassword(user) });
  } catch (error: unknown) {
    return next(error);
  }
}

export async function me(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) return res.status(401).json({ message: "Missing or invalid token" });

    const baseUser = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!baseUser) return res.status(404).json({ message: "User not found" });

    if (baseUser.role === "HOST" || baseUser.role === "ADMIN") {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        include: { listings: true, profile: true }
      });
      return res.json(user ? stripPassword(user) : null);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { bookings: { include: { listing: true } }, profile: true }
    });
    return res.json(user ? stripPassword(user) : null);
  } catch (error: unknown) {
    return next(error);
  }
}

export async function changePassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) return res.status(401).json({ message: "Missing or invalid token" });

    const { currentPassword, newPassword } = req.body ?? {};
    if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.userId }, data: { password: hashed } });
    return res.json({ message: "Password changed successfully" });
  } catch (error: unknown) {
    return next(error);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body ?? {};
    if (typeof email !== "string") {
      return res.status(200).json({
        message: "If that email is registered, a reset link has been sent"
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expiry = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: hashedToken, resetTokenExpiry: expiry }
      });

      const baseUrl = process.env["API_URL"] || "http://localhost:3000";
      const resetLink = `${baseUrl}/auth/reset-password/${rawToken}`;
      void sendEmail(user.email, "Reset your password", passwordResetEmail(user.name, resetLink)).catch((e) =>
        console.error("Reset email failed", e)
      );
    }

    return res.status(200).json({
      message: "If that email is registered, a reset link has been sent"
    });
  } catch (error: unknown) {
    return next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const rawToken = req.params["token"];
    const { password } = req.body ?? {};

    if (typeof rawToken !== "string" || rawToken.length === 0 || typeof password !== "string") {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const user = await prisma.user.findFirst({
      where: { resetToken: hashedToken, resetTokenExpiry: { gt: new Date() } }
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired reset token" });

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    return res.json({ message: "Password reset successful" });
  } catch (error: unknown) {
    return next(error);
  }
}

