import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  id: { type: mongoose.Schema.Types.Mixed, default: () => `item_${Date.now()}` },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, default: 1 },
  img: { type: String, default: "" },
  image: { type: String, default: "" },
  desc: { type: String, default: "" },
  sku: { type: String, default: "DZR-GEN-01" },
  selectedSize: { type: String, default: "Default" },
  selectedColor: { type: String, default: "Default" },
});

const returnRequestSchema = new mongoose.Schema({
  orderId: { type: String },
  reason: { type: String, required: true },
  resolution: { type: String, default: "Refund" },
  itemDetails: { type: String },
  comments: { type: String },
  status: { type: String, default: "Submitted" },
  submittedAt: { type: Date, default: Date.now },
});

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    orderNumber: {
      type: String,
      default: "",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    userEmail: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      default: "Customer",
    },
    userPhone: {
      type: String,
      default: "",
    },
    date: {
      type: String,
      default: () =>
        new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
    },
    total: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    gst: {
      type: Number,
      default: 0,
    },
    shippingCost: {
      type: Number,
      default: 50,
    },
    discount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      default: "Confirmed",
    },
    paymentStatus: {
      type: String,
      default: "Paid",
    },
    trackingNumber: {
      type: String,
      default: "",
    },
    statusColor: {
      type: String,
      default: "#0369a1",
    },
    statusBg: {
      type: String,
      default: "#e0f2fe",
    },
    badgeClass: {
      type: String,
      default: "badge-confirmed",
    },
    deliveryInfo: {
      type: String,
      default: "Order Confirmed by Seller",
    },
    paymentMethod: {
      type: String,
      default: "Credit/Debit Card, UPI (Razorpay)",
    },
    shippingAddress: {
      fullName: String,
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
    items: [orderItemSchema],
    allowReturn: {
      type: Boolean,
      default: true,
    },
    returnRequest: returnRequestSchema,
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
