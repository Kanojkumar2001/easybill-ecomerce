import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  qty: {
    type: Number,
    required: true,
    default: 1,
  },
  price: {
    type: Number,
    required: true,
    default: 0,
  },
  gst: {
    type: Number,
    required: true,
    default: 18,
  },
});

const invoiceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    number: {
      type: String,
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Customer",
    },
    date: {
      type: String,
      required: true,
    },
    items: [invoiceItemSchema],
    status: {
      type: String,
      required: true,
      enum: ["Paid", "Pending", "Overdue"],
      default: "Pending",
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    cgst: {
      type: Number,
      required: true,
      default: 0,
    },
    sgst: {
      type: Number,
      required: true,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
