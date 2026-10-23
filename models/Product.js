import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    id: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      unique: true,
    },
    originalId: {
      type: mongoose.Schema.Types.Mixed,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    seoSlug: {
      type: String,
      trim: true,
      default: "",
    },
    slug: {
      type: String,
      trim: true,
      default: "",
    },
    brand: {
      type: String,
      default: "DZIRE",
    },
    category: {
      type: String,
      default: "General",
    },
    section: {
      type: String,
      enum: ["outdoor", "trending", "new-arrivals", "general"],
      default: "general",
    },
    price: {
      type: Number,
      required: true,
    },
    oldPrice: {
      type: Number,
    },
    rating: {
      type: String,
      default: "4.8",
    },
    reviews: {
      type: String,
      default: "128",
    },
    reviewsList: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    offers: {
      type: String,
      default: "",
    },
    badge: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      default: "",
    },
    stock: {
      type: Number,
      default: 50,
    },
    sizes: {
      type: [String],
      default: ["6", "7", "8", "9", "10", "11"],
    },
    specs: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    sku: {
      type: String,
      default: "",
    },
    cost: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      default: "Active",
    },
    webStatus: {
      type: String,
      default: "view_on_web",
    },
    visibility: {
      type: String,
      default: "web",
    },
    productChannel: {
      type: String,
      default: "website + in-store",
    },
    categoryType: {
      type: String,
      default: "",
    },
    vendor: {
      type: String,
      default: "DZIRE Store",
    },
    gstRate: {
      type: String,
      default: "18",
    },
    hasVariations: {
      type: Boolean,
      default: false,
    },
    attributes: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    variations: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    primaryBarcode: {
      type: String,
      default: "",
    },
    barcodeFormat: {
      type: String,
      default: "EAN-13",
    },
    hsnCode: {
      type: String,
      default: "",
    },
    posDepartment: {
      type: String,
      default: "",
    },
    enableInPOS: {
      type: Boolean,
      default: true,
    },
    quickBillingTile: {
      type: Boolean,
      default: true,
    },
    allowManualPriceAtPOS: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
