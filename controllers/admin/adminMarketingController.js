import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import User from "../../models/User.js";
import Order from "../../models/Order.js";
import Product from "../../models/Product.js";
import Attribute from "../../models/Attribute.js";
import Vendor from "../../models/Vendor.js";
import PosInvoice from "../../models/PosInvoice.js";
import Quotation from "../../models/Quotation.js";
import PaymentIn from "../../models/PaymentIn.js";
import PaymentOut from "../../models/PaymentOut.js";
import CreditNote from "../../models/CreditNote.js";
import DebitNote from "../../models/DebitNote.js";
import PurchaseInvoice from "../../models/PurchaseInvoice.js";
import PurchaseOrder from "../../models/PurchaseOrder.js";
import PurchaseReturn from "../../models/PurchaseReturn.js";
import InstoreReturn from "../../models/InstoreReturn.js";
import CustomerReturn from "../../models/CustomerReturn.js";
import Coupon from "../../models/Coupon.js";
import Offer from "../../models/Offer.js";
import Category from "../../models/Category.js";
import Staff from "../../models/Staff.js";
import Role from "../../models/Role.js";
import Rental from "../../models/Rental.js";
import Blog from "../../models/Blog.js";
import Event from "../../models/Event.js";
import GstReturn from "../../models/GstReturn.js";
import ProfitReport from "../../models/ProfitReport.js";
import { getDbStatus } from "../../config/db.js";
import memoryStore from "../../config/store.js";
import { broadcastEvent } from "../../websocket.js";
import { productUpload, categoryUpload, blogUpload, staffUpload } from "../../middleware/upload.js";

import { generateAdminToken } from "./adminAuthController.js";

// @route GET /api/admin/coupons
export // ==========================================

const handleGetCoupons = async (req, res, next) => {
  try {
    let coupons = [];
    if (getDbStatus()) {
      coupons = await Coupon.find({}).sort({ createdAt: -1 });
    } else {
      coupons = memoryStore.coupons || [];
    }

    if (!coupons || coupons.length === 0) {
      const defaultCoupons = [
        {
          id: "CPN-001",
          code: "FLAT10",
          name: "Flat 10% Off",
          description: "Get 10% OFF on orders above ₹3,000",
          type: "Percentage",
          discountValue: 10,
          unit: "%",
          minOrderValue: 3000,
          hasMinOrder: true,
          status: "Active",
        },
        {
          id: "CPN-002",
          code: "TREK500",
          name: "Trek Saver",
          description: "₹500 OFF on orders above ₹7,500",
          type: "Fixed",
          discountValue: 500,
          unit: "₹",
          minOrderValue: 7500,
          hasMinOrder: true,
          status: "Active",
        },
        {
          id: "CPN-003",
          code: "FREEDEL",
          name: "Free Express Shipping",
          description: "Free Shipping on prepaid orders above ₹1,499",
          type: "Shipping",
          discountValue: 0,
          unit: "Free",
          minOrderValue: 1499,
          hasMinOrder: true,
          status: "Active",
        },
        {
          id: "CPN-004",
          code: "WINTER20",
          name: "Adventure Gear Sale",
          description: "Get 20% OFF on all outdoor and camping gear",
          type: "Percentage",
          discountValue: 20,
          unit: "%",
          minOrderValue: 2000,
          hasMinOrder: true,
          status: "Active",
        },
      ];

      if (getDbStatus()) {
        try {
          coupons = await Coupon.insertMany(defaultCoupons);
        } catch (e) {
          coupons = defaultCoupons;
        }
      } else {
        memoryStore.coupons = defaultCoupons;
        coupons = defaultCoupons;
      }
    }

    return res.json({
      success: true,
      count: coupons.length,
      coupons,
    });
  } catch (error) {
    next(error);
  }
};

export const getCoupons = handleGetCoupons;

