import mongoose from "mongoose";

const debitNoteSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    debitNo: { type: String, default: "" },
    purchaseNo: { type: String, default: "" },
    party: { type: String, default: "" },
    vendorId: { type: String, default: "" },
    date: { type: String, default: () => new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
    amount: { type: String, default: "₹ 0.00" },
    amountNum: { type: Number, default: 0 },
    reason: { type: String, default: "Rate difference" },
    status: { type: String, default: "Issued" },
    items: { type: Array, default: [] },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

const DebitNote = mongoose.model("DebitNote", debitNoteSchema);
export default DebitNote;
