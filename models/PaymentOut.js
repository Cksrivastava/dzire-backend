import mongoose from "mongoose";

const paymentOutSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    paymentNo: { type: String, default: "" },
    party: { type: String, default: "" },
    vendorId: { type: String, default: "" },
    date: { type: String, default: () => new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
    amount: { type: String, default: "₹ 0.00" },
    amountNum: { type: Number, default: 0 },
    mode: { type: String, default: "Bank Transfer" },
    refNo: { type: String, default: "" },
    notes: { type: String, default: "" },
    status: { type: String, default: "Completed" },
  },
  { timestamps: true }
);

const PaymentOut = mongoose.model("PaymentOut", paymentOutSchema);
export default PaymentOut;
