import { env, isProduction } from "./config/env";
import express from "express";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { pool } from "./config/database";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { rateLimit } from "./middleware/rateLimit";
import authRoutes from "./routes/authRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import orderRoutes from "./routes/orderRoutes";
import productRoutes from "./routes/productRoutes";
import settingsRoutes from "./routes/settingsRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import {
  getUploadDir,
  UPLOAD_MOUNT_PATH,
} from "./services/uploadService";
import { getStorageDriver } from "./services/storageService";

const app = express();

// Behind a reverse proxy (Render, Heroku, Nginx...) we need the real client
// IP for rate limiting and logging.
if (env.trustProxy) {
  app.set("trust proxy", 1);
}

// Security
app.use(
  helmet({
    // The storefront embeds /uploads images cross-origin (the Next.js
    // app and the API are different origins). Helmet's default
    // "same-origin" resource policy makes browsers block those <img>
    // loads, so uploaded assets must be explicitly cross-origin.
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Middleware
app.use(
  cors({
    origin: env.clientUrl,
    // The admin session cookie must travel with cross-origin
    // requests from the storefront app.
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(compression());
app.use(morgan(isProduction ? "combined" : "dev"));

// Uploaded product images, served straight from disk by the local
// storage driver (the s3 driver serves images from object storage
// instead). Filenames are unique, so responses can be cached
// aggressively.
if (getStorageDriver().kind === "local") {
  app.use(
    UPLOAD_MOUNT_PATH,
    express.static(getUploadDir(), {
      index: false,
      dotfiles: "deny",
      maxAge: "30d",
      immutable: true,
    })
  );
}

// Health check (also verifies the database connection)
app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      success: true,
      message: "Bethel Perfume API is running",
      database: "connected",
    });
  } catch (error) {
    console.error("Health check database error:", error);

    res.status(503).json({
      success: false,
      message:
        "Bethel Perfume API is running but the database is unreachable",
      database: "unreachable",
    });
  }
});

// Baseline rate limit for all API routes (the /uploads static mount
// and the health check above are intentionally excluded). Stricter
// per-route limiters — login, checkout, tracking — apply on top.
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600,
    message:
      "Too many requests. Please slow down and try again shortly.",
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/uploads", uploadRoutes);

// 404 + centralized error handling (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(env.port, () => {
  console.log(
    `Server running on http://localhost:${env.port} (${env.nodeEnv})`
  );
});

/**
 * Close the HTTP server and the database pool on a termination signal so
 * deployments do not drop in-flight requests or leak connections.
 */
const shutdown = (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  const forceExit = setTimeout(() => {
    console.error("Shutdown timed out — forcing exit.");
    process.exit(1);
  }, 10_000);

  forceExit.unref();

  server.close(async () => {
    try {
      await pool.end();
      console.log("Database pool closed.");
    } catch (error) {
      console.error("Error closing the database pool:", error);
    }

    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
