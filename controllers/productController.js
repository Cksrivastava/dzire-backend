import Product from "../models/Product.js";
import Category from "../models/Category.js";
import { getDbStatus } from "../config/db.js";
import memoryStore from "../config/store.js";
import { broadcastEvent } from "../websocket.js";

// Helper to check if a product is visible on the website (i.e. website + in-store)
export const isWebsiteVisible = (p) => {
  if (!p) return false;
  const vis = (p.visibility || p.productChannel || "").toString().trim().toLowerCase();
  const webStatus = (p.webStatus || "").toString().trim().toLowerCase();
  if (vis === "in-store" || vis === "instore" || vis === "in-store only" || vis === "store") {
    return false;
  }
  if (webStatus === "in-store" || webStatus === "add_to_web" || webStatus === "hidden") {
    return false;
  }
  return true;
};

// @desc    Get all homepage sections (outdoor, trending, new arrivals)
// @route   GET /api/products/sections/all
export const getSectionsAll = async (req, res, next) => {
  try {
    if (getDbStatus()) {
      const webFilter = {
        visibility: { $nin: ["in-store", "instore"] },
        webStatus: { $ne: "in-store" },
        productChannel: { $ne: "in-store" },
      };

      const categories = await Category.find({}).lean();
      const outdoorCatNames = categories
        .filter((c) => (c.type || "").toLowerCase().includes("outdoor"))
        .map((c) => new RegExp(`^${c.name}$`, "i"));

      let outdoor = await Product.find({
        ...webFilter,
        $or: [{ section: "outdoor" }, { category: { $in: outdoorCatNames } }, { categoryType: "outdoor" }],
      }).lean().limit(10);

      let trending = await Product.find({ ...webFilter, section: "trending" }).lean().limit(10);
      let newArrivals = await Product.find({ ...webFilter, section: "new-arrivals" }).lean().limit(10);

      const all = await Product.find(webFilter).sort({ createdAt: -1 }).lean().limit(20);
      if (outdoor.length === 0) {
        outdoor = all.filter((p) => {
          const cat = categories.find(
            (c) => (c.name || "").toLowerCase() === (p.category || "").toLowerCase()
          );
          return (cat?.type || "").toLowerCase().includes("outdoor") || (p.category || "").toLowerCase().includes("outdoor");
        });
      }
      if (trending.length === 0) trending = all;
      if (newArrivals.length === 0) newArrivals = all;

      return res.json({
        success: true,
        data: {
          outdoorCollection: outdoor,
          trendingGear: trending,
          newArrivals: newArrivals,
        },
      });
    } else {
      const allWeb = (memoryStore.products || []).filter(isWebsiteVisible);

      const outdoorCatNames = (memoryStore.categories || [])
        .filter((c) => (c.type || "").toLowerCase().includes("outdoor"))
        .map((c) => (c.name || "").toLowerCase());

      let outdoor = allWeb.filter(
        (p) =>
          p.section === "outdoor" ||
          p.categoryType === "outdoor" ||
          outdoorCatNames.includes((p.category || "").toLowerCase()) ||
          (p.category || "").toLowerCase().includes("outdoor")
      );

      let trending = allWeb.filter((p) => p.section === "trending");
      let newArrivals = allWeb.filter((p) => p.section === "new-arrivals");

      if (trending.length === 0) trending = allWeb.slice(0, 20);
      if (newArrivals.length === 0) newArrivals = allWeb.slice(0, 20);

      return res.json({
        success: true,
        data: {
          outdoorCollection: outdoor,
          trendingGear: trending,
          newArrivals: newArrivals,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get all products with filtering, search & pagination
// @route   GET /api/products
export const getProducts = async (req, res, next) => {
  try {
    const { search, category, section, limit = 50, sort } = req.query;

    if (getDbStatus()) {
      // Show products whose productChannel Visibility is website + in-store (exclude in-store only)
      const filter = {
        visibility: { $nin: ["in-store", "instore"] },
        webStatus: { $ne: "in-store" },
        productChannel: { $ne: "in-store" },
      };

      if (category && category !== "All") {
        filter.category = new RegExp(`^${category}$`, "i");
      }
      if (section) {
        filter.section = section;
      }
      if (search) {
        filter.$or = [
          { name: new RegExp(search, "i") },
          { brand: new RegExp(search, "i") },
          { category: new RegExp(search, "i") },
        ];
      }

      let query = Product.find(filter).lean().limit(Number(limit));
      if (sort === "price-low") {
        query = query.sort({ price: 1 });
      } else if (sort === "price-high") {
        query = query.sort({ price: -1 });
      } else {
        query = query.sort({ createdAt: -1 });
      }

      const products = await query;

      // Populate categoryType from Category collection
      let categories = [];
      try {
        categories = await Category.find({}).lean();
      } catch (e) {}

      const catMap = {};
      categories.forEach((c) => {
        if (c.name) {
          const key = c.name.toLowerCase().trim();
          const cType = (c.type || "").toLowerCase().trim();
          if (catMap[key] === "outdoor") return;
          catMap[key] = cType;
        }
      });

      const outdoorKeywords = [
        "outdoor", "trek", "hike", "hiking", "camp", "camping", "climb", "climbing",
        "foot-wear", "footwear", "shoe", "shoes", "boot", "boots",
        "bag", "bags", "backpack", "backpacks", "rucksack",
        "cycle", "cycling", "run", "running", "adventure", "rainwear", "jacket", "outerwear"
      ];

      const enrichedProducts = products.map((p) => {
        const pObj = p.toObject ? p.toObject() : { ...p };
        const pCat = (pObj.category || "").toLowerCase().trim();
        if (!pObj.categoryType && catMap[pCat]) {
          pObj.categoryType = catMap[pCat];
        }
        if (!pObj.categoryType && outdoorKeywords.some((kw) => pCat.includes(kw))) {
          pObj.categoryType = "outdoor";
        }
        return pObj;
      });

      return res.json({
        success: true,
        count: enrichedProducts.length,
        products: enrichedProducts,
      });
    } else {
      let filtered = (memoryStore.products || []).filter(isWebsiteVisible);

      if (category && category !== "All") {
        filtered = filtered.filter(
          (p) => (p.category || "").toLowerCase() === category.toLowerCase()
        );
      }
      if (section) {
        filtered = filtered.filter((p) => p.section === section);
      }
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            (p.name || "").toLowerCase().includes(q) ||
            (p.brand || "").toLowerCase().includes(q) ||
            (p.category || "").toLowerCase().includes(q)
        );
      }

      if (sort === "price-low") {
        filtered.sort((a, b) => a.price - b.price);
      } else if (sort === "price-high") {
        filtered.sort((a, b) => b.price - a.price);
      }

      const catMap = {};
      (memoryStore.categories || []).forEach((c) => {
        if (c.name) catMap[c.name.toLowerCase()] = c.type;
      });

      const enriched = filtered.slice(0, Number(limit)).map((p) => {
        const pCat = (p.category || "").toLowerCase();
        return {
          ...p,
          categoryType: p.categoryType || catMap[pCat] || "product",
        };
      });

      return res.json({
        success: true,
        count: enriched.length,
        products: enriched,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by id or slug
// @route   GET /api/products/:id
export const getProductByIdOrSlug = async (req, res, next) => {
  try {
    const paramId = req.params.id;

    if (getDbStatus()) {
      let product = await Product.findOne({ seoSlug: paramId }).lean();
      if (!product) {
        product = await Product.findOne({ slug: paramId }).lean();
      }
      if (!product) {
        product = await Product.findOne({ seoSlug: new RegExp(`^${paramId}$`, "i") }).lean();
      }
      if (!product) {
        product = await Product.findOne({ slug: new RegExp(`^${paramId}$`, "i") }).lean();
      }
      if (!product) {
        product = await Product.findOne({ id: paramId }).lean();
      }
      if (!product && !isNaN(Number(paramId))) {
        product = await Product.findOne({ id: Number(paramId) }).lean();
      }
      if (!product) {
        product = await Product.findOne({ originalId: paramId }).lean();
      }
      if (!product && paramId.match(/^[0-9a-fA-F]{24}$/)) {
        product = await Product.findById(paramId).lean();
      }
      if (!product) {
        const normalizedParam = paramId.replace(/-/g, " ");
        product = await Product.findOne({
          $or: [
            { name: new RegExp(`^${normalizedParam}$`, "i") },
            { title: new RegExp(`^${normalizedParam}$`, "i") },
          ],
        }).lean();
      }

      if (!product || !isWebsiteVisible(product)) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      const escapedCat = (product.category || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const categoryRegex = new RegExp(`^${escapedCat}$`, "i");

      const similarProducts = await Product.find({
        category: categoryRegex,
        _id: { $ne: product._id },
        id: { $ne: product.id },
        visibility: { $nin: ["in-store", "instore", "in-store only", "store"] },
        productChannel: { $ne: "in-store" },
        webStatus: { $nin: ["in-store", "add_to_web", "hidden"] },
      }).lean().limit(10);

      return res.json({
        success: true,
        product,
        similarProducts,
      });
    } else {
      const product =
        memoryStore.products.find(
          (p) =>
            p.seoSlug === paramId ||
            p.slug === paramId ||
            (p.seoSlug && p.seoSlug.toLowerCase() === paramId.toLowerCase()) ||
            (p.slug && p.slug.toLowerCase() === paramId.toLowerCase()) ||
            String(p.id) === String(paramId) ||
            String(p.originalId) === String(paramId) ||
            (p.name && p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") === paramId.toLowerCase())
        ) || null;

      if (!product || !isWebsiteVisible(product)) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      const normCat = (product.category || "").toLowerCase().replace(/[-\s_]/g, "");
      const similarProducts = memoryStore.products
        .filter((p) => {
          if (!isWebsiteVisible(p)) return false;
          if (String(p.id) === String(product.id) || p.name === product.name) return false;
          const otherCat = (p.category || "").toLowerCase().replace(/[-\s_]/g, "");
          return Boolean(normCat && otherCat === normCat);
        })
        .slice(0, 10);

      return res.json({
        success: true,
        product,
        similarProducts,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Add review to product & broadcast in real-time
// @route   POST /api/products/:id/reviews
export const addProductReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, rating, comment, title, tags } = req.body;
    const newReview = {
      id: `rev-${Date.now()}`,
      author: name || "Verified Customer",
      name: name || "Verified Customer",
      rating: Number(rating) || 5,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      title: title || (rating >= 4 ? "Great Product!" : "Customer Feedback"),
      comment: comment || "",
      verified: true,
      helpful: 0,
      tags: tags || [],
    };

    if (getDbStatus()) {
      const prod = await Product.findOneAndUpdate(
        { $or: [{ id: Number(id) || id }, { id: String(id) }, { seoSlug: id }, { slug: id }] },
        { $push: { reviewsList: newReview } },
        { new: true }
      ).lean();
      if (prod) {
        broadcastEvent("PRODUCT_UPDATED", { action: "review", id: prod.id, productId: prod.id, review: newReview });
        return res.status(201).json({ success: true, review: newReview, product: prod });
      }
    } else {
      const prod = memoryStore.products.find(
        (p) => String(p.id) === String(id) || p.seoSlug === id || p.slug === id
      );
      if (prod) {
        if (!Array.isArray(prod.reviewsList)) prod.reviewsList = [];
        prod.reviewsList.unshift(newReview);
        broadcastEvent("PRODUCT_UPDATED", { action: "review", id: prod.id, productId: prod.id, review: newReview });
        return res.status(201).json({ success: true, review: newReview, product: prod });
      }
    }
    return res.status(404).json({ success: false, message: "Product not found" });
  } catch (err) {
    next(err);
  }
};
