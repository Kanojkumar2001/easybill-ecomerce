import Customer from "../models/Customer.js";
import { logEmployeeActivity } from "../utils/activityLogger.js";

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
export const getCustomers = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "customer") {
      query = { email: req.user.email };
    } else {
      query = { user: req.businessId };
    }
    const customers = await Customer.find(query).sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a customer
// @route   POST /api/customers
// @access  Private
export const createCustomer = async (req, res) => {
  if (req.user.role === "customer") {
    return res.status(403).json({ message: "Not authorized to create customers" });
  }

  const { name, phone, email, address } = req.body;

  try {
    const customer = new Customer({
      user: req.businessId,
      name,
      phone,
      email,
      address,
    });

    const createdCustomer = await customer.save();
    
    // Log employee action
    await logEmployeeActivity(req, "Create Customer", `Created customer ${name}`);

    res.status(201).json(createdCustomer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Private
export const updateCustomer = async (req, res) => {
  if (req.user.role === "customer") {
    return res.status(403).json({ message: "Not authorized to update customers" });
  }

  const { name, phone, email, address } = req.body;

  try {
    const customer = await Customer.findOne({ _id: req.params.id, user: req.businessId });

    if (customer) {
      customer.name = name ?? customer.name;
      customer.phone = phone ?? customer.phone;
      customer.email = email ?? customer.email;
      customer.address = address ?? customer.address;

      const updatedCustomer = await customer.save();

      // Log employee action
      await logEmployeeActivity(req, "Update Customer", `Updated customer ${customer.name}`);

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
  if (req.user.role === "customer") {
    return res.status(403).json({ message: "Not authorized to delete customers" });
  }

  try {
    const customer = await Customer.findOneAndDelete({ _id: req.params.id, user: req.businessId });

    if (customer) {
      // Log employee action
      await logEmployeeActivity(req, "Delete Customer", `Deleted customer ${customer.name}`);
      res.json({ message: "Customer removed" });
    } else {
      res.status(404).json({ message: "Customer not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
