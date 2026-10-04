require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Record = require('./models/Record');
const AuditLog = require('./models/AuditLog');
const Notification = require('./models/Notification');
const { generateSeedData } = require('./seed/seedDemoData');
const { callMLService } = require('./services/mlService');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const DB_MESSAGE = 'Database connection unavailable. Please check MONGO_URI.';
const ML_MESSAGE = 'ML service unavailable. Start the Python FastAPI service.';

function addDays(date, days) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

function diffDays(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.max(0, Math.ceil((b - a) / (1000 * 60 * 60 * 24)));
}

function getRiskLevel(score) {
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

function getStatusFromDate(expiryDate) {
  const today = new Date();
  const diff = Math.ceil((new Date(expiryDate) - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'EXPIRED';
  if (diff <= 7) return 'EXPIRING SOON';
  return 'ACTIVE';
}

function getRecommendedAction(status, purposeCompleted) {
  if (status === 'EXPIRED') return purposeCompleted ? 'Review → Anonymise / Delete' : 'Anonymise / Delete';
  if (status === 'EXPIRING SOON') return 'Review';
  if (purposeCompleted) return 'Retain with review';
  return 'Retain';
}

function calculateRiskScore(payload) {
  const sensitivity = Number(payload.sensitivity || 1);
  const dataAgeDays = Number(payload.dataAgeDays || 0);
  const daysSinceLastAccess = Number(payload.daysSinceLastAccess || 0);
  const purposeCompleted = Boolean(payload.purposeCompleted);
  const retentionPeriodDays = Number(payload.retentionPeriodDays || 30);
  const usageWeight = { None: 20, Low: 12, Medium: 6, High: 2 }[payload.usageFrequency || 'Low'];
  let score = sensitivity * 12;
  score += Math.min(35, dataAgeDays * 0.08);
  score += Math.min(25, daysSinceLastAccess * 0.12);
  score += purposeCompleted ? 18 : 0;
  score += usageWeight;
  score += Math.max(0, retentionPeriodDays - 90) * 0.04;
  score = Math.min(100, Math.max(5, Math.round(score)));
  return score;
}

function createAuditLog({ action, recordId = 'System', previousStatus = '', newStatus = '', reason = '', admin = 'Admin' }) {
  return AuditLog.create({
    admin,
    action,
    recordId,
    previousStatus,
    newStatus,
    reason,
  });
}

function createNotification({ type, title, message, recordId = null }) {
  return Notification.create({ type, title, message, recordId });
}

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dataclock');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
  }
}

async function ensureDB() {
  if (mongoose.connection.readyState !== 1) {
    throw new Error(DB_MESSAGE);
  }
}

app.get('/api/health', async (req, res) => {
  const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ status: 'ok', database: dbState, message: dbState === 'connected' ? 'Backend online' : DB_MESSAGE });
});

app.post('/api/auth/demo-login', async (req, res) => {
  const { email, password } = req.body || {};
  if (email === 'admin@dataclock.demo' && password === 'dataclock123') {
    return res.json({
      success: true,
      user: { id: 'admin-01', name: 'Admin', email },
      token: 'demo-token',
    });
  }
  return res.status(401).json({ message: 'Invalid demo credentials.' });
});

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    await ensureDB();

    const [totalRecords, activeRecords, expiringSoon, expiredRecords, highRiskRecords, statusDistribution, riskDistribution, typeDistribution, mlDistribution, timeline] = await Promise.all([
      Record.countDocuments(),
      Record.countDocuments({ status: 'ACTIVE' }),
      Record.countDocuments({ status: 'EXPIRING SOON' }),
      Record.countDocuments({ status: 'EXPIRED' }),
      Record.countDocuments({ riskLevel: 'HIGH' }),
      Record.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Record.aggregate([{ $group: { _id: '$riskLevel', count: { $sum: 1 } } }]),
      Record.aggregate([{ $group: { _id: '$dataType', count: { $sum: 1 } } }]),
      Record.aggregate([{ $group: { _id: '$mlPrediction', count: { $sum: 1 } } }]),
      Record.find({ status: { $in: ['EXPIRING SOON', 'EXPIRED'] } }).sort({ expiryDate: 1 }).limit(8).lean(),
    ]);

    const stats = {
      totalRecords,
      active: activeRecords,
      expiringSoon,
      expired: expiredRecords,
      highRisk: highRiskRecords,
      data: {
        statusDistribution: statusDistribution.map((item) => ({ name: item._id, value: item.count })),
        riskDistribution: riskDistribution.map((item) => ({ name: item._id, value: item.count })),
        typeDistribution: typeDistribution.map((item) => ({ name: item._id, value: item.count })),
        mlDistribution: mlDistribution.map((item) => ({ name: item._id, value: item.count })),
        expiryTimeline: timeline.map((item) => ({
          name: item.recordId,
          expiryDate: item.expiryDate,
          daysRemaining: Math.ceil((new Date(item.expiryDate) - new Date()) / 86400000),
          risk: item.riskScore,
        })),
      },
    };

    res.json(stats);
  } catch (error) {
    res.status(503).json({ message: error.message || DB_MESSAGE });
  }
});

