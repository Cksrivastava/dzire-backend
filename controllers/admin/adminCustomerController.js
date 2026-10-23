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

// @route GET /api/admin/users
export const getUsers = async (req, res, next) => {
  try {
    let users = [];
    let orders = [];

    if (getDbStatus()) {
      users = await User.find({}).sort({ createdAt: -1 }).lean();
      orders = await Order.find({}).sort({ createdAt: -1 }).lean();
    } else {
      users = (memoryStore.users || []).map((u) => ({ ...u }));
      orders = (memoryStore.orders || []).map((o) => ({ ...o }));
    }

    const enhancedUsers = users.map((u) => {
      const userOrders = orders.filter((o) => {
        const matchId = u._id && o.userId && String(o.userId) === String(u._id);
        const matchEmail = u.email && o.userEmail && o.userEmail.toLowerCase() === u.email.toLowerCase();
        const matchPhone = u.phone && o.userPhone && u.phone.replace(/\D/g, "") === String(o.userPhone).replace(/\D/g, "");
        return matchId || matchEmail || matchPhone;
      });

      const ordersCount = userOrders.length;
      const totalSpent = userOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      const lastOrder = userOrders[0];
      const lastPurchase = lastOrder
        ? (lastOrder.date || (lastOrder.createdAt ? new Date(lastOrder.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"))
        : "Never";

      const addresses = Array.isArray(u.addresses) && u.addresses.length > 0
        ? u.addresses
        : (u.address ? [{ type: "Home", isDefault: true, address: u.address, recipient: u.name, phone: u.phone }] : []);

      return {
        ...u,
        id: u._id ? String(u._id) : (u.id || `user_${Date.now()}`),
        ordersCount,
        totalOrders: ordersCount,
        totalSpent,
        lastPurchase,
        recentOrders: userOrders.slice(0, 5),
        addresses,
        credits: typeof u.credits === "number" ? u.credits : 0,
        earnedCredits: typeof u.earnedCredits === "number" ? u.earnedCredits : (u.credits || 0),
        usedCredits: typeof u.usedCredits === "number" ? u.usedCredits : 0,
        activities: Array.isArray(u.activities) ? u.activities : [],
      };
    });

    return res.json({ success: true, count: enhancedUsers.length, users: enhancedUsers });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/users
export const createUsers = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      email,
      type = "Regular",
      channel = "Online",
      status = "Active",
      gender = "Other",
      dob = "",
      notes = "",
      address = "",
      tags = ["Customer"],
      credits = 0,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Customer name is required" });
    }

    const cleanEmail = (email && email.trim())
      ? email.trim().toLowerCase()
      : `${(phone || "cust").replace(/\D/g, "")}_${Date.now()}@dzire.in`;

    const cleanAddresses = address
      ? [
          {
            type: "Home",
            isDefault: true,
            recipient: name.trim(),
            address: address.trim(),
            phone: phone || "",
            street: address.trim(),
            city: address.trim().split(",")[0] || "",
            state: "",
            pincode: "",
          },
        ]
      : [];

    const creditsNum = Number(credits) || 0;
    const initialActivity = creditsNum > 0
      ? [
          {
            id: Date.now().toString(),
            type: "earned",
            amount: creditsNum,
            ref: "Initial Welcome Credits",
            date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
            createdAt: new Date(),
          },
        ]
      : [];

    const userData = {
      name: name.trim(),
      email: cleanEmail,
      phone: (phone || "").trim(),
      role: "customer",
      type: type || "Regular",
      channel: channel || "Online",
      status: status || "Active",
      gender: gender || "Other",
      dob: dob || "",
      notes: notes || "",
      tags: Array.isArray(tags) ? tags : [type || "Customer"],
      credits: creditsNum,
      earnedCredits: creditsNum,
      usedCredits: 0,
      activities: initialActivity,
      addresses: cleanAddresses,
      password: "Dzire@" + Math.floor(1000 + Math.random() * 9000),
    };

    if (getDbStatus()) {
      const existing = await User.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `User with email "${cleanEmail}" already exists.`,
        });
      }
      const user = await User.create(userData);
      return res.status(201).json({
        success: true,
        message: "Customer created successfully",
        user: { ...user.toObject(), id: String(user._id) },
      });
    } else {
      const newUser = {
        _id: `user_${Date.now()}`,
        id: `user_${Date.now()}`,
        ...userData,
        createdAt: new Date(),
      };
      if (!memoryStore.users) memoryStore.users = [];
      memoryStore.users.unshift(newUser);
      return res.status(201).json({
        success: true,
        message: "Customer created successfully",
        user: newUser,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/users/import
export const importUsersImport = async (req, res, next) => {
  try {
    const { customers = [] } = req.body;
    if (!Array.isArray(customers) || customers.length === 0) {
      return res.status(400).json({ success: false, message: "No customers to import" });
    }

    let importedCount = 0;
    for (const c of customers) {
      if (!c.name) continue;
      const cleanEmail = (c.email && c.email.trim())
        ? c.email.trim().toLowerCase()
        : `${(c.phone || "cust").replace(/\D/g, "")}_${Date.now()}_${Math.floor(Math.random() * 1000)}@dzire.in`;

      const userDoc = {
        name: c.name.trim(),
        email: cleanEmail,
        phone: (c.phone || "").trim(),
        role: "customer",
        type: c.type || "Regular",
        channel: c.channel || "Online",
        status: c.status || "Active",
        gender: c.gender || "Other",
        dob: c.dob || "",
        notes: c.notes || "",
        tags: c.tags || ["Customer"],
        credits: Number(c.credits) || 0,
        earnedCredits: Number(c.earnedCredits || c.credits) || 0,
        usedCredits: Number(c.usedCredits) || 0,
        password: "Dzire@Password123",
      };

      if (getDbStatus()) {
        const exists = await User.findOne({ email: cleanEmail });
        if (!exists) {
          await User.create(userDoc);
          importedCount++;
        }
      } else {
        const exists = (memoryStore.users || []).some(
          (u) => u.email.toLowerCase() === cleanEmail.toLowerCase()
        );
        if (!exists) {
          memoryStore.users.push({ _id: `user_${Date.now()}_${importedCount}`, id: `user_${Date.now()}_${importedCount}`, ...userDoc, createdAt: new Date() });
          importedCount++;
        }
      }
    }

    return res.json({ success: true, message: `Successfully imported ${importedCount} customers`, count: importedCount });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/users/:id
export const updateUsersById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData.password;

    if (getDbStatus()) {
      let user = null;
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        user = await User.findById(id);
      }
      if (!user) {
        user = await User.findOne({ $or: [{ email: id.toLowerCase() }, { phone: id }] });
      }

      if (user) {
        Object.keys(updateData).forEach((key) => {
          if (updateData[key] !== undefined) {
            user[key] = updateData[key];
          }
        });
        await user.save();
        return res.json({ success: true, message: "Customer updated successfully", user: { ...user.toObject(), id: String(user._id) } });
      }
    } else {
      const user = memoryStore.users.find(
        (u) => String(u._id) === String(id) || String(u.id) === String(id)
      );
      if (user) {
        Object.assign(user, updateData);
        return res.json({ success: true, message: "Customer updated successfully", user });
      }
    }

    return res.status(404).json({ success: false, message: "Customer not found" });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/users/:id
export const deleteUsersById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (getDbStatus()) {
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        await User.findByIdAndDelete(id);
      } else {
        await User.deleteOne({ $or: [{ email: id }, { phone: id }] });
      }
      return res.json({ success: true, message: "Customer deleted successfully" });
    } else {
      const idx = memoryStore.users.findIndex(
        (u) => String(u._id) === String(id) || String(u.id) === String(id)
      );
      if (idx !== -1) {
        memoryStore.users.splice(idx, 1);
      }
      return res.json({ success: true, message: "Customer deleted successfully" });
    }
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/users/:id/credits
export const createUsersByIdCredits = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, type, reason } = req.body;
    const amountNum = Math.abs(Number(amount)) || 0;
    const isAdd = type === "add" || type === "earned";

    const newActivity = {
      id: Date.now().toString(),
      type: isAdd ? "earned" : "deducted",
      amount: amountNum,
      ref: (reason || "").trim() || (isAdd ? "Manual Credit Award" : "Manual Credit Deduction"),
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      createdAt: new Date(),
    };

    if (getDbStatus()) {
      let user = null;
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        user = await User.findById(id);
      }
      if (!user) {
        user = await User.findOne({ $or: [{ email: id.toLowerCase() }, { phone: id }] });
      }

      if (user) {
        const curBal = Number(user.credits) || 0;
        const newBal = isAdd ? curBal + amountNum : Math.max(0, curBal - amountNum);
        user.credits = newBal;
        if (isAdd) {
          user.earnedCredits = (Number(user.earnedCredits) || curBal) + amountNum;
        } else {
          user.usedCredits = (Number(user.usedCredits) || 0) + amountNum;
        }
        if (!Array.isArray(user.activities)) user.activities = [];
        user.activities.unshift(newActivity);

        await user.save();
        return res.json({
          success: true,
          message: `Successfully ${isAdd ? "added" : "deducted"} ${amountNum} credits.`,
          user: { ...user.toObject(), id: String(user._id) },
        });
      }
    } else {
      const user = memoryStore.users.find(
        (u) => String(u._id) === String(id) || String(u.id) === String(id)
      );
      if (user) {
        const curBal = Number(user.credits) || 0;
        const newBal = isAdd ? curBal + amountNum : Math.max(0, curBal - amountNum);
        user.credits = newBal;
        if (isAdd) {
          user.earnedCredits = (Number(user.earnedCredits) || curBal) + amountNum;
        } else {
          user.usedCredits = (Number(user.usedCredits) || 0) + amountNum;
        }
        if (!Array.isArray(user.activities)) user.activities = [];
        user.activities.unshift(newActivity);

        return res.json({
          success: true,
          message: `Successfully ${isAdd ? "added" : "deducted"} ${amountNum} credits.`,
          user,
        });
      }
    }

    return res.status(404).json({ success: false, message: "Customer not found" });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/credits/summary
export const getCreditsSummary = async (req, res, next) => {
  try {
    let users = [];
    if (getDbStatus()) {
      users = await User.find({ role: "customer" }).lean();
    } else {
      users = (memoryStore.users || []).filter((u) => u.role !== "admin");
    }

    let totalIssued = 0;
    let totalRedeemed = 0;
    let outstanding = 0;
    let activeMembers = 0;
    let withCredits = 0;
    let noCredits = 0;

    users.forEach((u) => {
      const bal = Number(u.credits) || 0;
      const earned = Number(u.earnedCredits) || bal;
      const used = Number(u.usedCredits) || 0;

      outstanding += bal;
      totalIssued += earned;
      totalRedeemed += used;

      if (u.status !== "Inactive") activeMembers++;
      if (bal > 0) withCredits++;
      else noCredits++;
    });

    return res.json({
      success: true,
      summary: {
        totalIssued,
        totalRedeemed,
        outstanding,
        activeMembers,
        withCredits,
        noCredits,
        totalMembers: users.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/returns
export const getReturns = async (req, res, next) => {
  try {
    const { type } = req.query;
    let returnsList = [];

    if (getDbStatus()) {
      // 1. Fetch return requests from orders
      const returnOrders = await Order.find({ "returnRequest.status": { $exists: true } }).sort({
        "returnRequest.submittedAt": -1,
      });

      const orderReturns = returnOrders.map((o) => {
        let status = o.returnRequest?.status || "Pending Approval";
        if (status === "Submitted") status = "Pending Approval";
        return {
          id: o.returnRequest?.returnId || `RET-${o.orderId}`,
          orderId: o.orderId || o.orderNumber,
          date: o.returnRequest?.submittedAt
            ? new Date(o.returnRequest.submittedAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "Recent",
          cust: o.userName || o.shippingAddress?.fullName || "Customer",
          items: String(o.items?.length || 1),
          amount: `₹${(o.total || 0).toLocaleString("en-IN")}`,
          type: o.returnRequest?.reason || "Return / Refund",
          status,
          refundMethod: o.returnRequest?.resolution || "Wallet",
          source: "order",
        };
      });

      // 2. Fetch standalone customer returns
      const standaloneReturns = await CustomerReturn.find({}).sort({ createdAt: -1 });
      const mappedStandalone = standaloneReturns.map((c) => ({
        id: c.id,
        orderId: c.orderId || "N/A",
        date: c.date,
        cust: c.cust,
        items: c.items || "1",
        amount: c.amount || `₹${(c.amountNum || 0).toLocaleString("en-IN")}`,
        type: c.type || "Return / Refund",
        status: c.status || "Pending Approval",
        refundMethod: c.refundMethod || "Wallet",
        source: "standalone",
      }));

      returnsList = [...orderReturns, ...mappedStandalone];
    } else {
      const orderReturns = (memoryStore.orders || [])
        .filter((o) => o.returnRequest)
        .map((o) => {
          let status = o.returnRequest?.status || "Pending Approval";
          if (status === "Submitted") status = "Pending Approval";
          return {
            id: o.returnRequest?.returnId || `RET-${o.orderId}`,
            orderId: o.orderId || o.orderNumber,
            date: o.returnRequest?.submittedAt
              ? new Date(o.returnRequest.submittedAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "Recent",
            cust: o.userName || o.shippingAddress?.fullName || "Customer",
            items: String(o.items?.length || 1),
            amount: `₹${(o.total || 0).toLocaleString("en-IN")}`,
            type: o.returnRequest?.reason || "Return / Refund",
            status,
            refundMethod: o.returnRequest?.resolution || "Wallet",
            source: "order",
          };
        });

      const standaloneReturns = (memoryStore.customerReturns || []).map((c) => ({
        id: c.id,
        orderId: c.orderId || "N/A",
        date: c.date,
        cust: c.cust,
        items: c.items || "1",
        amount: c.amount || `₹${(c.amountNum || 0).toLocaleString("en-IN")}`,
        type: c.type || "Return / Refund",
        status: c.status || "Pending Approval",
        refundMethod: c.refundMethod || "Wallet",
        source: "standalone",
      }));

      returnsList = [...orderReturns, ...standaloneReturns];
    }

    if (type && type !== "All Types") {
      returnsList = returnsList.filter(
        (r) => (r.type || "").toLowerCase().includes(type.toLowerCase())
      );
    }

    res.json({ success: true, count: returnsList.length, returns: returnsList });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/returns
export const createReturns = async (req, res, next) => {
  try {
    const b = req.body || {};
    const id = b.id || `RET-${Date.now().toString().slice(-6)}`;
    const newReturn = {
      id,
      orderId: b.orderId || `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      date: b.date || new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      cust: b.cust || b.customer || "Customer",
      email: b.email || "",
      mobile: b.mobile || "",
      items: String(b.items || 1),
      itemDetails: b.itemDetails || "",
      amount: b.amount || `₹${(Number(b.totalAmount || b.amountNum) || 0).toLocaleString("en-IN")}`,
      amountNum: Number(b.amountNum || b.totalAmount) || 0,
      type: b.type || "Defective",
      reason: b.reason || "Defective item",
      status: b.status || "Pending Approval",
      refundMethod: b.refundMethod || "Wallet",
      notes: b.notes || "",
    };

    if (getDbStatus()) {
      const created = await CustomerReturn.create(newReturn);
      return res.status(201).json({ success: true, message: "Return request created", returnRequest: created });
    } else {
      if (!memoryStore.customerReturns) memoryStore.customerReturns = [];
      memoryStore.customerReturns.unshift(newReturn);
      return res.status(201).json({ success: true, message: "Return request created", returnRequest: newReturn });
    }
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/returns/:id
export const updateReturnsById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "Approved", "Refunded (Wallet)", "Rejected", etc.

    let updated = false;

    if (getDbStatus()) {
      // 1. Try updating Order returnRequest
      const order = await Order.findOne({
        $or: [{ "returnRequest.returnId": id }, { orderId: id }, { orderNumber: id }],
      });
      if (order && order.returnRequest) {
        order.returnRequest.status = status;
        if (status === "Approved" || status === "Refunded (Wallet)") {
          order.status = "Refunded";
          order.statusColor = "#15803d";
          order.statusBg = "#f0fdf4";
        } else if (status === "Rejected") {
          order.status = "Confirmed";
        }
        await order.save();
        updated = true;
      }

      // 2. Try updating CustomerReturn
      const custRet = await CustomerReturn.findOneAndUpdate(
        { $or: [{ id }, { orderId: id }] },
        { status },
        { new: true }
      );
      if (custRet) updated = true;
    } else {
      const order = (memoryStore.orders || []).find(
        (o) =>
          o.returnRequest?.returnId === id ||
          o.orderId === id ||
          o.orderNumber === id
      );
      if (order && order.returnRequest) {
        order.returnRequest.status = status;
        if (status === "Approved" || status === "Refunded (Wallet)") {
          order.status = "Refunded";
          order.statusColor = "#15803d";
          order.statusBg = "#f0fdf4";
        } else if (status === "Rejected") {
          order.status = "Confirmed";
        }
        updated = true;
      }

      const custRet = (memoryStore.customerReturns || []).find(
        (c) => c.id === id || c.orderId === id
      );
      if (custRet) {
        custRet.status = status;
        updated = true;
      }
    }

    if (updated) {
      return res.json({ success: true, message: `Return request marked as ${status}` });
    }

    return res.status(404).json({ success: false, message: "Return request not found" });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/returns/:id
export const deleteReturnsById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let deleted = false;

    if (getDbStatus()) {
      const resOrder = await Order.updateOne(
        { $or: [{ "returnRequest.returnId": id }, { orderId: id }] },
        { $unset: { returnRequest: 1 } }
      );
      if (resOrder.modifiedCount > 0) deleted = true;

      const resCust = await CustomerReturn.deleteOne({ $or: [{ id }, { orderId: id }] });
      if (resCust.deletedCount > 0) deleted = true;
    } else {
      const order = (memoryStore.orders || []).find(
        (o) => o.returnRequest?.returnId === id || o.orderId === id
      );
      if (order) {
        delete order.returnRequest;
        deleted = true;
      }
      const idx = (memoryStore.customerReturns || []).findIndex(
        (c) => c.id === id || c.orderId === id
      );
      if (idx !== -1) {
        memoryStore.customerReturns.splice(idx, 1);
        deleted = true;
      }
    }

    if (deleted) {
      return res.json({ success: true, message: "Return request deleted successfully" });
    }
    return res.status(404).json({ success: false, message: "Return request not found" });
  } catch (error) {
    next(error);
  }
};

