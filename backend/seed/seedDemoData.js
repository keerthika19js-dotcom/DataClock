const crypto = require('crypto');

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
const purposeStatusOptions = ['ACTIVE', 'COMPLETED', 'UNKNOWN'];
const usageValues = ['None', 'Low', 'Medium', 'High'];
const policyTypes = ['Temporary', 'Operational', 'Compliance', 'Legal', 'Archive'];
const mlPredictions = ['RETAIN', 'REVIEW', 'EXPIRE'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getExpiryDate(collectionDate, retentionDays) {
  const date = new Date(collectionDate);
  date.setDate(date.getDate() + retentionDays);
  return date;
}

function generateSeedData(count = 1000) {
  const records = [];

  for (let i = 1; i <= count; i += 1) {
    const dataType = dataTypes[randomInt(0, dataTypes.length - 1)];
    const dataCategory = categories[dataType][randomInt(0, categories[dataType].length - 1)];
    const purpose = purposes[randomInt(0, purposes.length - 1)];
    const collectionDate = new Date(Date.now() - randomInt(2, 900) * 86400000);
    const lastAccessDate = new Date(collectionDate.getTime() - randomInt(0, 180) * 86400000);
    const usageFrequency = usageValues[randomInt(0, usageValues.length - 1)];
    const purposeCompleted = Math.random() > 0.45;
    const sensitivity = Math.max(1, Math.min(5, (() => {
      if (dataType === 'Financial') return 5;
      if (dataType === 'Identity') return 4;
      if (dataType === 'Location') return 3;
      if (dataType === 'Academic') return 2;
      return 2;
    })() + (Math.random() > 0.7 ? 1 : 0) - (Math.random() > 0.8 ? 1 : 0)));
    const retentionPeriodDays = randomInt(7, 365);
    const expiryDate = getExpiryDate(collectionDate, retentionPeriodDays);
    const baseRisk = Math.min(100, Math.max(15, Math.round(
      sensitivity * 12 + (Date.now() - collectionDate.getTime()) / 86400000 * 0.08 + (purposeCompleted ? 12 : 0) + (usageFrequency === 'None' ? 18 : usageFrequency === 'Low' ? 8 : 0)
    )));
    const riskScore = Math.min(100, Math.max(10, baseRisk + randomInt(-12, 12)));
    const status = 'ACTIVE';
    const mlPrediction = riskScore >= 70 ? 'REVIEW' : riskScore >= 45 ? 'RETAIN' : 'RETAIN';
    const recordId = `DCL-${String(i).padStart(4, '0')}`;

    records.push({
      recordId,
      dataType,
      dataCategory,
      purpose,
      purposeStatus: purposeCompleted ? 'COMPLETED' : purposeStatusOptions[randomInt(0, purposeStatusOptions.length - 1)],
      sensitivity,
      collectionDate,
      lastAccessDate,
      usageFrequency,
      purposeCompleted,
      retentionPeriodDays,
      expiryDate,
      policyType: policyTypes[randomInt(0, policyTypes.length - 1)],
      organizationPolicy: 'Retention should align with the original purpose and documented compliance requirements.',
      riskScore,
      riskLevel: riskScore >= 70 ? 'HIGH' : riskScore >= 40 ? 'MEDIUM' : 'LOW',
      mlPrediction,
      mlConfidence: Number((Math.random() * 0.5 + 0.45).toFixed(2)),
      status,
      recommendedAction: purposeCompleted ? 'Retain with review' : 'Retain',
      classificationExplanation: `${dataCategory} is classified as ${dataType.toLowerCase()} data with ${sensitivity >= 4 ? 'high' : 'moderate'} sensitivity because it can support identity or operational decisions.`,
      purposeJustification: `${purpose} activity ${purposeCompleted ? 'has been completed and retention should be reviewed' : 'remains active; continued storage is justified'}.`,
      mlExplanation: purposeCompleted ? 'Purpose has been completed, data is aging, and recent activity is low.' : 'Purpose remains active and usage remains recent.',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return records;
}

module.exports = { generateSeedData };
