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


export const generateAdminToken = (user) => {
  const secret = process.env.JWT_SECRET || "dzire_super_secret_jwt_key_2026_sports_gear";
  return jwt.sign(
    { id: user._id || user.id || "admin_1", role: "admin", email: user.email },
    secret,
    { expiresIn: "30d" }
  );
};

// @route POST /api/admin/login
export const adminLogin = async (req, res, next) => {
  try {
    const { identifier, email, password } = req.body;
    const userIdentifier = (identifier || email || "").trim();

    // Check default master admin or demo credentials
    if (
      (userIdentifier === "admin" && (password === "123456" || password === "admin123")) ||
      (userIdentifier.toLowerCase() === "admin@dzire.in" && (password === "123456" || password === "admin123")) ||
      (userIdentifier.toLowerCase() === "admin@dzire.com" && (password === "123456" || password === "admin123"))
    ) {
      const adminUser = {
        id: "admin_master_1",
        name: "Admin",
        email: "admin@dzire.in",
        role: "admin",
      };
      const token = generateAdminToken(adminUser);
      return res.json({ success: true, token, user: adminUser });
    }

    if (getDbStatus()) {
      const user = await User.findOne({
        $or: [{ email: userIdentifier.toLowerCase() }, { name: userIdentifier }],
      });
      if (user && (await user.comparePassword(password))) {
        if (user.role === "admin") {
          const token = generateAdminToken(user);
          return res.json({
            success: true,
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
          });
        } else {
          return res.status(403).json({ success: false, message: "Access denied. Admin rights required." });
        }
      }
    } else {
      const user = memoryStore.users.find(
        (u) =>
          u.email.toLowerCase() === userIdentifier.toLowerCase() ||
          u.name.toLowerCase() === userIdentifier.toLowerCase()
      );
      if (user && user.role === "admin") {
        const token = generateAdminToken(user);
        return res.json({
          success: true,
          token,
          user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
      }
    }

    return res.status(401).json({ success: false, message: "Invalid admin credentials" });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/overview
export const getOverview = async (req, res, next) => {
  try {
    const { from, to, startDate, endDate } = req.query;
    const fromStr = from || startDate;
    const toStr = to || endDate;

    let fromDate = null;
    let toDate = null;

    if (fromStr) {
      const parts = fromStr.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        fromDate = new Date(y, m, d, 0, 0, 0, 0);
      } else {
        const parsedFrom = new Date(fromStr);
        if (!isNaN(parsedFrom.getTime())) {
          parsedFrom.setHours(0, 0, 0, 0);
          fromDate = parsedFrom;
        }
      }
    }

    if (toStr) {
      const parts = toStr.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        toDate = new Date(y, m, d, 23, 59, 59, 999);
      } else {
        const parsedTo = new Date(toStr);
        if (!isNaN(parsedTo.getTime())) {
          parsedTo.setHours(23, 59, 59, 999);
          toDate = parsedTo;
        }
      }
    }

    const isFiltered = Boolean(fromDate || toDate);

    let orders = [];
    let products = [];
    let users = [];
    let posInvoices = [];
    let purchaseInvoices = [];
    let customerReturns = [];
    let instoreReturns = [];

    if (getDbStatus()) {
      orders = await Order.find({}).sort({ createdAt: -1 }).lean();
      products = await Product.find({}).lean();
      users = await User.find({}).lean();
      posInvoices = await PosInvoice.find({}).sort({ createdAt: -1 }).lean();
      purchaseInvoices = await PurchaseInvoice.find({}).sort({ createdAt: -1 }).lean();
      customerReturns = await CustomerReturn.find({}).sort({ createdAt: -1 }).lean();
      instoreReturns = await InstoreReturn.find({}).sort({ createdAt: -1 }).lean();
    } else {
      orders = memoryStore.orders || [];
      products = memoryStore.products || [];
      users = memoryStore.users || [];
      posInvoices = memoryStore.posInvoices || [];
      purchaseInvoices = memoryStore.purchaseInvoices || [];
      customerReturns = memoryStore.customerReturns || [];
      instoreReturns = memoryStore.instoreReturns || [];
    }

    const getItemDate = (item) => {
      const raw = item.createdAt || item.date || item.invoiceDate || item.dateTime;
      if (!raw) return null;
      const d = new Date(raw);
      return isNaN(d.getTime()) ? null : d;
    };

    const isWithinDateRange = (item) => {
      if (!fromDate && !toDate) return true;
      const d = getItemDate(item);
      if (!d) return false;
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      return true;
    };

    const filteredOrders = isFiltered ? orders.filter(isWithinDateRange) : orders;
    const filteredPosInvoices = isFiltered ? posInvoices.filter(isWithinDateRange) : posInvoices;
    const filteredPurchaseInvoices = isFiltered ? purchaseInvoices.filter(isWithinDateRange) : purchaseInvoices;
    const filteredCustomerReturns = isFiltered ? customerReturns.filter(isWithinDateRange) : customerReturns;
    const filteredInstoreReturns = isFiltered ? instoreReturns.filter(isWithinDateRange) : instoreReturns;

    const onlineSales = filteredOrders.reduce((sum, o) => sum + (Number(o.total || o.totalAmount) || 0), 0);
    const instoreSales = filteredPosInvoices.reduce((sum, p) => sum + (Number(p.totalAmount || p.subtotal || p.amount) || 0), 0);
    const totalSales = onlineSales + instoreSales;
    const totalOrders = filteredOrders.length;
    const instoreOrders = filteredPosInvoices.length;
    const totalPurchases = filteredPurchaseInvoices.reduce((sum, pi) => sum + (Number(pi.totalAmount || pi.amount || pi.subtotal) || 0), 0);

    const pendingShipments = filteredOrders.filter((o) =>
      ["Confirmed", "Packed", "In Transit", "pending", "processing"].includes(o.status)
    ).length;

    const totalProducts = products.length;
    const outOfStockCount = products.filter((p) => Number(p.stock || 0) <= 0).length;
    const lowStockCount = products.filter((p) => Number(p.stock || 0) > 0 && Number(p.stock || 0) <= 5).length;
    const inStockCount = products.filter((p) => Number(p.stock || 0) > 5).length;
    const totalStockValue = products.reduce((sum, p) => sum + ((Number(p.price) || 0) * (Number(p.stock) || 0)), 0);

    const customerUsers = users.filter((u) => u.role !== "admin");
    const totalCustomers = customerUsers.length;
    const activeCustomers = customerUsers.filter((u) => u.status === "Active" || !u.status).length;

    let totalCreditsIssued = 0;
    let totalCreditsRedeemed = 0;
    let creditsExpiring = 0;
    customerUsers.forEach((u) => {
      const bal = Number(u.credits) || 0;
      const earned = Number(u.earnedCredits) || bal;
      const used = Number(u.usedCredits) || 0;
      totalCreditsIssued += earned;
      totalCreditsRedeemed += used;
    });

    const now = new Date();
    let salesGrowth = "0.0%";
    let salesGrowthTrend = "pos";
    let ordersGrowth = "0.0%";
    let ordersGrowthTrend = "pos";

    let onlineBuckets = [0, 0, 0, 0, 0];
    let instoreBuckets = [0, 0, 0, 0, 0];

    if (isFiltered) {
      const rangeStart = fromDate ? fromDate.getTime() : (toDate ? toDate.getTime() - 30 * 86400000 : now.getTime() - 30 * 86400000);
      const rangeEnd = toDate ? toDate.getTime() : now.getTime();
      const duration = Math.max(rangeEnd - rangeStart, 86400000);

      // Compare with previous equivalent period
      const prevPeriodStart = rangeStart - duration;
      const prevPeriodEnd = rangeStart - 1;

      const prevOrders = orders.filter((o) => {
        const d = getItemDate(o);
        return d && d.getTime() >= prevPeriodStart && d.getTime() <= prevPeriodEnd;
      });
      const prevPos = posInvoices.filter((p) => {
        const d = getItemDate(p);
        return d && d.getTime() >= prevPeriodStart && d.getTime() <= prevPeriodEnd;
      });

      const prevSales = prevOrders.reduce((sum, o) => sum + (Number(o.total || o.totalAmount) || 0), 0) +
                        prevPos.reduce((sum, p) => sum + (Number(p.totalAmount || p.subtotal || p.amount) || 0), 0);

      if (prevSales === 0 && totalSales > 0) {
        salesGrowth = "+100%";
        salesGrowthTrend = "pos";
      } else if (prevSales > 0) {
        const diff = (((totalSales - prevSales) / prevSales) * 100);
        salesGrowth = diff >= 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
        salesGrowthTrend = diff >= 0 ? "pos" : "neg";
      }

      const prevOrdersCount = prevOrders.length;
      if (prevOrdersCount === 0 && totalOrders > 0) {
        ordersGrowth = "+100%";
        ordersGrowthTrend = "pos";
      } else if (prevOrdersCount > 0) {
        const diff = (((totalOrders - prevOrdersCount) / prevOrdersCount) * 100);
        ordersGrowth = diff >= 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
        ordersGrowthTrend = diff >= 0 ? "pos" : "neg";
      }

      // Chart buckets across the selected duration
      const step = duration / 5;
      onlineBuckets = [0, 1, 2, 3, 4].map((i) => {
        const bStart = rangeStart + i * step;
        const bEnd = i === 4 ? rangeEnd : rangeStart + (i + 1) * step;
        return filteredOrders.filter((o) => {
          const d = getItemDate(o);
          return d && d.getTime() >= bStart && d.getTime() <= bEnd;
        }).reduce((sum, o) => sum + (Number(o.total || o.totalAmount) || 0), 0);
      });

      instoreBuckets = [0, 1, 2, 3, 4].map((i) => {
        const bStart = rangeStart + i * step;
        const bEnd = i === 4 ? rangeEnd : rangeStart + (i + 1) * step;
        return filteredPosInvoices.filter((p) => {
          const d = getItemDate(p);
          return d && d.getTime() >= bStart && d.getTime() <= bEnd;
        }).reduce((sum, p) => sum + (Number(p.totalAmount || p.subtotal || p.amount) || 0), 0);
      });
    } else {
      // Default: Month-over-month calculation
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

      const thisMonthOrders = orders.filter((o) => {
        const d = getItemDate(o);
        return d && d >= currentMonthStart;
      });
      const lastMonthOrders = orders.filter((o) => {
        const d = getItemDate(o);
        return d && d >= lastMonthStart && d <= lastMonthEnd;
      });

      const thisMonthPos = posInvoices.filter((p) => {
        const d = getItemDate(p);
        return d && d >= currentMonthStart;
      });
      const lastMonthPos = posInvoices.filter((p) => {
        const d = getItemDate(p);
        return d && d >= lastMonthStart && d <= lastMonthEnd;
      });

      const thisMonthSales = thisMonthOrders.reduce((sum, o) => sum + (Number(o.total || o.totalAmount) || 0), 0) +
                             thisMonthPos.reduce((sum, p) => sum + (Number(p.totalAmount || p.subtotal || p.amount) || 0), 0);
      const lastMonthSales = lastMonthOrders.reduce((sum, o) => sum + (Number(o.total || o.totalAmount) || 0), 0) +
                             lastMonthPos.reduce((sum, p) => sum + (Number(p.totalAmount || p.subtotal || p.amount) || 0), 0);

      if (lastMonthSales === 0 && thisMonthSales > 0) {
        salesGrowth = "+100%";
        salesGrowthTrend = "pos";
      } else if (lastMonthSales > 0) {
        const diff = (((thisMonthSales - lastMonthSales) / lastMonthSales) * 100);
        salesGrowth = diff >= 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
        salesGrowthTrend = diff >= 0 ? "pos" : "neg";
      }

      if (lastMonthOrders.length === 0 && thisMonthOrders.length > 0) {
        ordersGrowth = "+100%";
        ordersGrowthTrend = "pos";
      } else if (lastMonthOrders.length > 0) {
        const diff = (((thisMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100);
        ordersGrowth = diff >= 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
        ordersGrowthTrend = diff >= 0 ? "pos" : "neg";
      }

      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const periodDays = [
        [1, Math.min(6, daysInMonth)],
        [7, Math.min(12, daysInMonth)],
        [13, Math.min(18, daysInMonth)],
        [19, Math.min(24, daysInMonth)],
        [25, daysInMonth]
      ];

      onlineBuckets = periodDays.map(([startD, endD]) => {
        return thisMonthOrders.filter((o) => {
          const d = getItemDate(o);
          if (!d) return false;
          const day = d.getDate();
          return day >= startD && day <= endD;
        }).reduce((sum, o) => sum + (Number(o.total || o.totalAmount) || 0), 0);
      });

      instoreBuckets = periodDays.map(([startD, endD]) => {
        return thisMonthPos.filter((p) => {
          const d = getItemDate(p);
          if (!d) return false;
          const day = d.getDate();
          return day >= startD && day <= endD;
        }).reduce((sum, p) => sum + (Number(p.totalAmount || p.subtotal || p.amount) || 0), 0);
      });
    }

    const maxChartVal = Math.max(...onlineBuckets, ...instoreBuckets, 100);
    const xs = [0, 100, 200, 300, 400];
    const generatePath = (buckets) => {
      const ys = buckets.map((b) => Math.round(130 - (b / maxChartVal) * 95));
      let d = `M${xs[0]},${ys[0]}`;
      for (let i = 1; i < xs.length; i++) {
        const prevX = xs[i - 1], prevY = ys[i - 1];
        const curX = xs[i], curY = ys[i];
        const midX = (prevX + curX) / 2;
        d += ` Q${midX},${prevY} ${curX},${curY}`;
      }
      return d;
    };

    const instorePath = generatePath(instoreBuckets);
    const onlinePath = generatePath(onlineBuckets);

    // Top selling products from filtered orders
    const productSalesMap = {};
    filteredOrders.forEach((o) => {
      (o.items || []).forEach((it) => {
        const key = it.name || it.productName || it.sku;
        if (!productSalesMap[key]) {
          productSalesMap[key] = {
            name: key,
            sku: it.sku || "DZR-GEN",
            sold: 0,
            revenue: 0,
          };
        }
        const qty = Number(it.quantity) || 1;
        productSalesMap[key].sold += qty;
        productSalesMap[key].revenue += (Number(it.price) || 0) * qty;
      });
    });
    const topSellingProducts = Object.values(productSalesMap).sort((a, b) => b.sold - a.sold).slice(0, 5);

    // Low stock products from real inventory
    const lowStockProducts = products
      .filter((p) => Number(p.stock || 0) <= 5)
      .slice(0, 5)
      .map((p) => ({
        name: p.name,
        sku: p.sku || "SKU-N/A",
        stock: Number(p.stock || 0),
        status: Number(p.stock || 0) <= 0 ? "Out of Stock" : "Low Stock",
      }));

    // Recent purchases
    const recentPurchases = filteredPurchaseInvoices.slice(0, 5).map((pi) => ({
      invoiceNumber: pi.invoiceNumber || pi.inv || pi.id,
      vendor: pi.party || pi.vendorName || "Vendor",
      amount: Number(pi.totalAmount || pi.amount || 0),
      date: pi.date || (pi.createdAt ? new Date(pi.createdAt).toLocaleDateString("en-IN") : "Today"),
      status: pi.status || "Paid",
    }));

    // Recent returns
    const combinedReturns = [
      ...filteredCustomerReturns.map((r) => ({
        id: r.id || r.returnId || "RET-CR",
        orderId: r.orderId || "Order",
        type: r.type || r.reason || "Customer Return",
        amount: r.amount || (r.refundAmount ? `₹ ${r.refundAmount}` : "₹ 0"),
        date: r.date || (r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Today"),
        status: r.status || "Pending",
      })),
      ...filteredInstoreReturns.map((r) => ({
        id: r.id || r.returnId || "RET-IR",
        orderId: r.billNumber || r.invoiceNumber || "POS Bill",
        type: r.reason || "In-store Return",
        amount: r.totalAmount ? `₹ ${r.totalAmount}` : (r.amount || "₹ 0"),
        date: r.date || (r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Today"),
        status: r.status || "Completed",
      })),
    ];
    const recentReturns = combinedReturns.slice(0, 5);

    res.json({
      success: true,
      filter: {
        from: fromStr || null,
        to: toStr || null,
        isFiltered,
      },
      metrics: {
        totalSales,
        onlineSales,
        instoreSales,
        totalOrders,
        instoreOrders,
        totalPurchases,
        pendingShipments,
        totalProducts,
        outOfStockCount,
        lowStockCount,
        inStockCount,
        totalStockValue,
        totalCustomers,
        activeCustomers,
        totalCreditsIssued,
        totalCreditsRedeemed,
        creditsExpiring,
        salesGrowth,
        salesGrowthTrend,
        ordersGrowth,
        ordersGrowthTrend,
        chartPaths: {
          instorePath,
          onlinePath,
        },
      },
      storeInfo: {
        name: "Dzire Store",
        category: "Outdoor Equipment Store",
        phone: "+91 98765 43210",
        email: "support@dzirestore.in",
        gstin: "27ABCDE1234F1Z5",
        location: "Pune, Maharashtra",
      },
      recentOrders: filteredOrders.slice(0, 5),
      recentPurchases,
      recentReturns,
      topSellingProducts,
      lowStockProducts,
    });
  } catch (error) {
    next(error);
  }
};

