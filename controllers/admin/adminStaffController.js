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

// @route POST /api/admin/staff/upload
export const uploadStaffUpload = (req, res, next) => {
  staffUpload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    const host = req.get("host") || "localhost:5000";
    const protocol = req.protocol || "http";
    const fileUrl = `${protocol}://${host}/uploads/staff/${req.file.filename}`;
    const sizeBytes = req.file.size;
    const formattedSize =
      sizeBytes > 1024 * 1024
        ? `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(sizeBytes / 1024)} KB`;

    return res.json({
      success: true,
      message: "File uploaded successfully",
      fileUrl,
      url: fileUrl,
      filename: req.file.originalname,
      storedFilename: req.file.filename,
      size: formattedSize,
      mimetype: req.file.mimetype,
    });
  });
};

// @route GET /api/admin/staff
export const getStaff = async (req, res, next) => {
  try {
    let staffList = [];
    if (getDbStatus()) {
      staffList = await Staff.find({}).sort({ createdAt: -1 });
    } else {
      staffList = memoryStore.staff || [];
    }
    return res.json({ success: true, count: staffList.length, staff: staffList });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/staff/:id
export const getStaffById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let member = null;
    if (getDbStatus()) {
      member = await Staff.findOne({
        $or: [
          { id: String(id) },
          { id: isNaN(Number(id)) ? -1 : Number(id) },
          { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        ],
      });
    } else {
      member = (memoryStore.staff || []).find(
        (s) => String(s.id) === String(id) || String(s._id) === String(id)
      );
    }
    if (!member) {
      return res.status(404).json({ success: false, message: "Staff member not found" });
    }
    return res.json({ success: true, staff: member });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/staff
export const createStaff = async (req, res, next) => {
  try {
    const body = req.body || {};
    const name = (body.name || "").trim();
    if (!name) {
      return res.status(400).json({ success: false, message: "Staff name is required" });
    }

    const staffId = body.id || Date.now();
    const newStaff = {
      ...body,
      id: staffId,
      name,
      role: body.role || "Sales Associate",
      phone: body.phone || "",
      email: body.email || "",
      status: body.status || "Active",
      attendanceRate: body.attendanceRate || "92%",
    };

    if (getDbStatus()) {
      const created = await Staff.create(newStaff);
      return res.status(201).json({ success: true, message: "Staff member created", staff: created });
    } else {
      if (!memoryStore.staff) memoryStore.staff = [];
      memoryStore.staff.unshift(newStaff);
      return res.status(201).json({ success: true, message: "Staff member created", staff: newStaff });
    }
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/staff/:id
export const updateStaffById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    if (body.name) body.name = body.name.trim();

    if (getDbStatus()) {
      const updated = await Staff.findOneAndUpdate(
        {
          $or: [
            { id: String(id) },
            { id: isNaN(Number(id)) ? -1 : Number(id) },
            { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
          ],
        },
        { $set: body },
        { new: true }
      );
      if (updated) {
        return res.json({ success: true, message: "Staff member updated", staff: updated });
      }
    } else {
      const idx = (memoryStore.staff || []).findIndex(
        (s) => String(s.id) === String(id) || String(s._id) === String(id)
      );
      if (idx !== -1) {
        memoryStore.staff[idx] = { ...memoryStore.staff[idx], ...body };
        return res.json({ success: true, message: "Staff member updated", staff: memoryStore.staff[idx] });
      }
    }
    return res.status(404).json({ success: false, message: "Staff member not found" });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/staff/:id
export const deleteStaffById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (getDbStatus()) {
      await Staff.deleteOne({
        $or: [
          { id: String(id) },
          { id: isNaN(Number(id)) ? -1 : Number(id) },
          { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        ],
      });
    } else {
      const idx = (memoryStore.staff || []).findIndex(
        (s) => String(s.id) === String(id) || String(s._id) === String(id)
      );
      if (idx !== -1) memoryStore.staff.splice(idx, 1);
    }
    return res.json({ success: true, message: "Staff member deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/staff/bulk-delete
export const createStaffBulkDelete = async (req, res, next) => {
  try {
    const { ids = [] } = req.body;
    if (getDbStatus()) {
      await Staff.deleteMany({
        $or: [
          { id: { $in: ids } },
          { id: { $in: ids.map(String) } },
          { _id: { $in: ids.filter((id) => typeof id === "string" && id.match(/^[0-9a-fA-F]{24}$/)) } },
        ],
      });
    } else {
      memoryStore.staff = (memoryStore.staff || []).filter(
        (s) => !ids.includes(s.id) && !ids.map(String).includes(String(s.id))
      );
    }
    return res.json({ success: true, message: "Selected staff members deleted" });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/staff/:id/password-reset
export const resetStaffByIdPasswordReset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword, sendEmail } = req.body || {};
    return res.json({
      success: true,
      message: "Password reset successfully",
      emailSent: Boolean(sendEmail),
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ROLES & PERMISSIONS ROUTES
// ==========================================

const DEFAULT_SYSTEM_ROLES = [
  {
    id: 1,
    name: "Super Admin",
    icon: "👑",
    iconColor: "#f59e0b",
    iconBg: "#fef3c7",
    type: "System",
    description: "Full access to all modules and settings.",
    staffCount: 1,
    status: "Active",
    permissions: {
      dashboard: ["create_kpi", "view_dashboard", "manage_kpi", "delete_kpi"],
      sales: ["create_orders", "view_orders", "view_pos", "edit_orders", "process_returns", "cancel_orders", "delete_orders"],
      inventory: ["create_products", "view_products", "view_defective", "update_stock", "edit_products", "delete_products"],
      purchase: ["create_po", "view_po", "view_invoices", "approve_po", "payment_out", "delete_po"],
      customers: ["create_customers", "view_customers", "edit_customers", "manage_credits", "issue_refunds", "delete_customers"],
      marketing: ["create_coupons", "create_banners", "view_offers", "edit_banners", "collaborations", "delete_coupons"],
      website: ["create_blogs", "create_events", "view_website_content", "manage_blogs", "manage_categories", "delete_blogs"],
      staff: ["create_staff", "view_staff", "view_attendance", "manage_staff", "manage_attendance", "manage_salaries", "manage_roles", "delete_staff"],
      finance: ["create_expenses", "view_reports", "gst_reports", "profit_loss", "export_data", "delete_records"],
      settings: ["create_api_keys", "view_settings", "audit_logs", "store_settings", "payment_gateways", "shipping_settings", "delete_backups"],
    },
  },
  {
    id: 2,
    name: "Store Manager",
    icon: "🏪",
    iconColor: "#2563eb",
    iconBg: "#eff6ff",
    type: "System",
    description: "Manages store operations, staff, inventory and sales.",
    staffCount: 2,
    status: "Active",
    permissions: {
      dashboard: ["view_dashboard"],
      sales: ["view_orders", "create_orders", "edit_orders", "cancel_orders", "view_pos", "process_returns"],
      inventory: ["view_products", "update_stock", "edit_products", "view_defective"],
      purchase: ["view_po", "create_po", "view_invoices"],
      customers: ["view_customers", "edit_customers", "manage_credits"],
      marketing: ["view_offers", "create_coupons"],
      staff: ["view_staff", "view_attendance", "manage_attendance"],
      finance: ["view_reports"],
      settings: [],
    },
  },
  {
    id: 3,
    name: "Sales Associate",
    icon: "👤",
    iconColor: "#0284c7",
    iconBg: "#e0f2fe",
    type: "System",
    description: "Handles POS and in-store customer orders.",
    staffCount: 2,
    status: "Active",
    permissions: {
      dashboard: ["view_dashboard"],
      sales: ["view_orders", "create_orders", "view_pos", "process_returns"],
      inventory: ["view_products"],
      purchase: [],
      customers: ["view_customers"],
      marketing: ["view_offers"],
      staff: [],
      finance: [],
      settings: [],
    },
  },
  {
    id: 4,
    name: "Inventory Executive",
    icon: "📦",
    iconColor: "#ea580c",
    iconBg: "#ffedd5",
    type: "Custom",
    description: "Manages inventory, stock adjustments, purchase orders.",
    staffCount: 1,
    status: "Active",
    permissions: {
      dashboard: ["view_dashboard"],
      sales: ["view_orders"],
      inventory: ["view_products", "update_stock", "create_products", "edit_products", "view_defective"],
      purchase: ["view_po", "create_po", "view_invoices"],
      customers: [],
      marketing: [],
      staff: [],
      finance: ["view_reports"],
      settings: [],
    },
  },
  {
    id: 5,
    name: "Marketing Executive",
    icon: "📢",
    iconColor: "#3b82f6",
    iconBg: "#dbeafe",
    type: "Custom",
    description: "Manages offers, coupons, collaborations and content.",
    staffCount: 1,
    status: "Active",
    permissions: {
      dashboard: ["view_dashboard"],
      sales: ["view_orders"],
      inventory: ["view_products"],
      purchase: [],
      customers: ["view_customers"],
      marketing: ["view_offers", "create_coupons", "edit_banners", "collaborations"],
      staff: [],
      finance: ["view_reports"],
      settings: [],
    },
  },
  {
    id: 6,
    name: "Viewer (Reports Only)",
    icon: "📈",
    iconColor: "#16a34a",
    iconBg: "#dcfce7",
    type: "Custom",
    description: "Read-only access to reports and dashboards.",
    staffCount: 1,
    status: "Active",
    permissions: {
      dashboard: ["view_dashboard"],
      sales: ["view_orders"],
      inventory: ["view_products"],
      purchase: [],
      customers: ["view_customers"],
      marketing: [],
      staff: [],
      finance: ["view_reports", "gst_reports", "profit_loss"],
      settings: [],
    },
  },
];

// @route GET /api/admin/roles
export const getRoles = async (req, res, next) => {
  try {
    let roles = [];
    if (getDbStatus()) {
      roles = await Role.find({}).sort({ id: 1, createdAt: 1 });
      if (roles.length === 0) {
        roles = await Role.insertMany(DEFAULT_SYSTEM_ROLES);
      }
    } else {
      if (!memoryStore.roles || memoryStore.roles.length === 0) {
        memoryStore.roles = [...DEFAULT_SYSTEM_ROLES];
      }
      roles = memoryStore.roles;
    }
    return res.json({ success: true, count: roles.length, roles });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/roles/:id
export const getRolesById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let role = null;
    if (getDbStatus()) {
      role = await Role.findOne({
        $or: [
          { id: String(id) },
          { id: isNaN(Number(id)) ? -1 : Number(id) },
          { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        ],
      });
    } else {
      role = (memoryStore.roles || []).find(
        (r) => String(r.id) === String(id) || String(r._id) === String(id)
      );
    }
    if (!role) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }
    return res.json({ success: true, role });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/roles
export const createRoles = async (req, res, next) => {
  try {
    const body = req.body || {};
    const name = (body.name || "").trim();
    if (!name) {
      return res.status(400).json({ success: false, message: "Role name is required" });
    }

    const newRole = {
      ...body,
      id: body.id || Date.now(),
      name,
      icon: body.icon || "🛡️",
      iconColor: body.iconColor || "#ff6600",
      iconBg: body.iconBg || "#fff7ed",
      type: body.type || "Custom",
      description: body.description || "",
      staffCount: body.staffCount || 0,
      status: body.status || "Active",
      permissions: body.permissions || {},
    };

    if (getDbStatus()) {
      const created = await Role.create(newRole);
      return res.status(201).json({ success: true, message: "Role created successfully", role: created });
    } else {
      if (!memoryStore.roles) memoryStore.roles = [];
      memoryStore.roles.push(newRole);
      return res.status(201).json({ success: true, message: "Role created successfully", role: newRole });
    }
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/roles/:id
export const updateRolesById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    if (body.name) body.name = body.name.trim();

    if (getDbStatus()) {
      const updated = await Role.findOneAndUpdate(
        {
          $or: [
            { id: String(id) },
            { id: isNaN(Number(id)) ? -1 : Number(id) },
            { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
          ],
        },
        { $set: body },
        { new: true }
      );
      if (updated) {
        return res.json({ success: true, message: "Role updated successfully", role: updated });
      }
    } else {
      const idx = (memoryStore.roles || []).findIndex(
        (r) => String(r.id) === String(id) || String(r._id) === String(id)
      );
      if (idx !== -1) {
        memoryStore.roles[idx] = { ...memoryStore.roles[idx], ...body };
        return res.json({ success: true, message: "Role updated successfully", role: memoryStore.roles[idx] });
      }
    }
    return res.status(404).json({ success: false, message: "Role not found" });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/roles/:id
export const deleteRolesById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (getDbStatus()) {
      const existing = await Role.findOne({
        $or: [
          { id: String(id) },
          { id: isNaN(Number(id)) ? -1 : Number(id) },
          { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        ],
      });
      if (existing && existing.type === "System") {
        return res.status(400).json({ success: false, message: "System roles cannot be deleted" });
      }
      await Role.deleteOne({
        $or: [
          { id: String(id) },
          { id: isNaN(Number(id)) ? -1 : Number(id) },
          { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        ],
      });
    } else {
      const idx = (memoryStore.roles || []).findIndex(
        (r) => String(r.id) === String(id) || String(r._id) === String(id)
      );
      if (idx !== -1) {
        if (memoryStore.roles[idx].type === "System") {
          return res.status(400).json({ success: false, message: "System roles cannot be deleted" });
        }
        memoryStore.roles.splice(idx, 1);
      }
    }
    return res.json({ success: true, message: "Role deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/roles/bulk-delete
export const createRolesBulkDelete = async (req, res, next) => {
  try {
    const { ids = [] } = req.body;
    if (getDbStatus()) {
      await Role.deleteMany({
        $and: [
          { type: { $ne: "System" } },
          {
            $or: [
              { id: { $in: ids } },
              { id: { $in: ids.map(String) } },
              { _id: { $in: ids.filter((id) => typeof id === "string" && id.match(/^[0-9a-fA-F]{24}$/)) } },
            ],
          },
        ],
      });
    } else {
      memoryStore.roles = (memoryStore.roles || []).filter(
        (r) => r.type === "System" || (!ids.includes(r.id) && !ids.map(String).includes(String(r.id)))
      );
    }
    return res.json({ success: true, message: "Selected custom roles deleted" });
  } catch (error) {
    next(error);
  }
};

