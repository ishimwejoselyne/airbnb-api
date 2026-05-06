import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma.js";
import { createListingSchema, updateListingSchema } from "../validators/listings.validator.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";

function toListingType(value: unknown): "APARTMENT" | "HOUSE" | "VILLA" | "CABIN" | null {
  if (value === "APARTMENT" || value === "apartment") return "APARTMENT";
  if (value === "HOUSE" || value === "house") return "HOUSE";
  if (value === "VILLA" || value === "villa") return "VILLA";
  if (value === "CABIN" || value === "cabin") return "CABIN";
  return null;
}

function parsePositiveInt(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const n = typeof value === "number" ? value : Number.parseInt(value, 10);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

function parseNumber(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

export async function getAllListings(req: Request, res: Response, next: NextFunction) {
  try {
    const location = typeof req.query.location === "string" ? req.query.location : undefined;
    const type = toListingType(typeof req.query.type === "string" ? req.query.type : undefined);
    const minPrice = parseNumber(req.query.minPrice);
    const maxPrice = parseNumber(req.query.maxPrice);
    const guests = parsePositiveInt(req.query.guests);

    const page = parsePositiveInt(req.query.page) ?? 1;
    const limit = parsePositiveInt(req.query.limit) ?? 10;
    const skip = (page - 1) * limit;

    const sortBy = typeof req.query.sortBy === "string" ? req.query.sortBy : undefined;
    const order = req.query.order === "asc" || req.query.order === "desc" ? req.query.order : "asc";

    const orderBy =
      sortBy === "pricePerNight"
        ? ({ pricePerNight: order } as const)
        : sortBy === "createdAt"
          ? ({ createdAt: order } as const)
          : ({ createdAt: "desc" } as const);

    const listings = await prisma.listing.findMany({
      where: {
        ...(location
          ? { location: { contains: location, mode: "insensitive" } }
          : {}),
        ...(type ? { type } : {}),
        ...(guests !== null ? { guests: { gte: guests } } : {}),
        ...(minPrice !== null || maxPrice !== null
          ? {
              pricePerNight: {
                ...(minPrice !== null ? { gte: minPrice } : {}),
                ...(maxPrice !== null ? { lte: maxPrice } : {})
              }
            }
          : {})
      },
      select: {
        id: true,
        title: true,
        location: true,
        pricePerNight: true,
        guests: true,
        type: true,
        rating: true,
        amenities: true,
        createdAt: true,
        host: { select: { name: true, avatar: true } },
        _count: { select: { bookings: true } }
      },
      orderBy,
      skip,
      take: limit
    });

    const total = await prisma.listing.count({
      where: {
        ...(location
          ? { location: { contains: location, mode: "insensitive" } }
          : {}),
        ...(type ? { type } : {}),
        ...(guests !== null ? { guests: { gte: guests } } : {}),
        ...(minPrice !== null || maxPrice !== null
          ? {
              pricePerNight: {
                ...(minPrice !== null ? { gte: minPrice } : {}),
                ...(maxPrice !== null ? { lte: maxPrice } : {})
              }
            }
          : {})
      }
    });

    return res.json({
      data: listings,
      meta: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error: unknown) {
    return next(error);
  }
}

export async function searchListings(req: Request, res: Response, next: NextFunction) {
  return getAllListings(req, res, next);
}

export async function getListingsStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const [totalListings, avg, byLocation, byType] = await Promise.all([
      prisma.listing.count(),
      prisma.listing.aggregate({ _avg: { pricePerNight: true } }),
      prisma.listing.groupBy({ by: ["location"], _count: { _all: true } }),
      prisma.listing.groupBy({ by: ["type"], _count: { _all: true } })
    ]);

    return res.json({
      totalListings,
      averagePrice: avg._avg.pricePerNight ?? 0,
      byLocation: byLocation.map((x) => ({ location: x.location, count: x._count._all })),
      byType: byType.map((x) => ({ type: x.type, count: x._count._all }))
    });
  } catch (error: unknown) {
    return next(error);
  }
}

export async function getListingById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as String;
    if (!id) return res.status(404).json({ message: "Listing not found" });

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        host: true,
        bookings: {
          include: {
            user: { select: { name: true, avatar: true } }
          }
        },
        reviews: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: "desc" }
        }
      }
    });
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    return res.json(listing);
  } catch (error: unknown) {
    return next(error);
  }
}

export async function createListing(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = createListingSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ errors: result.error.issues });

    if (!req.userId) return res.status(401).json({ message: "Missing or invalid token" });

    const created = await prisma.listing.create({
      data: {
        ...result.data,
        hostId: req.userId
      }
    });

    return res.status(201).json(created);
  } catch (error: unknown) {
    return next(error);
  }
}

export async function updateListing(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as String;
    if (!id) return res.status(404).json({ message: "Listing not found" });

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    const authReq = req as AuthRequest;
    if (!authReq.userId) return res.status(401).json({ message: "Missing or invalid token" });
    if (listing.hostId !== authReq.userId && authReq.role !== "ADMIN") {
      return res.status(403).json({ message: "You can only edit your own listings" });
    }

    const result = updateListingSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ errors: result.error.issues });

    const updated = await prisma.listing.update({
      where: { id },
      data: {
        ...result.data
      }
    });

    return res.json(updated);
  } catch (error: unknown) {
    return next(error);
  }
}

export async function deleteListing(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as String;
    if (!id) return res.status(404).json({ message: "Listing not found" });

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    const authReq = req as AuthRequest;
    if (!authReq.userId) return res.status(401).json({ message: "Missing or invalid token" });
    if (listing.hostId !== authReq.userId && authReq.role !== "ADMIN") {
      return res.status(403).json({ message: "You can only delete your own listings" });
    }

    const deleted = await prisma.listing.delete({ where: { id } });
    return res.json(deleted);
  } catch (error: unknown) {
    return next(error);
  }
}

