import User from "../models/User.js";
import Activity from "../models/Activity.js";
import bcrypt from "bcryptjs";

// @desc    Get all employees for the admin
// @route   GET /api/employees
// @access  Private/Admin
export const getEmployees = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Not authorized. Admin only." });
  }

  try {
    const employees = await User.find({ adminId: req.user._id, role: "employee" }).select("-password");
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create an employee
// @route   POST /api/employees
// @access  Private/Admin
export const createEmployee = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Not authorized. Admin only." });
  }

  const { name, email, password, permissions, mobile } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const employee = await User.create({
      name,
      email,
      password,
      role: "employee",
      adminId: req.user._id,
      permissions: permissions || ["read_customers", "create_quotations", "create_invoices", "record_payments"],
      mobile: mobile || "",
      isActive: true,
    });

    if (employee) {
      res.status(201).json({
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        permissions: employee.permissions,
        mobile: employee.mobile,
        isActive: employee.isActive,
      });
    } else {
      res.status(400).json({ message: "Invalid employee data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update employee permissions or status
// @route   PUT /api/employees/:id
// @access  Private/Admin
export const updateEmployee = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Not authorized. Admin only." });
  }

  const { name, permissions, isActive, mobile, password } = req.body;

  try {
    const employee = await User.findOne({ _id: req.params.id, adminId: req.user._id, role: "employee" });

    if (employee) {
      employee.name = name || employee.name;
      employee.permissions = permissions || employee.permissions;
      employee.isActive = isActive !== undefined ? isActive : employee.isActive;
      employee.mobile = mobile ?? employee.mobile;

      if (password) {
        employee.password = password; // Pre-save middleware will hash it
      }

      const updated = await employee.save();
      res.json({
        _id: updated._id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        permissions: updated.permissions,
        mobile: updated.mobile,
        isActive: updated.isActive,
      });
    } else {
      res.status(404).json({ message: "Employee not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an employee
// @route   DELETE /api/employees/:id
// @access  Private/Admin
export const deleteEmployee = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Not authorized. Admin only." });
  }

  try {
    const employee = await User.findOneAndDelete({ _id: req.params.id, adminId: req.user._id, role: "employee" });

    if (employee) {
      res.json({ message: "Employee removed successfully" });
    } else {
      res.status(404).json({ message: "Employee not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get employee activity logs
// @route   GET /api/employees/activities
// @access  Private/Admin
export const getEmployeeActivities = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Not authorized. Admin only." });
  }

  try {
    const activities = await Activity.find({ adminId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
