import express from "express";
import {
  getSectionsAll,
  getProducts,
  getProductByIdOrSlug,
  addProductReview,
} from "../controllers/productController.js";

const router = express.Router();

// @route   GET /api/products/sections/all
// @desc    Get all homepage sections (outdoor, trending, new arrivals)
router.get("/sections/all", getSectionsAll);

// @route   GET /api/products
// @desc    Get all products with filtering, search & pagination
router.get("/", getProducts);

// @route   GET /api/products/:id
// @desc    Get single product by id or slug
router.get("/:id", getProductByIdOrSlug);

// @route   POST /api/products/:id/reviews
// @desc    Add review to product & broadcast in real-time
router.post("/:id/reviews", addProductReview);

export default router;
