import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    date: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["Shop Rent", "Electricity Bill", "Internet Charges", "Salary", "Maintenance", "Other"],
      default: "Other",
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
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

const Expense = mongoose.model("Expense", expenseSchema);
export default Expense;
