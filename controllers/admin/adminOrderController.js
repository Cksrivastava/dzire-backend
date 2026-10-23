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

// @route GET /api/admin/orders
export const getOrders = async (req, res, next) => {
  try {
    if (getDbStatus()) {
      const orders = await Order.find({}).sort({ createdAt: -1 });
      return res.json({ success: true, count: orders.length, orders });
    } else {
      return res.json({ success: true, count: memoryStore.orders.length, orders: memoryStore.orders });
    }
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/orders
export const createOrders = async (req, res, next) => {
  try {
    const orderNumber = req.body.orderNumber || req.body.orderId || `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const items = (Array.isArray(req.body.items) && req.body.items.length > 0)
      ? req.body.items.map((it, idx) => ({
          id: it.id || it.sku || `item_${Date.now()}_${idx}`,
          name: it.name || "Hiking Product",
          price: Number(it.price) || 0,
          quantity: Number(it.quantity) || 1,
          sku: it.sku || "DZR-GEN-01",
          img: it.img || it.image || "",
          image: it.image || it.img || "",
        }))
      : [
          {
            id: `item_${Date.now()}`,
            name: req.body.productName || "Hiking Product",
            price: Number(req.body.price) || 2499,
            quantity: Number(req.body.quantity) || 1,
            sku: req.body.sku || "DZR-GEN-01",
          },
        ];

    const total = Number(req.body.totalAmount) || Number(req.body.total) || Number(req.body.price) || 2499;

    const newOrder = {
      orderId: orderNumber,
      orderNumber,
      userName: req.body.customerName || req.body.customer?.name || "Customer",
      userEmail: req.body.email || req.body.customer?.email || "customer@example.com",
      userPhone: req.body.phone || req.body.customer?.phone || "+91 9876543210",
      items,
      total,
      totalAmount: total,
      status: req.body.status || "Confirmed",
      paymentStatus: req.body.paymentStatus || "Paid",
      paymentMethod: req.body.paymentMethod || "UPI / Online",
      shippingAddress: {
        fullName: req.body.customerName || req.body.customer?.name || "Customer",
        address: req.body.address || req.body.customer?.address || "Main Street",
        city: req.body.city || req.body.customer?.city || "Pune",
        state: req.body.state || req.body.customer?.state || "Maharashtra",
        pincode: req.body.pincode || req.body.customer?.pincode || "411001",
      },
      createdAt: new Date(),
    };

    if (getDbStatus()) {
      const order = await Order.create(newOrder);
      return res.status(201).json({ success: true, order });
    } else {
      memoryStore.orders.unshift(newOrder);
      return res.status(201).json({ success: true, order: newOrder });
    }
  } catch (error) {
    next(error);
  }
};

// Helper to normalize order for detail page & API
const normalizeAdminOrder = (o) => {
  if (!o) return null;
  const items = (o.items && o.items.length > 0)
    ? o.items.map((it, idx) => ({
        id: it.id || it._id || idx + 1,
        name: it.name || "Dzire Outdoor Gear",
        brand: it.brand || "Dzire",
        price: Number(it.price || 0),
        quantity: Number(it.quantity || 1),
        image: it.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=200",
      }))
    : [
        {
          id: 1,
          name: "Dzire Trekking Pack",
          brand: "Dzire",
          price: Number(o.total || o.totalAmount || 2499),
          quantity: 1,
          image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=200",
        },
      ];

  const addr = o.shippingAddress || {};
  const address_data = {
    fullName: o.userName || addr.fullName || "Valued Customer",
    phone: o.userPhone || addr.phone || "+91 9876543210",
    addressLine: addr.address || addr.addressLine || "Main Street",
    apartment: addr.apartment || "",
    area: addr.area || "",
    city: addr.city || "Pune",
    district: addr.district || "Pune",
    state: addr.state || "Maharashtra",
    pincode: addr.pincode || "411001",
    country: "India",
  };

  const statusStr = (o.status || "confirmed").toLowerCase();
  const paymentStatusStr = (o.paymentStatus || o.payment_status || "paid").toLowerCase();

  return {
    id: o.orderId || o.orderNumber || o.id || o._id,
    orderId: o.orderId || o.orderNumber || o.id,
    order_number: o.orderNumber || o.orderId || `ORD-${o.id || "1001"}`,
    status: statusStr,
    payment_status: paymentStatusStr,
    payment_method: o.paymentMethod || o.payment_method || "online",
    payment_reference: o.payment_reference || o.paymentReference || "",
    currency: "Rs",
    total_price: Number(o.total || o.totalAmount || 0),
    subtotal: Number(o.total || o.totalAmount || 0),
    shipping_fee: Number(o.shipping_fee || 0),
    created_at: o.createdAt || o.created_at || new Date().toISOString(),
    confirmed_at: o.confirmed_at || o.createdAt || null,
    expected_ship_at: o.expected_ship_at || null,
    shipped_at: o.shipped_at || null,
    expected_delivery_at: o.expected_delivery_at || null,
    delivered_at: o.delivered_at || null,
    cancelled_at: o.cancelled_at || null,
    address_data,
    address: `${address_data.addressLine}, ${address_data.city}`,
    items,
    updates: o.updates || [
      {
        id: "up_1",
        status: statusStr,
        title: "Order Processed",
        message: "Order placed and confirmed successfully in system.",
        created_at: o.createdAt || new Date().toISOString(),
        visible_to_customer: true,
      },
    ],
  };
};

// @route GET /api/admin/orders/:id
export const getOrdersById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let foundOrder = null;

    if (getDbStatus()) {
      foundOrder = await Order.findOne({
        $or: [{ orderId: id }, { orderNumber: id }],
      });
      if (!foundOrder && id.match(/^[0-9a-fA-F]{24}$/)) {
        foundOrder = await Order.findById(id);
      }
    } else {
      foundOrder = memoryStore.orders.find(
        (o) =>
          String(o.orderId) === String(id) ||
          String(o.orderNumber) === String(id) ||
          String(o.id) === String(id) ||
          String(o._id) === String(id)
      );
    }

    if (!foundOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const normalized = normalizeAdminOrder(foundOrder);
    return res.json({ success: true, ...normalized, order: normalized });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/orders/:id/updates
export const createOrdersByIdUpdates = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, title, message, created_at, visible_to_customer } = req.body;
    const newUpdate = {
      id: `up_${Date.now()}`,
      status: status || "confirmed",
      title: title || "Order Update",
      message: message || "Status update on order.",
      created_at: created_at || new Date().toISOString(),
      visible_to_customer: visible_to_customer !== false,
    };

    if (getDbStatus()) {
      let order = await Order.findOne({ $or: [{ orderId: id }, { orderNumber: id }] });
      if (!order && id.match(/^[0-9a-fA-F]{24}$/)) {
        order = await Order.findById(id);
      }
      if (order) {
        if (!order.updates) order.updates = [];
        order.updates.unshift(newUpdate);
        if (status && status !== "custom") order.status = status;
        await order.save();
        return res.json({ success: true, update: newUpdate, order });
      }
    } else {
      const order = memoryStore.orders.find(
        (o) =>
          String(o.orderId) === String(id) ||
          String(o.orderNumber) === String(id) ||
          String(o.id) === String(id) ||
          String(o._id) === String(id)
      );
      if (order) {
        if (!order.updates) order.updates = [];
        order.updates.unshift(newUpdate);
        if (status && status !== "custom") order.status = status;
        return res.json({ success: true, update: newUpdate, order });
      }
    }

    return res.status(404).json({ success: false, message: "Order not found" });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/orders/:id
export const updateOrdersById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      status,
      paymentStatus,
      payment_status,
      payment_reference,
      trackingNumber,
      notes,
      confirmed_at,
      expected_ship_at,
      shipped_at,
      expected_delivery_at,
      delivered_at,
      cancelled_at,
    } = req.body;

    if (getDbStatus()) {
      let order = await Order.findOne({ $or: [{ orderId: id }, { orderNumber: id }] });
      if (!order && id.match(/^[0-9a-fA-F]{24}$/)) {
        order = await Order.findById(id);
      }
      if (order) {
        if (status) order.status = status;
        if (paymentStatus || payment_status) order.paymentStatus = paymentStatus || payment_status;
        if (payment_reference) order.paymentReference = payment_reference;
        if (trackingNumber) order.trackingNumber = trackingNumber;
        if (notes) order.notes = notes;
        if (confirmed_at) order.confirmed_at = confirmed_at;
        if (expected_ship_at) order.expected_ship_at = expected_ship_at;
        if (shipped_at) order.shipped_at = shipped_at;
        if (expected_delivery_at) order.expected_delivery_at = expected_delivery_at;
        if (delivered_at) order.delivered_at = delivered_at;
        if (cancelled_at) order.cancelled_at = cancelled_at;
        await order.save();
        return res.json({ success: true, message: "Order updated successfully", order });
      }
    } else {
      const order = memoryStore.orders.find(
        (o) =>
          String(o.orderId) === String(id) ||
          String(o.orderNumber) === String(id) ||
          String(o.id) === String(id) ||
          String(o._id) === String(id)
      );
      if (order) {
        if (status) order.status = status;
        if (paymentStatus || payment_status) order.paymentStatus = paymentStatus || payment_status;
        if (payment_reference) order.paymentReference = payment_reference;
        if (trackingNumber) order.trackingNumber = trackingNumber;
        if (notes) order.notes = notes;
        if (confirmed_at) order.confirmed_at = confirmed_at;
        if (expected_ship_at) order.expected_ship_at = expected_ship_at;
        if (shipped_at) order.shipped_at = shipped_at;
        if (expected_delivery_at) order.expected_delivery_at = expected_delivery_at;
        if (delivered_at) order.delivered_at = delivered_at;
        if (cancelled_at) order.cancelled_at = cancelled_at;
        return res.json({ success: true, message: "Order updated successfully", order });
      }
    }

    return res.status(404).json({ success: false, message: "Order not found" });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/orders/:id
export const deleteOrdersById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (getDbStatus()) {
      await Order.deleteOne({ $or: [{ orderId: id }, { orderNumber: id }] });
      return res.json({ success: true, message: "Order deleted successfully" });
    } else {
      const idx = memoryStore.orders.findIndex(
        (o) =>
          String(o.orderId) === String(id) ||
          String(o.orderNumber) === String(id) ||
          String(o.id) === String(id) ||
          String(o._id) === String(id)
      );
      if (idx !== -1) {
        memoryStore.orders.splice(idx, 1);
      }
      return res.json({ success: true, message: "Order deleted successfully" });
    }
  } catch (error) {
    next(error);
  }
};

