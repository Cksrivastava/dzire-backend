import express from "express";
import {
  adminLogin,
  getOverview
} from "../controllers/admin/adminAuthController.js";
import {
  createCreditNotes,
  createDebitNotes,
  createInstoreReturns,
  createPaymentsIn,
  createPaymentsOut,
  createPosInvoices,
  createPurchaseInvoices,
  createPurchaseOrders,
  createPurchaseReturns,
  createQuotations,
  deleteCreditNotesById,
  deleteDebitNotesById,
  deleteInstoreReturnsById,
  deletePaymentsInById,
  deletePaymentsOutById,
  deletePosInvoicesById,
  deletePurchaseInvoicesById,
  deletePurchaseOrdersById,
  deletePurchaseReturnsById,
  deleteQuotationsById,
  getCreditNotes,
  getCreditNotesById,
  getDebitNotes,
  getInstoreReturns,
  getPaymentsIn,
  getPaymentsOut,
  getPosInvoices,
  getPosInvoicesById,
  getPurchaseInvoices,
  getPurchaseInvoicesById,
  getPurchaseOrders,
  getPurchaseReturns,
  getQuotations,
  getQuotationsById,
  updateCreditNotesById,
  updateDebitNotesById,
  updateInstoreReturnsById,
  updatePaymentsInById,
  updatePaymentsOutById,
  updatePosInvoicesById,
  updatePurchaseInvoicesById,
  updatePurchaseOrdersById,
  updatePurchaseReturnsById,
  updateQuotationsById
} from "../controllers/admin/adminBillingController.js";
import {
  createBlogs,
  createBlogsBulkDelete,
  createBlogsByIdComments,
  createEvents,
  createEventsBulkDelete,
  createEventsByIdAttendees,
  deleteBlogsById,
  deleteBlogsByIdCommentsByCommentId,
  deleteEventsById,
  deleteEventsByIdAttendeesByAttendeeId,
  getBlogs,
  getEvents,
  updateBlogsBulkPublish,
  updateBlogsById,
  updateEventsBulkPublish,
  updateEventsById,
  uploadBlogsUpload
} from "../controllers/admin/adminContentController.js";
import {
  createReturns,
  createUsers,
  createUsersByIdCredits,
  deleteReturnsById,
  deleteUsersById,
  getCreditsSummary,
  getReturns,
  getUsers,
  importUsersImport,
  updateReturnsById,
  updateUsersById
} from "../controllers/admin/adminCustomerController.js";
import {
  createCategories,
  createCoupons,
  createOffers,
  deleteCategoriesById,
  deleteCouponsById,
  deleteOffersById,
  getCategories,
  getCoupons,
  getOffers,
  handleGetCoupons,
  updateCategoriesById,
  updateCouponsById,
  updateOffersById,
  uploadCategoriesUpload
} from "../controllers/admin/adminMarketingController.js";
import {
  createOrders,
  createOrdersByIdUpdates,
  deleteOrdersById,
  getOrders,
  getOrdersById,
  updateOrdersById
} from "../controllers/admin/adminOrderController.js";
import {
  createAttributes,
  createProducts,
  deleteAttributesById,
  deleteProductsById,
  getAttributes,
  getBrands,
  getCollections,
  getPayments,
  getProducts,
  getProductsById,
  getStockAlerts,
  resetAttributesReset,
  updateAttributesById,
  updateProductsById,
  uploadProductsUpload
} from "../controllers/admin/adminProductController.js";
import {
  getReportsGst,
  getReportsProfit,
  syncReportsGstSync
} from "../controllers/admin/adminReportController.js";
import {
  createRoles,
  createRolesBulkDelete,
  createStaff,
  createStaffBulkDelete,
  deleteRolesById,
  deleteStaffById,
  getRoles,
  getRolesById,
  getStaff,
  getStaffById,
  resetStaffByIdPasswordReset,
  updateRolesById,
  updateStaffById,
  uploadStaffUpload
} from "../controllers/admin/adminStaffController.js";
import {
  createVendors,
  deleteVendorsById,
  getVendors,
  getVendorsById,
  updateVendorsById
} from "../controllers/admin/adminVendorController.js";

const router = express.Router();

// Auth & Overview
router.post("/login", adminLogin);
router.get("/overview", getOverview);

