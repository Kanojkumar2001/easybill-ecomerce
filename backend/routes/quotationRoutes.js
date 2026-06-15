import express from "express";
import { getQuotations, createQuotation, updateQuotationStatus, deleteQuotation } from "../controllers/quotationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
  .get(protect, getQuotations)
  .post(protect, createQuotation);

router.route("/:id")
  .delete(protect, deleteQuotation);

router.route("/:id/status")
  .put(protect, updateQuotationStatus);

export default router;
