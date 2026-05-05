import type { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma.js";
import { createProfileSchema, updateProfileSchema } from "../validators/profile.validator.js";

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.params.id;
    if (!userId) return res.status(404).json({ message: "User not found" });

    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    return res.json(profile);
  } catch (error: unknown) {
    return next(error);
  }
}

export async function createProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.params.id;
    if (!userId) return res.status(404).json({ message: "User not found" });

    const result = createProfileSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ errors: result.error.issues });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const existing = await prisma.profile.findUnique({ where: { userId } });
    if (existing) return res.status(409).json({ message: "Profile already exists" });

    const created = await prisma.profile.create({
      data: {
        userId,
        ...result.data
      }
    });

    return res.status(201).json(created);
  } catch (error: unknown) {
    return next(error);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.params.id;
    if (!userId) return res.status(404).json({ message: "User not found" });

    const result = updateProfileSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ errors: result.error.issues });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const existing = await prisma.profile.findUnique({ where: { userId } });
    if (!existing) return res.status(404).json({ message: "Profile not found" });

    const updated = await prisma.profile.update({
      where: { userId },
      data: result.data
    });

    return res.json(updated);
  } catch (error: unknown) {
    return next(error);
  }
}

