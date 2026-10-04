const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

async function callMLService(path, payload = null) {
  const url = `${ML_SERVICE_URL}${path}`;
  const options = {
    method: payload ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
  };

  if (payload) {
    options.body = JSON.stringify(payload);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'ML service request failed');
  }

  return response.json();
}

module.exports = { callMLService };
