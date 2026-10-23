import mongoose from "mongoose";

const purchaseInvoiceSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    inv: { type: String, default: "" },
    invoiceNumber: { type: String, default: "" },
    party: { type: String, default: "" },
    vendorId: { type: String, default: "" },
    date: { type: String, default: () => new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
    dueDate: { type: String, default: "" },
    dueIn: { type: String, default: "Due in 30 days" },
    originalInvoiceNo: { type: String, default: "" },
    paymentTerms: { type: String, default: "30" },
    items: { type: Array, default: [] },
    itemsCount: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    amount: { type: String, default: "₹ 0.00" },
    paidAmount: { type: Number, default: 0 },
    balanceAmount: { type: Number, default: 0 },
    status: { type: String, default: "Unpaid" },
    paymentMethod: { type: String, default: "Cash" },
    notes: { type: String, default: "" },
    terms: { type: String, default: "" },
    bankDetails: { type: Object, default: {} },
  },
  { timestamps: true }
);

const PurchaseInvoice = mongoose.model("PurchaseInvoice", purchaseInvoiceSchema);
export default PurchaseInvoice;
