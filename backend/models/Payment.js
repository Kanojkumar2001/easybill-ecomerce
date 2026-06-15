import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    method: {
      type: String,
      required: true,
      enum: ["UPI", "Cash", "Bank Transfer", "Credit Card"],
      default: "UPI",
    },
    note: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
