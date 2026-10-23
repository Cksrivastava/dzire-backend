import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    code: { type: String, required: true, uppercase: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    type: { type: String, default: "Percentage" },
    discountValue: { type: Number, default: 0 },
    discountDisplay: { type: String, default: "" },
    unit: { type: String, default: "%" },
    appliesTo: { type: String, default: "All Products" },
    channel: { type: [String], default: ["Online", "Store"] },
    userScope: { type: String, default: "all" },
    selectedEmails: { type: [String], default: [] },
    selectedProducts: { type: Array, default: [] },
    selectedCategories: { type: Array, default: [] },
    selectedBrands: { type: Array, default: [] },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    validityDisplay: { type: String, default: "" },
    usageCount: { type: Number, default: 0 },
    usageLimit: { type: Number, default: 0 },
    limitPerCustomer: { type: Number, default: 1 },
    minOrderValue: { type: Number, default: 0 },
    hasMinOrder: { type: Boolean, default: false },
    maxDiscount: { type: Number, default: 0 },
    hasMaxDiscount: { type: Boolean, default: false },
    status: { type: String, default: "Active" },
  },
  { timestamps: true }
);

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
