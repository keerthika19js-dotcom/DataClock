const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
  recordId: { type: String, required: true, unique: true },
  dataType: { type: String, required: true },
  dataCategory: { type: String, required: true },
  purpose: { type: String, required: true },
  purposeStatus: { type: String, enum: ['ACTIVE', 'COMPLETED', 'UNKNOWN'], default: 'ACTIVE' },
  sensitivity: { type: Number, min: 1, max: 5, required: true },
  collectionDate: { type: Date, required: true },
  lastAccessDate: { type: Date, required: true },
  usageFrequency: { type: String, enum: ['None', 'Low', 'Medium', 'High'], default: 'Low' },
  purposeCompleted: { type: Boolean, default: false },
  retentionPeriodDays: { type: Number, required: true },
  expiryDate: { type: Date, required: true },
  policyType: { type: String, default: 'Temporary' },
  organizationPolicy: { type: String, default: 'Review at retention threshold' },
  riskScore: { type: Number, min: 0, max: 100, default: 0 },
  riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW' },
  mlPrediction: { type: String, enum: ['RETAIN', 'REVIEW', 'EXPIRE'], default: 'REVIEW' },
  mlConfidence: { type: Number, default: 0 },
  status: { type: String, enum: ['ACTIVE', 'EXPIRING SOON', 'EXPIRED'], default: 'ACTIVE' },
  recommendedAction: { type: String, default: 'Review' },
  classificationExplanation: { type: String, default: '' },
  purposeJustification: { type: String, default: '' },
  mlExplanation: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Record', recordSchema);
