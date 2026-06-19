import Invoice from "../models/Invoice.js";
import Customer from "../models/Customer.js";
import Product from "../models/Product.js";
import { logEmployeeActivity } from "../utils/activityLogger.js";

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
export const getInvoices = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "customer") {
      const customers = await Customer.find({ email: req.user.email });
      const customerIds = customers.map((c) => c._id);
      query = { customer: { $in: customerIds } };
    } else {
      query = { user: req.businessId };
    }

    const invoices = await Invoice.find(query)
      .populate("customer", "name email phone address")
      .populate("user", "name email mobile")
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
  try {
    if (req.user.role === "customer") {
      const { items } = req.body;
      if (!items || !items.length) {
        return res.status(400).json({ message: "No items specified in checkout" });
      }

      const customerRecord = await Customer.findOne({ email: req.user.email });
      if (!customerRecord) {
        return res.status(400).json({ 
          message: "No customer profile found matching your account email. Please ask an administrator to add you as a customer first." 
        });
      }

      let subtotal = 0;
      let cgst = 0;
      let sgst = 0;
      let total = 0;
      const resolvedItems = [];
      let businessId = null;

      for (const item of items) {
        const prod = await Product.findById(item.productId);
        if (!prod) {
          return res.status(404).json({ message: `Product not found` });
        }
        if (prod.stock < item.qty) {
          return res.status(400).json({ 
            message: `Insufficient stock for product ${prod.name}. Only ${prod.stock} items left.` 
          });
        }
        
        businessId = prod.user;

        const itemSubtotal = prod.price * item.qty;
        const itemTax = itemSubtotal * (prod.gst / 100);

        resolvedItems.push({
          productId: prod._id,
          name: prod.name,
          qty: item.qty,
          price: prod.price,
          gst: prod.gst
        });

        subtotal += itemSubtotal;
        cgst += itemTax / 2;
        sgst += itemTax / 2;
        total += itemSubtotal + itemTax;

        prod.stock -= item.qty;
        await prod.save();
      }

      const invoiceCount = await Invoice.countDocuments({ user: businessId });
      const number = `INV-${1000 + invoiceCount + 1}`;

      const invoice = new Invoice({
        user: businessId,
        number,
        customer: customerRecord._id,
        date: new Date().toISOString().slice(0, 10),
        items: resolvedItems,
        subtotal,
        cgst,
        sgst,
        total,
        status: "Pending",
      });

      const createdInvoice = await invoice.save();
      const populated = await createdInvoice.populate("customer", "name email phone address");
      return res.status(201).json(populated);
    }

    // Admin / Employee flow
    const { number, customer, date, items, subtotal, cgst, sgst, total, status } = req.body;

    const invoice = new Invoice({
      user: req.businessId,
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
    
    // Log employee action
    await logEmployeeActivity(req, "Create Invoice", `Created invoice ${number}`);

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
  if (req.user.role === "customer") {
    return res.status(403).json({ message: "Not authorized to update invoice status" });
  }

  const { status } = req.body;

  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, user: req.businessId });

    if (invoice) {
      const oldStatus = invoice.status;
      invoice.status = status;
      const updatedInvoice = await invoice.save();

      // Log employee action
      await logEmployeeActivity(
        req,
        "Update Invoice Status",
        `Updated status of invoice ${invoice.number} from ${oldStatus} to ${status}`
      );

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
  if (req.user.role === "customer") {
    return res.status(403).json({ message: "Not authorized to delete invoices" });
  }

  try {
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, user: req.businessId });

    if (invoice) {
      // Log employee action
      await logEmployeeActivity(req, "Delete Invoice", `Deleted invoice ${invoice.number}`);
      res.json({ message: "Invoice removed" });
    } else {
      res.status(404).json({ message: "Invoice not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
