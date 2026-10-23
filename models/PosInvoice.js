import mongoose from "mongoose";

const posInvoiceSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    customer: { type: String, default: "Walk-in Customer" },
    mobile: { type: String, default: "" },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    dateTime: { type: String, default: "" },
    prefix: { type: String, default: "DZR/2026/" },
    invoiceNo: { type: String, default: "" },
    invoiceDate: { type: String, default: "" },
    paymentTerms: { type: String, default: "30" },
    dueDate: { type: String, default: "" },
    isCashSale: { type: Boolean, default: false },
    items: { type: Array, default: [] },
    itemsCount: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    amount: { type: String, default: "₹ 0" },
    mode: { type: String, default: "Cash" },
    receivedAmount: { type: Number, default: 0 },
    balanceAmount: { type: Number, default: 0 },
    status: { type: String, default: "Paid" },
    notes: { type: String, default: "" },
    terms: { type: String, default: "" },
    bankDetails: { type: Object, default: {} },
  },
  { timestamps: true }
);

const PosInvoice = mongoose.model("PosInvoice", posInvoiceSchema);
export default PosInvoice;
