import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import testRoutes from "./routes/testRoutes";
dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// Security
app.use(helmet());

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
  })
);

app.use(express.json());
app.use(morgan("dev"));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Bethel Perfume API is running",
  });
});
app.use("/api/test", testRoutes);
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});