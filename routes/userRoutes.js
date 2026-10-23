import express from "express";
import {
  updateProfile,
  getAddresses,
  addAddress,
  deleteAddress,
  setDefaultAddress,
  getCredits,
  getWishlist,
  syncWishlist,
  deleteAccount,
} from "../controllers/userController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// @route   PUT /api/users/profile
// @desc    Update current user profile info
router.put("/profile", requireAuth, updateProfile);

// @route   GET /api/users/addresses
// @desc    Get user's saved addresses
router.get("/addresses", requireAuth, getAddresses);

// @route   POST /api/users/addresses
// @desc    Add a saved address
router.post("/addresses", requireAuth, addAddress);

// @route   DELETE /api/users/addresses/:addressId
// @desc    Delete a saved address
router.delete("/addresses/:addressId", requireAuth, deleteAddress);

// @route   PUT /api/users/addresses/:addressId/default
// @desc    Set address as default
router.put("/addresses/:addressId/default", requireAuth, setDefaultAddress);

// @route   GET /api/users/credits
// @desc    Get Dzire credit points & history
router.get("/credits", requireAuth, getCredits);

// @route   GET /api/users/wishlist
// @desc    Get user's saved wishlist
router.get("/wishlist", requireAuth, getWishlist);

// @route   POST /api/users/wishlist
// @desc    Sync or toggle item in wishlist
router.post("/wishlist", requireAuth, syncWishlist);

// @route   DELETE /api/users/account
// @desc    Permanently delete account
router.delete("/account", requireAuth, deleteAccount);
router.delete("/profile", requireAuth, deleteAccount);

export default router;
