import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../config/prisma.js";
import { createUserSchema, updateUserSchema } from "../validators/users.validator.js";
import { User } from "@prisma/client";

function parsePositiveInt(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const n = typeof value === "number" ? value : Number.parseInt(value, 10);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

export async function getAllUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const page = parsePositiveInt(_req.query.page) ?? 1;
    const limit = parsePositiveInt(_req.query.limit) ?? 10;
    const skip = (page - 1) * limit;

    const [total, users] = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({
      include: {
        _count: { select: { listings: true } }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
      })
    ]);

    return res.json({
      data: users,
      meta: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error: unknown) {
    return next(error);
  }
}

export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    if (!id) return res.status(404).json({ message: "User not found" });

    const baseUser = await prisma.user.findUnique({ where: { id } });

    if (!baseUser) return res.status(404).json({ message: "User not found" });

    if (baseUser.role === "HOST") {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          listings: { include: { _count: { select: { bookings: true } } } }
        }
      });
      return res.json(user);
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        bookings: {
          include: { listing: { select: { id: true, title: true, location: true } } }
        }
      }
    });
    return res.json(user);
  } catch (error: unknown) {
    return next(error);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const result = createUserSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ errors: result.error.issues });

    const data = result.data as any;
    if (typeof data.password !== "string" || data.password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const hashed = await bcrypt.hash(data.password, 10);
    const created = await prisma.user.create({ data: { ...data, password: hashed } });

    // never return password/reset fields
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, resetToken, resetTokenExpiry, ...safe } = created as any;
    return res.status(201).json(safe);
  } catch (error: unknown) {
    return next(error);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    if (!id) return res.status(404).json({ message: "User not found" });

    const exists = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return res.status(404).json({ message: "User not found" });

    const result = updateUserSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ errors: result.error.issues });

    const updated = await prisma.user.update({
      where: { id },
      data: result.data
    });

    return res.json(updated);
  } catch (error: unknown) {
    return next(error);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    if (!id) return res.status(404).json({ message: "User not found" });

    const exists = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return res.status(404).json({ message: "User not found" });

    const deleted = await prisma.user.delete({ where: { id } });
    return res.json(deleted);
  } catch (error: unknown) {
    return next(error);
  }
}

export async function getUserListings(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    if (!id) return res.status(404).json({ message: "User not found" });

    const exists = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return res.status(404).json({ message: "User not found" });

    const listings = await prisma.listing.findMany({
      where: { hostId: id },
      include: { _count: { select: { bookings: true } } },
      orderBy: { createdAt: "desc" }
    });
    return res.json(listings);
  } catch (error: unknown) {
    return next(error);
  }
}

export async function getUserBookings(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    if (!id) return res.status(404).json({ message: "User not found" });

    const exists = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return res.status(404).json({ message: "User not found" });

    const bookings = await prisma.booking.findMany({
      where: { userId: id },
      include: { listing: { select: { id: true, title: true, location: true, pricePerNight: true } } },
      orderBy: { createdAt: "desc" }
    });
    return res.json(bookings);
  } catch (error: unknown) {
    return next(error);
  }
}

