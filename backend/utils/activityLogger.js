import Activity from "../models/Activity.js";

export const logEmployeeActivity = async (req, action, details = "") => {
  try {
    if (req.user && req.user.role === "employee") {
      await Activity.create({
        adminId: req.user.adminId,
        employeeId: req.user._id,
        employeeName: req.user.name,
        action,
        details,
      });
    }
  } catch (error) {
    console.error("Failed to log employee activity:", error);
  }
};
