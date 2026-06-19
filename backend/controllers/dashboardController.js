import Invoice from "../models/Invoice.js";
import Payment from "../models/Payment.js";
import Expense from "../models/Expense.js";
import Customer from "../models/Customer.js";
import Quotation from "../models/Quotation.js";

// @desc    Get dashboard metrics and graphs
// @route   GET /api/dashboard
// @access  Private
export const getDashboardData = async (req, res) => {
  try {
    const role = req.user.role;

    if (role === "customer") {
      // Find customer records matching this user's email
      const customers = await Customer.find({ email: req.user.email });
      const customerIds = customers.map((c) => c._id);

      const [invoices, quotations] = await Promise.all([
        Invoice.find({ customer: { $in: customerIds } }).populate("customer", "name").sort({ createdAt: -1 }),
        Quotation.find({ customer: { $in: customerIds }, status: { $ne: "Draft" } }).populate("customer", "name").sort({ createdAt: -1 }),
      ]);

      const invoiceIds = invoices.map((i) => i._id);
      const payments = await Payment.find({ invoiceId: { $in: invoiceIds } })
        .populate({
          path: "invoiceId",
          select: "number total status customer",
          populate: { path: "customer", select: "name" }
        })
        .sort({ createdAt: -1 });

      const pendingAmount = invoices
        .filter((i) => i.status !== "Paid")
        .reduce((s, i) => s + i.total, 0);

      const activeQuotationsCount = quotations.filter((q) => q.status === "Draft" || q.status === "Approved").length;

      res.json({
        role,
        activeQuotationsCount,
        invoicesCount: invoices.length,
        pendingAmount,
        paymentsReceived: payments.reduce((s, p) => s + p.amount, 0),
        recentInvoices: invoices.slice(0, 5).map((i) => ({
          id: i._id,
          number: i.number,
          date: i.date,
          total: i.total,
          status: i.status,
          customerName: i.customer?.name || "—",
        })),
        recentPayments: payments.slice(0, 5).map((p) => ({
          id: p._id,
          date: p.date,
          invoiceNumber: p.invoiceId?.number || "—",
          amount: p.amount,
          method: p.method,
        })),
        recentQuotations: quotations.slice(0, 5).map((q) => ({
          id: q._id,
          number: q.number,
          date: q.date,
          total: q.total,
          status: q.status,
        })),
      });
      return;
    }

    const userId = req.businessId;

    if (role === "employee") {
      // Fetch stats for Employee dashboard (scoped to the business)
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const startOfDay = new Date();
      startOfDay.setHours(0,0,0,0);

      const [customersCount, todayInvoices, todayQuotations, todayPayments, pendingInvoices] = await Promise.all([
        Customer.countDocuments({ user: userId }),
        Invoice.find({ user: userId, createdAt: { $gte: startOfDay } }),
        Quotation.find({ user: userId, createdAt: { $gte: startOfDay } }),
        Payment.find({ user: userId, createdAt: { $gte: startOfDay } }),
        Invoice.find({ user: userId, status: { $ne: "Paid" } }),
      ]);

      const paymentCollections = todayPayments.reduce((s, p) => s + p.amount, 0);
      const pendingPaymentsTotal = pendingInvoices.reduce((s, i) => s + i.total, 0);

      res.json({
        role,
        assignedCustomersCount: customersCount,
        todayInvoicesCount: todayInvoices.length,
        todayQuotationsCount: todayQuotations.length,
        paymentCollections,
        pendingPaymentsTotal,
        recentInvoices: todayInvoices.slice(0, 5).map((i) => ({
          id: i._id,
          number: i.number,
          date: i.date,
          total: i.total,
          status: i.status,
        })),
      });
      return;
    }

    // Admin Dashboard (original logic scoped to businessId)
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
      role,
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
