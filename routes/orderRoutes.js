import express from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  submitReturnRequest,
} from "../controllers/orderController.js";
import { optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// @route   POST /api/orders
// @desc    Create a new order
router.post("/", optionalAuth, createOrder);

// @route   GET /api/orders
// @desc    Get order history
router.get("/", optionalAuth, getOrders);

// @route   GET /api/orders/:orderId
// @desc    Get order details
router.get("/:orderId", getOrderById);

// @route   POST /api/orders/:orderId/return
// @desc    Submit return request for an order
router.post("/:orderId/return", submitReturnRequest);

export default router;
