import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import User from "../../models/User.js";
import Order from "../../models/Order.js";
import Product from "../../models/Product.js";
import Attribute from "../../models/Attribute.js";
import Vendor from "../../models/Vendor.js";
import PosInvoice from "../../models/PosInvoice.js";
import Quotation from "../../models/Quotation.js";
import PaymentIn from "../../models/PaymentIn.js";
import PaymentOut from "../../models/PaymentOut.js";
import CreditNote from "../../models/CreditNote.js";
import DebitNote from "../../models/DebitNote.js";
import PurchaseInvoice from "../../models/PurchaseInvoice.js";
import PurchaseOrder from "../../models/PurchaseOrder.js";
import PurchaseReturn from "../../models/PurchaseReturn.js";
import InstoreReturn from "../../models/InstoreReturn.js";
import CustomerReturn from "../../models/CustomerReturn.js";
import Coupon from "../../models/Coupon.js";
import Offer from "../../models/Offer.js";
import Category from "../../models/Category.js";
import Staff from "../../models/Staff.js";
import Role from "../../models/Role.js";
import Rental from "../../models/Rental.js";
import Blog from "../../models/Blog.js";
import Event from "../../models/Event.js";
import GstReturn from "../../models/GstReturn.js";
import ProfitReport from "../../models/ProfitReport.js";
import { getDbStatus } from "../../config/db.js";
import memoryStore from "../../config/store.js";
import { broadcastEvent } from "../../websocket.js";
import { productUpload, categoryUpload, blogUpload, staffUpload } from "../../middleware/upload.js";

import { generateAdminToken } from "./adminAuthController.js";

// @route POST /api/admin/blogs/upload
export const uploadBlogsUpload = (req, res, next) => {
  blogUpload.single("image")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || "Failed to upload image" });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }
    const host = req.get("host") || "localhost:5000";
    const protocol = req.protocol || "http";
    const imageUrl = `${protocol}://${host}/uploads/blogs/${req.file.filename}`;
    return res.json({
      success: true,
      message: "Image uploaded successfully",
      imageUrl,
      filename: req.file.filename,
    });
  });
};

