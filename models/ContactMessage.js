import mongoose from "mongoose";

const contactMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: "",
    },
    message: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      default: "contact_page", // "contact_page" | "support_help_center"
    },
    status: {
      type: String,
      enum: ["unread", "read", "resolved"],
      default: "unread",
    },
  },
  {
    timestamps: true,
  }
);

const ContactMessage = mongoose.model("ContactMessage", contactMessageSchema);
export default ContactMessage;
