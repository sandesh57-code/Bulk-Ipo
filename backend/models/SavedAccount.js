const mongoose = require('mongoose');

const savedAccountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  nickname: { type: String, required: true, trim: true },
  fullName: { type: String, required: true, trim: true },
  boid: { type: String, required: true, trim: true },
  loginId: { type: String, required: true, trim: true },
  password: { type: String, required: true }, // AES encrypted
  bankName: { type: String, required: true, trim: true },
  crnNumber: { type: String, required: true, trim: true },
  dematNumber: { type: String, trim: true },
  mobileNumber: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  accountType: {
    type: String,
    enum: ['self', 'family', 'friend'],
    default: 'self',
  },
  isActive: { type: Boolean, default: true },
  lastChecked: { type: Date },
  tags: [{ type: String }],
  totalApplied: { type: Number, default: 0 },
  totalAllotted: { type: Number, default: 0 },
  totalAmountBlocked: { type: Number, default: 0 },
}, { timestamps: true });

savedAccountSchema.index({ user: 1, boid: 1 }, { unique: true });

module.exports = mongoose.model('SavedAccount', savedAccountSchema);
