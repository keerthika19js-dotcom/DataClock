const test = require('node:test');
const assert = require('node:assert/strict');

const { generateSeedData } = require('../seed/seedDemoData');

test('seed data should start in a neutral active state so expiry scan can update it', () => {
  const records = generateSeedData(100);

  assert.equal(records.length, 100);
  const uniqueStatuses = new Set(records.map((record) => record.status));
  assert.deepEqual([...uniqueStatuses].sort(), ['ACTIVE']);
});
