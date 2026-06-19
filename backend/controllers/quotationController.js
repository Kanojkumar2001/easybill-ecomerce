import Quotation from "../models/Quotation.js";
import Customer from "../models/Customer.js";
import { logEmployeeActivity } from "../utils/activityLogger.js";

// @desc    Get all quotations
// @route   GET /api/quotations
// @access  Private
export const getQuotations = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "customer") {
      const customers = await Customer.find({ email: req.user.email });
      const customerIds = customers.map((c) => c._id);
      query = { customer: { $in: customerIds }, status: { $ne: "Draft" } };
    } else {
      query = { user: req.businessId };
    }

    const quotations = await Quotation.find(query)
      .populate("customer", "name email phone address")
      .populate("user", "name email mobile")
      .sort({ createdAt: -1 });
    res.json(quotations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a quotation
// @route   POST /api/quotations
// @access  Private
export const createQuotation = async (req, res) => {
  if (req.user.role === "customer") {
    return res.status(403).json({ message: "Not authorized to create quotations" });
  }

  const { number, customer, date, items, status, total } = req.body;

  try {
    const quotation = new Quotation({
      user: req.businessId,
      number,
      customer,
      date,
      items,
      status: status || "Draft",
      total,
    });

    const createdQuotation = await quotation.save();
    
    // Log employee action
    await logEmployeeActivity(req, "Create Quotation", `Created quotation ${number}`);

    // Populate customer details before sending response
    const populated = await createdQuotation.populate("customer", "name email phone address");
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update quotation status
// @route   PUT /api/quotations/:id/status
// @access  Private
export const updateQuotationStatus = async (req, res) => {
  const { status } = req.body;

  try {
    let quotation;
    if (req.user.role === "customer") {
      // Customer can approve/reject their own quotation
      const customers = await Customer.find({ email: req.user.email });
      const customerIds = customers.map((c) => c._id);
      quotation = await Quotation.findOne({ _id: req.params.id, customer: { $in: customerIds } });
      
      if (quotation && !["Approved", "Rejected"].includes(status)) {
        return res.status(400).json({ message: "Customer can only approve or reject quotations" });
      }
    } else {
      quotation = await Quotation.findOne({ _id: req.params.id, user: req.businessId });
    }

    if (quotation) {
      const oldStatus = quotation.status;
      quotation.status = status;
      const updatedQuotation = await quotation.save();

      // Log employee action
      await logEmployeeActivity(
        req,
        "Update Quotation Status",
        `Updated status of quotation ${quotation.number} from ${oldStatus} to ${status}`
      );

      const populated = await updatedQuotation.populate("customer", "name email phone address");
      res.json(populated);
    } else {
      res.status(404).json({ message: "Quotation not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a quotation
// @route   DELETE /api/quotations/:id
// @access  Private
export const deleteQuotation = async (req, res) => {
  if (req.user.role === "customer") {
    return res.status(403).json({ message: "Not authorized to delete quotations" });
  }

  try {
    const quotation = await Quotation.findOneAndDelete({ _id: req.params.id, user: req.businessId });

    if (quotation) {
      // Log employee action
      await logEmployeeActivity(req, "Delete Quotation", `Deleted quotation ${quotation.number}`);
      res.json({ message: "Quotation removed" });
    } else {
      res.status(404).json({ message: "Quotation not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
