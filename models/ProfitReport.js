import mongoose from "mongoose";

const profitReportSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true }, // e.g. "CH-01", "CH-02", etc.
    channel: { type: String, required: true },
    department: { type: String, required: true },
    orders: { type: Number, default: 0 },
    grossRevenue: { type: Number, default: 0 },
    cogs: { type: Number, default: 0 },
    operatingCost: { type: Number, default: 0 },
    grossProfit: { type: Number, default: 0 },
    marginPercent: { type: Number, default: 0 },
    status: { type: String, default: "High Margin" },
  },
  { timestamps: true }
);

const ProfitReport = mongoose.model("ProfitReport", profitReportSchema);
export default ProfitReport;
