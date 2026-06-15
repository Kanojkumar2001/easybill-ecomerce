import Invoice from "../models/Invoice.js";
import Payment from "../models/Payment.js";
import Expense from "../models/Expense.js";

// Helper to filter documents by date string
const dateRangeFilter = (from, to) => {
  const query = {};
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = from;
    if (to) query.date.$lte = to;
  }
  return query;
};

// @desc    Get sales report
// @route   GET /api/reports/sales
// @access  Private
export const getSalesReport = async (req, res) => {
  const { from, to } = req.query;
  try {
    const filter = { user: req.user._id, ...dateRangeFilter(from, to) };
    const invoices = await Invoice.find(filter)
      .populate("customer", "name")
      .sort({ date: -1 });

    const totalSales = invoices.reduce((s, i) => s + i.total, 0);

    res.json({
      totalSales,
      invoices: invoices.map((i) => ({
        id: i._id,
        number: i.number,
        date: i.date,
        customerName: i.customer?.name || "—",
        subtotal: i.subtotal,
        gst: i.cgst + i.sgst,
        total: i.total,
        status: i.status,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get payments report
// @route   GET /api/reports/payments
// @access  Private
export const getPaymentsReport = async (req, res) => {
  const { from, to } = req.query;
  try {
    const filter = { user: req.user._id, ...dateRangeFilter(from, to) };
    const payments = await Payment.find(filter)
      .populate("invoiceId", "number total status")
      .sort({ date: -1 });

    const totalPaid = payments.reduce((s, p) => s + p.amount, 0);

    // Calculate pending from invoices in range
    const invoiceFilter = { user: req.user._id, ...dateRangeFilter(from, to), status: { $ne: "Paid" } };
    const pendingInvoices = await Invoice.find(invoiceFilter);
    const totalPending = pendingInvoices.reduce((s, i) => s + i.total, 0);

    res.json({
      totalPaid,
      totalPending,
      payments: payments.map((p) => ({
        id: p._id,
        date: p.date,
        invoiceNumber: p.invoiceId?.number || "—",
        method: p.method,
        amount: p.amount,
        note: p.note,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get expenses report
// @route   GET /api/reports/expenses
// @access  Private
export const getExpensesReport = async (req, res) => {
  const { from, to } = req.query;
  try {
    const filter = { user: req.user._id, ...dateRangeFilter(from, to) };
    const expenses = await Expense.find(filter).sort({ date: -1 });
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

    res.json({
      totalExpenses,
      expenses,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get profit and loss report
// @route   GET /api/reports/profit
// @access  Private
export const getProfitReport = async (req, res) => {
  const { from, to } = req.query;
  try {
    const userId = req.user._id;
    const filter = dateRangeFilter(from, to);

    const [invoices, expenses] = await Promise.all([
      Invoice.find({ user: userId, ...filter }),
      Expense.find({ user: userId, ...filter }),
    ]);

    const sales = invoices.reduce((s, i) => s + i.total, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const profit = sales - totalExpenses;

    res.json({
      sales,
      expenses: totalExpenses,
      profit,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
