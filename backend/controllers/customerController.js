import Customer from "../models/Customer.js";

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
export const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a customer
// @route   POST /api/customers
// @access  Private
export const createCustomer = async (req, res) => {
  const { name, phone, email, address } = req.body;

  try {
    const customer = new Customer({
      user: req.user._id,
      name,
      phone,
      email,
      address,
    });

    const createdCustomer = await customer.save();
    res.status(201).json(createdCustomer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Private
export const updateCustomer = async (req, res) => {
  const { name, phone, email, address } = req.body;

  try {
    const customer = await Customer.findOne({ _id: req.params.id, user: req.user._id });

    if (customer) {
      customer.name = name ?? customer.name;
      customer.phone = phone ?? customer.phone;
      customer.email = email ?? customer.email;
      customer.address = address ?? customer.address;

      const updatedCustomer = await customer.save();
      res.json(updatedCustomer);
    } else {
      res.status(404).json({ message: "Customer not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a customer
// @route   DELETE /api/customers/:id
// @access  Private
export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (customer) {
      res.json({ message: "Customer removed" });
    } else {
      res.status(404).json({ message: "Customer not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
