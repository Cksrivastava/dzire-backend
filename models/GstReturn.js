import mongoose from "mongoose";

const gstReturnSchema = new mongoose.Schema(
  {
    id: { type: String, required: true }, // "GSTR-1", "GSTR-3B", "GSTR-2B"
    returnId: { type: String, unique: true }, // unique identifier e.g. "GSTR-1-2026-08"
    returnType: { type: String, required: true }, // "GSTR-1", "GSTR-3B", "GSTR-2B"
    name: { type: String, required: true },
    period: { type: String, required: true },
    arn: { type: String, required: true },
    taxable: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    dueDate: { type: String, default: "" },
    status: { type: String, enum: ["Filed", "Reconciled", "Pending"], default: "Pending" },
    source: { type: String, default: "Live Sales & Invoices" },
  },
  { timestamps: true }
);

const GstReturn = mongoose.model("GstReturn", gstReturnSchema);
export default GstReturn;
