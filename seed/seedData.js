import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

import Product from "../models/Product.js";
import Book from "../models/Book.js";
import Rental from "../models/Rental.js";
import Event from "../models/Event.js";
import Blog from "../models/Blog.js";
import Order from "../models/Order.js";
import User from "../models/User.js";

// Dummy seed data removed. Production catalog is clean.
export const sampleProducts = [];
export const sampleBooks = [];
export const sampleRentals = [];
export const sampleEvents = [];
export const sampleBlogs = [];
export const sampleOrders = [];

export const clearDatabase = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log("No MONGODB_URI set, skipping database clear.");
    return;
  }

  try {
    console.log("Clearing all collections in MongoDB...");
    await Product.deleteMany({});
    await Book.deleteMany({});
    await Rental.deleteMany({});
    await Event.deleteMany({});
    await Blog.deleteMany({});
    await Order.deleteMany({});
    await User.deleteMany({ email: "demo@dzirestore.in" });
    console.log("✅ All dummy seed data cleared successfully!");
  } catch (error) {
    console.error("Error clearing database:", error.message);
  }
};

export const seedDatabase = async () => {
  console.log("Dummy seed data has been removed. Database remains clean with real data only.");
};

// If run directly via node seed/seedData.js
if (process.argv[1] && process.argv[1].endsWith("seedData.js")) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(async () => {
      await clearDatabase();
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
