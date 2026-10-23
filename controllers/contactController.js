import ContactMessage from "../models/ContactMessage.js";
import { getDbStatus } from "../config/db.js";
import memoryStore from "../config/store.js";

// @desc    Submit contact or support message
// @route   POST /api/contact
export const submitContactMessage = async (req, res, next) => {
  try {
    const { name, email, phone, message, source } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields (Name, Email, Message).",
      });
    }

    const newMessage = {
      _id: `msg_${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: (phone || "").trim(),
      message: message.trim(),
      source: source || "contact_page",
      status: "unread",
      createdAt: new Date(),
    };

    if (getDbStatus()) {
      await ContactMessage.create(newMessage);
    } else {
      memoryStore.contactMessages.unshift(newMessage);
    }

    res.status(201).json({
      success: true,
      message: "Your message has been submitted successfully!",
      data: newMessage,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all messages (for admin)
// @route   GET /api/contact
export const getContactMessages = async (req, res, next) => {
  try {
    if (getDbStatus()) {
      const messages = await ContactMessage.find().sort({ createdAt: -1 });
      return res.json({
        success: true,
        count: messages.length,
        messages,
      });
    } else {
      return res.json({
        success: true,
        count: memoryStore.contactMessages.length,
        messages: memoryStore.contactMessages,
      });
    }
  } catch (error) {
    next(error);
  }
};
