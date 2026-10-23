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

// @route POST /api/admin/products/upload
export const uploadProductsUpload = (req, res, next) => {
  productUpload.any()(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || "Failed to upload file" });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No file provided" });
    }
    const host = req.get("host") || "localhost:5000";
    const protocol = req.protocol || "http";
    const files = req.files.map((f) => ({
      url: `${protocol}://${host}/uploads/products/${f.filename}`,
      filename: f.filename,
      originalName: f.originalname,
      size: f.size,
      mimetype: f.mimetype,
    }));
    return res.json({
      success: true,
      message: `${files.length} file(s) uploaded successfully`,
      url: files[0].url,
      urls: files.map((f) => f.url),
      files,
    });
  });
};

// @route GET /api/admin/products
export const getProducts = async (req, res, next) => {
  try {
    if (getDbStatus()) {
      const products = await Product.find({}).sort({ id: 1 });
      return res.json({ success: true, count: products.length, products });
    } else {
      return res.json({ success: true, count: memoryStore.products.length, products: memoryStore.products });
    }
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/products
export const createProducts = async (req, res, next) => {
  try {
    const nextId = req.body.id || Date.now();
    let determinedCategoryType = req.body.categoryType || "";
    if (!determinedCategoryType && req.body.category) {
      if (getDbStatus()) {
        try {
          const cat = await Category.findOne({ name: new RegExp(`^${req.body.category}$`, "i") });
          if (cat) determinedCategoryType = cat.type;
        } catch (e) {}
      } else {
        const cat = (memoryStore.categories || []).find(
          (c) => (c.name || "").toLowerCase() === (req.body.category || "").toLowerCase()
        );
        if (cat) determinedCategoryType = cat.type;
      }
    }

    const isInstoreOnly =
      req.body.webStatus === "in-store" ||
      req.body.visibility === "in-store" ||
      req.body.productChannel === "in-store";

    const newProduct = {
      ...req.body,
      id: nextId,
      name: req.body.name || req.body.title || "New Outdoor Product",
      brand: req.body.brand || (req.body.posDepartment ? req.body.posDepartment.split(" [")[0] : "DZIRE"),
      category: req.body.category || "General",
      categoryType: determinedCategoryType || (req.body.category && req.body.category.toLowerCase().includes("outdoor") ? "outdoor" : "product"),
      price: Number(req.body.price || req.body.sellingPrice) || 999,
      oldPrice: Number(req.body.oldPrice || req.body.mrp) || 1499,
      cost: Number(req.body.cost || req.body.purchasePrice) || 699,
      stock: Number(req.body.stock) || 10,
      sku: req.body.sku || `DZR-${nextId}`,
      image: req.body.image || (req.body.variations?.[0]?.img) || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
      images: req.body.images || (req.body.variations ? req.body.variations.map(v => v.img).filter(Boolean) : []),
      description: req.body.description || "High performance outdoor equipment designed for endurance.",
      status: Number(req.body.stock) <= 0 ? "Out of Stock" : Number(req.body.stock) <= 5 ? "Low Stock" : "Active",
      webStatus: isInstoreOnly ? "in-store" : (req.body.webStatus || "view_on_web"),
      visibility: isInstoreOnly ? "in-store" : "web",
      productChannel: isInstoreOnly ? "in-store" : "website + in-store",
      hasVariations: Boolean(req.body.hasVariations),
      attributes: req.body.attributes || [],
      variations: req.body.variations || [],
      primaryBarcode: req.body.primaryBarcode || "",
      barcodeFormat: req.body.barcodeFormat || "EAN-13",
      hsnCode: req.body.hsnCode || "",
      posDepartment: req.body.posDepartment || "",
      enableInPOS: req.body.enableInPOS ?? true,
      quickBillingTile: req.body.quickBillingTile ?? true,
      allowManualPriceAtPOS: req.body.allowManualPriceAtPOS ?? false,
      vendor: req.body.vendor || (req.body.brand ? `${req.body.brand} [PO]` : "Dzire Store [PO]"),
      gstRate: req.body.gstRate || "18",
      createdAt: new Date(),
    };

    if (getDbStatus()) {
      const product = await Product.create(newProduct);
      broadcastEvent("PRODUCT_UPDATED", { action: "create", id: product.id, product });
      return res.status(201).json({ success: true, product });
    } else {
      memoryStore.products.unshift(newProduct);
      broadcastEvent("PRODUCT_UPDATED", { action: "create", id: newProduct.id, product: newProduct });
      return res.status(201).json({ success: true, product: newProduct });
    }
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/products/:id
export const updateProductsById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const updatePayload = { ...req.body };

    if (
      updatePayload.visibility !== undefined ||
      updatePayload.webStatus !== undefined ||
      updatePayload.productChannel !== undefined
    ) {
      const isInstore =
        updatePayload.visibility === "in-store" ||
        updatePayload.webStatus === "in-store" ||
        updatePayload.productChannel === "in-store";
      updatePayload.visibility = isInstore ? "in-store" : "web";
      updatePayload.webStatus = isInstore ? "in-store" : "view_on_web";
      updatePayload.productChannel = isInstore ? "in-store" : "website + in-store";
    }

    if (updatePayload.category && !updatePayload.categoryType) {
      try {
        if (getDbStatus()) {
          const cat = await Category.findOne({ name: new RegExp(`^${updatePayload.category}$`, "i") });
          if (cat) updatePayload.categoryType = cat.type;
        } else {
          const cat = (memoryStore.categories || []).find(
            (c) => (c.name || "").toLowerCase() === (updatePayload.category || "").toLowerCase()
          );
          if (cat) updatePayload.categoryType = cat.type;
        }
      } catch (e) {}
    }

    if (getDbStatus()) {
      const isObjectId = Boolean(id && typeof id === "string" && id.match(/^[0-9a-fA-F]{24}$/));
      const numericId = Number(id);
      const queryList = [];
      if (!isNaN(numericId)) queryList.push({ id: numericId });
      queryList.push({ id: id });
      queryList.push({ id: String(id) });
      if (isObjectId) queryList.push({ _id: id });

      const product = await Product.findOneAndUpdate(
        { $or: queryList },
        { $set: updatePayload },
        { new: true }
      );
      if (product) {
        broadcastEvent("PRODUCT_UPDATED", { action: "update", id, product });
        return res.json({ success: true, product });
      }
    } else {
      const product = memoryStore.products.find(
        (p) => String(p.id) === String(id) || String(p._id) === String(id)
      );
      if (product) {
        Object.assign(product, updatePayload);
        broadcastEvent("PRODUCT_UPDATED", { action: "update", id, product });
        return res.json({ success: true, product });
      }
    }

    return res.status(404).json({ success: false, message: "Product not found" });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/products/:id
export const deleteProductsById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (getDbStatus()) {
      await Product.deleteOne({
        $or: [{ id: Number(id) || id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      });
      broadcastEvent("PRODUCT_UPDATED", { action: "delete", id });
      return res.json({ success: true, message: "Product deleted successfully" });
    } else {
      const idx = memoryStore.products.findIndex(
        (p) => String(p.id) === String(id) || String(p._id) === String(id)
      );
      if (idx !== -1) {
        memoryStore.products.splice(idx, 1);
      }
      broadcastEvent("PRODUCT_UPDATED", { action: "delete", id });
      return res.json({ success: true, message: "Product deleted successfully" });
    }
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/attributes
export const getAttributes = async (req, res, next) => {
  try {
    if (getDbStatus()) {
      let attributes = await Attribute.find({}).sort({ createdAt: 1 });
      if (!attributes || attributes.length === 0) {
        // Seed default attributes into Mongo if empty
        if (memoryStore.attributes && memoryStore.attributes.length > 0) {
          attributes = await Attribute.insertMany(memoryStore.attributes);
        }
      }
      return res.json({ success: true, count: attributes.length, attributes });
    } else {
      return res.json({
        success: true,
        count: (memoryStore.attributes || []).length,
        attributes: memoryStore.attributes || []
      });
    }
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/attributes
export const createAttributes = async (req, res, next) => {
  try {
    const { name, type, description, values, isPreset } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Attribute name is required" });
    }

    const cleanName = name.trim();
    const id = req.body.id || `attr_${Date.now()}`;
    const newAttr = {
      id,
      name: cleanName,
      type: type || "text",
      isPreset: Boolean(isPreset),
      description: description ? description.trim() : `Custom ${cleanName} variation attribute`,
      values: Array.isArray(values) ? values : [],
      createdAt: new Date().toISOString().split("T")[0]
    };

    if (getDbStatus()) {
      // Check duplicate
      const existing = await Attribute.findOne({ name: { $regex: new RegExp(`^${cleanName}$`, "i") } });
      if (existing) {
        return res.status(400).json({ success: false, message: `Attribute with name "${cleanName}" already exists.` });
      }
      const attribute = await Attribute.create(newAttr);
      return res.status(201).json({ success: true, attribute });
    } else {
      const isDuplicate = (memoryStore.attributes || []).some(
        (a) => a.name.toLowerCase() === cleanName.toLowerCase()
      );
      if (isDuplicate) {
        return res.status(400).json({ success: false, message: `Attribute with name "${cleanName}" already exists.` });
      }
      if (!memoryStore.attributes) memoryStore.attributes = [];
      memoryStore.attributes.push(newAttr);
      return res.status(201).json({ success: true, attribute: newAttr });
    }
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/attributes/:id
export const updateAttributesById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, description, values } = req.body;

    if (getDbStatus()) {
      const updated = await Attribute.findOneAndUpdate(
        { $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
        {
          $set: {
            ...(name ? { name: name.trim() } : {}),
            ...(type ? { type } : {}),
            ...(description !== undefined ? { description: description.trim() } : {}),
            ...(Array.isArray(values) ? { values } : {})
          }
        },
        { new: true }
      );
      if (updated) return res.json({ success: true, attribute: updated });
    } else {
      const attr = (memoryStore.attributes || []).find((a) => String(a.id) === String(id));
      if (attr) {
        if (name) attr.name = name.trim();
        if (type) attr.type = type;
        if (description !== undefined) attr.description = description.trim();
        if (Array.isArray(values)) attr.values = values;
        return res.json({ success: true, attribute: attr });
      }
    }

    return res.status(404).json({ success: false, message: "Attribute not found" });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/attributes/:id
export const deleteAttributesById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (getDbStatus()) {
      await Attribute.deleteOne({ $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] });
      return res.json({ success: true, message: "Attribute deleted successfully" });
    } else {
      const idx = (memoryStore.attributes || []).findIndex((a) => String(a.id) === String(id));
      if (idx !== -1) {
        memoryStore.attributes.splice(idx, 1);
      }
      return res.json({ success: true, message: "Attribute deleted successfully" });
    }
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/attributes/reset
export const resetAttributesReset = async (req, res, next) => {
  try {
    const defaults = [];

    if (getDbStatus()) {
      await Attribute.deleteMany({});
      await Attribute.insertMany(defaults);
    }
    memoryStore.attributes = [...defaults];

    return res.json({ success: true, message: "Attributes reset to presets successfully", attributes: defaults });
  } catch (error) {
    next(error);
  }
};


// @route GET /api/admin/products/:id
export const getProductsById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let product = null;

    if (getDbStatus()) {
      const isObjectId = Boolean(id && typeof id === "string" && id.match(/^[0-9a-fA-F]{24}$/));
      const numericId = Number(id);
      const queryList = [];
      if (!isNaN(numericId)) queryList.push({ id: numericId });
      queryList.push({ id: id });
      queryList.push({ id: String(id) });
      if (isObjectId) queryList.push({ _id: id });

      product = await Product.findOne({ $or: queryList });
    } else {
      product = memoryStore.products.find(
        (p) => String(p.id) === String(id) || String(p._id) === String(id)
      );
    }

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.json({ success: true, ...product, product });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/payments
export const getPayments = async (req, res, next) => {
  try {
    let orders = [];
    if (getDbStatus()) {
      orders = await Order.find({}).sort({ createdAt: -1 });
    } else {
      orders = memoryStore.orders || [];
    }

    const payments = orders.map((o) => ({
      id: o.orderId || o.orderNumber || o.id || o._id,
      order_number: o.orderNumber || o.orderId || `ORD-${o.id}`,
      customer_name: o.userName || o.shippingAddress?.fullName || "Customer",
      amount: Number(o.total || o.totalAmount || 0),
      method: o.paymentMethod || "Online Payment",
      status: (o.paymentStatus || "Paid").toLowerCase() === "paid" ? "paid" : "pending",
      created_at: o.createdAt || new Date().toISOString(),
    }));

    return res.json(payments);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/stock-alerts
export const getStockAlerts = async (req, res, next) => {
  try {
    let products = [];
    if (getDbStatus()) {
      products = await Product.find({ stock: { $lte: 5 } });
    } else {
      products = (memoryStore.products || []).filter((p) => Number(p.stock) <= 5);
    }

    const alerts = products.map((p, idx) => ({
      id: idx + 1,
      product_id: p.id || p._id,
      product_name: p.name,
      stock: p.stock,
      status: Number(p.stock) <= 0 ? "out_of_stock" : "low_stock",
      email: "inventory@dzire.in",
      created_at: new Date().toISOString(),
    }));

    return res.json(alerts);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/brands
export const getBrands = async (req, res, next) => {
  try {
    let products = [];
    if (getDbStatus()) {
      products = await Product.find({});
    } else {
      products = memoryStore.products || [];
    }

    const brandsMap = new Map();
    products.forEach((p) => {
      const b = p.brand || "Dzire";
      const stock = Number(p.stock) || 0;
      const price = Number(p.price) || 0;

      if (!brandsMap.has(b)) {
        brandsMap.set(b, {
          brand: b,
          product_count: 1,
          in_stock_products: stock > 0 ? 1 : 0,
          total_stock_units: stock,
          min_price: price,
          max_price: price,
          average_price: price,
          low_stock_products: stock > 0 && stock <= 5 ? 1 : 0,
          out_of_stock_products: stock === 0 ? 1 : 0,
          featured_products: [p],
          latest_updated_at: new Date().toISOString(),
        });
      } else {
        const existing = brandsMap.get(b);
        existing.product_count++;
        if (stock > 0) existing.in_stock_products++;
        existing.total_stock_units += stock;
        existing.min_price = Math.min(existing.min_price, price);
        existing.max_price = Math.max(existing.max_price, price);
        if (stock > 0 && stock <= 5) existing.low_stock_products++;
        if (stock === 0) existing.out_of_stock_products++;
        if (existing.featured_products.length < 3) existing.featured_products.push(p);
      }
    });

    return res.json(Array.from(brandsMap.values()));
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/collections
export const getCollections = async (req, res) => {
  return res.json([
    {
      id: 1,
      name: "Trekking & Camping Gear",
      slug: "trekking-camping-gear",
      card_image: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&q=80&w=400",
      sort_order: 1,
      is_active: true,
      product_ids: [1, 3],
    },
    {
      id: 2,
      name: "High Altitude Climbing",
      slug: "high-altitude-climbing",
      card_image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=400",
      sort_order: 2,
      is_active: true,
      product_ids: [2, 4],
    },
    {
      id: 3,
      name: "Waterproof Apparel",
      slug: "waterproof-apparel",
      card_image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400",
      sort_order: 3,
      is_active: true,
      product_ids: [5, 6],
    },
  ]);
};