app.get('/api/records', async (req, res) => {
  try {
    await ensureDB();
    const {
      q = '',
      status,
      dataType,
      sensitivity,
      purpose,
      riskLevel,
      prediction,
      sortBy = 'riskScore',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (dataType) filters.dataType = dataType;
    if (sensitivity) filters.sensitivity = Number(sensitivity);
    if (purpose) filters.purpose = purpose;
    if (riskLevel) filters.riskLevel = riskLevel;
    if (prediction) filters.mlPrediction = prediction;

    if (q) {
      filters.$or = [
        { recordId: { $regex: q, $options: 'i' } },
        { dataType: { $regex: q, $options: 'i' } },
        { purpose: { $regex: q, $options: 'i' } },
      ];
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const total = await Record.countDocuments(filters);
    const records = await Record.find(filters).sort(sort).skip((Number(page) - 1) * Number(limit)).limit(Number(limit)).lean();

    res.json({ records, page: Number(page), limit: Number(limit), total, totalPages: Math.max(1, Math.ceil(total / Number(limit))) });
  } catch (error) {
    res.status(503).json({ message: error.message || DB_MESSAGE });
  }
});

app.get('/api/records/:id', async (req, res) => {
  try {
    await ensureDB();
    const record = await Record.findOne({ recordId: req.params.id }).lean();
    if (!record) return res.status(404).json({ message: 'Record not found.' });
    return res.json(record);
  } catch (error) {
    return res.status(503).json({ message: error.message || DB_MESSAGE });
  }
});

app.post('/api/records', async (req, res) => {
  try {
    await ensureDB();
    const body = req.body || {};
    if (!body.dataType || !body.purpose || !body.dataCategory || !body.retentionPeriodDays) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const collectionDate = body.collectionDate ? new Date(body.collectionDate) : new Date();
    const lastAccessDate = body.lastAccessDate ? new Date(body.lastAccessDate) : new Date();
    const retentionPeriodDays = Number(body.retentionPeriodDays || 30);
    const expiryDate = addDays(collectionDate, retentionPeriodDays);
    const riskScore = calculateRiskScore({
      sensitivity: body.sensitivity || 3,
      dataAgeDays: diffDays(collectionDate, new Date()),
      daysSinceLastAccess: diffDays(lastAccessDate, new Date()),
      purposeCompleted: body.purposeCompleted,
      retentionPeriodDays,
      usageFrequency: body.usageFrequency || 'Low',
    });
    const recordId = `DCL-${Date.now().toString().slice(-6)}`;
    const mlPayload = {
      data_type: body.dataCategory,
      sensitivity: Number(body.sensitivity || 3),
      purpose: body.purpose,
      data_age_days: diffDays(collectionDate, new Date()),
      days_since_last_access: diffDays(lastAccessDate, new Date()),
      usage_frequency: body.usageFrequency || 'Low',
      purpose_completed: !!body.purposeCompleted,
      retention_period_days: retentionPeriodDays,
      policy_type: body.policyType || 'Temporary',
      risk_score: riskScore,
    };

    let mlResponse;
    try {
      mlResponse = await callMLService('/predict', mlPayload);
    } catch (error) {
      return res.status(503).json({ message: ML_MESSAGE, error: error.message });
    }

    const honorStatus = getStatusFromDate(expiryDate);
    const mlPrediction = mlResponse.prediction || 'REVIEW';
    const recommendedAction = getRecommendedAction(mlPrediction === 'EXPIRE' ? 'EXPIRED' : honorStatus, Boolean(body.purposeCompleted));

    const record = await Record.create({
      recordId,
      dataType: body.dataType,
      dataCategory: body.dataCategory,
      purpose: body.purpose,
      purposeStatus: body.purposeCompleted ? 'COMPLETED' : 'ACTIVE',
      sensitivity: Number(body.sensitivity || 3),
      collectionDate,
      lastAccessDate,
      usageFrequency: body.usageFrequency || 'Low',
      purposeCompleted: Boolean(body.purposeCompleted),
      retentionPeriodDays,
      expiryDate,
      policyType: body.policyType || 'Temporary',
      organizationPolicy: body.organizationPolicy || 'Retention aligns with policy and purpose completion.',
      riskScore,
      riskLevel: getRiskLevel(riskScore),
      mlPrediction,
      mlConfidence: mlResponse.confidence || 0,
      status: honorStatus,
      recommendedAction,
      classificationExplanation: `"${body.dataCategory}" is classified as ${body.dataType.toLowerCase()} data with ${body.sensitivity >= 4 ? 'high' : 'moderate'} sensitivity because it supports operational or compliance decisions.`,
      purposeJustification: `${body.purpose} remains ${body.purposeCompleted ? 'completed and should be reviewed' : 'active and still justified'} for the current retention policy.`,
      mlExplanation: `Prediction result based on the live ML model, influenced by sensitivity, usage, age, purpose completion, and retention policy.`,
    });

    await createAuditLog({
      action: 'Record Created',
      recordId: record.recordId,
      previousStatus: 'New',
      newStatus: record.status,
      reason: 'New record added and ML prediction generated.',
    });

    res.status(201).json({ record, prediction: mlResponse });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create record.' });
  }
});

app.put('/api/records/:id', async (req, res) => {
  try {
    await ensureDB();
    const record = await Record.findOne({ recordId: req.params.id });
    if (!record) return res.status(404).json({ message: 'Record not found.' });
    const previousStatus = record.status;
    Object.assign(record, req.body);
    record.updatedAt = new Date();
    await record.save();
    await createAuditLog({ action: 'Record Updated', recordId: record.recordId, previousStatus, newStatus: record.status, reason: 'Administrator updated the record metadata.' });
    return res.json(record);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update record.' });
  }
});

app.delete('/api/records/:id', async (req, res) => {
  try {
    await ensureDB();
    const record = await Record.findOne({ recordId: req.params.id });
    if (!record) return res.status(404).json({ message: 'Record not found.' });
    await Record.deleteOne({ _id: record._id });
    await createAuditLog({ action: 'Delete', recordId: record.recordId, previousStatus: record.status, newStatus: 'Deleted', reason: 'Data record removed by admin after confirmation.' });
    return res.json({ success: true, message: 'Record deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to delete record.' });
  }
});

app.post('/api/records/:id/anonymise', async (req, res) => {
  try {
    await ensureDB();
    const record = await Record.findOne({ recordId: req.params.id });
    if (!record) return res.status(404).json({ message: 'Record not found.' });
    const previousStatus = record.status;
    record.dataCategory = '[ANONYMISED]';
    record.purpose = '[ANONYMISED]';
    record.organizationPolicy = '[ANONYMISED]';
    record.status = 'REVIEW';
    record.recommendedAction = 'Review';
    record.mlPrediction = 'REVIEW';
    record.updatedAt = new Date();
    await record.save();
    await createAuditLog({ action: 'Anonymise', recordId: record.recordId, previousStatus, newStatus: 'Review', reason: 'Sensitive data was anonymised to reduce risk exposure.' });
    return res.json({ success: true, message: 'Record anonymised successfully.', record });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to anonymise record.' });
  }
});

app.post('/api/expiry/scan', async (req, res) => {
  try {
    await ensureDB();
    const records = await Record.find().lean();
    let updated = 0;
    const notifications = [];

    for (const record of records) {
      const expiryStatus = getStatusFromDate(record.expiryDate);
      const previousStatus = record.status;
      if (expiryStatus !== previousStatus) {
        record.status = expiryStatus;
        record.recommendedAction = getRecommendedAction(expiryStatus, record.purposeCompleted);
        const newRecord = await Record.findByIdAndUpdate(record._id, { status: expiryStatus, recommendedAction: record.recommendedAction, updatedAt: new Date() }, { new: true });
        updated += 1;
        await createAuditLog({ action: 'Expiry Scan', recordId: newRecord.recordId, previousStatus, newStatus: expiryStatus, reason: 'Retention threshold reviewed during expiry scan.' });

        if (expiryStatus === 'EXPIRED') {
          notifications.push(createNotification({
            type: 'Expiry',
            title: 'Retention expired',
            message: `${newRecord.recordId} has exceeded its retention period.`,
            recordId: newRecord.recordId,
          }));
        }
      }
    }

    if (notifications.length) {
      await Promise.all(notifications);
    }

    const alerts = await Notification.find().sort({ createdAt: -1 }).limit(10).lean();
    res.json({ success: true, updated, notifications: alerts, message: 'Expiry scan completed.' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Expiry scan failed.' });
  }
});

app.get('/api/expiry/upcoming', async (req, res) => {
  try {
    await ensureDB();
    const records = await Record.find({ status: { $in: ['EXPIRING SOON', 'EXPIRED'] } }).sort({ expiryDate: 1 }).lean();
    res.json(records);
  } catch (error) {
    res.status(503).json({ message: error.message || DB_MESSAGE });
  }
});

app.get('/api/audit-logs', async (req, res) => {
  try {
    await ensureDB();
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100).lean();
    res.json(logs);
  } catch (error) {
    res.status(503).json({ message: error.message || DB_MESSAGE });
  }
});

app.get('/api/notifications', async (req, res) => {
  try {
    await ensureDB();
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50).lean();
    res.json(notifications);
  } catch (error) {
    res.status(503).json({ message: error.message || DB_MESSAGE });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    await ensureDB();
    const notif = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    res.json({ success: true, notification: notif });
  } catch (error) {
    res.status(500).json({ message: 'Unable to update notification.' });
  }
});

app.get('/api/analytics', async (req, res) => {
  try {
    await ensureDB();
    const [statusCounts, riskCounts, typeCounts, purposeCompletion, expiryTrend] = await Promise.all([
      Record.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Record.aggregate([{ $group: { _id: '$riskLevel', count: { $sum: 1 } } }]),
      Record.aggregate([{ $group: { _id: '$dataType', count: { $sum: 1 } } }]),
      Record.aggregate([{ $group: { _id: '$purposeCompleted', count: { $sum: 1 } } }]),
      Record.aggregate([
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$expiryDate' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $limit: 14 },
      ]),
    ]);

    const total = await Record.countDocuments();
    const highSensitivity = await Record.countDocuments({ sensitivity: { $gte: 4 } });
    const completedPurpose = await Record.countDocuments({ purposeCompleted: true });

    res.json({
      total,
      statusCounts,
      riskCounts,
      typeCounts,
      purposeCompletion,
      expiryTrend,
      insights: [
        `${Math.round((highSensitivity / total) * 100 || 0)}% of records are high-sensitivity data requiring stricter controls.`,
        `${Math.round((completedPurpose / total) * 100 || 0)}% of records have completed their original purpose.`,
        `Review queue contains ${await Record.countDocuments({ mlPrediction: 'REVIEW' })} records.`,
      ],
    });
  } catch (error) {
    res.status(503).json({ message: error.message || DB_MESSAGE });
  }
});

app.get('/api/ml/evaluation', async (req, res) => {
  try {
    const result = await callMLService('/evaluation');
    res.json(result);
  } catch (error) {
    res.status(503).json({ message: 'ML service unavailable. Start the Python FastAPI service.' });
  }
});

app.post('/api/ml/predict', async (req, res) => {
  try {
    const result = await callMLService('/predict', req.body || {});
    res.json(result);
  } catch (error) {
    res.status(503).json({ message: ML_MESSAGE, error: error.message });
  }
});

app.post('/api/ml/retrain', async (req, res) => {
  try {
    const result = await callMLService('/retrain');
    res.json({ success: true, result });
  } catch (error) {
    res.status(503).json({ message: ML_MESSAGE, error: error.message });
  }
});

app.post('/api/seed', async (req, res) => {
  try {
    await ensureDB();
    const existingCount = await Record.countDocuments();
    if (existingCount > 0) {
      await Record.deleteMany({});
      await AuditLog.deleteMany({});
      await Notification.deleteMany({});
    }

    const seedData = generateSeedData(1200);
    const inserted = await Record.insertMany(seedData);
    await createNotification({
      type: 'System',
      title: 'Demo data loaded',
      message: `${inserted.length} synthetic records were loaded into the database.`,
    });

    return res.status(201).json({ success: true, message: 'Demo data reset and loaded successfully.', insertedCount: inserted.length });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to seed demo data.' });
  }
});

app.post('/api/demo/event-simulation', async (req, res) => {
  try {
    await ensureDB();
    const records = await Record.find({ purpose: { $in: ['Verification', 'Registration'] }, purposeCompleted: true }).limit(500).lean();
    const counts = { RETAIN: 0, REVIEW: 0, EXPIRE: 0 };

    for (const item of records) {
      const bucket = item.mlPrediction || 'REVIEW';
      counts[bucket] = (counts[bucket] || 0) + 1;
    }

    return res.json({
      totalAnalyzed: records.length,
      counts,
      message: 'Purpose completed verification records are prioritized for expiry review.',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'College event simulation failed.' });
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Unexpected server error.' });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`DataClock backend running on port ${PORT}`);
  });
});
