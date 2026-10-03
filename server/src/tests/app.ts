import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import authRoutes from "../routes/authRoutes";
import categoryRoutes from "../routes/categoryRoutes";
import orderRoutes from "../routes/orderRoutes";
import productRoutes from "../routes/productRoutes";
import settingsRoutes from "../routes/settingsRoutes";
import uploadRoutes from "../routes/uploadRoutes";
import { notFoundHandler } from "../middleware/errorHandler";
import {
  getUploadDir,
  UPLOAD_MOUNT_PATH,
} from "../services/uploadService";

/**
 * A supertest-friendly mirror of server.ts: the same middleware and
 * routes, but without `listen`, logging, or a live database pool —
 * each test file mocks `../config/database` as needed.
 */
const app = express();

// Mirrors the helmet config in server.ts, so security headers on
// static uploads are covered by tests too.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(express.json());
app.use(cookieParser());

app.use(
  UPLOAD_MOUNT_PATH,
  express.static(getUploadDir(), {
    index: false,
    dotfiles: "deny",
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/uploads", uploadRoutes);

app.use(notFoundHandler);

export default app;
