import express from "express";
import {
  submitContactMessage,
  getContactMessages,
} from "../controllers/contactController.js";

const router = express.Router();

// @route   POST /api/contact
// @desc    Submit contact or support message
router.post("/", submitContactMessage);

// @route   GET /api/contact
// @desc    Get all messages (for admin)
router.get("/", getContactMessages);

export default router;
