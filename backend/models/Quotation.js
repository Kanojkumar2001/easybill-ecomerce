import mongoose from "mongoose";

const quotationItemSchema = new mongoose.Schema({
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

const quotationSchema = new mongoose.Schema(
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
    items: [quotationItemSchema],
    status: {
      type: String,
      required: true,
      enum: ["Draft", "Approved", "Rejected"],
      default: "Draft",
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

const Quotation = mongoose.model("Quotation", quotationSchema);
export default Quotation;
