import Quotation from "../models/Quotation.js";

// @desc    Get all quotations
// @route   GET /api/quotations
// @access  Private
export const getQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.find({ user: req.user._id })
      .populate("customer", "name email phone address")
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
  const { number, customer, date, items, status, total } = req.body;

  try {
    const quotation = new Quotation({
      user: req.user._id,
      number,
      customer,
      date,
      items,
      status: status || "Draft",
      total,
    });

    const createdQuotation = await quotation.save();
    
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
    const quotation = await Quotation.findOne({ _id: req.params.id, user: req.user._id });

    if (quotation) {
      quotation.status = status;
      const updatedQuotation = await quotation.save();
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
  try {
    const quotation = await Quotation.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (quotation) {
      res.json({ message: "Quotation removed" });
    } else {
      res.status(404).json({ message: "Quotation not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
