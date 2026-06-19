import Payment from "../models/Payment.js";
import Invoice from "../models/Invoice.js";
import Customer from "../models/Customer.js";
import { logEmployeeActivity } from "../utils/activityLogger.js";

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
export const getPayments = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "customer") {
      const customers = await Customer.find({ email: req.user.email });
      const customerIds = customers.map((c) => c._id);
      const invoices = await Invoice.find({ customer: { $in: customerIds } });
      const invoiceIds = invoices.map((i) => i._id);
      query = { invoiceId: { $in: invoiceIds } };
    } else {
      query = { user: req.businessId };
    }

    const payments = await Payment.find(query)
      .populate({
        path: "invoiceId",
        select: "number total status customer",
        populate: { path: "customer", select: "name email" }
      })
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Record a payment
// @route   POST /api/payments
// @access  Private
export const createPayment = async (req, res) => {
  const { invoiceId, date, amount, method, note } = req.body;

  try {
    let invoice;
    let paymentUserId;

    if (req.user.role === "customer") {
      // Find invoice and verify it belongs to this customer
      const customers = await Customer.find({ email: req.user.email });
      const customerIds = customers.map((c) => c._id);
      invoice = await Invoice.findOne({ _id: invoiceId, customer: { $in: customerIds } });
      if (!invoice) {
        return res.status(403).json({ message: "Not authorized to pay for this invoice" });
      }
      paymentUserId = invoice.user; // Payment goes into the Admin's business
    } else {
      invoice = await Invoice.findOne({ _id: invoiceId, user: req.businessId });
      paymentUserId = req.businessId;
    }

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const payment = new Payment({
      user: paymentUserId,
      invoiceId,
      date,
      amount,
      method,
      note: note || (req.user.role === "customer" ? "Paid by customer online" : ""),
    });

    const createdPayment = await payment.save();

    // Update the invoice status to "Paid"
    invoice.status = "Paid";
    await invoice.save();

    // Log employee action
    await logEmployeeActivity(
      req,
      "Record Payment",
      `Recorded payment of ${amount} for invoice ${invoice.number}`
    );

    const populated = await createdPayment.populate({
      path: "invoiceId",
      select: "number total status customer",
      populate: { path: "customer", select: "name" }
    });

    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
