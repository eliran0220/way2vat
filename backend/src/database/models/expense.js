import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema({
  reportId: { type: String, required: true },
  company: { type: String, required: true },
  amount: { type: Number, required: true },
  category: {
    type: String,
    enum: ["Completed", "Failed", "Excluded"],
    required: true,
  },
  imageUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

ExpenseSchema.index({ reportId: 1 });

export default mongoose.model("Expense", ExpenseSchema);
