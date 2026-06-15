import Expense from "../models/Expense.js";

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user._id }).sort({ date: -1, createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create an expense
// @route   POST /api/expenses
// @access  Private
export const createExpense = async (req, res) => {
  const { date, category, amount, note } = req.body;

  try {
    const expense = new Expense({
      user: req.user._id,
      date,
      category,
      amount,
      note,
    });

    const createdExpense = await expense.save();
    res.status(201).json(createdExpense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (expense) {
      res.json({ message: "Expense removed" });
    } else {
      res.status(404).json({ message: "Expense not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
