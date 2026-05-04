import { z } from "zod";

export const createProfileSchema = z.object({
  bio: z.string().max(300).optional(),
  website: z.string().url().optional(),
  country: z.string().min(1).optional()
});

export const updateProfileSchema = createProfileSchema.partial();

