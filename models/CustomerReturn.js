import mongoose from "mongoose";

const customerReturnSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    orderId: { type: String, default: "" },
    date: {
      type: String,
      default: () =>
        new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
    },
    cust: { type: String, default: "Customer" },
    email: { type: String, default: "" },
    mobile: { type: String, default: "" },
    items: { type: String, default: "1" },
    itemDetails: { type: String, default: "" },
    amount: { type: String, default: "₹ 0" },
    amountNum: { type: Number, default: 0 },
    type: { type: String, default: "Return / Refund" }, // 'Defective', 'Size Issue', 'Return / Refund', 'Size/Fit issue'
    reason: { type: String, default: "" },
    status: { type: String, default: "Pending Approval" }, // 'Pending Approval', 'Refunded (Wallet)', 'Approved', 'Rejected'
    refundMethod: { type: String, default: "Wallet" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

const CustomerReturn = mongoose.model("CustomerReturn", customerReturnSchema);
export default CustomerReturn;
