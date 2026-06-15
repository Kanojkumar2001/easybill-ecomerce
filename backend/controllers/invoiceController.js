import Invoice from "../models/Invoice.js";

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user._id })
      .populate("customer", "name email phone address")
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create an invoice
// @route   POST /api/invoices
// @access  Private
export const createInvoice = async (req, res) => {
  const { number, customer, date, items, subtotal, cgst, sgst, total, status } = req.body;

  try {
    const invoice = new Invoice({
      user: req.user._id,
      number,
      customer,
      date,
      items,
      subtotal,
      cgst,
      sgst,
      total,
      status: status || "Pending",
    });

    const createdInvoice = await invoice.save();
    const populated = await createdInvoice.populate("customer", "name email phone address");
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update invoice status
// @route   PUT /api/invoices/:id/status
// @access  Private
export const updateInvoiceStatus = async (req, res) => {
  const { status } = req.body;

  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id });

    if (invoice) {
      invoice.status = status;
      const updatedInvoice = await invoice.save();
      const populated = await updatedInvoice.populate("customer", "name email phone address");
      res.json(populated);
    } else {
      res.status(404).json({ message: "Invoice not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete an invoice
// @route   DELETE /api/invoices/:id
// @access  Private
export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (invoice) {
      res.json({ message: "Invoice removed" });
    } else {
      res.status(404).json({ message: "Invoice not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
