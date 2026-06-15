import express from "express";
import { getSalesReport, getPaymentsReport, getExpensesReport, getProfitReport } from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/sales", protect, getSalesReport);
router.get("/payments", protect, getPaymentsReport);
router.get("/expenses", protect, getExpensesReport);
router.get("/profit", protect, getProfitReport);

export default router;
