import type { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { createReviewSchema } from "../validators/reviews.validator.js";

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

function parsePositiveInt(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const n = typeof value === "number" ? value : Number.parseInt(value, 10);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

export async function getListingReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const listingId = parseId(req.params.id);
    if (listingId === null) return res.status(404).json({ error: "Listing not found" });

    const listingExists = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true }
    });
    if (!listingExists) return res.status(404).json({ error: "Listing not found" });

    const page = parsePositiveInt(req.query.page) ?? 1;
    const limit = parsePositiveInt(req.query.limit) ?? 10;
    const skip = (page - 1) * limit;

    const [total, reviews] = await Promise.all([
      prisma.review.count({ where: { listingId } }),
      prisma.review.findMany({
        where: { listingId },
        include: {
          user: { select: { id: true, name: true, avatar: true } }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      })
    ]);

    return res.json({
      data: reviews,
      meta: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error: unknown) {
    return next(error);
  }
}

export async function createListingReview(req: Request, res: Response, next: NextFunction) {
  try {
    const listingId = parseId(req.params.id);
    if (listingId === null) return res.status(404).json({ error: "Listing not found" });

    const authReq = req as AuthRequest;
    if (!authReq.userId) return res.status(401).json({ error: "Missing or invalid token" });

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    const result = createReviewSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ errors: result.error.issues });

    const review = await prisma.review.create({
      data: {
        listingId,
        userId: authReq.userId,
        rating: result.data.rating,
        comment: result.data.comment
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } }
      }
    });

    return res.status(201).json(review);
  } catch (error: unknown) {
    return next(error);
  }
}

export async function deleteReview(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(404).json({ error: "Review not found" });

    const authReq = req as AuthRequest;
    if (!authReq.userId) return res.status(401).json({ error: "Missing or invalid token" });

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) return res.status(404).json({ error: "Review not found" });

    if (review.userId !== authReq.userId && authReq.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }

    await prisma.review.delete({ where: { id } });
    return res.json({ message: "Review deleted" });
  } catch (error: unknown) {
    return next(error);
  }
}

