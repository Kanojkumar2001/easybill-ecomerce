import Payment from "../models/Payment.js";
import Invoice from "../models/Invoice.js";

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
export const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate({
        path: "invoiceId",
        select: "number total status customer",
        populate: { path: "customer", select: "name" }
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
    const payment = new Payment({
      user: req.user._id,
      invoiceId,
      date,
      amount,
      method,
      note,
    });

    const createdPayment = await payment.save();

    // Update the invoice status to "Paid"
    const invoice = await Invoice.findOne({ _id: invoiceId, user: req.user._id });
    if (invoice) {
      invoice.status = "Paid";
      await invoice.save();
    }

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
