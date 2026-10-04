const STORAGE_KEY = 'dataclock-demo-store';
const dataTypes = ['Identity', 'Contact', 'Financial', 'Location', 'Academic', 'Other'];
const categories = {
  Identity: ['ID Proof', 'Passport Scan', 'Student ID'],
  Contact: ['Email', 'Phone', 'Address'],
  Financial: ['Bank Details', 'Payment Record', 'Transaction Log'],
  Location: ['Check-in Log', 'GPS Coordinates', 'Access Location'],
  Academic: ['Certificate', 'Transcript', 'Assessment Record'],
  Other: ['Survey Data', 'Preference Log', 'Support Ticket'],
};
const purposes = ['Verification', 'Registration', 'Communication', 'Navigation', 'Payment', 'Academic', 'Other'];
const usageValues = ['None', 'Low', 'Medium', 'High'];
const policyTypes = ['Temporary', 'Operational', 'Compliance', 'Legal', 'Archive'];
const dayMs = 86400000;

function daysFromNow(days) {
  return new Date(Date.now() + days * dayMs).toISOString();
}

function statusFromExpiry(expiryDate) {
  const days = Math.ceil((new Date(expiryDate) - Date.now()) / dayMs);
  if (days < 0) return 'EXPIRED';
  if (days <= 7) return 'EXPIRING SOON';
  return 'ACTIVE';
}

