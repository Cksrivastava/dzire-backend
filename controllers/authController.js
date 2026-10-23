import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { getDbStatus } from "../config/db.js";
import memoryStore from "../config/store.js";

export const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || "dzire_super_secret_jwt_key_2026_sports_gear";
  return jwt.sign({ id: userId }, secret, { expiresIn: "30d" });
};

// @desc    Register a new user
// @route   POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and password.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const displayName = name?.trim() || cleanEmail.split("@")[0] || "User";

    if (getDbStatus()) {
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "An account with this email already exists.",
        });
      }

      const user = await User.create({
        name: displayName,
        email: cleanEmail,
        password,
        phone: "",
        phoneVerified: false,
        credits: 500,
      });

      const token = generateToken(user._id);

      return res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          phoneVerified: user.phoneVerified,
          credits: user.credits,
          role: user.role,
        },
      });
    } else {
      const existingUser = memoryStore.users.find(
        (u) => u.email.toLowerCase() === cleanEmail
      );
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "An account with this email already exists.",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newUser = {
        _id: `user_${Date.now()}`,
        name: displayName,
        email: cleanEmail,
        password: hashedPassword,
        phone: "",
        phoneVerified: false,
        credits: 500,
        role: "customer",
        addresses: [],
      };
      memoryStore.users.push(newUser);

      const token = generateToken(newUser._id);

      return res.status(201).json({
        success: true,
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          phoneVerified: newUser.phoneVerified,
          credits: newUser.credits,
          role: newUser.role,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and password.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (getDbStatus()) {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password.",
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password.",
        });
      }

      const token = generateToken(user._id);

      return res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          phoneVerified: user.phoneVerified,
          credits: user.credits,
          role: user.role,
        },
      });
    } else {
      const user = memoryStore.users.find(
        (u) => u.email.toLowerCase() === cleanEmail
      );

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password.",
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password.",
        });
      }

      const token = generateToken(user._id);

      return res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          phoneVerified: user.phoneVerified,
          credits: user.credits,
          role: user.role,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently logged in user
// @route   GET /api/auth/me
export const getMe = async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
};
