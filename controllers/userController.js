import User from "../models/User.js";
import { getDbStatus } from "../config/db.js";
import memoryStore from "../config/store.js";

const formatUserResponse = (user) => ({
  id: user._id,
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || "",
  phoneVerified: Boolean(user.phoneVerified),
  gender: user.gender || "",
  dob: user.dob || "",
  dobFormatted: user.dobFormatted || "",
  altPhone: user.altPhone || "",
  altEmail: user.altEmail || "",
  credits: user.credits ?? 500,
  earnedCredits: user.earnedCredits ?? 500,
  usedCredits: user.usedCredits ?? 0,
  role: user.role || "customer",
  addresses: user.addresses || [],
  wishlist: user.wishlist || [],
});

// @desc    Update current user profile info
// @route   PUT /api/users/profile
export const updateProfile = async (req, res, next) => {
  try {
    const {
      name,
      fullName,
      phone,
      phoneVerified,
      gender,
      dob,
      dobFormatted,
      altPhone,
      altEmail,
    } = req.body;

    const newName = (name !== undefined ? name : fullName);

    if (getDbStatus()) {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      if (newName !== undefined) user.name = newName.trim();
      if (phone !== undefined) user.phone = phone.trim();
      if (phoneVerified !== undefined) user.phoneVerified = Boolean(phoneVerified);
      if (gender !== undefined) user.gender = gender;
      if (dob !== undefined) user.dob = dob;
      if (dobFormatted !== undefined) user.dobFormatted = dobFormatted;
      if (altPhone !== undefined) user.altPhone = altPhone.trim();
      if (altEmail !== undefined) user.altEmail = altEmail.trim().toLowerCase();

      await user.save();

      return res.json({
        success: true,
        user: formatUserResponse(user),
      });
    } else {
      const user = memoryStore.users.find(
        (u) => String(u._id) === String(req.user._id)
      );
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      if (newName !== undefined) user.name = newName.trim();
      if (phone !== undefined) user.phone = phone.trim();
      if (phoneVerified !== undefined) user.phoneVerified = Boolean(phoneVerified);
      if (gender !== undefined) user.gender = gender;
      if (dob !== undefined) user.dob = dob;
      if (dobFormatted !== undefined) user.dobFormatted = dobFormatted;
      if (altPhone !== undefined) user.altPhone = altPhone.trim();
      if (altEmail !== undefined) user.altEmail = altEmail.trim().toLowerCase();

      return res.json({
        success: true,
        user: formatUserResponse(user),
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's saved addresses
// @route   GET /api/users/addresses
export const getAddresses = async (req, res, next) => {
  try {
    if (getDbStatus()) {
      const user = await User.findById(req.user._id);
      return res.json({
        success: true,
        addresses: user?.addresses || [],
      });
    } else {
      const user = memoryStore.users.find(
        (u) => String(u._id) === String(req.user._id)
      );
      return res.json({
        success: true,
        addresses: user?.addresses || [],
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Add a saved address
// @route   POST /api/users/addresses
export const addAddress = async (req, res, next) => {
  try {
    const {
      title,
      fullName,
      name,
      phone,
      street,
      city,
      state,
      pincode,
      country,
      type,
      isDefault,
    } = req.body;

    const addressItem = {
      name: (name || fullName || req.user?.name || "").trim(),
      phone: (phone || req.user?.phone || "").trim(),
      street: (street || "").trim(),
      city: (city || "").trim(),
      state: (state || "Maharashtra").trim(),
      pincode: (pincode || "").trim(),
      type: type || title || "Home",
      isDefault: Boolean(isDefault),
    };

    if (getDbStatus()) {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      if (!user.addresses) user.addresses = [];

      if (isDefault || user.addresses.length === 0) {
        user.addresses.forEach((addr) => (addr.isDefault = false));
        addressItem.isDefault = true;
      }

      user.addresses.push(addressItem);
      await user.save();

      return res.status(201).json({
        success: true,
        addresses: user.addresses,
      });
    } else {
      const user = memoryStore.users.find(
        (u) => String(u._id) === String(req.user._id)
      );
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      if (!user.addresses) user.addresses = [];
      if (isDefault || user.addresses.length === 0) {
        user.addresses.forEach((addr) => (addr.isDefault = false));
        addressItem.isDefault = true;
      }

      const created = {
        _id: `addr_${Date.now()}`,
        id: `addr_${Date.now()}`,
        ...addressItem,
      };
      user.addresses.push(created);

      return res.status(201).json({
        success: true,
        addresses: user.addresses,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a saved address
// @route   DELETE /api/users/addresses/:addressId
export const deleteAddress = async (req, res, next) => {
  try {
    const targetId = req.params.addressId;

    if (getDbStatus()) {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      user.addresses = user.addresses.filter(
        (addr) => addr._id.toString() !== targetId && addr.id !== targetId
      );

      // If default address was deleted, make first remaining address default
      if (user.addresses.length > 0 && !user.addresses.some((a) => a.isDefault)) {
        user.addresses[0].isDefault = true;
      }

      await user.save();

      return res.json({
        success: true,
        addresses: user.addresses,
      });
    } else {
      const user = memoryStore.users.find(
        (u) => String(u._id) === String(req.user._id)
      );
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      user.addresses = (user.addresses || []).filter(
        (addr) => String(addr._id || addr.id) !== String(targetId)
      );

      if (user.addresses.length > 0 && !user.addresses.some((a) => a.isDefault)) {
        user.addresses[0].isDefault = true;
      }

      return res.json({
        success: true,
        addresses: user.addresses,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Set address as default
// @route   PUT /api/users/addresses/:addressId/default
export const setDefaultAddress = async (req, res, next) => {
  try {
    const targetId = req.params.addressId;

    if (getDbStatus()) {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      user.addresses.forEach((addr) => {
        addr.isDefault = (addr._id.toString() === targetId || addr.id === targetId);
      });

      await user.save();

      return res.json({
        success: true,
        addresses: user.addresses,
      });
    } else {
      const user = memoryStore.users.find(
        (u) => String(u._id) === String(req.user._id)
      );
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      (user.addresses || []).forEach((addr) => {
        addr.isDefault = String(addr._id || addr.id) === String(targetId);
      });

      return res.json({
        success: true,
        addresses: user.addresses,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get Dzire credit points & activity history
// @route   GET /api/users/credits
export const getCredits = async (req, res, next) => {
  try {
    let user = null;
    if (getDbStatus()) {
      user = await User.findById(req.user._id);
    } else {
      user = memoryStore.users.find(
        (u) => String(u._id) === String(req.user._id)
      );
    }

    const defaultActivities = [
      {
        id: "act_welcome",
        type: "earned",
        amount: 500,
        ref: "Welcome Bonus Credit Points",
        date: new Date(user?.createdAt || Date.now()).toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      },
    ];

    const activities = (user?.activities && user.activities.length > 0)
      ? user.activities
      : defaultActivities;

    return res.json({
      success: true,
      credits: user?.credits ?? 500,
      earnedCredits: user?.earnedCredits ?? 500,
      usedCredits: user?.usedCredits ?? 0,
      activities,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's wishlist
// @route   GET /api/users/wishlist
export const getWishlist = async (req, res, next) => {
  try {
    let user = null;
    if (getDbStatus()) {
      user = await User.findById(req.user._id);
    } else {
      user = memoryStore.users.find(
        (u) => String(u._id) === String(req.user._id)
      );
    }

    return res.json({
      success: true,
      wishlist: user?.wishlist || [],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Sync or toggle item in wishlist
// @route   POST /api/users/wishlist
export const syncWishlist = async (req, res, next) => {
  try {
    const { item, items } = req.body;

    if (getDbStatus()) {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      if (Array.isArray(items)) {
        user.wishlist = items;
      } else if (item) {
        if (!user.wishlist) user.wishlist = [];
        const exists = user.wishlist.some(
          (w) => String(w.id || w._id) === String(item.id || item._id)
        );
        if (exists) {
          user.wishlist = user.wishlist.filter(
            (w) => String(w.id || w._id) !== String(item.id || item._id)
          );
        } else {
          user.wishlist.push(item);
        }
      }

      await user.save();
      return res.json({ success: true, wishlist: user.wishlist });
    } else {
      const user = memoryStore.users.find(
        (u) => String(u._id) === String(req.user._id)
      );
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      if (Array.isArray(items)) {
        user.wishlist = items;
      } else if (item) {
        if (!user.wishlist) user.wishlist = [];
        const exists = user.wishlist.some(
          (w) => String(w.id || w._id) === String(item.id || item._id)
        );
        if (exists) {
          user.wishlist = user.wishlist.filter(
            (w) => String(w.id || w._id) !== String(item.id || item._id)
          );
        } else {
          user.wishlist.push(item);
        }
      }

      return res.json({ success: true, wishlist: user.wishlist });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Permanently delete current user account
// @route   DELETE /api/users/account
export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    if (getDbStatus()) {
      await User.findByIdAndDelete(userId);
    } else {
      memoryStore.users = memoryStore.users.filter(
        (u) => String(u._id) !== String(userId)
      );
    }

    return res.json({
      success: true,
      message: "Your Dzire account has been permanently deleted.",
    });
  } catch (error) {
    next(error);
  }
};
