import express from "express";
import { register, login, getMe } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
router.post("/register", register);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post("/login", login);

// @route   GET /api/auth/me
// @desc    Get currently logged in user
router.get("/me", requireAuth, getMe);

export default router;
