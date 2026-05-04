import type { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma.js";
import { deleteFromCloudinary, uploadToCloudinary } from "../config/cloudinary.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

export async function uploadAvatar(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(404).json({ message: "User not found" });

    const authReq = req as AuthRequest;
    if (!authReq.userId) return res.status(401).json({ message: "Missing or invalid token" });
    if (authReq.userId !== id) return res.status(403).json({ message: "You can only update your own avatar" });

    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.avatarPublicId) {
      try {
        await deleteFromCloudinary(user.avatarPublicId);
      } catch (err) {
        console.error("Failed to delete old avatar", err);
      }
    }

    const uploaded = await uploadToCloudinary(file.buffer, "airbnb/avatars");
    const updated = await prisma.user.update({
      where: { id },
      data: { avatar: uploaded.url, avatarPublicId: uploaded.publicId }
    });

    // never return password/reset fields
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, resetToken, resetTokenExpiry, ...safe } = updated as any;
    return res.json(safe);
  } catch (error: unknown) {
    return next(error);
  }
}

export async function deleteAvatar(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(404).json({ message: "User not found" });

    const authReq = req as AuthRequest;
    if (!authReq.userId) return res.status(401).json({ message: "Missing or invalid token" });
    if (authReq.userId !== id) return res.status(403).json({ message: "You can only update your own avatar" });

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.avatar || !user.avatarPublicId) return res.status(400).json({ message: "No avatar to remove" });

    await deleteFromCloudinary(user.avatarPublicId);
    await prisma.user.update({ where: { id }, data: { avatar: null, avatarPublicId: null } });

    return res.json({ message: "Avatar removed" });
  } catch (error: unknown) {
    return next(error);
  }
}

export async function uploadListingPhotos(req: Request, res: Response, next: NextFunction) {
  try {
    const listingId = parseId(req.params.id);
    if (listingId === null) return res.status(404).json({ message: "Listing not found" });

    const authReq = req as AuthRequest;
    if (!authReq.userId) return res.status(401).json({ message: "Missing or invalid token" });

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    if (listing.hostId !== authReq.userId && authReq.role !== "ADMIN") {
      return res.status(403).json({ message: "You can only upload photos to your own listings" });
    }

    const existingCount = await prisma.listingPhoto.count({ where: { listingId } });
    if (existingCount >= 5) return res.status(400).json({ message: "Maximum of 5 photos allowed per listing" });

    const files = ((req as any).files as Express.Multer.File[] | undefined) ?? [];
    if (files.length === 0) return res.status(400).json({ message: "No files uploaded" });

    const remaining = Math.max(0, 5 - existingCount);
    const toProcess = files.slice(0, remaining);

    for (const file of toProcess) {
      const uploaded = await uploadToCloudinary(file.buffer, "airbnb/listings");
      await prisma.listingPhoto.create({
        data: {
          listingId,
          url: uploaded.url,
          publicId: uploaded.publicId
        }
      });
    }

    const updated = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { photos: true }
    });
    return res.json(updated);
  } catch (error: unknown) {
    return next(error);
  }
}

export async function deleteListingPhoto(req: Request, res: Response, next: NextFunction) {
  try {
    const listingId = parseId(req.params.id);
    const photoId = parseId(req.params.photoId);
    if (listingId === null || photoId === null) return res.status(404).json({ message: "Not found" });

    const authReq = req as AuthRequest;
    if (!authReq.userId) return res.status(401).json({ message: "Missing or invalid token" });

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    if (listing.hostId !== authReq.userId && authReq.role !== "ADMIN") {
      return res.status(403).json({ message: "You can only delete photos from your own listings" });
    }

    const photo = await prisma.listingPhoto.findUnique({ where: { id: photoId } });
    if (!photo) return res.status(404).json({ message: "Photo not found" });
    if (photo.listingId !== listingId) return res.status(403).json({ message: "Photo does not belong to this listing" });

    if (photo.publicId) await deleteFromCloudinary(photo.publicId);
    await prisma.listingPhoto.delete({ where: { id: photoId } });

    return res.json({ message: "Photo deleted" });
  } catch (error: unknown) {
    return next(error);
  }
}

