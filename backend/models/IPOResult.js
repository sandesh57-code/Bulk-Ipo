const mongoose = require('mongoose');

const ipoResultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'SavedAccount', required: true },
  ipo: { type: mongoose.Schema.Types.ObjectId, ref: 'IPO', required: true },
  application: { type: mongoose.Schema.Types.ObjectId, ref: 'IPOApplication' },
  appliedQuantity: { type: Number, default: 0 },
  allottedQuantity: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['allotted', 'not_allotted', 'pending', 'partial'],
    default: 'pending',
  },
  refundStatus: {
    type: String,
    enum: ['refunded', 'not_refunded', 'pending', 'partial'],
    default: 'pending',
  },
  refundAmount: { type: Number, default: 0 },
  resultDate: { type: Date },
  checkedAt: { type: Date, default: Date.now },
  meroshareResultData: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

ipoResultSchema.index({ user: 1, ipo: 1, account: 1 }, { unique: true });
ipoResultSchema.index({ status: 1 });

module.exports = mongoose.model('IPOResult', ipoResultSchema);
