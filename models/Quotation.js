import mongoose from "mongoose";

const quotationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    qtnNo: { type: String, required: true },
    date: { type: String, default: "" },
    party: { type: String, default: "" },
    mobile: { type: String, default: "" },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    validTill: { type: String, default: "" },
    items: { type: Array, default: [] },
    subtotal: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    amount: { type: String, default: "₹ 0.00" },
    status: { type: String, default: "Open" }, // Approved, Pending, Open, Expired
    notes: { type: String, default: "" },
    terms: { type: String, default: "" },
    bankDetails: { type: Object, default: {} },
  },
  { timestamps: true }
);

const Quotation = mongoose.model("Quotation", quotationSchema);
export default Quotation;
