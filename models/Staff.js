import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    size: { type: String, default: "" },
    type: { type: String, default: "PDF" },
    fileUrl: { type: String, default: "" },
  },
  { _id: false }
);

const staffSchema = new mongoose.Schema(
  {
    id: { type: mongoose.Schema.Types.Mixed, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, default: "Sales Associate" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    joinDate: { type: String, default: "" },
    doj: { type: String, default: "" },
    dob: { type: String, default: "" },
    gender: { type: String, default: "Male" },
    maritalStatus: { type: String, default: "Single" },
    aadharCard: { type: String, default: "" },
    aadharFile: { type: String, default: null },
    aadharFileName: { type: String, default: "" },
    aadharFileSize: { type: String, default: "" },
    panCard: { type: String, default: "" },
    panFile: { type: String, default: null },
    panFileName: { type: String, default: "" },
    panFileSize: { type: String, default: "" },
    previousExperience: { type: String, default: "" },
    status: { type: String, default: "Active" },
    attendanceRate: { type: String, default: "92%" },
    avatar: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
    store: { type: String, default: "Offline" },
    address: { type: String, default: "" },
    attendance: {
      present: { type: Number, default: 0 },
      absent: { type: Number, default: 0 },
      onLeave: { type: Number, default: 0 },
      halfDay: { type: Number, default: 0 },
    },
    attendanceMap: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    salary: {
      type: { type: String, default: "Monthly" },
      basic: { type: String, default: "₹20,000" },
      numericBasic: { type: Number, default: 20000 },
      startDate: { type: String, default: "" },
      paymentDay: { type: String, default: "5th of every month" },
      bankName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      bankAccount: { type: String, default: "" },
      ifsc: { type: String, default: "" },
      accountHolderName: { type: String, default: "" },
      bankBranch: { type: String, default: "" },
      pfEsic: { type: String, default: "Applicable" },
    },
    permissions: { type: [String], default: ["Sales", "POS"] },
    documents: [documentSchema],
  },
  { timestamps: true }
);

const Staff = mongoose.models.Staff || mongoose.model("Staff", staffSchema);
export default Staff;
