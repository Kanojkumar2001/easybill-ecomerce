import Product from "../models/Product.js";
import { logEmployeeActivity } from "../utils/activityLogger.js";

// @desc    Get all products
// @route   GET /api/products
// @access  Private
export const getProducts = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "customer") {
      const customers = await Customer.find({ email: req.user.email });
      if (customers.length > 0) {
        const businessOwnerIds = customers.map((c) => c.user);
        query = { user: { $in: businessOwnerIds } };
      } else {
        query = {}; // Show all products if not associated with a specific business
      }
    } else {
      query = { user: req.businessId };
    }
    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private
export const createProduct = async (req, res) => {
  if (req.user.role === "customer") {
    return res.status(403).json({ message: "Not authorized to create products" });
  }

  const { name, category, price, stock, gst } = req.body;

  try {
    const product = new Product({
      user: req.businessId,
      name,
      category,
      price,
      stock,
      gst,
    });

    const createdProduct = await product.save();

    // Log employee action
    await logEmployeeActivity(req, "Create Product", `Created product ${name}`);

    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private
export const updateProduct = async (req, res) => {
  if (req.user.role === "customer") {
    return res.status(403).json({ message: "Not authorized to update products" });
  }

  const { name, category, price, stock, gst } = req.body;

  try {
    const product = await Product.findOne({ _id: req.params.id, user: req.businessId });

    if (product) {
      product.name = name ?? product.name;
      product.category = category ?? product.category;
      product.price = price !== undefined ? price : product.price;
      product.stock = stock !== undefined ? stock : product.stock;
      product.gst = gst !== undefined ? gst : product.gst;

      const updatedProduct = await product.save();

      // Log employee action
      await logEmployeeActivity(req, "Update Product", `Updated product ${product.name}`);

      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private
export const deleteProduct = async (req, res) => {
  if (req.user.role === "customer") {
    return res.status(403).json({ message: "Not authorized to delete products" });
  }

  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, user: req.businessId });

    if (product) {
      // Log employee action
      await logEmployeeActivity(req, "Delete Product", `Deleted product ${product.name}`);
      res.json({ message: "Product removed" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
