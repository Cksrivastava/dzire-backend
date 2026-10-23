import express from "express";
import {
  getEvents,
  getEventById,
  registerForEvent,
} from "../controllers/eventController.js";
import { optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// @route   GET /api/events
// @desc    Get events with category, date & pagination
router.get("/", getEvents);

// @route   GET /api/events/:id
// @desc    Get single event
router.get("/:id", getEventById);

// @route   POST /api/events/register
// @desc    Register for an event
router.post("/register", optionalAuth, registerForEvent);

export default router;
