import express from "express";
import {
  getRentals,
  getRentalById,
  bookRental,
} from "../controllers/rentalController.js";
import { optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// @route   GET /api/rentals
// @desc    Get all rental items with category filter
router.get("/", getRentals);

// @route   GET /api/rentals/:id
// @desc    Get single rental item
router.get("/:id", getRentalById);

// @route   POST /api/rentals/book
// @desc    Book a rental item
router.post("/book", optionalAuth, bookRental);

export default router;
