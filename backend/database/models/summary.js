import mongoose from "mongoose";

const SummarySchema = new mongoose.Schema({
  Completed: { type: Number, required: true, default: 0 },
  Failed: { type: Number, required: true, default: 0 },
  Excluded: { type: Number, required: true, default: 0 },
  totalReports: { type: Number, required: true, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});


export default mongoose.model("Summary", SummarySchema);