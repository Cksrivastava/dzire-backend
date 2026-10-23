import mongoose from "mongoose";

const creditNoteSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    cnNo: { type: String, required: true },
    date: { type: String, default: "" },
    party: { type: String, default: "" },
    mobile: { type: String, default: "" },
    invoiceNo: { type: String, default: "" },
    items: { type: Array, default: [] },
    subtotal: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    amount: { type: String, default: "₹ 0.00" },
    status: { type: String, default: "Open" }, // Settled, Open
    notes: { type: String, default: "" },
    terms: { type: String, default: "" },
    bankDetails: { type: Object, default: {} },
  },
  { timestamps: true }
);

const CreditNote = mongoose.model("CreditNote", creditNoteSchema);
export default CreditNote;
