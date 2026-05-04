import "dotenv/config";

import express from "express";
import compression from "compression";
import listingsRouter from "./routes/listings.routes.js";
import usersRouter from "./routes/users.routes.js";
import { connectDB } from "./config/prisma.js";
import bookingsRouter from "./routes/bookings.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import authRouter from "./routes/auth.routes.js";
import uploadRouter from "./routes/upload.routes.js";
import { setupSwagger } from "./config/swagger.js";
import { generalLimiter, strictPostLimiter } from "./middlewares/rateLimiter.js";
async function main() {
  const app = express();

  app.use(compression());
  app.use(generalLimiter);
  app.use(strictPostLimiter);
  app.use(express.json());

  // Swagger should be mounted after middleware, before routes.
  setupSwagger(app);

  app.use("/auth", authRouter);
  app.use("/", uploadRouter);
  app.use("/users", usersRouter);
  app.use("/listings", listingsRouter);
  app.use("/bookings", bookingsRouter);
  app.use("*", (_req, res) => {
    return res.status(404).json({ message: "Route not found" });
  });

  app.use(errorHandler);

  const PORT = Number(process.env["PORT"] ?? 3001);

  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Fatal startup error", err);
  process.exit(1);
});

