import mongoose from "mongoose";

const instoreReturnSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    dateTime: {
      type: String,
      default: () =>
        new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
    customer: { type: String, default: "Walk-in Customer" },
    mobile: { type: String, default: "" },
    invoiceNo: { type: String, default: "" },
    item: { type: String, default: "" },
    reason: { type: String, default: "Defective / Dissatisfied" },
    refundAmount: { type: String, default: "₹ 0" },
    refundAmountNum: { type: Number, default: 0 },
    refundMode: { type: String, default: "Store Credit" }, // Store Credit, Cash, UPI / Bank, Exchange
    status: { type: String, default: "Pending Audit" }, // Completed, Approved, Pending Audit, Rejected
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

const InstoreReturn = mongoose.model("InstoreReturn", instoreReturnSchema);
export default InstoreReturn;
