const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['ipo_open', 'ipo_close', 'ipo_result', 'application_success', 'application_failure', 'portfolio_update', 'bank_verification', 'system', 'announcement'],
    default: 'system',
  },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  link: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  icon: { type: String },
}, { timestamps: true });

notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
