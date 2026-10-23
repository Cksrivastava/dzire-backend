import mongoose from "mongoose";

const purchaseReturnSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    returnNo: { type: String, default: "" },
    originalInvoice: { type: String, default: "" },
    party: { type: String, default: "" },
    vendorId: { type: String, default: "" },
    date: { type: String, default: () => new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
    itemsCount: { type: Number, default: 0 },
    items: { type: Array, default: [] },
    totalAmount: { type: Number, default: 0 },
    amount: { type: String, default: "₹ 0.00" },
    receivedAmount: { type: Number, default: 0 },
    balanceAmount: { type: Number, default: 0 },
    refundMode: { type: String, default: "Bank Transfer" },
    status: { type: String, default: "Pending" },
    reason: { type: String, default: "Defective / Damaged goods" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

const PurchaseReturn = mongoose.model("PurchaseReturn", purchaseReturnSchema);
export default PurchaseReturn;
