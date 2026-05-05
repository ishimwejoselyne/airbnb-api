import "dotenv/config";

import express from "express";
import compression from "compression";
import morgan from "morgan";
import { connectDB } from "./config/prisma.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { setupSwagger } from "./config/swagger.js";
import { generalLimiter, strictPostLimiter } from "./middlewares/rateLimiter.js";
import v1Router from "./routes/v1/index.js";
import { deprecateV1 } from "./middlewares/deprecation.middleware.js";
async function main() {
  const app = express();

  app.use(process.env["NODE_ENV"] === "production" ? morgan("combined") : morgan("dev"));
  app.use(compression());
  app.use(generalLimiter);
  app.use(strictPostLimiter);
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date()
    });
  });

  // Swagger should be mounted after middleware, before routes.
  setupSwagger(app);

  // Versioned API
  app.use("/api/v1", deprecateV1, v1Router);

  // 404 handler (must be before error handler)
  app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

  // Global error handler (must be last)
  app.use(errorHandler);

  const PORT = Number(process.env["PORT"]) || 3000;

  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Fatal startup error", err);
  process.exit(1);
});

