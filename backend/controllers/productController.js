import Product from "../models/Product.js";

// @desc    Get all products
// @route   GET /api/products
// @access  Private
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private
export const createProduct = async (req, res) => {
  const { name, category, price, stock, gst } = req.body;

  try {
    const product = new Product({
      user: req.user._id,
      name,
      category,
      price,
      stock,
      gst,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private
export const updateProduct = async (req, res) => {
  const { name, category, price, stock, gst } = req.body;

  try {
    const product = await Product.findOne({ _id: req.params.id, user: req.user._id });

    if (product) {
      product.name = name ?? product.name;
      product.category = category ?? product.category;
      product.price = price !== undefined ? price : product.price;
      product.stock = stock !== undefined ? stock : product.stock;
      product.gst = gst !== undefined ? gst : product.gst;

      const updatedProduct = await product.save();
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
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (product) {
      res.json({ message: "Product removed" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
