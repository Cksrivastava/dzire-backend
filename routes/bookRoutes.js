import express from "express";
import {
  getBooks,
  getBookById,
  addBookReview,
} from "../controllers/bookController.js";

const router = express.Router();

// @route   GET /api/books
// @desc    Get all books with category filter & search
router.get("/", getBooks);

// @route   GET /api/books/:id
// @desc    Get single book details with recommendations
router.get("/:id", getBookById);

// @route   POST /api/books/:id/reviews
// @desc    Add review to book
router.post("/:id/reviews", addBookReview);

export default router;