// Orders
router.get("/orders", getOrders);
router.post("/orders", createOrders);
router.get("/orders/:id", getOrdersById);
router.post("/orders/:id/updates", createOrdersByIdUpdates);
router.put("/orders/:id", updateOrdersById);
router.delete("/orders/:id", deleteOrdersById);

// Products & Attributes
router.post("/products/upload", uploadProductsUpload);
router.get("/products", getProducts);
router.post("/products", createProducts);
router.put("/products/:id", updateProductsById);
router.delete("/products/:id", deleteProductsById);
router.get("/products/:id", getProductsById);
router.get("/payments", getPayments);
router.get("/stock-alerts", getStockAlerts);
router.get("/brands", getBrands);
router.get("/collections", getCollections);
router.get("/attributes", getAttributes);
router.post("/attributes", createAttributes);
router.put("/attributes/:id", updateAttributesById);
router.delete("/attributes/:id", deleteAttributesById);
router.post("/attributes/reset", resetAttributesReset);

// Vendors
router.get("/vendors", getVendors);
router.get("/vendors/:id", getVendorsById);
router.post("/vendors", createVendors);
router.put("/vendors/:id", updateVendorsById);
router.delete("/vendors/:id", deleteVendorsById);

// Users, Credits & Returns
router.get("/users", getUsers);
router.post("/users", createUsers);
router.post("/users/import", importUsersImport);
router.put("/users/:id", updateUsersById);
router.delete("/users/:id", deleteUsersById);
router.post("/users/:id/credits", createUsersByIdCredits);
router.get("/credits/summary", getCreditsSummary);
router.get("/returns", getReturns);
router.post("/returns", createReturns);
router.put("/returns/:id", updateReturnsById);
router.delete("/returns/:id", deleteReturnsById);

// POS Sales Invoices
router.get("/pos/invoices", getPosInvoices);
router.get("/pos/invoices/:id", getPosInvoicesById);
router.post("/pos/invoices", createPosInvoices);
router.put("/pos/invoices/:id", updatePosInvoicesById);
router.delete("/pos/invoices/:id", deletePosInvoicesById);

// Quotations
router.get("/quotations", getQuotations);
router.get("/quotations/:id", getQuotationsById);
router.post("/quotations", createQuotations);
router.put("/quotations/:id", updateQuotationsById);
router.delete("/quotations/:id", deleteQuotationsById);

// Payments In
router.get("/payments-in", getPaymentsIn);
router.post("/payments-in", createPaymentsIn);
router.put("/payments-in/:id", updatePaymentsInById);
router.delete("/payments-in/:id", deletePaymentsInById);

// Credit Notes
router.get("/credit-notes", getCreditNotes);
router.get("/credit-notes/:id", getCreditNotesById);
router.post("/credit-notes", createCreditNotes);
router.put("/credit-notes/:id", updateCreditNotesById);
router.delete("/credit-notes/:id", deleteCreditNotesById);

// Purchase Invoices
router.get("/purchase/invoices", getPurchaseInvoices);
router.get("/purchase-invoices", getPurchaseInvoices);
router.get("/purchase/invoices/:id", getPurchaseInvoicesById);
router.get("/purchase-invoices/:id", getPurchaseInvoicesById);
router.post("/purchase/invoices", createPurchaseInvoices);
router.post("/purchase-invoices", createPurchaseInvoices);
router.put("/purchase/invoices/:id", updatePurchaseInvoicesById);
router.put("/purchase-invoices/:id", updatePurchaseInvoicesById);
router.delete("/purchase/invoices/:id", deletePurchaseInvoicesById);
router.delete("/purchase-invoices/:id", deletePurchaseInvoicesById);

// Purchase Returns
router.get("/purchase-returns", getPurchaseReturns);
router.get("/purchase/returns", getPurchaseReturns);
router.post("/purchase-returns", createPurchaseReturns);
router.post("/purchase/returns", createPurchaseReturns);
router.put("/purchase-returns/:id", updatePurchaseReturnsById);
router.put("/purchase/returns/:id", updatePurchaseReturnsById);
router.delete("/purchase-returns/:id", deletePurchaseReturnsById);
router.delete("/purchase/returns/:id", deletePurchaseReturnsById);

// Payments Out
router.get("/payments-out", getPaymentsOut);
router.get("/payment-out", getPaymentsOut);
router.post("/payments-out", createPaymentsOut);
router.post("/payment-out", createPaymentsOut);
router.put("/payments-out/:id", updatePaymentsOutById);
router.put("/payment-out/:id", updatePaymentsOutById);
router.delete("/payments-out/:id", deletePaymentsOutById);
router.delete("/payment-out/:id", deletePaymentsOutById);

