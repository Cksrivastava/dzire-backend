import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { getDbStatus } from "../config/db.js";
import memoryStore from "../config/store.js";

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login.",
      });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || "dzire_super_secret_jwt_key_2026_sports_gear";
    const decoded = jwt.verify(token, secret);

    let user = null;
    if (getDbStatus()) {
      user = await User.findById(decoded.id).select("-password");
    } else {
      user = memoryStore.users.find((u) => String(u._id) === String(decoded.id));
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User session expired or user not found.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const secret = process.env.JWT_SECRET || "dzire_super_secret_jwt_key_2026_sports_gear";
      const decoded = jwt.verify(token, secret);
      if (getDbStatus()) {
        req.user = await User.findById(decoded.id).select("-password");
      } else {
        req.user = memoryStore.users.find((u) => String(u._id) === String(decoded.id));
      }
    }
  } catch (err) {
    // Ignore invalid token in optional auth
  }
  next();
};
