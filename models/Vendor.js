import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    id: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: "Bag & Accessories",
    },
    mobile: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    gstin: {
      type: String,
      default: "",
    },
    panNumber: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["Supplier", "Manufacturer", "Wholesale"],
      default: "Supplier",
    },
    openingBalance: {
      type: Number,
      default: 0,
    },
    balance: {
      type: String,
      default: "₹ 0",
    },
    balanceType: {
      type: String,
      enum: ["collect", "pay", "neutral"],
      default: "neutral",
    },
    billingAddress: {
      type: String,
      default: "",
    },
    shippingAddress: {
      type: String,
      default: "",
    },
    creditPeriod: {
      type: String,
      default: "30 Days",
    },
    creditLimit: {
      type: String,
      default: "₹ 0",
    },
    contactPerson: {
      type: String,
      default: "",
    },
    dateOfBirth: {
      type: String,
      default: "",
    },
    bankDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

const Vendor = mongoose.model("Vendor", vendorSchema);
export default Vendor;