// Debit Notes
router.get("/debit-notes", getDebitNotes);
router.get("/debit-note", getDebitNotes);
router.post("/debit-notes", createDebitNotes);
router.post("/debit-note", createDebitNotes);
router.put("/debit-notes/:id", updateDebitNotesById);
router.put("/debit-note/:id", updateDebitNotesById);
router.delete("/debit-notes/:id", deleteDebitNotesById);
router.delete("/debit-note/:id", deleteDebitNotesById);

// Purchase Orders
router.get("/purchase-orders", getPurchaseOrders);
router.get("/purchase/orders", getPurchaseOrders);
router.post("/purchase-orders", createPurchaseOrders);
router.post("/purchase/orders", createPurchaseOrders);
router.put("/purchase-orders/:id", updatePurchaseOrdersById);
router.put("/purchase/orders/:id", updatePurchaseOrdersById);
router.delete("/purchase-orders/:id", deletePurchaseOrdersById);
router.delete("/purchase/orders/:id", deletePurchaseOrdersById);

// Instore Returns
router.get("/instore-returns", getInstoreReturns);
router.get("/instore-return", getInstoreReturns);
router.post("/instore-returns", createInstoreReturns);
router.post("/instore-return", createInstoreReturns);
router.put("/instore-returns/:id", updateInstoreReturnsById);
router.put("/instore-return/:id", updateInstoreReturnsById);
router.delete("/instore-returns/:id", deleteInstoreReturnsById);
router.delete("/instore-return/:id", deleteInstoreReturnsById);

// Coupons
router.get("/coupons", getCoupons);
router.post("/coupons", createCoupons);
router.put("/coupons/:id", updateCouponsById);
router.delete("/coupons/:id", deleteCouponsById);

// Offers
router.get("/offers", getOffers);
router.post("/offers", createOffers);
router.put("/offers/:id", updateOffersById);
router.delete("/offers/:id", deleteOffersById);

// Categories
router.get("/categories", getCategories);
router.post("/categories/upload", uploadCategoriesUpload);
router.post("/categories", createCategories);
router.put("/categories/:id", updateCategoriesById);
router.delete("/categories/:id", deleteCategoriesById);

// Blogs
router.post("/blogs/upload", uploadBlogsUpload);
router.get("/blogs", getBlogs);
router.post("/blogs", createBlogs);
router.put("/blogs/:id", updateBlogsById);
router.delete("/blogs/:id", deleteBlogsById);
router.post("/blogs/bulk-delete", createBlogsBulkDelete);
router.put("/blogs/bulk-publish", updateBlogsBulkPublish);
router.post("/blogs/:id/comments", createBlogsByIdComments);
router.delete("/blogs/:id/comments/:commentId", deleteBlogsByIdCommentsByCommentId);

// Events
router.get("/events", getEvents);
router.post("/events", createEvents);
router.put("/events/:id", updateEventsById);
router.delete("/events/:id", deleteEventsById);
router.post("/events/bulk-delete", createEventsBulkDelete);
router.put("/events/bulk-publish", updateEventsBulkPublish);
router.post("/events/:id/attendees", createEventsByIdAttendees);
router.delete("/events/:id/attendees/:attendeeId", deleteEventsByIdAttendeesByAttendeeId);

// Staff & Roles
router.post("/staff/upload", uploadStaffUpload);
router.get("/staff", getStaff);
router.get("/staff/:id", getStaffById);
router.post("/staff", createStaff);
router.put("/staff/:id", updateStaffById);
router.delete("/staff/:id", deleteStaffById);
router.post("/staff/bulk-delete", createStaffBulkDelete);
router.post("/staff/:id/password-reset", resetStaffByIdPasswordReset);
router.get("/roles", getRoles);
router.get("/roles/:id", getRolesById);
router.post("/roles", createRoles);
router.put("/roles/:id", updateRolesById);
router.delete("/roles/:id", deleteRolesById);
router.post("/roles/bulk-delete", createRolesBulkDelete);

// Reports
router.get("/reports/gst", getReportsGst);
router.post("/reports/gst/sync", syncReportsGstSync);
router.get("/reports/profit", getReportsProfit);

export default router;