const handleCreateCoupon = async (req, res, next) => {
  try {
    const body = req.body || {};
    const code = (body.code || "").toUpperCase().trim();
    if (!code) {
      return res.status(400).json({ success: false, message: "Coupon code is required" });
    }

    const id = body.id || String(Date.now());
    const newCoupon = {
      ...body,
      id: String(id),
      code,
      name: body.name || code,
      discountValue: Number(body.discountValue) || 0,
      usageCount: Number(body.usageCount) || 0,
      usageLimit: Number(body.usageLimit) || 0,
      limitPerCustomer: Number(body.limitPerCustomer) || 1,
      minOrderValue: Number(body.minOrderValue) || 0,
      maxDiscount: Number(body.maxDiscount) || 0,
      status: body.status || "Active",
    };

    if (getDbStatus()) {
      const created = await Coupon.create(newCoupon);
      return res.status(201).json({ success: true, message: "Coupon created successfully", coupon: created });
    } else {
      if (!memoryStore.coupons) memoryStore.coupons = [];
      memoryStore.coupons.unshift(newCoupon);
      return res.status(201).json({ success: true, message: "Coupon created successfully", coupon: newCoupon });
    }
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/coupons
const handleUpdateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    if (body.code) body.code = body.code.toUpperCase().trim();

    if (getDbStatus()) {
      const updated = await Coupon.findOneAndUpdate(
        { $or: [{ id: String(id) }, { code: String(id).toUpperCase() }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
        { $set: body },
        { new: true }
      );
      if (updated) {
        return res.json({ success: true, message: "Coupon updated successfully", coupon: updated });
      }
    } else {
      const item = (memoryStore.coupons || []).find(
        (c) => String(c.id) === String(id) || String(c.code).toUpperCase() === String(id).toUpperCase()
      );
      if (item) {
        Object.assign(item, body);
        return res.json({ success: true, message: "Coupon updated successfully", coupon: item });
      }
    }

    return res.status(404).json({ success: false, message: "Coupon not found" });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/coupons/:id
const handleDeleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (getDbStatus()) {
      await Coupon.deleteOne({
        $or: [{ id: String(id) }, { code: String(id).toUpperCase() }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      });
    } else {
      const idx = (memoryStore.coupons || []).findIndex(
        (c) => String(c.id) === String(id) || String(c.code).toUpperCase() === String(id).toUpperCase()
      );
      if (idx !== -1) memoryStore.coupons.splice(idx, 1);
    }
    return res.json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/coupons/:id
// ==========================================
// OFFERS API ROUTES
// ==========================================

const handleGetOffers = async (req, res, next) => {
  try {
    let offers = [];
    if (getDbStatus()) {
      offers = await Offer.find({}).sort({ createdAt: -1 });
    } else {
      offers = memoryStore.offers || [];
    }

    return res.json({
      success: true,
      count: offers.length,
      offers,
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/offers
const handleCreateOffer = async (req, res, next) => {
  try {
    const body = req.body || {};
    const name = (body.name || "").trim();
    if (!name) {
      return res.status(400).json({ success: false, message: "Offer name is required" });
    }

    const id = body.id || String(Date.now());
    const newOffer = {
      ...body,
      id: String(id),
      name,
      discountValue: Number(body.discountValue) || 0,
      usageCount: Number(body.usageCount) || 0,
      usageLimit: Number(body.usageLimit) || 0,
      status: body.status || "Active",
    };

    if (getDbStatus()) {
      const created = await Offer.create(newOffer);
      return res.status(201).json({ success: true, message: "Offer created successfully", offer: created });
    } else {
      if (!memoryStore.offers) memoryStore.offers = [];
      memoryStore.offers.unshift(newOffer);
      return res.status(201).json({ success: true, message: "Offer created successfully", offer: newOffer });
    }
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/offers
const handleUpdateOffer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    if (getDbStatus()) {
      const updated = await Offer.findOneAndUpdate(
        { $or: [{ id: String(id) }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
        { $set: body },
        { new: true }
      );
      if (updated) {
        return res.json({ success: true, message: "Offer updated successfully", offer: updated });
      }
    } else {
      const item = (memoryStore.offers || []).find(
        (o) => String(o.id) === String(id) || String(o._id) === String(id)
      );
      if (item) {
        Object.assign(item, body);
        return res.json({ success: true, message: "Offer updated successfully", offer: item });
      }
    }

    return res.status(404).json({ success: false, message: "Offer not found" });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/offers/:id
const handleDeleteOffer = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (getDbStatus()) {
      await Offer.deleteOne({
        $or: [{ id: String(id) }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      });
    } else {
      const idx = (memoryStore.offers || []).findIndex(
        (o) => String(o.id) === String(id) || String(o._id) === String(id)
      );
      if (idx !== -1) memoryStore.offers.splice(idx, 1);
    }
    return res.json({ success: true, message: "Offer deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/offers/:id
// ==========================================
// CATEGORIES API ROUTES
// ==========================================

const handleGetCategories = async (req, res, next) => {
  try {
    let categories = [];
    const sortOrder = req.query.sort === "desc" ? -1 : 1;
    if (getDbStatus()) {
      categories = await Category.find({}).sort({ createdAt: sortOrder });
    } else {
      categories = memoryStore.categories || [];
    }
    return res.json({ success: true, count: categories.length, categories });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/categories
export const getCategories = handleGetCategories;

// @route POST /api/admin/categories/upload
export const uploadCategoriesUpload = (req, res, next) => {
  categoryUpload.single("image")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || "Failed to upload image" });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }
    const host = req.get("host") || "localhost:5000";
    const protocol = req.protocol || "http";
    const imageUrl = `${protocol}://${host}/uploads/categories/${req.file.filename}`;
    return res.json({
      success: true,
      message: "Category image uploaded successfully",
      imageUrl,
      filename: req.file.filename,
    });
  });
};

const handleCreateCategory = async (req, res, next) => {
  try {
    const { name, image, status, type } = req.body || {};
    const trimmed = (name || "").trim();
    if (!trimmed) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const id = req.body.id || `${slug}-${Date.now().toString().slice(-4)}`;

    const newCategory = {
      id,
      name: trimmed,
      slug,
      image: image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
      status: status || "Active",
      type: type || "outdoor",
      itemCount: 0,
    };

    if (getDbStatus()) {
      const created = await Category.create(newCategory);
      broadcastEvent("CATEGORIES_UPDATED", { action: "create", category: created });
      return res.status(201).json({ success: true, message: "Category created successfully", category: created });
    } else {
      if (!memoryStore.categories) memoryStore.categories = [];
      memoryStore.categories.unshift(newCategory);
      broadcastEvent("CATEGORIES_UPDATED", { action: "create", category: newCategory });
      return res.status(201).json({ success: true, message: "Category created successfully", category: newCategory });
    }
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/categories
export const createCategories = (req, res, next) => {
  categoryUpload.single("image")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || "Failed to upload image" });
    }
    if (req.file) {
      const host = req.get("host") || "localhost:5000";
      const protocol = req.protocol || "http";
      req.body = req.body || {};
      req.body.image = `${protocol}://${host}/uploads/categories/${req.file.filename}`;
    }
    handleCreateCategory(req, res, next);
  });
};

const handleUpdateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    if (body.name) {
      body.name = body.name.trim();
      body.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }

    if (getDbStatus()) {
      const updated = await Category.findOneAndUpdate(
        { $or: [{ id: String(id) }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
        { $set: body },
        { new: true }
      );
      if (updated) {
        broadcastEvent("CATEGORIES_UPDATED", { action: "update", id, category: updated });
        return res.json({ success: true, message: "Category updated successfully", category: updated });
      }
    } else {
      const item = (memoryStore.categories || []).find(
        (c) => String(c.id) === String(id) || String(c._id) === String(id)
      );
      if (item) {
        Object.assign(item, body);
        broadcastEvent("CATEGORIES_UPDATED", { action: "update", id, category: item });
        return res.json({ success: true, message: "Category updated successfully", category: item });
      }
    }

    return res.status(404).json({ success: false, message: "Category not found" });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/categories/:id
export const updateCategoriesById = (req, res, next) => {
  categoryUpload.single("image")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || "Failed to upload image" });
    }
    if (req.file) {
      const host = req.get("host") || "localhost:5000";
      const protocol = req.protocol || "http";
      req.body = req.body || {};
      req.body.image = `${protocol}://${host}/uploads/categories/${req.file.filename}`;
    }
    handleUpdateCategory(req, res, next);
  });
};

const handleDeleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (getDbStatus()) {
      await Category.deleteOne({
        $or: [{ id: String(id) }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      });
    } else {
      const idx = (memoryStore.categories || []).findIndex(
        (c) => String(c.id) === String(id) || String(c._id) === String(id)
      );
      if (idx !== -1) memoryStore.categories.splice(idx, 1);
    }
    broadcastEvent("CATEGORIES_UPDATED", { action: "delete", id });
    return res.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/categories/:id
export const deleteCategoriesById = handleDeleteCategory;


export const createCoupons = handleCreateCoupon;
export const updateCouponsById = handleUpdateCoupon;
export const deleteCouponsById = handleDeleteCoupon;

export const getOffers = handleGetOffers;
export const createOffers = handleCreateOffer;
export const updateOffersById = handleUpdateOffer;
export const deleteOffersById = handleDeleteOffer;
