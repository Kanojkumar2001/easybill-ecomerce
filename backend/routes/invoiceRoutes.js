import express from "express";
import { getInvoices, createInvoice, updateInvoiceStatus, deleteInvoice } from "../controllers/invoiceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
  .get(protect, getInvoices)
  .post(protect, createInvoice);

router.route("/:id")
  .delete(protect, deleteInvoice);

router.route("/:id/status")
  .put(protect, updateInvoiceStatus);

export default router;
