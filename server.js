import express from "express";
import http from "http";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import compression from "compression";
import { fileURLToPath } from "url";
import { initWebSocket } from "./websocket.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

import { connectDB, getDbStatus } from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import rentalRoutes from "./routes/rentalRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

import fs from "fs";

// Ensure uploads directories exist
const blogUploadsDir = path.join(__dirname, "uploads", "blogs");
if (!fs.existsSync(blogUploadsDir)) {
  fs.mkdirSync(blogUploadsDir, { recursive: true });
}
const staffUploadsDir = path.join(__dirname, "uploads", "staff");
if (!fs.existsSync(staffUploadsDir)) {
  fs.mkdirSync(staffUploadsDir, { recursive: true });
}
const categoryUploadsDir = path.join(__dirname, "uploads", "categories");
if (!fs.existsSync(categoryUploadsDir)) {
  fs.mkdirSync(categoryUploadsDir, { recursive: true });
}
const productUploadsDir = path.join(__dirname, "uploads", "products");
if (!fs.existsSync(productUploadsDir)) {
  fs.mkdirSync(productUploadsDir, { recursive: true });
}

// Middleware
app.use(compression());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    database: getDbStatus() ? "connected" : "fallback_mode",
    version: "1.0.0",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/rentals", rentalRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/admin", adminRoutes);

// Error Handler
app.use(errorHandler);

// Connect DB & Start Server
const startServer = async () => {
  await connectDB();

  initWebSocket(server);

  server.listen(PORT, () => {
    console.log(`🚀 Dzire Backend Server running on http://localhost:${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`⚡ WebSocket Server active on ws://localhost:${PORT}/ws`);
  });
};

startServer();

export { app, server };
export default app;
