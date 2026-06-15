import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["Laptop", "Accessory", "Desktop", "Service", "Other"],
      default: "Laptop",
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    gst: {
      type: Number,
      required: true,
      default: 18,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
