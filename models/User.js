import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const addressSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  phone: { type: String, default: "" },
  street: { type: String, default: "" },
  city: { type: String, default: "" },
  state: { type: String, default: "" },
  pincode: { type: String, default: "" },
  address: { type: String, default: "" },
  type: { type: String, default: "Home" },
  isDefault: { type: Boolean, default: false },
});

const creditActivitySchema = new mongoose.Schema({
  id: { type: String, default: () => Date.now().toString() },
  type: { type: String, enum: ["earned", "deducted", "redeemed"], default: "earned" },
  amount: { type: Number, required: true },
  ref: { type: String, default: "Manual Credit Adjustment" },
  date: { type: String, default: () => new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
  createdAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      default: "Dzire@123",
    },
    phone: {
      type: String,
      default: "",
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
    type: {
      type: String,
      default: "Regular",
    },
    channel: {
      type: String,
      default: "Online",
    },
    status: {
      type: String,
      default: "Active",
    },
    gender: {
      type: String,
      default: "Other",
    },
    dob: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
    tags: {
      type: [String],
      default: ["Customer"],
    },
    credits: {
      type: Number,
      default: 0,
    },
    earnedCredits: {
      type: Number,
      default: 0,
    },
    usedCredits: {
      type: Number,
      default: 0,
    },
    activities: [creditActivitySchema],
    addresses: [addressSchema],
    dobFormatted: {
      type: String,
      default: "",
    },
    altPhone: {
      type: String,
      default: "",
    },
    altEmail: {
      type: String,
      default: "",
    },
    wishlist: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
