import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    id: { type: mongoose.Schema.Types.Mixed, required: true, unique: true },
    name: { type: String, required: true },
    icon: { type: String, default: "🛡️" },
    iconColor: { type: String, default: "#ff6600" },
    iconBg: { type: String, default: "#fff7ed" },
    type: { type: String, default: "Custom" }, // "System" | "Custom"
    description: { type: String, default: "" },
    staffCount: { type: Number, default: 0 },
    status: { type: String, default: "Active" }, // "Active" | "Inactive"
    permissions: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

const Role = mongoose.models.Role || mongoose.model("Role", roleSchema);
export default Role;
