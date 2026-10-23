import mongoose from "mongoose";

const paymentInSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    dateTime: { type: String, default: "" },
    customer: { type: String, default: "" },
    mobile: { type: String, default: "" },
    invoiceNo: { type: String, default: "" },
    mode: { type: String, default: "Cash" },
    txnRef: { type: String, default: "" },
    amount: { type: String, default: "₹ 0" },
    numAmount: { type: Number, default: 0 },
    status: { type: String, default: "Received" }, // Received, Pending Clearance
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

const PaymentIn = mongoose.model("PaymentIn", paymentInSchema);
export default PaymentIn;
