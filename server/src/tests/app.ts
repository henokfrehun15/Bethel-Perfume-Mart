import express from "express";

import authRoutes from "../routes/authRoutes";
import categoryRoutes from "../routes/categoryRoutes";
import orderRoutes from "../routes/orderRoutes";
import productRoutes from "../routes/productRoutes";
import settingsRoutes from "../routes/settingsRoutes";
import { notFoundHandler } from "../middleware/errorHandler";

/**
 * A supertest-friendly mirror of server.ts: the same middleware and
 * routes, but without `listen`, logging, or a live database pool —
 * each test file mocks `../config/database` as needed.
 */
const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/settings", settingsRoutes);

app.use(notFoundHandler);

export default app;
