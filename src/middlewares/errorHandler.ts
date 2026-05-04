import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ errors: err.format() });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        return res.status(409).json({ error: "Unique constraint failed" });
      case "P2025":
        return res.status(404).json({ error: "Record not found" });
      case "P2003":
        return res.status(400).json({ error: "Related record does not exist" });
      default:
        return res.status(500).json({ error: "Database error" });
    }
  }

  console.error(err);
  return res.status(500).json({ error: "Something went wrong" });
}

