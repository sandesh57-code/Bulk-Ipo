const mongoose = require('mongoose');

const ipoSchema = new mongoose.Schema({
  companyName: { type: String, required: true, trim: true },
  companyCode: { type: String, trim: true },
  symbol: { type: String, trim: true },
  ipoType: {
    type: String,
    enum: ['IPO', 'FPO', 'RIGHT', 'DEBENTURE', 'MUTUAL_FUND'],
    default: 'IPO',
  },
  shareType: { type: String, enum: ['Ordinary', 'Preference'], default: 'Ordinary' },
  openingDate: { type: Date, required: true },
  closingDate: { type: Date, required: true },
  issueManager: { type: String, trim: true },
  sharePrice: { type: Number, required: true },
  minQuantity: { type: Number, required: true, default: 10 },
  maxQuantity: { type: Number },
  totalUnits: { type: Number },
  totalAmount: { type: Number },
  sector: { type: String, trim: true },
  description: { type: String },
  prospectusUrl: { type: String },
  logo: { type: String },
  status: {
    type: String,
    enum: ['upcoming', 'open', 'closed', 'result_published', 'allotment_done'],
    default: 'upcoming',
  },
  resultDate: { type: Date },
  isMeroShareEnabled: { type: Boolean, default: true },
  shareGroupId: { type: Number },
  companyShareId: { type: Number },
  brlmsId: { type: Number },
  meroshareCompanyId: { type: Number },
  isActive: { type: Boolean, default: true },
  applicationsCount: { type: Number, default: 0 },
  oversubscriptionRatio: { type: Number, default: 0 },
}, { timestamps: true });

ipoSchema.index({ status: 1 });
ipoSchema.index({ openingDate: 1, closingDate: 1 });

module.exports = mongoose.model('IPO', ipoSchema);