function createRecord(index) {
  const dataType = dataTypes[(index * 7 + Math.floor(index / 11)) % dataTypes.length];
  const dataCategory = categories[dataType][(index * 3) % categories[dataType].length];
  const purpose = purposes[(index * 5 + Math.floor(index / 7)) % purposes.length];
  const ageDays = 2 + ((index * 73) % 900);
  const retentionPeriodDays = 7 + ((index * 37) % 359);
  const sensitivity = dataType === 'Financial' || dataType === 'Identity' ? 5 : 2 + (index % 4);
  const collectionDate = daysFromNow(-ageDays);
  const expiryDate = daysFromNow(retentionPeriodDays - ageDays);
  const usageFrequency = usageValues[index % usageValues.length];
  const purposeCompleted = index % 3 !== 0;
  const riskScore = Math.min(100, Math.max(10, Math.round(
    sensitivity * 12 + ageDays * 0.08 + (purposeCompleted ? 18 : 0) + (usageFrequency === 'None' ? 15 : 4),
  )));
  const status = 'ACTIVE';
  const mlPrediction = riskScore >= 70 ? 'REVIEW' : 'RETAIN';

  return {
    _id: `demo-${String(index).padStart(5, '0')}`,
    recordId: `DCL-${String(index).padStart(4, '0')}`,
    dataType,
    dataCategory,
    purpose,
    purposeStatus: purposeCompleted ? 'COMPLETED' : 'ACTIVE',
    sensitivity,
    collectionDate,
    lastAccessDate: daysFromNow(-Math.max(0, ageDays - ((index * 13) % 120))),
    usageFrequency,
    purposeCompleted,
    retentionPeriodDays,
    expiryDate,
    policyType: policyTypes[index % policyTypes.length],
    organizationPolicy: 'Retention should align with the original purpose and documented compliance requirements.',
    riskScore,
    riskLevel: riskScore >= 70 ? 'HIGH' : riskScore >= 40 ? 'MEDIUM' : 'LOW',
    mlPrediction,
    mlConfidence: Number((0.72 + ((index * 17) % 25) / 100).toFixed(2)),
    status,
    recommendedAction: status === 'EXPIRED' ? 'Review → Anonymise / Delete' : status === 'EXPIRING SOON' ? 'Review' : 'Retain',
    classificationExplanation: `${dataCategory} is classified as ${dataType.toLowerCase()} data for this synthetic demo record.`,
    purposeJustification: `${purpose} is reviewed against the record's retention period.`,
    mlExplanation: 'Synthetic demo prediction based on sensitivity, purpose, age, and usage.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function createInitialState() {
  const records = Array.from({ length: 1200 }, (_, index) => createRecord(index + 1));
  const auditLogs = Array.from({ length: 24 }, (_, index) => ({
    _id: `demo-log-${index + 1}`,
    timestamp: daysFromNow(-index),
    admin: 'Admin',
    action: index % 3 === 0 ? 'Expiry Scan' : 'ML Prediction',
    recordId: records[(index * 41) % records.length].recordId,
    previousStatus: index % 3 === 0 ? 'ACTIVE' : '',
    newStatus: index % 3 === 0 ? 'EXPIRED' : 'REVIEW',
    reason: 'Synthetic demo audit event.',
  }));
  return { records, auditLogs, notifications: [] };
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

export function getDemoState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return saveState(createInitialState());
}

export function resetDemoState() {
  return saveState(createInitialState());
}

function addAudit(state, action, record, previousStatus, newStatus, reason) {
  state.auditLogs.unshift({
    _id: `demo-log-${Date.now()}-${state.auditLogs.length}`,
    timestamp: new Date().toISOString(),
    admin: 'Admin',
    action,
    recordId: record?.recordId || 'System',
    previousStatus: previousStatus || '',
    newStatus: newStatus || '',
    reason,
  });
  state.auditLogs = state.auditLogs.slice(0, 100);
}

function countBy(items, key) {
  const counts = new Map();
  items.forEach((item) => counts.set(item[key], (counts.get(item[key]) || 0) + 1));
  return [...counts].map(([_id, count]) => ({ _id, count }));
}

export function getDemoDashboardStats() {
  const { records } = getDemoState();
  const statusDistribution = countBy(records, 'status').map((item) => ({ name: item._id, value: item.count }));
  const riskDistribution = countBy(records, 'riskLevel').map((item) => ({ name: item._id, value: item.count }));
  const typeDistribution = countBy(records, 'dataType').map((item) => ({ name: item._id, value: item.count }));
  const mlDistribution = countBy(records, 'mlPrediction').map((item) => ({ name: item._id, value: item.count }));
  const timeline = records
    .filter((record) => record.status === 'EXPIRING SOON' || record.status === 'EXPIRED')
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
    .slice(0, 8)
    .map((record) => ({
      name: record.recordId,
      expiryDate: record.expiryDate,
      daysRemaining: Math.ceil((new Date(record.expiryDate) - Date.now()) / dayMs),
      risk: record.riskScore,
    }));

  return {
    totalRecords: records.length,
    active: records.filter((record) => record.status === 'ACTIVE').length,
    expiringSoon: records.filter((record) => record.status === 'EXPIRING SOON').length,
    expired: records.filter((record) => record.status === 'EXPIRED').length,
    highRisk: records.filter((record) => record.riskLevel === 'HIGH').length,
    data: { statusDistribution, riskDistribution, typeDistribution, mlDistribution, expiryTimeline: timeline },
  };
}

export function getDemoRecords(params = {}) {
  const state = getDemoState();
  const query = String(params.q || '').toLowerCase();
  let records = state.records.filter((record) => (
    (!query || [record.recordId, record.dataType, record.purpose].some((value) => value.toLowerCase().includes(query)))
    && (!params.status || record.status === params.status)
    && (!params.dataType || record.dataType === params.dataType)
    && (!params.sensitivity || record.sensitivity === Number(params.sensitivity))
    && (!params.purpose || record.purpose === params.purpose)
    && (!params.riskLevel || record.riskLevel === params.riskLevel)
    && (!params.prediction || record.mlPrediction === params.prediction)
  ));
  const sortBy = params.sortBy || 'riskScore';
  const sortDirection = params.sortOrder === 'asc' ? 1 : -1;
  records = records.sort((a, b) => (a[sortBy] > b[sortBy] ? 1 : a[sortBy] < b[sortBy] ? -1 : 0) * sortDirection);
  const page = Number(params.page || 1);
  const limit = Number(params.limit || 20);
  return { records: records.slice((page - 1) * limit, page * limit), page, limit, total: records.length, totalPages: Math.max(1, Math.ceil(records.length / limit)) };
}

export function getDemoAnalytics() {
  const { records } = getDemoState();
  const highSensitivity = records.filter((record) => record.sensitivity >= 4).length;
  const completedPurpose = records.filter((record) => record.purposeCompleted).length;
  const reviewCount = records.filter((record) => record.mlPrediction === 'REVIEW').length;
  const expiryCounts = countBy(records, 'expiryDate').sort((a, b) => a._id.localeCompare(b._id)).slice(-14);
  return {
    total: records.length,
    statusCounts: countBy(records, 'status'),
    riskCounts: countBy(records, 'riskLevel'),
    typeCounts: countBy(records, 'dataType'),
    purposeCompletion: countBy(records, 'purposeCompleted'),
    expiryTrend: expiryCounts,
    insights: [
      `${Math.round((highSensitivity / records.length) * 100)}% of records are high-sensitivity data requiring stricter controls.`,
      `${Math.round((completedPurpose / records.length) * 100)}% of records have completed their original purpose.`,
      `Review queue contains ${reviewCount} records.`,
    ],
  };
}

export function scanDemoExpiry() {
  const state = getDemoState();
  let updated = 0;
  state.records.forEach((record) => {
    const nextStatus = statusFromExpiry(record.expiryDate);
    if (nextStatus !== record.status) {
      const previousStatus = record.status;
      record.status = nextStatus;
      record.recommendedAction = nextStatus === 'EXPIRED' ? 'Review → Anonymise / Delete' : 'Review';
      record.updatedAt = new Date().toISOString();
      addAudit(state, 'Expiry Scan', record, previousStatus, nextStatus, 'Retention threshold reviewed during demo expiry scan.');
      updated += 1;
    }
  });
  state.notifications.unshift({ _id: `demo-notification-${Date.now()}`, type: 'Expiry', title: 'Expiry scan completed', message: `${updated} synthetic records were reviewed.`, read: false, createdAt: new Date().toISOString() });
  saveState(state);
  return { success: true, updated, notifications: state.notifications.slice(0, 10), message: `Expiry scan completed. ${updated} records updated in this browser demo.` };
}

export function createDemoRecord(payload, prediction) {
  const state = getDemoState();
  const collectionDate = payload.collectionDate ? new Date(payload.collectionDate) : new Date();
  const retentionPeriodDays = Number(payload.retentionPeriodDays || 30);
  const expiryDate = new Date(collectionDate.getTime() + retentionPeriodDays * dayMs).toISOString();
  const riskScore = Math.min(100, Math.max(5, Math.round(Number(payload.sensitivity || 3) * 12 + (payload.purposeCompleted ? 18 : 0) + (payload.usageFrequency === 'None' ? 20 : 8))));
  const status = statusFromExpiry(expiryDate);
  const mlPrediction = prediction?.prediction || (riskScore >= 70 ? 'REVIEW' : 'RETAIN');
  const record = {
    ...payload,
    _id: `demo-${Date.now()}`,
    recordId: `DCL-${String(Date.now()).slice(-6)}`,
    collectionDate: collectionDate.toISOString(),
    lastAccessDate: payload.lastAccessDate ? new Date(payload.lastAccessDate).toISOString() : new Date().toISOString(),
    expiryDate,
    retentionPeriodDays,
    riskScore,
    riskLevel: riskScore >= 70 ? 'HIGH' : riskScore >= 40 ? 'MEDIUM' : 'LOW',
    mlPrediction,
    mlConfidence: prediction?.confidence || 0.78,
    status,
    recommendedAction: status === 'EXPIRED' ? 'Review → Anonymise / Delete' : status === 'EXPIRING SOON' ? 'Review' : 'Retain',
  };
  state.records.unshift(record);
  addAudit(state, 'Record Created', record, 'New', status, 'Record added in browser demo mode.');
  saveState(state);
  return { record, prediction: prediction || { prediction: mlPrediction, confidence: record.mlConfidence, risk_level: record.riskLevel } };
}

export function updateDemoRecord(id, payload) {
  const state = getDemoState();
  const record = state.records.find((item) => item.recordId === id);
  if (!record) throw new Error('Record not found.');
  const previousStatus = record.status;
  Object.assign(record, payload, { updatedAt: new Date().toISOString() });
  addAudit(state, 'Record Updated', record, previousStatus, record.status, 'Record metadata updated in browser demo mode.');
  saveState(state);
  return record;
}

export function deleteDemoRecord(id) {
  const state = getDemoState();
  const record = state.records.find((item) => item.recordId === id);
  if (!record) throw new Error('Record not found.');
  state.records = state.records.filter((item) => item.recordId !== id);
  addAudit(state, 'Delete', record, record.status, 'Deleted', 'Record removed in browser demo mode.');
  saveState(state);
  return { success: true, message: 'Record deleted successfully.' };
}

export function anonymiseDemoRecord(id) {
  const state = getDemoState();
  const record = state.records.find((item) => item.recordId === id);
  if (!record) throw new Error('Record not found.');
  const previousStatus = record.status;
  Object.assign(record, { dataCategory: '[ANONYMISED]', purpose: '[ANONYMISED]', organizationPolicy: '[ANONYMISED]', status: 'REVIEW', recommendedAction: 'Review', mlPrediction: 'REVIEW', updatedAt: new Date().toISOString() });
  addAudit(state, 'Anonymise', record, previousStatus, 'REVIEW', 'Sensitive data anonymised in browser demo mode.');
  saveState(state);
  return { success: true, message: 'Record anonymised successfully.', record };
}

export function getDemoUpcomingExpiry() {
  return getDemoState().records.filter((record) => record.status === 'EXPIRING SOON' || record.status === 'EXPIRED').sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
}

export function getDemoAuditLogs() {
  return getDemoState().auditLogs;
}

export function getDemoNotifications() {
  return getDemoState().notifications;
}

export function markDemoNotificationRead(id) {
  const state = getDemoState();
  const notification = state.notifications.find((item) => item._id === id);
  if (notification) notification.read = true;
  saveState(state);
  return { success: true, notification: notification || null };
}

export function getDemoEventSimulation() {
  const records = getDemoState().records.filter((record) => ['Verification', 'Registration'].includes(record.purpose) && record.purposeCompleted);
  const counts = { RETAIN: 0, REVIEW: 0, EXPIRE: 0 };
  records.forEach((record) => { counts[record.mlPrediction] = (counts[record.mlPrediction] || 0) + 1; });
  return { totalAnalyzed: records.length, counts, message: 'Purpose-completed event records are prioritized for expiry review. Results use synthetic browser-local demo data.' };
}

export const demoModelEvaluation = {
  best_model: 'Random Forest',
  results: {
    'Logistic Regression': { accuracy: 0.881, precision: 0.884, recall: 0.881, f1_score: 0.8804, cv_score: 0.874 },
    'Decision Tree': { accuracy: 0.801, precision: 0.798, recall: 0.801, f1_score: 0.797, cv_score: 0.782 },
    'Random Forest': { accuracy: 0.899, precision: 0.901, recall: 0.899, f1_score: 0.8974, cv_score: 0.891 },
  },
  training_records: 1440,
  testing_records: 360,
  last_trained: 'Synthetic demo evaluation',
};
