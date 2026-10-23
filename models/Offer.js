import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    tagline: { type: String, default: "" },
    image: { type: String, default: "" },
    bannerImage: { type: String, default: "" },
    bannerOverlay: { type: Number, default: 0.45 },
    bannerTextColor: { type: String, default: "#ffffff" },
    description: { type: String, default: "" },
    type: { type: String, default: "Percentage" },
    discountValue: { type: Number, default: 0 },
    discountDisplay: { type: String, default: "" },
    unit: { type: String, default: "%" },
    appliesTo: { type: String, default: "All Products" },
    appliesToType: { type: String, default: "All Products" },
    selectedProducts: { type: Array, default: [] },
    selectedCategories: { type: Array, default: [] },
    selectedBrands: { type: Array, default: [] },
    channel: { type: [String], default: ["Online", "Store"] },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    validityDisplay: { type: String, default: "" },
    usageCount: { type: Number, default: 0 },
    usageLimit: { type: Number, default: 0 },
    status: { type: String, default: "Active" },
  },
  { timestamps: true }
);

const Offer = mongoose.model("Offer", offerSchema);
export default Offer;
