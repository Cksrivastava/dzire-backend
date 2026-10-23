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

// Helper to compute balance summary
export const computeVendorSummary = (vendorsList) => {
  const totalVendors = vendorsList.length;
  let totalToCollect = 0;
  let totalToPay = 0;

  vendorsList.forEach((v) => {
    const rawVal = Number(String(v.openingBalance || v.balance || 0).replace(/[^0-9.]/g, "")) || 0;
    if (v.balanceType === "collect") {
      totalToCollect += rawVal;
    } else if (v.balanceType === "pay") {
      totalToPay += rawVal;
    }
  });

  return {
    totalVendors,
    totalToCollect,
    totalToPay,
    formattedToCollect: `₹ ${totalToCollect.toLocaleString("en-IN")}`,
    formattedToPay: `₹ ${totalToPay.toLocaleString("en-IN")}`,
  };
};

// @route GET /api/admin/vendors
export const getVendors = async (req, res, next) => {
  try {
    let vendors = [];

    if (getDbStatus()) {
      vendors = await Vendor.find({}).sort({ createdAt: -1 });
      if (!vendors || vendors.length === 0) {
        if (memoryStore.vendors && memoryStore.vendors.length > 0) {
          vendors = await Vendor.insertMany(memoryStore.vendors);
        }
      }
    } else {
      vendors = memoryStore.vendors || [];
    }

    const { search, category } = req.query;
    let filtered = [...vendors];

    if (category && category !== "All") {
      filtered = filtered.filter(
        (v) => (v.category || "").toLowerCase() === category.toLowerCase()
      );
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (v) =>
          (v.name || "").toLowerCase().includes(q) ||
          (v.category || "").toLowerCase().includes(q) ||
          (v.mobile || "").includes(q) ||
          (v.gstin || "").toLowerCase().includes(q)
      );
    }

    const summary = computeVendorSummary(vendors);

    return res.json({
      success: true,
      count: filtered.length,
      vendors: filtered,
      summary,
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/vendors/:id
export const getVendorsById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (getDbStatus()) {
      const vendor = await Vendor.findOne({
        $or: [{ id: Number(id) || id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      });
      if (vendor) return res.json({ success: true, vendor });
    } else {
      const vendor = (memoryStore.vendors || []).find(
        (v) => String(v.id) === String(id) || String(v._id) === String(id)
      );
      if (vendor) return res.json({ success: true, vendor });
    }

    return res.status(404).json({ success: false, message: "Vendor not found" });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/vendors
export const createVendors = async (req, res, next) => {
  try {
    const {
      name,
      partyName,
      category,
      mobile,
      email,
      openingBalance,
      balanceType: rawBalanceType,
      gstin,
      panNumber,
      type: rawType,
      partyType,
      billingAddress,
      shippingAddress,
      creditPeriod,
      creditLimit,
      contactPerson,
      dateOfBirth,
      bankDetails,
    } = req.body;

    const vendorName = (name || partyName || "").trim();
    if (!vendorName) {
      return res.status(400).json({ success: false, message: "Party / Vendor name is required" });
    }

    const nextId = req.body.id || Date.now();
    const numBalance = Number(String(openingBalance || 0).replace(/[^0-9.]/g, "")) || 0;
    
    let balanceType = "neutral";
    const lowerType = String(rawBalanceType || "").toLowerCase();
    if (lowerType.includes("collect")) balanceType = "collect";
    else if (lowerType.includes("pay")) balanceType = "pay";
    else if (numBalance > 0) balanceType = "pay";

    const formattedBalance = numBalance > 0 ? `₹ ${numBalance.toLocaleString("en-IN")}` : "₹ 0";

    const newVendor = {
      id: nextId,
      name: vendorName,
      category: category && category !== "Select Category" ? category : "Bag & Accessories",
      mobile: mobile || "",
      email: email || "",
      openingBalance: numBalance,
      balance: formattedBalance,
      balanceType: balanceType,
      gstin: gstin || "",
      panNumber: panNumber || (gstin && gstin.length >= 10 ? gstin.slice(2, 12).toUpperCase() : ""),
      type: rawType || partyType || "Supplier",
      billingAddress: billingAddress || "",
      shippingAddress: shippingAddress || billingAddress || "",
      creditPeriod: creditPeriod ? (String(creditPeriod).includes("Days") ? creditPeriod : `${creditPeriod} Days`) : "30 Days",
      creditLimit: creditLimit ? (String(creditLimit).startsWith("₹") ? creditLimit : `₹ ${Number(String(creditLimit).replace(/[^0-9.]/g, "") || 0).toLocaleString("en-IN")}`) : "₹ 0",
      contactPerson: contactPerson || "",
      dateOfBirth: dateOfBirth || "",
      bankDetails: bankDetails || {},
      createdAt: new Date().toISOString().split("T")[0],
    };

    if (getDbStatus()) {
      const vendor = await Vendor.create(newVendor);
      return res.status(201).json({ success: true, vendor });
    } else {
      if (!memoryStore.vendors) memoryStore.vendors = [];
      memoryStore.vendors.unshift(newVendor);
      return res.status(201).json({ success: true, vendor: newVendor });
    }
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/vendors/:id
export const updateVendorsById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (getDbStatus()) {
      const vendor = await Vendor.findOneAndUpdate(
        { $or: [{ id: Number(id) || id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
        { $set: req.body },
        { new: true }
      );
      if (vendor) return res.json({ success: true, vendor });
    } else {
      const vendor = (memoryStore.vendors || []).find(
        (v) => String(v.id) === String(id) || String(v._id) === String(id)
      );
      if (vendor) {
        Object.assign(vendor, req.body);
        return res.json({ success: true, vendor });
      }
    }

    return res.status(404).json({ success: false, message: "Vendor not found" });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/vendors/:id
export const deleteVendorsById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (getDbStatus()) {
      await Vendor.deleteOne({
        $or: [{ id: Number(id) || id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      });
      return res.json({ success: true, message: "Vendor deleted successfully" });
    } else {
      const idx = (memoryStore.vendors || []).findIndex(
        (v) => String(v.id) === String(id) || String(v._id) === String(id)
      );
      if (idx !== -1) {
        memoryStore.vendors.splice(idx, 1);
      }
      return res.json({ success: true, message: "Vendor deleted successfully" });
    }
  } catch (error) {
    next(error);
  }
};

