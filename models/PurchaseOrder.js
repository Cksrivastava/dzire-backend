import mongoose from "mongoose";

const purchaseOrderSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    poNo: { type: String, default: "" },
    party: { type: String, default: "" },
    vendorId: { type: String, default: "" },
    date: { type: String, default: () => new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
    validTill: { type: String, default: "" },
    itemsCount: { type: Number, default: 0 },
    items: { type: Array, default: [] },
    totalAmount: { type: Number, default: 0 },
    amount: { type: String, default: "₹ 0.00" },
    status: { type: String, default: "Pending" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

const PurchaseOrder = mongoose.model("PurchaseOrder", purchaseOrderSchema);
export default PurchaseOrder;
