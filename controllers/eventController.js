import Event from "../models/Event.js";
import { getDbStatus } from "../config/db.js";
import memoryStore from "../config/store.js";

// @desc    Get events with category, date & pagination
// @route   GET /api/events
export const getEvents = async (req, res, next) => {
  try {
    const { category, type, date, page = 1, limit = 50 } = req.query;

    if (getDbStatus()) {
      const filter = {};
      if (category && category !== "All") {
        filter.$or = [
          { category: new RegExp(category, "i") },
          { type: new RegExp(category, "i") },
          { title: new RegExp(category, "i") },
        ];
      }
      if (type) {
        filter.type = new RegExp(type, "i");
      }

      const limitNum = Number(limit) > 0 ? Number(limit) : 50;
      const skip = (Number(page) - 1) * limitNum;
      const total = await Event.countDocuments(filter);
      const events = await Event.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      return res.json({
        success: true,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limitNum) || 1,
        events,
      });
    } else {
      let events = [...(memoryStore.events || [])];
      if (category && category !== "All") {
        const c = category.toLowerCase();
        events = events.filter(
          (e) =>
            (e.category && e.category.toLowerCase().includes(c)) ||
            (e.type && e.type.toLowerCase().includes(c)) ||
            (e.title && e.title.toLowerCase().includes(c))
        );
      }
      if (type) {
        events = events.filter((e) => e.type && e.type.toLowerCase().includes(type.toLowerCase()));
      }

      const limitNum = Number(limit) > 0 ? Number(limit) : 50;
      const total = events.length;
      const skip = (Number(page) - 1) * limitNum;
      const paginated = events.slice(skip, skip + limitNum);

      return res.json({
        success: true,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limitNum) || 1,
        events: paginated,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
export const getEventById = async (req, res, next) => {
  try {
    const rawId = req.params.id;
    const numId = Number(rawId);
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(rawId);

    if (getDbStatus()) {
      const orConditions = [
        { id: rawId },
        { slug: rawId },
      ];
      if (!isNaN(numId)) {
        orConditions.push({ id: numId });
      }
      if (isValidObjectId) {
        orConditions.push({ _id: rawId });
      }

      const event = await Event.findOne({ $or: orConditions });
      if (!event) {
        return res.status(404).json({ success: false, message: "Event not found" });
      }
      return res.json({ success: true, event });
    } else {
      const event = (memoryStore.events || []).find(
        (e) =>
          String(e.id) === String(rawId) ||
          String(e._id) === String(rawId) ||
          e.slug === rawId ||
          (!isNaN(numId) && Number(e.id) === numId)
      ) || (memoryStore.events && memoryStore.events[0]);

      if (!event) {
        return res.status(404).json({ success: false, message: "Event not found" });
      }
      return res.json({ success: true, event });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Register for an event
// @route   POST /api/events/register
export const registerForEvent = async (req, res, next) => {
  try {
    const { eventId, name, email, phone, date, time, tickets, amountPaid } = req.body;

    const rawId = eventId;
    const numId = Number(rawId);
    const isValidObjectId = typeof rawId === "string" && /^[0-9a-fA-F]{24}$/.test(rawId);

    const attendee = {
      userId: req.user?._id || null,
      name: name?.trim() || req.user?.name || "Participant",
      email: email?.trim() || req.user?.email || "participant@example.com",
      phone: phone?.trim() || req.user?.phone || "",
      date: date || "Upcoming Date",
      time: time || "7:00 PM",
      tickets: Number(tickets) || 1,
      amountPaid: amountPaid || "Free",
      registeredAt: new Date(),
    };

    if (getDbStatus()) {
      const orConditions = [
        { id: String(rawId) },
        { slug: String(rawId) },
      ];
      if (!isNaN(numId)) {
        orConditions.push({ id: numId });
      }
      if (isValidObjectId) {
        orConditions.push({ _id: rawId });
      }

      const event = await Event.findOne({ $or: orConditions });
      if (event) {
        if (!event.attendees) event.attendees = [];
        event.attendees.push(attendee);
        event.booked = (Number(event.booked) || 0) + attendee.tickets;
        if (event.stock !== undefined && event.stock > 0) {
          event.stock = Math.max(0, event.stock - attendee.tickets);
        }
        await event.save();
      }
    } else {
      const event = (memoryStore.events || []).find(
        (e) =>
          String(e.id) === String(rawId) ||
          String(e._id) === String(rawId) ||
          e.slug === String(rawId) ||
          (!isNaN(numId) && Number(e.id) === numId)
      );
      if (event) {
        if (!event.attendees) event.attendees = [];
        event.attendees.push(attendee);
        event.booked = (Number(event.booked) || 0) + attendee.tickets;
      }
    }

    res.status(201).json({
      success: true,
      message: "Registration successful!",
      registration: attendee,
    });
  } catch (error) {
    next(error);
  }
};
