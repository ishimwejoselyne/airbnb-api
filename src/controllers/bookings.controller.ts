import type { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma.js";
import { createBookingSchema } from "../validators/bookings.validator.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { sendEmail } from "../config/email.js";
import { bookingCancellationEmail, bookingConfirmationEmail } from "../templates/emails.js";

function diffDays(checkIn: Date, checkOut: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const start = Date.UTC(checkIn.getUTCFullYear(), checkIn.getUTCMonth(), checkIn.getUTCDate());
  const end = Date.UTC(checkOut.getUTCFullYear(), checkOut.getUTCMonth(), checkOut.getUTCDate());
  return Math.ceil((end - start) / msPerDay);
}

function parsePositiveInt(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const n = typeof value === "number" ? value : Number.parseInt(value, 10);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

export async function getAllBookings(_req: Request, res: Response, next: NextFunction) {
  try {
    const page = parsePositiveInt(_req.query.page) ?? 1;
    const limit = parsePositiveInt(_req.query.limit) ?? 10;
    const skip = (page - 1) * limit;

    const [total, bookings] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.findMany({
        include: {
          user: { select: { id: true, name: true } },
          listing: { select: { id: true, title: true } }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      })
    ]);

    return res.json({
      data: bookings,
      meta: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error: unknown) {
    return next(error);
  }
}

export async function getBookingById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    if (!id) return res.status(404).json({ message: "Booking not found" });

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, username: true, phone: true, role: true, avatar: true, createdAt: true, updatedAt: true } },
        listing: { include: { host: { select: { id: true, name: true, avatar: true } } } }
      }
    });

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    return res.json(booking);
  } catch (error: unknown) {
    return next(error);
  }
}

export async function createBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const result = createBookingSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ errors: result.error.issues });

    const authReq = req as AuthRequest;
    if (!authReq.userId) return res.status(401).json({ message: "Missing or invalid token" });

    const inDate = new Date(result.data.checkIn);
    const outDate = new Date(result.data.checkOut);

    const overlap = await prisma.booking.findFirst({
      where: {
        listingId: result.data.listingId,
        status: "CONFIRMED",
        AND: [{ checkIn: { lt: outDate } }, { checkOut: { gt: inDate } }]
      },
      select: { id: true }
    });
    if (overlap) return res.status(409).json({ message: "Dates overlap with an existing booking" });

    const [guest, listing] = await Promise.all([
      prisma.user.findUnique({ where: { id: authReq.userId } }),
      prisma.listing.findUnique({ where: { id: result.data.listingId } })
    ]);

    if (!guest) return res.status(404).json({ message: "Guest not found" });
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    const nights = diffDays(inDate, outDate);
    if (nights <= 0) return res.status(400).json({ message: "Invalid booking dates" });

    const total = nights * listing.pricePerNight;

    const booking = await prisma.booking.create({
      data: {
        userId: authReq.userId,
        listingId: result.data.listingId,
        checkIn: inDate,
        checkOut: outDate,
        guests: result.data.guests,
        total,
        status: "CONFIRMED"
      }
    });

    void sendEmail(
      guest.email,
      "Booking confirmation",
      bookingConfirmationEmail(
        guest.name,
        listing.title,
        listing.location,
        inDate.toDateString(),
        outDate.toDateString(),
        total
      )
    ).catch((e) => console.error("Booking confirmation email failed", e));

    return res.status(201).json(booking);
  } catch (error: unknown) {
    return next(error);
  }
}

export async function deleteBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    if (!id) return res.status(404).json({ message: "Booking not found" });

    const authReq = req as AuthRequest;
    if (!authReq.userId) return res.status(401).json({ message: "Missing or invalid token" });

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.userId !== authReq.userId && authReq.role !== "ADMIN") {
      return res.status(403).json({ message: "You can only cancel your own bookings" });
    }

    if (booking.status === "CANCELLED") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    const cancelled = await prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED" }
    });

    const guest = await prisma.user.findUnique({ where: { id: booking.userId } });
    const listing = await prisma.listing.findUnique({ where: { id: booking.listingId } });
    if (guest && listing) {
      void sendEmail(
        guest.email,
        "Booking cancelled",
        bookingCancellationEmail(
          guest.name,
          listing.title,
          booking.checkIn.toDateString(),
          booking.checkOut.toDateString()
        )
      ).catch((e) => console.error("Booking cancellation email failed", e));
    }

    return res.json(cancelled);
  } catch (error: unknown) {
    return next(error);
  }
}

export async function updateBookingStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    if (!id) return res.status(404).json({ message: "Booking not found" });

    const { status } = req.body ?? {};
    if (status !== "PENDING" && status !== "CONFIRMED" && status !== "CANCELLED") {
      return res.status(400).json({ message: "Invalid status" });
    }

    const exists = await prisma.booking.findUnique({ where: { id } });
    if (!exists) return res.status(404).json({ message: "Booking not found" });

    const updated = await prisma.booking.update({ where: { id }, data: { status } });
    return res.json(updated);
  } catch (error: unknown) {
    return next(error);
  }
}

