import Invoice from "../models/Invoice.js";
import Payment from "../models/Payment.js";
import Expense from "../models/Expense.js";
import Customer from "../models/Customer.js";

// @desc    Get dashboard metrics and graphs
// @route   GET /api/dashboard
// @access  Private
export const getDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch collections in parallel
    const [invoices, payments, expenses, customers] = await Promise.all([
      Invoice.find({ user: userId }),
      Payment.find({ user: userId }),
      Expense.find({ user: userId }),
      Customer.find({ user: userId }),
    ]);

    // Basic Metrics
    const totalSales = invoices.reduce((s, i) => s + i.total, 0);
    const paymentsReceived = payments.reduce((s, p) => s + p.amount, 0);
    const pendingPayments = invoices
      .filter((i) => i.status !== "Paid")
      .reduce((s, i) => s + i.total, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const businessProfit = totalSales - totalExpenses;

    // Monthly Data
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyData = months.map((m, idx) => {
      const sales = invoices
        .filter((i) => {
          if (!i.date) return false;
          const date = new Date(i.date);
          return date.getMonth() === idx && !isNaN(date.getTime());
        })
        .reduce((s, i) => s + i.total, 0);

      const exp = expenses
        .filter((e) => {
          if (!e.date) return false;
          const date = new Date(e.date);
          return date.getMonth() === idx && !isNaN(date.getTime());
        })
        .reduce((s, e) => s + e.amount, 0);

      return { month: m, sales, expenses: exp };
    });

    // Payment Status Counts
    const statusData = [
      { name: "Paid", value: invoices.filter((i) => i.status === "Paid").length },
      { name: "Pending", value: invoices.filter((i) => i.status === "Pending").length },
      { name: "Overdue", value: invoices.filter((i) => i.status === "Overdue").length },
    ];

    // Recent Invoices (limit to 6)
    const recentInvoices = await Invoice.find({ user: userId })
      .populate("customer", "name")
      .sort({ createdAt: -1 })
      .limit(6);

    res.json({
      totalSales,
      totalCustomers: customers.length,
      totalInvoices: invoices.length,
      paymentsReceived,
      pendingPayments,
      totalExpenses,
      businessProfit,
      monthlyData,
      statusData,
      recentInvoices: recentInvoices.map((i) => ({
        id: i._id,
        number: i.number,
        date: i.date,
        total: i.total,
        status: i.status,
        customerName: i.customer?.name || "—",
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
