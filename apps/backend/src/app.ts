import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import farmerRoutes from "./routes/farmer.routes.js";
import mandiRoutes from "./routes/mandi.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { uploadRouter } from "./routes/upload.routes.js";
import { errorHandler } from "./middlewares/errorHandler.middleware.js";
import { env } from "./config/env.js";

export function createApp(): Express {
  const app = express();

  // Security & standard middlewares
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?$/.test(origin) || origin === env.CLIENT_URL) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Health check endpoints
  const healthHandler = (req: express.Request, res: express.Response) => {
    res.status(200).json({
      status: "ok",
      service: "SIH Backend API",
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    });
  };

  app.get("/health", healthHandler);
  app.get("/api/v1/health", healthHandler);

  // API Routes v1
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/user", userRoutes);
  app.use("/api/v1/farmer", farmerRoutes);
  app.use("/api/v1/mandi", mandiRoutes);
  app.use("/api/v1/admin", adminRoutes);
  app.use("/api/v1/upload", uploadRouter);

  // 404 handler
  app.use("*", (req, res) => {
    res.status(404).json({
      success: false,
      message: `Route ${req.originalUrl} not found`,
      code: "ROUTE_NOT_FOUND",
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
export default app;
