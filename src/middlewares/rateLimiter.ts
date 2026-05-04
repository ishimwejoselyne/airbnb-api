import rateLimit from "express-rate-limit";
import type { NextFunction, Request, Response } from "express";

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." }
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many POST requests, please try again later." }
});

export function strictPostLimiter(req: Request, res: Response, next: NextFunction) {
  if (req.method === "POST") return strictLimiter(req, res, next);
  return next();
}

