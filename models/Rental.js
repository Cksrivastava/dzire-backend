import mongoose from "mongoose";

const rentalBookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  userPhone: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  days: { type: Number, default: 1 },
  totalCost: { type: Number, required: true },
  deposit: { type: String },
  status: { type: String, default: "Booked" },
  bookedAt: { type: Date, default: Date.now },
});

const rentalSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    capacity: {
      type: String,
      default: "Standard Fit",
    },
    status: {
      type: String,
      default: "Available",
    },
    badge: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: true,
    },
    deposit: {
      type: String,
      default: "1,000",
    },
    pickup: {
      type: String,
      default: "Self Pickup Available",
    },
    sanitized: {
      type: String,
      default: "Sanitized & Checked",
    },
    image: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    bookings: [rentalBookingSchema],
  },
  {
    timestamps: true,
  }
);

const Rental = mongoose.model("Rental", rentalSchema);
export default Rental;
