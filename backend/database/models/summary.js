import mongoose from "mongoose";

const ExpenseSummarySchema = new mongoose.Schema({
  totalReports: { type: Number, default: 0 },
  completedCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  excludedCount: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

export default mongoose.model("ExpenseSummaryReport", ExpenseSummarySchema);