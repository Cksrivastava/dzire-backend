import mongoose from "mongoose";

const attendeeSchema = new mongoose.Schema({
  id: { type: String, default: () => `ATT-${Date.now().toString().slice(-4)}` },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: "" },
  date: { type: String, default: "" },
  time: { type: String, default: "" },
  tickets: { type: Number, default: 1 },
  amountPaid: { type: String, default: "" },
  status: { type: String, default: "Confirmed" },
  paymentStatus: { type: String, default: "Paid" },
  registeredAt: { type: Date, default: Date.now },
});

const eventSchema = new mongoose.Schema(
  {
    id: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      default: "Indoor Workshop",
    },
    category: {
      type: String,
      default: "Camping",
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      default: "10:00 AM",
    },
    duration: {
      type: String,
      default: "2 Hours",
    },
    difficulty: {
      type: String,
      default: "Moderate",
    },
    rating: {
      type: Number,
      default: 4.8,
    },
    reviews: {
      type: Number,
      default: 20,
    },
    badge: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "Dzire Experience Studio",
    },
    address: {
      type: String,
      default: "123 Adventure Street, Koramangala, Bengaluru, Karnataka 560034",
    },
    organizer: {
      type: String,
      default: "Dzire Adventure Team",
    },
    venueTag: {
      type: String,
      default: "Dzire Studio",
    },
    price: {
      type: String,
      default: "Free",
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    capacity: {
      type: Number,
      default: 25,
    },
    stock: {
      type: Number,
      default: 25,
    },
    booked: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    },
    status: {
      type: String,
      enum: ["Upcoming", "Ongoing", "Completed", "Cancelled"],
      default: "Upcoming",
    },
    visibility: {
      type: String,
      default: "web",
    },
    alert: {
      type: Boolean,
      default: false,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    moreDates: [
      {
        label: String,
        time: String,
      },
    ],
    groupSize: {
      type: String,
      default: "50 People",
    },
    mapImage: {
      type: String,
      default: "",
    },
    attendees: [attendeeSchema],
  },
  {
    timestamps: true,
  }
);

const Event = mongoose.model("Event", eventSchema);
export default Event;
