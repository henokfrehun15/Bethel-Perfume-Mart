import { env, isProduction } from "./config/env";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { pool } from "./config/database";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/authRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import orderRoutes from "./routes/orderRoutes";
import productRoutes from "./routes/productRoutes";
import settingsRoutes from "./routes/settingsRoutes";

const app = express();

// Behind a reverse proxy (Render, Heroku, Nginx...) we need the real client
// IP for rate limiting and logging.
if (env.trustProxy) {
  app.set("trust proxy", 1);
}

// Security
app.use(helmet());

// Middleware
app.use(
  cors({
    origin: env.clientUrl,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(morgan(isProduction ? "combined" : "dev"));

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

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/settings", settingsRoutes);

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
