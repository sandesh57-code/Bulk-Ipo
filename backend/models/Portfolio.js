const mongoose = require('mongoose');

const holdingSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  symbol: { type: String },
  isin: { type: String },
  quantity: { type: Number, default: 0 },
  previousClosingPrice: { type: Number, default: 0 },
  lastTransactionPrice: { type: Number, default: 0 },
  wacc: { type: Number, default: 0 }, // Weighted Average Cost of Capital
  totalCost: { type: Number, default: 0 },
  currentValue: { type: Number, default: 0 },
  profitLoss: { type: Number, default: 0 },
  profitLossPercent: { type: Number, default: 0 },
  sector: { type: String },
}, { _id: false });

const portfolioSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'SavedAccount', required: true },
  holdings: [holdingSchema],
  totalInvestment: { type: Number, default: 0 },
  currentValue: { type: Number, default: 0 },
  totalProfitLoss: { type: Number, default: 0 },
  totalProfitLossPercent: { type: Number, default: 0 },
  totalHoldings: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  dividendHistory: [{
    companyName: String,
    year: Number,
    dividendType: { type: String, enum: ['cash', 'bonus', 'stock'] },
    amount: Number,
    shares: Number,
    date: Date,
  }],
  transactionHistory: [{
    companyName: String,
    symbol: String,
    transactionType: { type: String, enum: ['buy', 'sell', 'bonus', 'right', 'ipo'] },
    quantity: Number,
    price: Number,
    amount: Number,
    date: Date,
    description: String,
  }],
}, { timestamps: true });

portfolioSchema.index({ user: 1, account: 1 }, { unique: true });

module.exports = mongoose.model('Portfolio', portfolioSchema);
