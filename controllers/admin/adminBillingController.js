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

// @route GET /api/admin/pos/invoices
export const getPosInvoices = async (req, res, next) => {
  try {
    let invoices = [];
    if (getDbStatus()) {
      invoices = await PosInvoice.find({}).sort({ createdAt: -1 });
    } else {
      invoices = memoryStore.posInvoices || [];
    }

    const totalSales = invoices.reduce((sum, inv) => {
      const num = inv.totalAmount !== undefined ? Number(inv.totalAmount) : (parseFloat(String(inv.amount || '0').replace(/[^0-9.]/g, '')) || 0);
      return sum + num;
    }, 0);

    const paidAmount = invoices.reduce((sum, inv) => {
      if (inv.status === 'Paid') {
        const num = inv.totalAmount !== undefined ? Number(inv.totalAmount) : (parseFloat(String(inv.amount || '0').replace(/[^0-9.]/g, '')) || 0);
        return sum + num;
      }
      return sum + (Number(inv.receivedAmount) || 0);
    }, 0);

    const pendingAmount = invoices.reduce((sum, inv) => {
      if (inv.status === 'Pending') {
        const num = inv.balanceAmount !== undefined ? Number(inv.balanceAmount) : (parseFloat(String(inv.amount || '0').replace(/[^0-9.]/g, '')) || 0);
        return sum + num;
      }
      return sum + (Number(inv.balanceAmount) || 0);
    }, 0);

    return res.json({
      success: true,
      invoices,
      metrics: {
        totalSales,
        transactionsCount: invoices.length,
        paidAmount,
        pendingAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/pos/invoices/:id
export const getPosInvoicesById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let invoice = null;

    if (getDbStatus()) {
      invoice = await PosInvoice.findOne({ $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] });
    } else {
      invoice = (memoryStore.posInvoices || []).find((i) => String(i.id) === String(id));
    }

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }
    return res.json({ success: true, invoice });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/pos/invoices
export const createPosInvoices = async (req, res, next) => {
  try {
    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const formattedTime = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    const fullDateTime = `${formattedDate}, ${formattedTime}`;

    const numId = Date.now().toString().slice(-4);
    const invoiceId = req.body.id || `INV-2026-${numId}`;
    const amountVal = req.body.totalAmount || req.body.amount || 0;
    const numericAmount = typeof amountVal === 'number' ? amountVal : (parseFloat(String(amountVal).replace(/[^0-9.]/g, '')) || 0);

    const invoiceData = {
      id: invoiceId,
      customer: req.body.customer || "Walk-in Customer",
      mobile: req.body.mobile || "",
      email: req.body.email || "",
      address: req.body.address || "",
      dateTime: req.body.dateTime || fullDateTime,
      prefix: req.body.prefix || "DZR/2026/",
      invoiceNo: req.body.invoiceNo || numId,
      invoiceDate: req.body.invoiceDate || formattedDate,
      paymentTerms: req.body.paymentTerms || "30",
      dueDate: req.body.dueDate || "",
      isCashSale: Boolean(req.body.isCashSale),
      items: req.body.items || [],
      itemsCount: (req.body.items || []).reduce((s, it) => s + (Number(it.qty) || 1), 0) || (req.body.items || []).length || 1,
      subtotal: Number(req.body.subtotal) || numericAmount,
      totalDiscount: Number(req.body.totalDiscount) || 0,
      totalTax: Number(req.body.totalTax) || 0,
      totalAmount: numericAmount,
      amount: `₹ ${numericAmount.toLocaleString('en-IN')}`,
      mode: req.body.mode || req.body.paymentMethod || "Cash",
      receivedAmount: Number(req.body.receivedAmount) || (req.body.status === "Paid" ? numericAmount : 0),
      balanceAmount: Number(req.body.balanceAmount) || (req.body.status === "Paid" ? 0 : numericAmount),
      status: req.body.status || (req.body.balanceAmount === 0 ? "Paid" : "Pending"),
      notes: req.body.notes || "",
      terms: req.body.terms || "",
      bankDetails: req.body.bankDetails || {},
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    if (getDbStatus()) {
      const created = await PosInvoice.create(invoiceData);
      return res.status(201).json({ success: true, invoice: created });
    } else {
      if (!memoryStore.posInvoices) memoryStore.posInvoices = [];
      memoryStore.posInvoices.unshift(invoiceData);
      return res.status(201).json({ success: true, invoice: invoiceData });
    }
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/pos/invoices/:id
export const updatePosInvoicesById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (getDbStatus()) {
      const updated = await PosInvoice.findOneAndUpdate(
        { $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
        { ...req.body, updatedAt: new Date().toISOString() },
        { new: true }
      );
      if (updated) return res.json({ success: true, invoice: updated });
    } else {
      const idx = (memoryStore.posInvoices || []).findIndex((i) => String(i.id) === String(id));
      if (idx !== -1) {
        Object.assign(memoryStore.posInvoices[idx], req.body, { updatedAt: new Date().toISOString() });
        return res.json({ success: true, invoice: memoryStore.posInvoices[idx] });
      }
    }
    return res.status(404).json({ success: false, message: "Invoice not found" });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/pos/invoices/:id
export const deletePosInvoicesById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (getDbStatus()) {
      await PosInvoice.deleteOne({ $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] });
    } else {
      const idx = (memoryStore.posInvoices || []).findIndex((i) => String(i.id) === String(id));
      if (idx !== -1) {
        memoryStore.posInvoices.splice(idx, 1);
      }
    }
    return res.json({ success: true, message: "Invoice deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/quotations
export const getQuotations = async (req, res, next) => {
  try {
    let quotations = [];
    if (getDbStatus()) {
      quotations = await Quotation.find({}).sort({ createdAt: -1 });
    } else {
      quotations = memoryStore.quotations || [];
    }

    const totalQuotations = quotations.reduce((sum, q) => {
      const num = q.totalAmount !== undefined ? Number(q.totalAmount) : (parseFloat(String(q.amount || '0').replace(/[^0-9.]/g, '')) || 0);
      return sum + num;
    }, 0);

    const approvedAmount = quotations.reduce((sum, q) => {
      if (q.status === 'Approved') {
        const num = q.totalAmount !== undefined ? Number(q.totalAmount) : (parseFloat(String(q.amount || '0').replace(/[^0-9.]/g, '')) || 0);
        return sum + num;
      }
      return sum;
    }, 0);

    const pendingAmount = quotations.reduce((sum, q) => {
      if (q.status === 'Pending' || q.status === 'Open') {
        const num = q.totalAmount !== undefined ? Number(q.totalAmount) : (parseFloat(String(q.amount || '0').replace(/[^0-9.]/g, '')) || 0);
        return sum + num;
      }
      return sum;
    }, 0);

    const expiredAmount = quotations.reduce((sum, q) => {
      if (q.status === 'Expired') {
        const num = q.totalAmount !== undefined ? Number(q.totalAmount) : (parseFloat(String(q.amount || '0').replace(/[^0-9.]/g, '')) || 0);
        return sum + num;
      }
      return sum;
    }, 0);

    return res.json({
      success: true,
      quotations,
      metrics: {
        totalQuotations,
        approvedAmount,
        pendingAmount,
        expiredAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/quotations/:id
export const getQuotationsById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let quotation = null;
    if (getDbStatus()) {
      quotation = await Quotation.findOne({ $or: [{ id }, { qtnNo: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] });
    } else {
      quotation = (memoryStore.quotations || []).find((q) => String(q.id) === String(id) || String(q.qtnNo) === String(id));
    }
    if (!quotation) {
      return res.status(404).json({ success: false, message: "Quotation not found" });
    }
    return res.json({ success: true, quotation });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/quotations
export const createQuotations = async (req, res, next) => {
  try {
    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const numId = Date.now().toString().slice(-3);
    const qtnNo = req.body.qtnNo || `DZR/QTN/${numId}`;
    const amountVal = req.body.totalAmount || req.body.amount || 0;
    const numericAmount = typeof amountVal === 'number' ? amountVal : (parseFloat(String(amountVal).replace(/[^0-9.]/g, '')) || 0);

    const quotationData = {
      id: req.body.id || `qtn_${Date.now()}`,
      qtnNo,
      date: req.body.date || formattedDate,
      party: req.body.party || req.body.customer || "General Customer",
      mobile: req.body.mobile || "",
      email: req.body.email || "",
      address: req.body.address || "",
      validTill: req.body.validTill || "10 Days",
      items: req.body.items || [],
      subtotal: Number(req.body.subtotal) || numericAmount,
      totalDiscount: Number(req.body.totalDiscount) || 0,
      totalTax: Number(req.body.totalTax) || 0,
      totalAmount: numericAmount,
      amount: `₹ ${numericAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      status: req.body.status || "Open",
      notes: req.body.notes || "",
      terms: req.body.terms || "",
      bankDetails: req.body.bankDetails || {},
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    if (getDbStatus()) {
      const created = await Quotation.create(quotationData);
      return res.status(201).json({ success: true, quotation: created });
    } else {
      if (!memoryStore.quotations) memoryStore.quotations = [];
      memoryStore.quotations.unshift(quotationData);
      return res.status(201).json({ success: true, quotation: quotationData });
    }
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/quotations/:id
export const updateQuotationsById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (getDbStatus()) {
      const updated = await Quotation.findOneAndUpdate(
        { $or: [{ id }, { qtnNo: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
        { ...req.body, updatedAt: new Date().toISOString() },
        { new: true }
      );
      if (updated) return res.json({ success: true, quotation: updated });
    } else {
      const idx = (memoryStore.quotations || []).findIndex((q) => String(q.id) === String(id) || String(q.qtnNo) === String(id));
      if (idx !== -1) {
        Object.assign(memoryStore.quotations[idx], req.body, { updatedAt: new Date().toISOString() });
        return res.json({ success: true, quotation: memoryStore.quotations[idx] });
      }
    }
    return res.status(404).json({ success: false, message: "Quotation not found" });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/quotations/:id
export const deleteQuotationsById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (getDbStatus()) {
      await Quotation.deleteOne({ $or: [{ id }, { qtnNo: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] });
    } else {
      const idx = (memoryStore.quotations || []).findIndex((q) => String(q.id) === String(id) || String(q.qtnNo) === String(id));
      if (idx !== -1) {
        memoryStore.quotations.splice(idx, 1);
      }
    }
    return res.json({ success: true, message: "Quotation deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/payments-in
export const getPaymentsIn = async (req, res, next) => {
  try {
    let payments = [];
    if (getDbStatus()) {
      payments = await PaymentIn.find({}).sort({ createdAt: -1 });
    } else {
      payments = memoryStore.paymentsIn || [];
    }

    const totalAmount = payments.reduce((sum, p) => {
      const num = p.numAmount !== undefined ? Number(p.numAmount) : (parseFloat(String(p.amount || '0').replace(/[^0-9.]/g, '')) || 0);
      return sum + num;
    }, 0);

    const receivedAmount = payments.reduce((sum, p) => {
      if (p.status === 'Received') {
        const num = p.numAmount !== undefined ? Number(p.numAmount) : (parseFloat(String(p.amount || '0').replace(/[^0-9.]/g, '')) || 0);
        return sum + num;
      }
      return sum;
    }, 0);

    const pendingClearanceAmount = payments.reduce((sum, p) => {
      if (p.status === 'Pending Clearance') {
        const num = p.numAmount !== undefined ? Number(p.numAmount) : (parseFloat(String(p.amount || '0').replace(/[^0-9.]/g, '')) || 0);
        return sum + num;
      }
      return sum;
    }, 0);

    return res.json({
      success: true,
      payments,
      metrics: {
        totalAmount,
        receivedAmount,
        pendingClearanceAmount,
        totalCount: payments.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/payments-in
export const createPaymentsIn = async (req, res, next) => {
  try {
    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const formattedTime = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    const fullDateTime = `${formattedDate}, ${formattedTime}`;

    const numId = Date.now().toString().slice(-3);
    const payId = req.body.id || `PAY-IN-2026-${numId}`;
    const amountVal = req.body.numAmount || req.body.amount || 0;
    const numericAmount = typeof amountVal === 'number' ? amountVal : (parseFloat(String(amountVal).replace(/[^0-9.]/g, '')) || 0);

    const paymentData = {
      id: payId,
      dateTime: req.body.dateTime || fullDateTime,
      customer: req.body.customer || "Walk-in Customer",
      mobile: req.body.mobile || "",
      invoiceNo: req.body.invoiceNo || `INV-2026-${numId}`,
      mode: req.body.mode || "Cash",
      txnRef: req.body.txnRef || `TXN${Date.now().toString().slice(-8)}`,
      amount: `₹ ${numericAmount.toLocaleString('en-IN')}`,
      numAmount: numericAmount,
      status: req.body.status || "Received",
      notes: req.body.notes || "",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    if (getDbStatus()) {
      const created = await PaymentIn.create(paymentData);
      return res.status(201).json({ success: true, payment: created });
    } else {
      if (!memoryStore.paymentsIn) memoryStore.paymentsIn = [];
      memoryStore.paymentsIn.unshift(paymentData);
      return res.status(201).json({ success: true, payment: paymentData });
    }
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/payments-in/:id
export const updatePaymentsInById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (getDbStatus()) {
      const updated = await PaymentIn.findOneAndUpdate(
        { $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
        { ...req.body, updatedAt: new Date().toISOString() },
        { new: true }
      );
      if (updated) return res.json({ success: true, payment: updated });
    } else {
      const idx = (memoryStore.paymentsIn || []).findIndex((p) => String(p.id) === String(id));
      if (idx !== -1) {
        Object.assign(memoryStore.paymentsIn[idx], req.body, { updatedAt: new Date().toISOString() });
        return res.json({ success: true, payment: memoryStore.paymentsIn[idx] });
      }
    }
    return res.status(404).json({ success: false, message: "Payment record not found" });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/payments-in/:id
export const deletePaymentsInById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (getDbStatus()) {
      await PaymentIn.deleteOne({ $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] });
    } else {
      const idx = (memoryStore.paymentsIn || []).findIndex((p) => String(p.id) === String(id));
      if (idx !== -1) {
        memoryStore.paymentsIn.splice(idx, 1);
      }
    }
    return res.json({ success: true, message: "Payment record deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/credit-notes
export const getCreditNotes = async (req, res, next) => {
  try {
    let creditNotes = [];
    if (getDbStatus()) {
      creditNotes = await CreditNote.find({}).sort({ createdAt: -1 });
    } else {
      creditNotes = memoryStore.creditNotes || [];
    }

    const totalAmount = creditNotes.reduce((sum, cn) => {
      const num = cn.totalAmount !== undefined ? Number(cn.totalAmount) : (parseFloat(String(cn.amount || '0').replace(/[^0-9.]/g, '')) || 0);
      return sum + num;
    }, 0);

    const settledAmount = creditNotes.reduce((sum, cn) => {
      if (cn.status === 'Settled') {
        const num = cn.totalAmount !== undefined ? Number(cn.totalAmount) : (parseFloat(String(cn.amount || '0').replace(/[^0-9.]/g, '')) || 0);
        return sum + num;
      }
      return sum;
    }, 0);

    const openAmount = creditNotes.reduce((sum, cn) => {
      if (cn.status === 'Open') {
        const num = cn.totalAmount !== undefined ? Number(cn.totalAmount) : (parseFloat(String(cn.amount || '0').replace(/[^0-9.]/g, '')) || 0);
        return sum + num;
      }
      return sum;
    }, 0);

    return res.json({
      success: true,
      creditNotes,
      metrics: {
        totalAmount,
        settledAmount,
        openAmount,
        totalCount: creditNotes.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/credit-notes/:id
export const getCreditNotesById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let creditNote = null;
    if (getDbStatus()) {
      creditNote = await CreditNote.findOne({ $or: [{ id }, { cnNo: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] });
    } else {
      creditNote = (memoryStore.creditNotes || []).find((cn) => String(cn.id) === String(id) || String(cn.cnNo) === String(id));
    }
    if (!creditNote) {
      return res.status(404).json({ success: false, message: "Credit Note not found" });
    }
    return res.json({ success: true, creditNote });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/credit-notes
export const createCreditNotes = async (req, res, next) => {
  try {
    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const numId = Date.now().toString().slice(-2);
    const cnNo = req.body.cnNo || `DZR/CN/${numId}`;
    const amountVal = req.body.totalAmount || req.body.amount || 0;
    const numericAmount = typeof amountVal === 'number' ? amountVal : (parseFloat(String(amountVal).replace(/[^0-9.]/g, '')) || 0);

    const creditNoteData = {
      id: req.body.id || `cn_${Date.now()}`,
      cnNo,
      date: req.body.date || formattedDate,
      party: req.body.party || req.body.customer || "General Customer",
      mobile: req.body.mobile || "",
      invoiceNo: req.body.invoiceNo || `INV-2026-${Date.now().toString().slice(-3)}`,
      items: req.body.items || [],
      subtotal: Number(req.body.subtotal) || numericAmount,
      totalTax: Number(req.body.totalTax) || 0,
      totalDiscount: Number(req.body.totalDiscount) || 0,
      totalAmount: numericAmount,
      amount: `₹ ${numericAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      status: req.body.status || "Open",
      notes: req.body.notes || "",
      terms: req.body.terms || "",
      bankDetails: req.body.bankDetails || {},
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    if (getDbStatus()) {
      const created = await CreditNote.create(creditNoteData);
      return res.status(201).json({ success: true, creditNote: created });
    } else {
      if (!memoryStore.creditNotes) memoryStore.creditNotes = [];
      memoryStore.creditNotes.unshift(creditNoteData);
      return res.status(201).json({ success: true, creditNote: creditNoteData });
    }
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/credit-notes/:id
export const updateCreditNotesById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (getDbStatus()) {
      const updated = await CreditNote.findOneAndUpdate(
        { $or: [{ id }, { cnNo: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
        { ...req.body, updatedAt: new Date().toISOString() },
        { new: true }
      );
      if (updated) return res.json({ success: true, creditNote: updated });
    } else {
      const idx = (memoryStore.creditNotes || []).findIndex((cn) => String(cn.id) === String(id) || String(cn.cnNo) === String(id));
      if (idx !== -1) {
        Object.assign(memoryStore.creditNotes[idx], req.body, { updatedAt: new Date().toISOString() });
        return res.json({ success: true, creditNote: memoryStore.creditNotes[idx] });
      }
    }
    return res.status(404).json({ success: false, message: "Credit Note not found" });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/credit-notes/:id
export const deleteCreditNotesById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (getDbStatus()) {
      await CreditNote.deleteOne({ $or: [{ id }, { cnNo: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] });
    } else {
      const idx = (memoryStore.creditNotes || []).findIndex((cn) => String(cn.id) === String(id) || String(cn.cnNo) === String(id));
      if (idx !== -1) {
        memoryStore.creditNotes.splice(idx, 1);
      }
    }
    return res.json({ success: true, message: "Credit Note deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// PURCHASE INVOICES API ROUTES
// ==========================================

const handleGetPurchaseInvoices = async (req, res, next) => {
  try {
    let invoices = [];
    if (getDbStatus()) {
      invoices = await PurchaseInvoice.find({}).sort({ createdAt: -1 });
    } else {
      invoices = memoryStore.purchaseInvoices || [];
    }

    let totalPurchase = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;

    invoices.forEach((inv) => {
      const amt = Number(inv.totalAmount) || parseFloat(String(inv.amount || 0).replace(/[^0-9.]/g, "")) || 0;
      totalPurchase += amt;
      if (inv.status === "Paid") {
        totalPaid += amt;
      } else {
        totalUnpaid += amt;
      }
    });

    return res.json({
      success: true,
      count: invoices.length,
      invoices,
      totalPurchase,
      totalPaid,
      totalUnpaid,
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/purchase/invoices
// @route GET /api/admin/purchase-invoices
const handleGetPurchaseInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let invoice = null;
    if (getDbStatus()) {
      invoice = await PurchaseInvoice.findOne({
        $or: [{ id }, { inv: id }, { invoiceNumber: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      });
    } else {
      invoice = (memoryStore.purchaseInvoices || []).find(
        (i) => String(i.id) === String(id) || String(i.inv) === String(id)
      );
    }
    if (!invoice) return res.status(404).json({ success: false, message: "Purchase Invoice not found" });
    return res.json({ success: true, invoice });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/purchase/invoices/:id
// @route GET /api/admin/purchase-invoices/:id
const handleCreatePurchaseInvoice = async (req, res, next) => {
  try {
    const body = req.body || {};
    const invoiceNumber = body.invoiceNumber || body.inv || `DZR/PI/${Date.now().toString().slice(-4)}`;
    const id = body.id || `pi_${Date.now()}`;
    const totalAmount = Number(body.totalAmount) || parseFloat(String(body.amount || 0).replace(/[^0-9.]/g, "")) || 0;
    const paidAmount = Number(body.paidAmount) || 0;
    const balanceAmount = Math.max(0, totalAmount - paidAmount);
    const status = body.status || (balanceAmount <= 0 && totalAmount > 0 ? "Paid" : "Unpaid");

    const newInvoice = {
      id,
      inv: invoiceNumber,
      invoiceNumber,
      party: body.party || "Supplier / Vendor",
      vendorId: body.vendorId || "",
      date: body.date || new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      dueDate: body.dueDate || "",
      dueIn: body.dueIn || "Due in 30 days",
      originalInvoiceNo: body.originalInvoiceNo || "",
      paymentTerms: body.paymentTerms || "30",
      items: Array.isArray(body.items) ? body.items : [],
      itemsCount: Array.isArray(body.items) ? body.items.length : (body.itemsCount || 1),
      subtotal: Number(body.subtotal) || totalAmount,
      totalDiscount: Number(body.totalDiscount) || 0,
      totalTax: Number(body.totalTax) || 0,
      totalAmount,
      amount: body.amount || `₹ ${totalAmount.toLocaleString("en-IN")}`,
      paidAmount,
      balanceAmount,
      status,
      paymentMethod: body.paymentMethod || "Cash",
      notes: body.notes || "",
      terms: body.terms || "",
      bankDetails: body.bankDetails || {},
    };

    if (getDbStatus()) {
      const created = await PurchaseInvoice.create(newInvoice);
      return res.status(201).json({ success: true, message: "Purchase Invoice created successfully", invoice: created });
    } else {
      if (!memoryStore.purchaseInvoices) memoryStore.purchaseInvoices = [];
      memoryStore.purchaseInvoices.unshift(newInvoice);
      return res.status(201).json({ success: true, message: "Purchase Invoice created successfully", invoice: newInvoice });
    }
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/purchase/invoices
// @route POST /api/admin/purchase-invoices
const handleUpdatePurchaseInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (getDbStatus()) {
      const updated = await PurchaseInvoice.findOneAndUpdate(
        { $or: [{ id }, { inv: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
        { $set: req.body },
        { new: true }
      );
      if (updated) return res.json({ success: true, message: "Purchase Invoice updated successfully", invoice: updated });
    } else {
      const invoice = (memoryStore.purchaseInvoices || []).find(
        (i) => String(i.id) === String(id) || String(i.inv) === String(id)
      );
      if (invoice) {
        Object.assign(invoice, req.body);
        return res.json({ success: true, message: "Purchase Invoice updated successfully", invoice });
      }
    }
    return res.status(404).json({ success: false, message: "Purchase Invoice not found" });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/purchase/invoices/:id
// @route PUT /api/admin/purchase-invoices/:id
const handleDeletePurchaseInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (getDbStatus()) {
      await PurchaseInvoice.deleteOne({
        $or: [{ id }, { inv: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      });
    } else {
      const idx = (memoryStore.purchaseInvoices || []).findIndex(
        (i) => String(i.id) === String(id) || String(i.inv) === String(id)
      );
      if (idx !== -1) memoryStore.purchaseInvoices.splice(idx, 1);
    }
    return res.json({ success: true, message: "Purchase Invoice deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/purchase/invoices/:id
// @route DELETE /api/admin/purchase-invoices/:id
// ==========================================
// PURCHASE RETURNS API ROUTES
// ==========================================

const handleGetPurchaseReturns = async (req, res, next) => {
  try {
    let returns = [];
    if (getDbStatus()) {
      returns = await PurchaseReturn.find({}).sort({ createdAt: -1 });
    } else {
      returns = memoryStore.purchaseReturns || [];
    }

    let totalReturns = 0;
    let totalRefunded = 0;
    let totalPending = 0;

    returns.forEach((r) => {
      const amt = Number(r.totalAmount) || parseFloat(String(r.amount || 0).replace(/[^0-9.]/g, "")) || 0;
      totalReturns += amt;
      if (r.status === "Refunded") totalRefunded += amt;
      else totalPending += amt;
    });

    return res.json({
      success: true,
      count: returns.length,
      returns,
      totalReturns,
      totalRefunded,
      totalPending,
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/purchase-returns
// @route GET /api/admin/purchase/returns
const handleCreatePurchaseReturn = async (req, res, next) => {
  try {
    const body = req.body || {};
    const returnNo = body.returnNo || `PR-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const id = body.id || `pret_${Date.now()}`;
    const totalAmount = Number(body.totalAmount) || parseFloat(String(body.amount || 0).replace(/[^0-9.]/g, "")) || 0;

    const newReturn = {
      id,
      returnNo,
      originalInvoice: body.originalInvoice || "",
      party: body.party || "Supplier / Vendor",
      vendorId: body.vendorId || "",
      date: body.date || new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      itemsCount: Array.isArray(body.items) ? body.items.length : (body.itemsCount || 1),
      items: Array.isArray(body.items) ? body.items : [],
      totalAmount,
      amount: body.amount || `₹ ${totalAmount.toLocaleString("en-IN")}`,
      receivedAmount: Number(body.receivedAmount) || 0,
      balanceAmount: Math.max(0, totalAmount - (Number(body.receivedAmount) || 0)),
      refundMode: body.refundMode || "Bank Transfer",
      status: body.status || "Pending",
      reason: body.reason || "Defective / Damaged goods",
      notes: body.notes || "",
    };

    if (getDbStatus()) {
      const created = await PurchaseReturn.create(newReturn);
      return res.status(201).json({ success: true, message: "Purchase Return created successfully", purchaseReturn: created });
    } else {
      if (!memoryStore.purchaseReturns) memoryStore.purchaseReturns = [];
      memoryStore.purchaseReturns.unshift(newReturn);
      return res.status(201).json({ success: true, message: "Purchase Return created successfully", purchaseReturn: newReturn });
    }
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/purchase-returns
// @route POST /api/admin/purchase/returns
const handleUpdatePurchaseReturn = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (getDbStatus()) {
      const updated = await PurchaseReturn.findOneAndUpdate(
        { $or: [{ id }, { returnNo: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
        { $set: req.body },
        { new: true }
      );
      if (updated) return res.json({ success: true, message: "Purchase Return updated successfully", purchaseReturn: updated });
    } else {
      const item = (memoryStore.purchaseReturns || []).find(
        (r) => String(r.id) === String(id) || String(r.returnNo) === String(id)
      );
      if (item) {
        Object.assign(item, req.body);
        return res.json({ success: true, message: "Purchase Return updated successfully", purchaseReturn: item });
      }
    }
    return res.status(404).json({ success: false, message: "Purchase Return not found" });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/purchase-returns/:id
// @route PUT /api/admin/purchase/returns/:id
const handleDeletePurchaseReturn = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (getDbStatus()) {
      await PurchaseReturn.deleteOne({
        $or: [{ id }, { returnNo: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      });
    } else {
      const idx = (memoryStore.purchaseReturns || []).findIndex(
        (r) => String(r.id) === String(id) || String(r.returnNo) === String(id)
      );
      if (idx !== -1) memoryStore.purchaseReturns.splice(idx, 1);
    }
    return res.json({ success: true, message: "Purchase Return deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/purchase-returns/:id
// @route DELETE /api/admin/purchase/returns/:id
// ==========================================
// PAYMENT OUT API ROUTES
// ==========================================

const handleGetPaymentsOut = async (req, res, next) => {
  try {
    let payments = [];
    if (getDbStatus()) {
      payments = await PaymentOut.find({}).sort({ createdAt: -1 });
    } else {
      payments = memoryStore.paymentsOut || [];
    }

    const totalPaidOut = payments.reduce((sum, p) => {
      const val = Number(p.amountNum) || parseFloat(String(p.amount || 0).replace(/[^0-9.]/g, "")) || 0;
      return sum + val;
    }, 0);

    return res.json({
      success: true,
      count: payments.length,
      payments,
      totalPaidOut,
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/payments-out
// @route GET /api/admin/payment-out
const handleCreatePaymentOut = async (req, res, next) => {
  try {
    const body = req.body || {};
    const paymentNo = body.paymentNo || `DZR/P-OUT/${Date.now().toString().slice(-4)}`;
    const id = body.id || `pout_${Date.now()}`;
    const amountNum = Number(body.amountNum) || parseFloat(String(body.amount || 0).replace(/[^0-9.]/g, "")) || 0;

    const newPayment = {
      id,
      paymentNo,
      party: body.party || "Supplier / Vendor",
      vendorId: body.vendorId || "",
      date: body.date || new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      amount: body.amount || `₹ ${amountNum.toLocaleString("en-IN")}`,
      amountNum,
      mode: body.mode || "Bank Transfer",
      refNo: body.refNo || "",
      notes: body.notes || "",
      status: body.status || "Completed",
    };

    if (getDbStatus()) {
      const created = await PaymentOut.create(newPayment);
      return res.status(201).json({ success: true, message: "Payment Out created successfully", payment: created });
    } else {
      if (!memoryStore.paymentsOut) memoryStore.paymentsOut = [];
      memoryStore.paymentsOut.unshift(newPayment);
      return res.status(201).json({ success: true, message: "Payment Out created successfully", payment: newPayment });
    }
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/payments-out
// @route POST /api/admin/payment-out
const handleUpdatePaymentOut = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (getDbStatus()) {
      const updated = await PaymentOut.findOneAndUpdate(
        { $or: [{ id }, { paymentNo: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
        { $set: req.body },
        { new: true }
      );
      if (updated) return res.json({ success: true, message: "Payment Out updated successfully", payment: updated });
    } else {
      const p = (memoryStore.paymentsOut || []).find(
        (item) => String(item.id) === String(id) || String(item.paymentNo) === String(id)
      );
      if (p) {
        Object.assign(p, req.body);
        return res.json({ success: true, message: "Payment Out updated successfully", payment: p });
      }
    }
    return res.status(404).json({ success: false, message: "Payment Out not found" });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/payments-out/:id
// @route PUT /api/admin/payment-out/:id
const handleDeletePaymentOut = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (getDbStatus()) {
      await PaymentOut.deleteOne({
        $or: [{ id }, { paymentNo: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      });
    } else {
      const idx = (memoryStore.paymentsOut || []).findIndex(
        (item) => String(item.id) === String(id) || String(item.paymentNo) === String(id)
      );
      if (idx !== -1) memoryStore.paymentsOut.splice(idx, 1);
    }
    return res.json({ success: true, message: "Payment Out deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/payments-out/:id
// @route DELETE /api/admin/payment-out/:id
// ==========================================
// DEBIT NOTES API ROUTES
// ==========================================

const handleGetDebitNotes = async (req, res, next) => {
  try {
    let debitNotes = [];
    if (getDbStatus()) {
      debitNotes = await DebitNote.find({}).sort({ createdAt: -1 });
    } else {
      debitNotes = memoryStore.debitNotes || [];
    }

    const totalDebitAmount = debitNotes.reduce((sum, d) => {
      const val = Number(d.amountNum) || parseFloat(String(d.amount || 0).replace(/[^0-9.]/g, "")) || 0;
      return sum + val;
    }, 0);

    return res.json({
      success: true,
      count: debitNotes.length,
      debitNotes,
      totalDebitAmount,
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/debit-notes
// @route GET /api/admin/debit-note
const handleCreateDebitNote = async (req, res, next) => {
  try {
    const body = req.body || {};
    const debitNo = body.debitNo || `DZR/DEBIT/${Date.now().toString().slice(-4)}`;
    const id = body.id || `deb_${Date.now()}`;
    const amountNum = Number(body.amountNum) || parseFloat(String(body.amount || 0).replace(/[^0-9.]/g, "")) || 0;

    const newNote = {
      id,
      debitNo,
      purchaseNo: body.purchaseNo || "",
      party: body.party || "Supplier / Vendor",
      vendorId: body.vendorId || "",
      date: body.date || new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      amount: body.amount || `₹ ${amountNum.toLocaleString("en-IN")}`,
      amountNum,
      reason: body.reason || "Rate difference",
      status: body.status || "Issued",
      items: Array.isArray(body.items) ? body.items : [],
      notes: body.notes || "",
    };

    if (getDbStatus()) {
      const created = await DebitNote.create(newNote);
      return res.status(201).json({ success: true, message: "Debit Note created successfully", debitNote: created });
    } else {
      if (!memoryStore.debitNotes) memoryStore.debitNotes = [];
      memoryStore.debitNotes.unshift(newNote);
      return res.status(201).json({ success: true, message: "Debit Note created successfully", debitNote: newNote });
    }
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/debit-notes
// @route POST /api/admin/debit-note
const handleUpdateDebitNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (getDbStatus()) {
      const updated = await DebitNote.findOneAndUpdate(
        { $or: [{ id }, { debitNo: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
        { $set: req.body },
        { new: true }
      );
      if (updated) return res.json({ success: true, message: "Debit Note updated successfully", debitNote: updated });
    } else {
      const item = (memoryStore.debitNotes || []).find(
        (d) => String(d.id) === String(id) || String(d.debitNo) === String(id)
      );
      if (item) {
        Object.assign(item, req.body);
        return res.json({ success: true, message: "Debit Note updated successfully", debitNote: item });
      }
    }
    return res.status(404).json({ success: false, message: "Debit Note not found" });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/debit-notes/:id
// @route PUT /api/admin/debit-note/:id
const handleDeleteDebitNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (getDbStatus()) {
      await DebitNote.deleteOne({
        $or: [{ id }, { debitNo: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      });
    } else {
      const idx = (memoryStore.debitNotes || []).findIndex(
        (d) => String(d.id) === String(id) || String(d.debitNo) === String(id)
      );
      if (idx !== -1) memoryStore.debitNotes.splice(idx, 1);
    }
    return res.json({ success: true, message: "Debit Note deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/debit-notes/:id
// @route DELETE /api/admin/debit-note/:id
// ==========================================
// PURCHASE ORDERS API ROUTES
// ==========================================

const handleGetPurchaseOrders = async (req, res, next) => {
  try {
    let orders = [];
    if (getDbStatus()) {
      orders = await PurchaseOrder.find({}).sort({ createdAt: -1 });
    } else {
      orders = memoryStore.purchaseOrders || [];
    }

    const totalOrderAmount = orders.reduce((sum, o) => {
      const val = Number(o.totalAmount) || parseFloat(String(o.amount || 0).replace(/[^0-9.]/g, "")) || 0;
      return sum + val;
    }, 0);

    return res.json({
      success: true,
      count: orders.length,
      orders,
      totalOrderAmount,
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/purchase-orders
// @route GET /api/admin/purchase/orders
const handleCreatePurchaseOrder = async (req, res, next) => {
  try {
    const body = req.body || {};
    const poNo = body.poNo || `DZR/PO/${Date.now().toString().slice(-4)}`;
    const id = body.id || `po_${Date.now()}`;
    const totalAmount = Number(body.totalAmount) || parseFloat(String(body.amount || 0).replace(/[^0-9.]/g, "")) || 0;

    const newOrder = {
      id,
      poNo,
      party: body.party || "Supplier / Vendor",
      vendorId: body.vendorId || "",
      date: body.date || new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      validTill: body.validTill || "",
      itemsCount: Array.isArray(body.items) ? body.items.length : (body.itemsCount || 1),
      items: Array.isArray(body.items) ? body.items : [],
      totalAmount,
      amount: body.amount || `₹ ${totalAmount.toLocaleString("en-IN")}`,
      status: body.status || "Pending",
      notes: body.notes || "",
    };

    if (getDbStatus()) {
      const created = await PurchaseOrder.create(newOrder);
      return res.status(201).json({ success: true, message: "Purchase Order created successfully", order: created });
    } else {
      if (!memoryStore.purchaseOrders) memoryStore.purchaseOrders = [];
      memoryStore.purchaseOrders.unshift(newOrder);
      return res.status(201).json({ success: true, message: "Purchase Order created successfully", order: newOrder });
    }
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/purchase-orders
// @route POST /api/admin/purchase/orders
const handleUpdatePurchaseOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (getDbStatus()) {
      const updated = await PurchaseOrder.findOneAndUpdate(
        { $or: [{ id }, { poNo: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
        { $set: req.body },
        { new: true }
      );
      if (updated) return res.json({ success: true, message: "Purchase Order updated successfully", order: updated });
    } else {
      const item = (memoryStore.purchaseOrders || []).find(
        (o) => String(o.id) === String(id) || String(o.poNo) === String(id)
      );
      if (item) {
        Object.assign(item, req.body);
        return res.json({ success: true, message: "Purchase Order updated successfully", order: item });
      }
    }
    return res.status(404).json({ success: false, message: "Purchase Order not found" });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/purchase-orders/:id
// @route PUT /api/admin/purchase/orders/:id
const handleDeletePurchaseOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (getDbStatus()) {
      await PurchaseOrder.deleteOne({
        $or: [{ id }, { poNo: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      });
    } else {
      const idx = (memoryStore.purchaseOrders || []).findIndex(
        (o) => String(o.id) === String(id) || String(o.poNo) === String(id)
      );
      if (idx !== -1) memoryStore.purchaseOrders.splice(idx, 1);
    }
    return res.json({ success: true, message: "Purchase Order deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/purchase-orders/:id
// @route DELETE /api/admin/purchase/orders/:id
// ==========================================
// INSTORE RETURNS API ROUTES
// ==========================================

const handleGetInstoreReturns = async (req, res, next) => {
  try {
    let returns = [];
    if (getDbStatus()) {
      returns = await InstoreReturn.find({}).sort({ createdAt: -1 });
    } else {
      returns = memoryStore.instoreReturns || [];
    }

    const totalRequests = returns.length;
    const totalRefundAmount = returns.reduce((sum, r) => {
      const val = Number(r.refundAmountNum) || parseFloat(String(r.refundAmount || 0).replace(/[^0-9.]/g, "")) || 0;
      return sum + val;
    }, 0);
    const completedApproved = returns.filter(
      (r) => r.status === "Completed" || r.status === "Approved"
    ).length;
    const pendingAudit = returns.filter((r) => r.status === "Pending Audit").length;

    return res.json({
      success: true,
      count: returns.length,
      returns,
      stats: {
        totalRequests,
        totalRefundAmount,
        completedApproved,
        pendingAudit,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/instore-returns
// @route GET /api/admin/instore-return
const handleCreateInstoreReturn = async (req, res, next) => {
  try {
    const body = req.body || {};
    const id = body.id || `RET-IN-${Math.floor(1000 + Math.random() * 9000)}`;
    const refundAmountNum = Number(body.refundAmountNum) || parseFloat(String(body.refundAmount || 0).replace(/[^0-9.]/g, "")) || 0;

    const newRecord = {
      id,
      dateTime: body.dateTime || new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      customer: body.customer || "Walk-in Customer",
      mobile: body.mobile || "",
      invoiceNo: body.invoiceNo || `INV-POS-${Math.floor(1000 + Math.random() * 9000)}`,
      item: body.item || "Apparel Item",
      reason: body.reason || "Defective / Dissatisfied",
      refundAmount: body.refundAmount || `₹ ${refundAmountNum.toLocaleString("en-IN")}`,
      refundAmountNum,
      refundMode: body.refundMode || "Store Credit",
      status: body.status || "Pending Audit",
      notes: body.notes || "",
    };

    if (getDbStatus()) {
      const created = await InstoreReturn.create(newRecord);
      return res.status(201).json({ success: true, message: "Instore return recorded successfully", returnRecord: created });
    } else {
      if (!memoryStore.instoreReturns) memoryStore.instoreReturns = [];
      memoryStore.instoreReturns.unshift(newRecord);
      return res.status(201).json({ success: true, message: "Instore return recorded successfully", returnRecord: newRecord });
    }
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/instore-returns
// @route POST /api/admin/instore-return
const handleUpdateInstoreReturn = async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    if (getDbStatus()) {
      const updated = await InstoreReturn.findOneAndUpdate(
        { $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
        { $set: body },
        { new: true }
      );
      if (updated) {
        return res.json({ success: true, message: "Instore return updated successfully", returnRecord: updated });
      }
    } else {
      const item = (memoryStore.instoreReturns || []).find(
        (r) => String(r.id) === String(id) || String(r._id) === String(id)
      );
      if (item) {
        Object.assign(item, body);
        return res.json({ success: true, message: "Instore return updated successfully", returnRecord: item });
      }
    }

    return res.status(404).json({ success: false, message: "Instore return not found" });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/instore-returns/:id
// @route PUT /api/admin/instore-return/:id
const handleDeleteInstoreReturn = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (getDbStatus()) {
      await InstoreReturn.deleteOne({
        $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      });
    } else {
      const idx = (memoryStore.instoreReturns || []).findIndex(
        (r) => String(r.id) === String(id) || String(r._id) === String(id)
      );
      if (idx !== -1) memoryStore.instoreReturns.splice(idx, 1);
    }
    return res.json({ success: true, message: "Instore return deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/instore-returns/:id
// @route DELETE /api/admin/instore-return/:id

export const getPurchaseInvoices = handleGetPurchaseInvoices;
export const getPurchaseInvoicesById = handleGetPurchaseInvoiceById;
export const createPurchaseInvoices = handleCreatePurchaseInvoice;
export const updatePurchaseInvoicesById = handleUpdatePurchaseInvoice;
export const deletePurchaseInvoicesById = handleDeletePurchaseInvoice;

export const getPurchaseReturns = handleGetPurchaseReturns;
export const createPurchaseReturns = handleCreatePurchaseReturn;
export const updatePurchaseReturnsById = handleUpdatePurchaseReturn;
export const deletePurchaseReturnsById = handleDeletePurchaseReturn;

export const getPaymentsOut = handleGetPaymentsOut;
export const createPaymentsOut = handleCreatePaymentOut;
export const updatePaymentsOutById = handleUpdatePaymentOut;
export const deletePaymentsOutById = handleDeletePaymentOut;

export const getDebitNotes = handleGetDebitNotes;
export const createDebitNotes = handleCreateDebitNote;
export const updateDebitNotesById = handleUpdateDebitNote;
export const deleteDebitNotesById = handleDeleteDebitNote;

export const getPurchaseOrders = handleGetPurchaseOrders;
export const createPurchaseOrders = handleCreatePurchaseOrder;
export const updatePurchaseOrdersById = handleUpdatePurchaseOrder;
export const deletePurchaseOrdersById = handleDeletePurchaseOrder;

export const getInstoreReturns = handleGetInstoreReturns;
export const createInstoreReturns = handleCreateInstoreReturn;
export const updateInstoreReturnsById = handleUpdateInstoreReturn;
export const deleteInstoreReturnsById = handleDeleteInstoreReturn;
