import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  reportId: { type: String, required: true },
  company: { type: String, required: true },
  totalAmountCompleted: { type: Number, required: true, default: 0 },
  expenseCount: { type: Number, required: true, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ReportSchema.index({ company: 1, reportId: 1 });

export default mongoose.model('Report', ReportSchema);