const handleGetBlogs = async (req, res, next) => {
  try {
    let blogs = [];
    if (getDbStatus()) {
      blogs = await Blog.find({}).sort({ createdAt: -1 });
    } else {
      blogs = memoryStore.blogs || [];
    }
    return res.json({ success: true, count: blogs.length, blogs });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/blogs
export const getBlogs = handleGetBlogs;

// Helper: Generate unique slug for blogs
export const generateUniqueBlogSlug = async (rawTitleOrSlug, excludeBlogId = null) => {
  let base = (rawTitleOrSlug || "blog")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  if (!base) base = "blog";

  let candidate = base;
  let suffix = 1;

  if (getDbStatus()) {
    while (true) {
      const query = { slug: candidate };
      if (excludeBlogId) {
        const isObjectId = typeof excludeBlogId === "string" && /^[0-9a-fA-F]{24}$/.test(excludeBlogId);
        query.$and = [
          { id: { $ne: String(excludeBlogId) } },
          ...(isObjectId ? [{ _id: { $ne: excludeBlogId } }] : []),
        ];
      }
      const existing = await Blog.findOne(query);
      if (!existing) {
        return candidate;
      }
      candidate = `${base}-${suffix}`;
      suffix++;
    }
  } else {
    while (true) {
      const existing = (memoryStore.blogs || []).find(
        (b) =>
          b.slug === candidate &&
          String(b.id) !== String(excludeBlogId) &&
          String(b._id) !== String(excludeBlogId)
      );
      if (!existing) {
        return candidate;
      }
      candidate = `${base}-${suffix}`;
      suffix++;
    }
  }
};

const handleCreateBlog = async (req, res, next) => {
  try {
    const body = req.body || {};
    const title = (body.title || "").trim();
    if (!title) {
      return res.status(400).json({ success: false, message: "Blog title is required" });
    }

    const id = body.id || String(Date.now());
    const rawSlug = body.slug || title;
    const slug = await generateUniqueBlogSlug(rawSlug);

    const newBlog = {
      ...body,
      id: String(id),
      title,
      slug,
      category: body.category || "Adventure Tips",
      author: body.author || "Dzire Store",
      authorBadge: body.authorBadge || "[Author]",
      image: body.image || "https://images.unsplash.com/photo-1517821365201-7734f463f9e1?auto=format&fit=crop&w=1200&q=80",
      excerpt: body.excerpt || (body.content ? body.content.slice(0, 160) + "..." : ""),
      content: body.content || "",
      readTime: body.readTime || "5 min read",
      status: body.status || "Published",
      visibility: body.visibility || (body.status === "Published" ? "web" : "draft-only"),
      alert: body.alert ?? (body.status !== "Published"),
      featured: Boolean(body.featured),
      date: body.date || new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      views: Number(body.views) || 1,
      tags: Array.isArray(body.tags) ? body.tags : [],
      comments: Array.isArray(body.comments) ? body.comments : [],
    };

    if (getDbStatus()) {
      const created = await Blog.create(newBlog);
      broadcastEvent("BLOGS_UPDATED", { action: "create", blog: created });
      return res.status(201).json({ success: true, message: "Blog created successfully", blog: created });
    } else {
      if (!memoryStore.blogs) memoryStore.blogs = [];
      memoryStore.blogs.unshift(newBlog);
      broadcastEvent("BLOGS_UPDATED", { action: "create", blog: newBlog });
      return res.status(201).json({ success: true, message: "Blog created successfully", blog: newBlog });
    }
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/blogs
export const createBlogs = handleCreateBlog;

const handleUpdateBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    if (body.title) body.title = body.title.trim();

    if (body.slug || body.title) {
      const rawSlug = body.slug || body.title;
      body.slug = await generateUniqueBlogSlug(rawSlug, id);
    }

    if (getDbStatus()) {
      const updated = await Blog.findOneAndUpdate(
        { $or: [{ id: String(id) }, { slug: String(id) }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
        { $set: body },
        { new: true }
      );
      if (updated) {
        broadcastEvent("BLOGS_UPDATED", { action: "update", id, blog: updated });
        return res.json({ success: true, message: "Blog updated successfully", blog: updated });
      }
    } else {
      const item = (memoryStore.blogs || []).find(
        (b) => String(b.id) === String(id) || String(b.slug) === String(id) || String(b._id) === String(id)
      );
      if (item) {
        Object.assign(item, body);
        broadcastEvent("BLOGS_UPDATED", { action: "update", id, blog: item });
        return res.json({ success: true, message: "Blog updated successfully", blog: item });
      }
    }

    return res.status(404).json({ success: false, message: "Blog not found" });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/blogs/:id
export const updateBlogsById = handleUpdateBlog;

const handleDeleteBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (getDbStatus()) {
      await Blog.deleteOne({
        $or: [{ id: String(id) }, { slug: String(id) }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      });
    } else {
      const idx = (memoryStore.blogs || []).findIndex(
        (b) => String(b.id) === String(id) || String(b.slug) === String(id) || String(b._id) === String(id)
      );
      if (idx !== -1) memoryStore.blogs.splice(idx, 1);
    }
    broadcastEvent("BLOGS_UPDATED", { action: "delete", id });
    return res.json({ success: true, message: "Blog deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/blogs/:id
export const deleteBlogsById = handleDeleteBlog;

// @route POST /api/admin/blogs/bulk-delete
export const createBlogsBulkDelete = async (req, res, next) => {
  try {
    const { ids = [] } = req.body;
    if (getDbStatus()) {
      await Blog.deleteMany({
        $or: [{ id: { $in: ids.map(String) } }, { _id: { $in: ids.filter((id) => typeof id === "string" && id.match(/^[0-9a-fA-F]{24}$/)) } }],
      });
    } else {
      memoryStore.blogs = (memoryStore.blogs || []).filter(
        (b) => !ids.map(String).includes(String(b.id)) && !ids.map(String).includes(String(b._id))
      );
    }
    broadcastEvent("BLOGS_UPDATED", { action: "bulk-delete", ids });
    return res.json({ success: true, message: "Selected blogs deleted" });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/blogs/bulk-publish
export const updateBlogsBulkPublish = async (req, res, next) => {
  try {
    const { ids = [] } = req.body;
    if (getDbStatus()) {
      await Blog.updateMany(
        {
          $or: [{ id: { $in: ids.map(String) } }, { _id: { $in: ids.filter((id) => typeof id === "string" && id.match(/^[0-9a-fA-F]{24}$/)) } }],
        },
        { $set: { status: "Published", visibility: "web", alert: false } }
      );
    } else {
      (memoryStore.blogs || []).forEach((b) => {
        if (ids.map(String).includes(String(b.id)) || ids.map(String).includes(String(b._id))) {
          b.status = "Published";
          b.visibility = "web";
          b.alert = false;
        }
      });
    }
    broadcastEvent("BLOGS_UPDATED", { action: "bulk-publish", ids });
    return res.json({ success: true, message: "Selected blogs published" });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/blogs/:id/comments
export const createBlogsByIdComments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { author, text } = req.body;
    const newComment = {
      id: Date.now(),
      author: (author || "Store Staff").trim(),
      date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      text: (text || "").trim(),
      likes: 0,
    };

    if (getDbStatus()) {
      const blog = await Blog.findOne({
        $or: [{ id: String(id) }, { slug: String(id) }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      });
      if (blog) {
        blog.comments.unshift(newComment);
        await blog.save();
        return res.status(201).json({ success: true, comment: newComment, comments: blog.comments });
      }
    } else {
      const blog = (memoryStore.blogs || []).find(
        (b) => String(b.id) === String(id) || String(b.slug) === String(id) || String(b._id) === String(id)
      );
      if (blog) {
        if (!blog.comments) blog.comments = [];
        blog.comments.unshift(newComment);
        return res.status(201).json({ success: true, comment: newComment, comments: blog.comments });
      }
    }
    return res.status(404).json({ success: false, message: "Blog not found" });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/blogs/:id/comments/:commentId
export const deleteBlogsByIdCommentsByCommentId = async (req, res, next) => {
  try {
    const { id, commentId } = req.params;
    if (getDbStatus()) {
      const blog = await Blog.findOne({
        $or: [{ id: String(id) }, { slug: String(id) }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      });
      if (blog) {
        blog.comments = blog.comments.filter((c) => String(c.id) !== String(commentId));
        await blog.save();
        return res.json({ success: true, message: "Comment removed", comments: blog.comments });
      }
    } else {
      const blog = (memoryStore.blogs || []).find(
        (b) => String(b.id) === String(id) || String(b.slug) === String(id) || String(b._id) === String(id)
      );
      if (blog) {
        blog.comments = (blog.comments || []).filter((c) => String(c.id) !== String(commentId));
        return res.json({ success: true, message: "Comment removed", comments: blog.comments });
      }
    }
    return res.status(404).json({ success: false, message: "Blog not found" });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// EVENTS API ROUTES
// ==========================================

const handleGetEvents = async (req, res, next) => {
  try {
    let events = [];
    if (getDbStatus()) {
      events = await Event.find({}).sort({ createdAt: -1 });
    } else {
      events = memoryStore.events || [];
    }
    return res.json({ success: true, count: events.length, events });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/events
export const getEvents = handleGetEvents;

// Helper: Generate unique slug for events
export const generateUniqueEventSlug = async (rawTitleOrSlug, excludeEventId = null) => {
  let base = (rawTitleOrSlug || "event")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  if (!base) base = "event";

  let candidate = base;
  let suffix = 1;

  if (getDbStatus()) {
    while (true) {
      const query = { slug: candidate };
      if (excludeEventId) {
        const isObjectId = typeof excludeEventId === "string" && /^[0-9a-fA-F]{24}$/.test(excludeEventId);
        query.$and = [
          { id: { $ne: String(excludeEventId) } },
          ...(isObjectId ? [{ _id: { $ne: excludeEventId } }] : []),
        ];
      }
      const existing = await Event.findOne(query);
      if (!existing) {
        return candidate;
      }
      candidate = `${base}-${suffix}`;
      suffix++;
    }
  } else {
    while (true) {
      const existing = (memoryStore.events || []).find(
        (e) =>
          e.slug === candidate &&
          String(e.id) !== String(excludeEventId) &&
          String(e._id) !== String(excludeEventId)
      );
      if (!existing) {
        return candidate;
      }
      candidate = `${base}-${suffix}`;
      suffix++;
    }
  }
};

const handleCreateEvent = async (req, res, next) => {
  try {
    const body = req.body || {};
    const title = (body.title || "").trim();
    if (!title) {
      return res.status(400).json({ success: false, message: "Event title is required" });
    }

    const id = body.id || String(Date.now());
    const rawSlug = body.slug || title;
    const slug = await generateUniqueEventSlug(rawSlug);
    const capacity = parseInt(body.capacity, 10) || 25;
    const isFree = Boolean(body.isFree);
    const cleanPrice = isFree ? "Free" : (String(body.price).startsWith("₹") ? body.price : `₹${body.price}`);

    const newEvent = {
      ...body,
      id: String(id),
      title,
      slug,
      type: body.type || "Indoor Workshop",
      category: body.category || "Camping",
      venueTag: body.venueTag || "Dzire Studio",
      date: body.date || "",
      time: body.time || "10:00 AM",
      duration: body.duration || "2 Hours",
      location: body.location || "Dzire Experience Studio",
      organizer: body.organizer || "Dzire Adventure Team",
      price: cleanPrice,
      isFree,
      capacity,
      stock: body.stock !== undefined ? body.stock : capacity,
      booked: Number(body.booked) || 0,
      description: body.description || "",
      image: body.image || "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
      status: body.status || "Upcoming",
      visibility: body.visibility || (body.status === "Upcoming" ? "web" : "in-store"),
      alert: body.alert ?? (body.status !== "Upcoming"),
      featured: Boolean(body.featured),
      attendees: Array.isArray(body.attendees) ? body.attendees : [],
    };

    if (getDbStatus()) {
      const created = await Event.create(newEvent);
      broadcastEvent("EVENTS_UPDATED", { action: "create", event: created });
      return res.status(201).json({ success: true, message: "Event created successfully", event: created });
    } else {
      if (!memoryStore.events) memoryStore.events = [];
      memoryStore.events.unshift(newEvent);
      broadcastEvent("EVENTS_UPDATED", { action: "create", event: newEvent });
      return res.status(201).json({ success: true, message: "Event created successfully", event: newEvent });
    }
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/events
export const createEvents = handleCreateEvent;

const handleUpdateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    if (body.title) body.title = body.title.trim();

    if (body.slug || body.title) {
      const rawSlug = body.slug || body.title;
      body.slug = await generateUniqueEventSlug(rawSlug, id);
    }

    if (getDbStatus()) {
      const updated = await Event.findOneAndUpdate(
        { $or: [{ id: String(id) }, { slug: String(id) }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
        { $set: body },
        { new: true }
      );
      if (updated) {
        broadcastEvent("EVENTS_UPDATED", { action: "update", id, event: updated });
        return res.json({ success: true, message: "Event updated successfully", event: updated });
      }
    } else {
      const item = (memoryStore.events || []).find(
        (e) => String(e.id) === String(id) || String(e.slug) === String(id) || String(e._id) === String(id)
      );
      if (item) {
        Object.assign(item, body);
        broadcastEvent("EVENTS_UPDATED", { action: "update", id, event: item });
        return res.json({ success: true, message: "Event updated successfully", event: item });
      }
    }

    return res.status(404).json({ success: false, message: "Event not found" });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/events/:id
export const updateEventsById = handleUpdateEvent;

const handleDeleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (getDbStatus()) {
      await Event.deleteOne({
        $or: [{ id: String(id) }, { slug: String(id) }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      });
    } else {
      const idx = (memoryStore.events || []).findIndex(
        (e) => String(e.id) === String(id) || String(e.slug) === String(id) || String(e._id) === String(id)
      );
      if (idx !== -1) memoryStore.events.splice(idx, 1);
    }
    broadcastEvent("EVENTS_UPDATED", { action: "delete", id });
    return res.json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/events/:id
export const deleteEventsById = handleDeleteEvent;

// @route POST /api/admin/events/bulk-delete
export const createEventsBulkDelete = async (req, res, next) => {
  try {
    const { ids = [] } = req.body;
    if (getDbStatus()) {
      await Event.deleteMany({
        $or: [{ id: { $in: ids.map(String) } }, { _id: { $in: ids.filter((id) => typeof id === "string" && id.match(/^[0-9a-fA-F]{24}$/)) } }],
      });
    } else {
      memoryStore.events = (memoryStore.events || []).filter(
        (e) => !ids.map(String).includes(String(e.id)) && !ids.map(String).includes(String(e._id))
      );
    }
    broadcastEvent("EVENTS_UPDATED", { action: "bulk-delete", ids });
    return res.json({ success: true, message: "Selected events deleted" });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/events/bulk-publish
export const updateEventsBulkPublish = async (req, res, next) => {
  try {
    const { ids = [] } = req.body;
    if (getDbStatus()) {
      await Event.updateMany(
        {
          $or: [{ id: { $in: ids.map(String) } }, { _id: { $in: ids.filter((id) => typeof id === "string" && id.match(/^[0-9a-fA-F]{24}$/)) } }],
        },
        { $set: { status: "Upcoming", visibility: "web", alert: false } }
      );
    } else {
      (memoryStore.events || []).forEach((e) => {
        if (ids.map(String).includes(String(e.id)) || ids.map(String).includes(String(e._id))) {
          e.status = "Upcoming";
          e.visibility = "web";
          e.alert = false;
        }
      });
    }
    broadcastEvent("EVENTS_UPDATED", { action: "bulk-publish", ids });
    return res.json({ success: true, message: "Selected events published" });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/events/:id/attendees
export const createEventsByIdAttendees = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone, tickets = 1, status = "Confirmed", paymentStatus = "Paid" } = req.body;
    const ticketsNum = parseInt(tickets, 10) || 1;
    const newAttendee = {
      id: `ATT-${Date.now().toString().slice(-4)}`,
      name: (name || "Guest").trim(),
      email: (email || "guest@dzire.in").trim(),
      phone: (phone || "+91 98000 00000").trim(),
      tickets: ticketsNum,
      status,
      paymentStatus,
      registeredAt: new Date(),
    };

    if (getDbStatus()) {
      const event = await Event.findOne({
        $or: [{ id: String(id) }, { slug: String(id) }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      });
      if (event) {
        event.booked = (event.booked || 0) + ticketsNum;
        event.stock = Math.max(0, (event.capacity || 25) - event.booked);
        event.attendees.unshift(newAttendee);
        await event.save();
        return res.status(201).json({ success: true, attendee: newAttendee, event });
      }
    } else {
      const event = (memoryStore.events || []).find(
        (e) => String(e.id) === String(id) || String(e.slug) === String(id) || String(e._id) === String(id)
      );
      if (event) {
        event.booked = (event.booked || 0) + ticketsNum;
        event.stock = Math.max(0, (event.capacity || 25) - event.booked);
        if (!event.attendees) event.attendees = [];
        event.attendees.unshift(newAttendee);
        return res.status(201).json({ success: true, attendee: newAttendee, event });
      }
    }
    return res.status(404).json({ success: false, message: "Event not found" });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/events/:id/attendees/:attendeeId
export const deleteEventsByIdAttendeesByAttendeeId = async (req, res, next) => {
  try {
    const { id, attendeeId } = req.params;
    if (getDbStatus()) {
      const event = await Event.findOne({
        $or: [{ id: String(id) }, { slug: String(id) }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      });
      if (event) {
        const att = event.attendees.find((a) => String(a.id) === String(attendeeId));
        const ticketsToRemove = att ? att.tickets : 1;
        event.booked = Math.max(0, (event.booked || 0) - ticketsToRemove);
        event.stock = Math.min(event.capacity || 25, (event.stock || 0) + ticketsToRemove);
        event.attendees = event.attendees.filter((a) => String(a.id) !== String(attendeeId));
        await event.save();
        return res.json({ success: true, message: "Attendee removed", event });
      }
    } else {
      const event = (memoryStore.events || []).find(
        (e) => String(e.id) === String(id) || String(e.slug) === String(id) || String(e._id) === String(id)
      );
      if (event) {
        const att = (event.attendees || []).find((a) => String(a.id) === String(attendeeId));
        const ticketsToRemove = att ? att.tickets : 1;
        event.booked = Math.max(0, (event.booked || 0) - ticketsToRemove);
        event.stock = Math.min(event.capacity || 25, (event.stock || 0) + ticketsToRemove);
        event.attendees = (event.attendees || []).filter((a) => String(a.id) !== String(attendeeId));
        return res.json({ success: true, message: "Attendee removed", event });
      }
    }
    return res.status(404).json({ success: false, message: "Event not found" });
  } catch (error) {
    next(error);
  }
};

