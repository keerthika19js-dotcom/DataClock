const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: { type: String, enum: ['Expiry', 'High Risk', 'Review', 'System', 'ML Prediction'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  recordId: { type: String, default: null },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notification', notificationSchema);
