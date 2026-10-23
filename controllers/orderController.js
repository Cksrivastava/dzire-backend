import Order from "../models/Order.js";
import { getDbStatus } from "../config/db.js";
import memoryStore from "../config/store.js";
import { broadcastEvent } from "../websocket.js";

// @desc    Create a new order
// @route   POST /api/orders
export const createOrder = async (req, res, next) => {
  try {
    const {
      items,
      shippingAddress,
      total,
      subtotal,
      gst,
      shippingCost,
      discount,
      paymentMethod,
      contactEmail,
      contactPhone,
      fullName,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart has no items" });
    }

    const orderId = `DZ-${Math.floor(10000 + Math.random() * 90000)}`;

    const orderData = {
      orderId,
      userId: req.user?._id || null,
      userEmail: contactEmail || req.user?.email || "customer@example.com",
      userName: fullName || req.user?.name || "Customer",
      userPhone: contactPhone || req.user?.phone || "",
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        img: item.image || item.img || "",
        desc: item.desc || item.category || "",
        selectedSize: item.selectedSize || "Default",
        selectedColor: item.selectedColor || "Default",
      })),
      shippingAddress: shippingAddress || {},
      total: Number(total) || 0,
      subtotal: Number(subtotal) || 0,
      gst: Number(gst) || 0,
      shippingCost: Number(shippingCost) || 50,
      discount: Number(discount) || 0,
      paymentMethod: paymentMethod || "Credit/Debit Card, UPI (Razorpay)",
      status: "Confirmed",
      statusColor: "#0369a1",
      statusBg: "#e0f2fe",
      badgeClass: "badge-confirmed",
      deliveryInfo: "Order Confirmed by Seller",
      allowReturn: true,
      createdAt: new Date(),
    };

    if (getDbStatus()) {
      const order = await Order.create(orderData);
      broadcastEvent("ORDERS_UPDATED", { action: "create", orderId: order.orderId, order });
      return res.status(201).json({ success: true, order });
    } else {
      memoryStore.orders.unshift(orderData);
      broadcastEvent("ORDERS_UPDATED", { action: "create", orderId: orderData.orderId, order: orderData });
      return res.status(201).json({ success: true, order: orderData });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get order history
// @route   GET /api/orders
export const getOrders = async (req, res, next) => {
  try {
    if (getDbStatus()) {
      let orders = [];
      if (req.user) {
        orders = await Order.find({
          $or: [{ userId: req.user._id }, { userEmail: req.user.email }],
        })
          .sort({ createdAt: -1 })
          .lean();
      } else {
        orders = await Order.find({}).sort({ createdAt: -1 }).limit(10).lean();
      }
      return res.json({ success: true, count: orders.length, orders });
    } else {
      let orders = [...memoryStore.orders];
      if (req.user) {
        orders = orders.filter(
          (o) =>
            o.userEmail === req.user.email ||
            String(o.userId) === String(req.user._id)
        );
      }
      return res.json({ success: true, count: orders.length, orders });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get order details
// @route   GET /api/orders/:orderId
export const getOrderById = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (getDbStatus()) {
      let order = await Order.findOne({ orderId });
      if (!order && orderId.match(/^[0-9a-fA-F]{24}$/)) {
        order = await Order.findById(orderId);
      }
      if (!order) {
        order = await Order.findOne().sort({ createdAt: -1 });
      }
      return res.json({ success: true, order });
    } else {
      const order = memoryStore.orders.find((o) => o.orderId === orderId) || memoryStore.orders[0];
      return res.json({ success: true, order });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Submit return request for an order
// @route   POST /api/orders/:orderId/return
export const submitReturnRequest = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { reason, resolution, itemDetails, comments } = req.body;

    const returnRequest = {
      orderId,
      reason,
      resolution: resolution || "Refund",
      itemDetails: itemDetails || "",
      comments: comments || "",
      status: "Submitted",
      submittedAt: new Date(),
    };

    if (getDbStatus()) {
      let order = await Order.findOne({ orderId });
      if (!order && orderId.match(/^[0-9a-fA-F]{24}$/)) {
        order = await Order.findById(orderId);
      }
      if (order) {
        order.returnRequest = returnRequest;
        order.status = "On Hold";
        order.statusColor = "#c2410c";
        order.statusBg = "#fff7ed";
        order.badgeClass = "badge-on-hold";
        order.deliveryInfo = "Return Request Received & Under Review";
        await order.save();
      }
    } else {
      const order = memoryStore.orders.find((o) => o.orderId === orderId);
      if (order) {
        order.returnRequest = returnRequest;
        order.status = "On Hold";
        order.statusColor = "#c2410c";
        order.statusBg = "#fff7ed";
        order.badgeClass = "badge-on-hold";
        order.deliveryInfo = "Return Request Received & Under Review";
      }
    }

    res.json({
      success: true,
      message: "Return request submitted successfully",
      returnRequest,
    });
  } catch (error) {
    next(error);
  }
};
