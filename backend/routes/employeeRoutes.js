import express from "express";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeActivities,
} from "../controllers/employeeController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
  .get(protect, getEmployees)
  .post(protect, createEmployee);

router.route("/activities")
  .get(protect, getEmployeeActivities);

router.route("/:id")
  .put(protect, updateEmployee)
  .delete(protect, deleteEmployee);

export default router;
