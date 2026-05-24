const mongoose = require('mongoose');

const ipoApplicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'SavedAccount', required: true },
  ipo: { type: mongoose.Schema.Types.ObjectId, ref: 'IPO', required: true },
  appliedQuantity: { type: Number, required: true },
  appliedAmount: { type: Number, required: true },
  applicationNumber: { type: String },
  status: {
    type: String,
    enum: ['pending', 'applied', 'verified', 'unverified', 'rejected', 'failed', 'amount_blocked', 'error'],
    default: 'pending',
  },
  bankResponse: { type: String },
  errorMessage: { type: String },
  blockedAmount: { type: Number, default: 0 },
  appliedAt: { type: Date, default: Date.now },
  verifiedAt: { type: Date },
  retryCount: { type: Number, default: 0 },
  lastRetryAt: { type: Date },
  meroshareResponse: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  batchId: { type: String },
}, { timestamps: true });

ipoApplicationSchema.index({ user: 1, ipo: 1, account: 1 });
ipoApplicationSchema.index({ batchId: 1 });
ipoApplicationSchema.index({ status: 1 });

module.exports = mongoose.model('IPOApplication', ipoApplicationSchema);
